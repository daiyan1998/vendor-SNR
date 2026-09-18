import { z } from 'zod';
import {
  countryCodeSchema,
  phoneNumberValueSchema,
  PhoneNumberRequestDto,
} from './phone-number.dto.js';

export const loginSchema = z.object({
  countryCode: countryCodeSchema,
  number: phoneNumberValueSchema,
});

export type LoginDto = z.infer<typeof loginSchema>;

export class LoginRequestDto extends PhoneNumberRequestDto implements LoginDto {}
