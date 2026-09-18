export interface OtpRecipient {
  countryCode: string;
  number: string;
}

export interface OtpSender {
  send(recipient: OtpRecipient, code: string): Promise<void>;
}

export const OTP_SENDER = Symbol('OTP_SENDER');
