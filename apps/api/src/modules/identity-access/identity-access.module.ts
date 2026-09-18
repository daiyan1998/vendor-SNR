import { Module } from '@nestjs/common';
import { CLOCK, SystemClock } from './clock.js';
import { IdentityAccessController } from './identity-access.controller.js';
import { IdentityAccessService } from './identity-access.service.js';
import { ConsoleOtpSender } from './otp/console-otp-sender.js';
import { OTP_SENDER } from './otp/otp-sender.port.js';

// Identity & Access bounded context (see CONTEXT.md): registration, login,
// and OTP verification per issue #2 / ADR-0010 (phone + OTP only).
@Module({
  controllers: [IdentityAccessController],
  providers: [
    IdentityAccessService,
    { provide: OTP_SENDER, useClass: ConsoleOtpSender },
    { provide: CLOCK, useClass: SystemClock },
  ],
  exports: [IdentityAccessService],
})
export class IdentityAccessModule {}
