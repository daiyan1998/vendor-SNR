import { Injectable, Logger } from '@nestjs/common';
import type { OtpRecipient, OtpSender } from './otp-sender.port.js';

// Stand-in until a real SMS provider is wired up; keeps the delivery
// mechanism behind the OtpSender port so that swap is a one-line change.
@Injectable()
export class ConsoleOtpSender implements OtpSender {
  private readonly logger = new Logger(ConsoleOtpSender.name);

  async send(recipient: OtpRecipient, code: string): Promise<void> {
    this.logger.log(`OTP for +${recipient.countryCode}${recipient.number}: ${code}`);
  }
}
