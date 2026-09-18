import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type OtpPurpose, type PhoneNumber } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CLOCK, type Clock } from './clock.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { ResendOtpDto } from './dto/resend-otp.dto.js';
import type { VerifyOtpDto } from './dto/verify-otp.dto.js';
import type {
  OtpSentResult,
  PhoneNumberInput,
  SessionResult,
  SessionSummary,
} from './identity-access.types.js';
import { generateOtpCode, generateSessionToken, hashOtpCode } from './otp/otp-code.util.js';
import {
  OTP_EXPIRY_MS,
  OTP_MAX_FAILED_ATTEMPTS,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_RESEND_COOLDOWN_MS,
  OTP_SEND_WINDOW_MS,
  REGISTRATION_ATTEMPT_TTL_MS,
} from './otp/otp.constants.js';
import { OTP_SENDER, type OtpSender } from './otp/otp-sender.port.js';

@Injectable()
export class IdentityAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(OTP_SENDER) private readonly otpSender: OtpSender,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async register(input: RegisterDto): Promise<OtpSentResult> {
    if (!input.tosAccepted) {
      throw new BadRequestException('You must accept the Terms of Service to register.');
    }
    this.assertCountryAllowed(input.countryCode);

    const now = this.clock.now();
    const existing = await this.findActivePhone(input, now);

    if (existing) {
      if (existing.verified) {
        throw new ConflictException('This phone number is already registered. Log in instead.');
      }
      // A pending, non-expired registration for the same number: refresh its
      // details and resend rather than creating a duplicate User.
      await this.prisma.user.update({
        where: { id: existing.userId },
        data: { displayName: input.displayName, tosAcceptedAt: now },
      });
      return this.issueOtp({ phoneNumberId: existing.id, ...input, purpose: 'REGISTRATION', now });
    }

    const user = await this.createUnverifiedUser(input, now);
    return this.issueOtp({
      phoneNumberId: user.phoneNumber!.id,
      ...input,
      purpose: 'REGISTRATION',
      now,
    });
  }

  async login(input: LoginDto): Promise<OtpSentResult> {
    const now = this.clock.now();
    const phone = await this.findActivePhone(input, now);

    if (!phone || !phone.verified) {
      throw new NotFoundException('This phone number is not registered. Sign up instead.');
    }

    return this.issueOtp({ phoneNumberId: phone.id, ...input, purpose: 'LOGIN', now });
  }

  async resendOtp(input: ResendOtpDto): Promise<OtpSentResult> {
    const now = this.clock.now();
    const phone = await this.findActivePhone(input, now);

    if (!phone) {
      throw new NotFoundException('This phone number has no pending code to resend.');
    }

    const purpose: OtpPurpose = phone.verified ? 'LOGIN' : 'REGISTRATION';
    return this.issueOtp({ phoneNumberId: phone.id, ...input, purpose, now });
  }

  async verifyOtp(input: VerifyOtpDto): Promise<SessionResult> {
    const now = this.clock.now();
    const phone = await this.findActivePhone(input, now);

    if (!phone) {
      throw new NotFoundException('This phone number is not registered. Sign up instead.');
    }

    // Always the newest challenge: sending a fresh code supersedes any
    // earlier one for the same phone, even if that earlier one is still
    // unexpired — there is only ever one "live" code per phone number.
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phoneNumberId: phone.id },
      orderBy: { createdAt: 'desc' },
      include: { consumedSession: true },
    });

    if (!challenge) {
      throw new BadRequestException('No code has been requested for this phone number.');
    }

    const codeHash = hashOtpCode(input.code);

    if (challenge.consumedAt) {
      const isSameCodeStillValid = challenge.codeHash === codeHash && now < challenge.expiresAt;
      if (!isSameCodeStillValid || !challenge.consumedSession) {
        throw new BadRequestException('This code has already been used. Request a new one.');
      }
      // Idempotent replay: the same code was already verified successfully
      // within its validity window — return the session it created rather
      // than minting a second one.
      return {
        sessionToken: challenge.consumedSession.token,
        userId: challenge.consumedSession.userId,
      };
    }

    if (challenge.lockedAt) {
      throw new ForbiddenException('Too many incorrect attempts. Request a new code.');
    }

    if (now >= challenge.expiresAt) {
      throw new BadRequestException('This code has expired. Request a new one.');
    }

    if (challenge.codeHash !== codeHash) {
      const attemptCount = challenge.attemptCount + 1;
      const isNowLocked = attemptCount >= OTP_MAX_FAILED_ATTEMPTS;
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attemptCount, lockedAt: isNowLocked ? now : undefined },
      });
      if (isNowLocked) {
        throw new ForbiddenException('Too many incorrect attempts. Request a new code.');
      }
      throw new BadRequestException('Incorrect code.');
    }

    const session = await this.prisma.session.create({
      data: { userId: phone.userId, token: generateSessionToken(), createdAt: now },
    });

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: now, consumedSessionId: session.id },
    });

    if (!phone.verified) {
      await this.prisma.phoneNumber.update({
        where: { id: phone.id },
        data: { verified: true, verifiedAt: now },
      });
    }

    return { sessionToken: session.token, userId: session.userId };
  }

  // Idempotent: a session already gone (e.g. a concurrent double-logout
  // for the same token) is the goal state, not an error.
  async logout(sessionId: string): Promise<void> {
    try {
      await this.prisma.session.delete({ where: { id: sessionId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return;
      }
      throw error;
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  async listSessions(userId: string): Promise<SessionSummary[]> {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true },
    });
  }

  // Scoped to the given User: a Session that exists but belongs to someone
  // else is reported as not found rather than forbidden, so a caller can't
  // use this to probe which session ids exist for another account.
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found.');
    }
    await this.logout(sessionId);
  }

  private async issueOtp(
    input: PhoneNumberInput & { phoneNumberId: string; purpose: OtpPurpose; now: Date },
  ): Promise<OtpSentResult> {
    const { phoneNumberId, countryCode, number, purpose, now } = input;

    const latest = await this.prisma.otpChallenge.findFirst({
      where: { phoneNumberId },
      orderBy: { createdAt: 'desc' },
    });

    if (latest && now.getTime() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      throw new HttpException(
        'Please wait before requesting another code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const windowStart = new Date(now.getTime() - OTP_SEND_WINDOW_MS);
    const sentInWindow = await this.prisma.otpChallenge.count({
      where: { phoneNumberId, createdAt: { gte: windowStart } },
    });

    if (sentInWindow >= OTP_MAX_SENDS_PER_HOUR) {
      throw new HttpException(
        'Too many codes requested for this phone number. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = generateOtpCode();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

    await this.prisma.otpChallenge.create({
      data: { phoneNumberId, purpose, codeHash: hashOtpCode(code), expiresAt, createdAt: now },
    });

    await this.otpSender.send({ countryCode, number }, code);

    return { expiresAt };
  }

  // Creates the unverified User + PhoneNumber for a brand-new registration.
  // Guards against the race where two requests for the same never-seen
  // number both pass findActivePhone before either commits: the loser hits
  // the (countryCode, number) unique constraint, which we translate into
  // the same "already registered" response a sequential duplicate gets,
  // rather than letting a raw Prisma error surface as a 500.
  private async createUnverifiedUser(input: RegisterDto, now: Date) {
    try {
      return await this.prisma.user.create({
        data: {
          displayName: input.displayName,
          tosAcceptedAt: now,
          createdAt: now,
          phoneNumber: {
            create: { countryCode: input.countryCode, number: input.number, createdAt: now },
          },
        },
        include: { phoneNumber: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This phone number is already registered. Log in instead.');
      }
      throw error;
    }
  }

  // Looks up a phone number, lazily pruning it (and its User, cascading) if
  // it was an unverified registration attempt abandoned for more than the
  // TTL — there is no background sweep, so an expired attempt must not
  // block a fresh one just because nobody looked at it yet.
  private async findActivePhone(
    { countryCode, number }: PhoneNumberInput,
    now: Date,
  ): Promise<PhoneNumber | null> {
    const phone = await this.prisma.phoneNumber.findUnique({
      where: { countryCode_number: { countryCode, number } },
    });

    if (!phone) {
      return null;
    }

    const isExpiredAttempt =
      !phone.verified && now.getTime() - phone.createdAt.getTime() > REGISTRATION_ATTEMPT_TTL_MS;

    if (isExpiredAttempt) {
      await this.prisma.user.delete({ where: { id: phone.userId } });
      return null;
    }

    return phone;
  }

  private assertCountryAllowed(countryCode: string): void {
    const allowed = this.config.get<string[]>('ALLOWED_COUNTRY_CODES') ?? [];
    if (!allowed.includes(countryCode)) {
      throw new BadRequestException('Registrations from this country are not currently supported.');
    }
  }
}
