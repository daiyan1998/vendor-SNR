import { z } from 'zod';
import { countryCodeSchema, phoneNumberValueSchema } from './phone-number.dto.js';
import { OTP_CODE_LENGTH } from '../otp/otp.constants.js';

export const verifyOtpSchema = z.object({
  countryCode: countryCodeSchema,
  number: phoneNumberValueSchema,
  code: z
    .string()
    .regex(new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`), `code must be ${OTP_CODE_LENGTH} digits`),
});

export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
