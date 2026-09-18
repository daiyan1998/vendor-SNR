// OTP tuning per issue #2 — identical for Registration and Login.
export const OTP_CODE_LENGTH = 6;
export const OTP_EXPIRY_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
export const OTP_MAX_FAILED_ATTEMPTS = 5;
export const OTP_MAX_SENDS_PER_HOUR = 5;
export const OTP_SEND_WINDOW_MS = 60 * 60 * 1000;

// How long an unverified registration attempt may sit before its phone
// number is freed up for a fresh attempt.
export const REGISTRATION_ATTEMPT_TTL_MS = 24 * 60 * 60 * 1000;
