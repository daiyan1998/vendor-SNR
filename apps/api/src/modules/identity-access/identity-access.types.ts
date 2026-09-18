export interface PhoneNumberInput {
  countryCode: string;
  number: string;
}

export interface OtpSentResult {
  expiresAt: Date;
}

export interface SessionResult {
  sessionToken: string;
  userId: string;
}
