import type { OtpRecipient, OtpSender } from './otp-sender.port.js';

export interface SentOtp {
  recipient: OtpRecipient;
  code: string;
}

// Test double: records "sent" codes instead of dispatching real SMS.
export class FakeOtpSender implements OtpSender {
  readonly sent: SentOtp[] = [];

  async send(recipient: OtpRecipient, code: string): Promise<void> {
    this.sent.push({ recipient, code });
  }

  latestCode(): string {
    const last = this.sent[this.sent.length - 1];
    if (!last) {
      throw new Error('FakeOtpSender: no OTP has been sent yet');
    }
    return last.code;
  }
}
