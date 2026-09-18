import { z } from 'zod';
import { countryCodeSchema, phoneNumberValueSchema } from './phone-number.dto.js';

export const loginSchema = z.object({
  countryCode: countryCodeSchema,
  number: phoneNumberValueSchema,
});

export type LoginDto = z.infer<typeof loginSchema>;
