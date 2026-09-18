import { z } from 'zod';
import { countryCodeSchema, phoneNumberValueSchema } from './phone-number.dto.js';

export const registerSchema = z.object({
  countryCode: countryCodeSchema,
  number: phoneNumberValueSchema,
  displayName: z.string().trim().min(1).max(120),
  tosAccepted: z.boolean(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
