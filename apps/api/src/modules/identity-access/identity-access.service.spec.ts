import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service.js';
import { createTestPrisma, resetDb } from '../../../test/setup/prisma-test.util.js';
import { FakeClock } from './fake-clock.js';
import { IdentityAccessService } from './identity-access.service.js';
import { FakeOtpSender } from './otp/fake-otp-sender.js';

const PHONE = { countryCode: '880', number: '1710000000' };
const registerInput = { ...PHONE, displayName: 'Asha', tosAccepted: true };

async function registerAndVerify(service: IdentityAccessService, otpSender: FakeOtpSender) {
  await service.register(registerInput);
  const code = otpSender.latestCode();
  return service.verifyOtp({ ...PHONE, code });
}

describe('IdentityAccessService', () => {
  let prisma: PrismaService;
  let clock: FakeClock;
  let otpSender: FakeOtpSender;
  let service: IdentityAccessService;

  beforeEach(async () => {
    prisma ??= await createTestPrisma();
    await resetDb(prisma);
    clock = new FakeClock(new Date('2026-01-01T00:00:00.000Z'));
    otpSender = new FakeOtpSender();
    const config = new ConfigService({ ALLOWED_COUNTRY_CODES: ['880'] });
    service = new IdentityAccessService(prisma, config, otpSender, clock);
  });

  describe('register', () => {
    it('creates an unverified User + PhoneNumber, stores the ToS timestamp, and sends an OTP', async () => {
      await service.register(registerInput);

      const phone = await prisma.phoneNumber.findUniqueOrThrow({
        where: { countryCode_number: PHONE },
      });
      expect(phone.verified).toBe(false);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: phone.userId } });
      expect(user.tosAcceptedAt).toEqual(clock.now());
      expect(otpSender.sent).toHaveLength(1);
    });

    it('rejects without ToS acceptance', async () => {
      await expect(
        service.register({ ...registerInput, tosAccepted: false }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(otpSender.sent).toHaveLength(0);
    });

    it('rejects a country outside the configured allow-list', async () => {
      await expect(
        service.register({ ...registerInput, countryCode: '999' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(otpSender.sent).toHaveLength(0);
    });

    it('rejects re-registering an already-verified phone, sending no OTP, no message directing to Login', async () => {
      await registerAndVerify(service, otpSender);
      const sentBefore = otpSender.sent.length;

      await expect(service.register(registerInput)).rejects.toBeInstanceOf(ConflictException);
      expect(otpSender.sent).toHaveLength(sentBefore);
    });

    it('resolves a race between two simultaneous registrations for the same new number cleanly, not as a raw DB error', async () => {
      const outcomes = await Promise.allSettled([
        service.register(registerInput),
        service.register(registerInput),
      ]);

      expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
      const rejected = outcomes.find(
        (outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected',
      );
      expect(rejected?.reason).toBeInstanceOf(ConflictException);
      expect(await prisma.user.count()).toBe(1);
    });

    it('verifying the OTP produces a verified User, PhoneNumber, and an active Session', async () => {
      const result = await registerAndVerify(service, otpSender);

      const phone = await prisma.phoneNumber.findUniqueOrThrow({
        where: { countryCode_number: PHONE },
      });
      expect(phone.verified).toBe(true);
      const session = await prisma.session.findUniqueOrThrow({
        where: { token: result.sessionToken },
      });
      expect(session.userId).toBe(result.userId);
    });
  });

  describe('login', () => {
    it('rejects a phone with no verified User, creating no User', async () => {
      await expect(service.login(PHONE)).rejects.toBeInstanceOf(NotFoundException);
      expect(await prisma.user.count()).toBe(0);
    });

    it('creates a new Session for the existing User without creating a duplicate User', async () => {
      const { userId } = await registerAndVerify(service, otpSender);
      const userCountBefore = await prisma.user.count();

      clock.advanceMs(31_000);
      await service.login(PHONE);
      const code = otpSender.latestCode();
      const result = await service.verifyOtp({ ...PHONE, code });

      expect(result.userId).toBe(userId);
      expect(await prisma.user.count()).toBe(userCountBefore);
      expect(await prisma.session.count({ where: { userId } })).toBe(2);
    });

    it('leaves two independent active Sessions after two successful logins', async () => {
      const { userId } = await registerAndVerify(service, otpSender);

      clock.advanceMs(31_000);
      await service.login(PHONE);
      const firstLoginResult = await service.verifyOtp({ ...PHONE, code: otpSender.latestCode() });

      clock.advanceMs(31_000);
      await service.login(PHONE);
      const secondLoginResult = await service.verifyOtp({ ...PHONE, code: otpSender.latestCode() });

      expect(firstLoginResult.sessionToken).not.toBe(secondLoginResult.sessionToken);
      expect(await prisma.session.count({ where: { userId } })).toBe(3);
    });
  });

  describe('resendOtp', () => {
    it('rejects a resend before the 30s cooldown elapses', async () => {
      await service.register(registerInput);
      await expect(service.resendOtp(PHONE)).rejects.toBeInstanceOf(HttpException);
    });

    it('issues a fresh code once the cooldown has elapsed', async () => {
      await service.register(registerInput);
      const firstCode = otpSender.latestCode();

      clock.advanceMs(31_000);
      await service.resendOtp(PHONE);

      expect(otpSender.sent).toHaveLength(2);
      expect(otpSender.latestCode()).not.toBe(firstCode);
    });

    it('rejects the 6th send for the same phone within an hour', async () => {
      await service.register(registerInput); // send 1
      for (let i = 0; i < 4; i++) {
        clock.advanceMs(31_000);
        await service.resendOtp(PHONE); // sends 2-5
      }

      clock.advanceMs(31_000);
      await expect(service.resendOtp(PHONE)).rejects.toBeInstanceOf(HttpException); // send 6
      expect(otpSender.sent).toHaveLength(5);
    });
  });

  describe('verifyOtp', () => {
    it('rejects an incorrect code without locking before the 5th attempt', async () => {
      await service.register(registerInput);

      for (let i = 0; i < 4; i++) {
        await expect(service.verifyOtp({ ...PHONE, code: '000000' })).rejects.toBeInstanceOf(
          BadRequestException,
        );
      }

      const correctCode = otpSender.latestCode();
      const result = await service.verifyOtp({ ...PHONE, code: correctCode });
      expect(result.sessionToken).toBeTruthy();
    });

    it('locks after 5 wrong attempts, rejecting even the correct code until a fresh one is sent', async () => {
      await service.register(registerInput);
      const correctCode = otpSender.latestCode();

      for (let i = 0; i < 5; i++) {
        await expect(service.verifyOtp({ ...PHONE, code: '000000' })).rejects.toBeDefined();
      }

      await expect(service.verifyOtp({ ...PHONE, code: correctCode })).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      clock.advanceMs(31_000);
      await service.resendOtp(PHONE);
      const freshCode = otpSender.latestCode();
      const result = await service.verifyOtp({ ...PHONE, code: freshCode });
      expect(result.sessionToken).toBeTruthy();
    });

    it('rejects a code once it has expired', async () => {
      await service.register(registerInput);
      const code = otpSender.latestCode();

      clock.advanceMs(5 * 60 * 1000 + 1);

      await expect(service.verifyOtp({ ...PHONE, code })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('is idempotent against replaying an already-used, still-valid code', async () => {
      await service.register(registerInput);
      const code = otpSender.latestCode();

      const first = await service.verifyOtp({ ...PHONE, code });
      const second = await service.verifyOtp({ ...PHONE, code });

      expect(second.sessionToken).toBe(first.sessionToken);
      expect(await prisma.user.count()).toBe(1);
      expect(await prisma.session.count()).toBe(1);
    });
  });

  describe('abandoned registration attempts', () => {
    it('frees the phone number for a fresh attempt after the 24h TTL', async () => {
      await service.register(registerInput);
      const staleUser = await prisma.phoneNumber.findUniqueOrThrow({
        where: { countryCode_number: PHONE },
      });

      clock.advanceMs(24 * 60 * 60 * 1000 + 1);

      await expect(service.register(registerInput)).resolves.toBeDefined();

      const phones = await prisma.phoneNumber.findMany({ where: PHONE });
      expect(phones).toHaveLength(1);
      expect(phones[0]!.userId).not.toBe(staleUser.userId);
      expect(await prisma.user.findUnique({ where: { id: staleUser.userId } })).toBeNull();
    });
  });

  describe('logout', () => {
    it('ends only the given Session, leaving a second independently-created Session active', async () => {
      const { userId } = await registerAndVerify(service, otpSender);

      clock.advanceMs(31_000);
      await service.login(PHONE);
      const secondSession = await service.verifyOtp({ ...PHONE, code: otpSender.latestCode() });

      const [firstSession] = await prisma.session.findMany({ where: { userId } });

      await service.logout(firstSession!.id);

      expect(await prisma.session.findUnique({ where: { id: firstSession!.id } })).toBeNull();
      expect(
        await prisma.session.findUnique({ where: { token: secondSession.sessionToken } }),
      ).not.toBeNull();
    });

    it('is idempotent against a concurrent double-logout of the same session', async () => {
      const result = await registerAndVerify(service, otpSender);
      const session = await prisma.session.findUniqueOrThrow({
        where: { token: result.sessionToken },
      });

      await expect(
        Promise.all([service.logout(session.id), service.logout(session.id)]),
      ).resolves.toBeDefined();
      expect(await prisma.session.findUnique({ where: { id: session.id } })).toBeNull();
    });
  });

  describe('logoutAllDevices', () => {
    it('revokes every Session for that User', async () => {
      const { userId } = await registerAndVerify(service, otpSender);

      clock.advanceMs(31_000);
      await service.login(PHONE);
      await service.verifyOtp({ ...PHONE, code: otpSender.latestCode() });

      expect(await prisma.session.count({ where: { userId } })).toBe(2);

      await service.logoutAllDevices(userId);

      expect(await prisma.session.count({ where: { userId } })).toBe(0);
    });
  });
});
