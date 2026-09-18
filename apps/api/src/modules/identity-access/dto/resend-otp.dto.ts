import { z } from 'zod';
import { countryCodeSchema, phoneNumberValueSchema } from './phone-number.dto.js';

export const resendOtpSchema = z.object({
  countryCode: countryCodeSchema,
  number: phoneNumberValueSchema,
});

export type ResendOtpDto = z.infer<typeof resendOtpSchema>;
