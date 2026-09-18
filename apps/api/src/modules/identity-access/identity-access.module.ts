import { Module } from '@nestjs/common';
import { CLOCK, SystemClock } from './clock.js';
import { IdentityAccessController } from './identity-access.controller.js';
import { IdentityAccessService } from './identity-access.service.js';
import { ConsoleOtpSender } from './otp/console-otp-sender.js';
import { OTP_SENDER } from './otp/otp-sender.port.js';
import { SessionGuard } from './session.guard.js';

// Identity & Access bounded context (see CONTEXT.md): registration, login,
// OTP verification, and session logout per issues #2/#3 / ADR-0010 (phone +
// OTP only).
@Module({
  controllers: [IdentityAccessController],
  providers: [
    IdentityAccessService,
    SessionGuard,
    { provide: OTP_SENDER, useClass: ConsoleOtpSender },
    { provide: CLOCK, useClass: SystemClock },
  ],
  exports: [IdentityAccessService],
})
export class IdentityAccessModule {}
