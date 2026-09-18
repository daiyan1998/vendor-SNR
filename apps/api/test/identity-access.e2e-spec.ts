import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { CLOCK } from '../src/modules/identity-access/clock.js';
import { FakeClock } from '../src/modules/identity-access/fake-clock.js';
import { FakeOtpSender } from '../src/modules/identity-access/otp/fake-otp-sender.js';
import { OTP_SENDER } from '../src/modules/identity-access/otp/otp-sender.port.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { resetDb } from './setup/prisma-test.util.js';

describe('Identity & Access (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clock: FakeClock;
  let otpSender: FakeOtpSender;

  beforeAll(async () => {
    clock = new FakeClock(new Date('2026-01-01T00:00:00.000Z'));
    otpSender = new FakeOtpSender();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CLOCK)
      .useValue(clock)
      .overrideProvider(OTP_SENDER)
      .useValue(otpSender)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDb(prisma);
    otpSender.sent.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, verifies the OTP, and returns an active session', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/register')
      .send({ countryCode: '880', number: '1710000000', displayName: 'Asha', tosAccepted: true })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('otp_sent');
      });

    const code = otpSender.latestCode();

    const verifyResponse = await request(app.getHttpServer())
      .post('/identity-access/otp/verify')
      .send({ countryCode: '880', number: '1710000000', code })
      .expect(200);

    expect(verifyResponse.body.sessionToken).toBeTruthy();
    expect(verifyResponse.body.userId).toBeTruthy();
  });

  it('rejects login for an unregistered phone number, directing to registration', async () => {
    const response = await request(app.getHttpServer())
      .post('/identity-access/login')
      .send({ countryCode: '880', number: '1710000099' })
      .expect(404);

    expect(response.body.message).toMatch(/sign up/i);
  });

  it('rejects registration without ToS acceptance', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/register')
      .send({ countryCode: '880', number: '1710000001', displayName: 'Asha', tosAccepted: false })
      .expect(400);
  });

  describe('logout', () => {
    async function registerAndVerify(number: string) {
      await request(app.getHttpServer())
        .post('/identity-access/register')
        .send({ countryCode: '880', number, displayName: 'Asha', tosAccepted: true })
        .expect(201);

      const { body } = await request(app.getHttpServer())
        .post('/identity-access/otp/verify')
        .send({ countryCode: '880', number, code: otpSender.latestCode() })
        .expect(200);

      return body.sessionToken as string;
    }

    it('rejects a request with no Authorization header', async () => {
      await request(app.getHttpServer()).post('/identity-access/logout').expect(401);
    });

    it('ends only the current session, leaving a second session active, and rejects it on the next authenticated request', async () => {
      const firstToken = await registerAndVerify('1710000010');

      clock.advanceMs(31_000);
      await request(app.getHttpServer())
        .post('/identity-access/login')
        .send({ countryCode: '880', number: '1710000010' })
        .expect(201);
      const { body: verifyBody } = await request(app.getHttpServer())
        .post('/identity-access/otp/verify')
        .send({ countryCode: '880', number: '1710000010', code: otpSender.latestCode() })
        .expect(200);
      const secondToken = verifyBody.sessionToken as string;

      await request(app.getHttpServer())
        .post('/identity-access/logout')
        .set('Authorization', `Bearer ${firstToken}`)
        .expect(200)
        .expect(({ body }) => expect(body.status).toBe('logged_out'));

      await request(app.getHttpServer())
        .post('/identity-access/logout')
        .set('Authorization', `Bearer ${firstToken}`)
        .expect(401);

      // The second session was never touched by the first logout.
      await request(app.getHttpServer())
        .post('/identity-access/logout')
        .set('Authorization', `Bearer ${secondToken}`)
        .expect(200);
    });
  });

  describe('logout-all', () => {
    it('revokes every session for the user, rejecting each on its next authenticated request', async () => {
      await request(app.getHttpServer())
        .post('/identity-access/register')
        .send({ countryCode: '880', number: '1710000020', displayName: 'Asha', tosAccepted: true })
        .expect(201);
      const { body: firstVerify } = await request(app.getHttpServer())
        .post('/identity-access/otp/verify')
        .send({ countryCode: '880', number: '1710000020', code: otpSender.latestCode() })
        .expect(200);
      const tokenA = firstVerify.sessionToken as string;

      clock.advanceMs(31_000);
      await request(app.getHttpServer())
        .post('/identity-access/login')
        .send({ countryCode: '880', number: '1710000020' })
        .expect(201);
      const { body: secondVerify } = await request(app.getHttpServer())
        .post('/identity-access/otp/verify')
        .send({ countryCode: '880', number: '1710000020', code: otpSender.latestCode() })
        .expect(200);
      const tokenB = secondVerify.sessionToken as string;

      await request(app.getHttpServer())
        .post('/identity-access/logout-all')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/identity-access/logout')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(401);
      await request(app.getHttpServer())
        .post('/identity-access/logout')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(401);
    });
  });
});
