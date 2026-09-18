import { createHash, randomBytes, randomInt } from 'node:crypto';
import { OTP_CODE_LENGTH } from './otp.constants.js';

export function generateOtpCode(): string {
  const max = 10 ** OTP_CODE_LENGTH;
  return randomInt(0, max).toString().padStart(OTP_CODE_LENGTH, '0');
}

export function hashOtpCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}
