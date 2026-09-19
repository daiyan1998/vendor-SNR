import { z } from 'zod';
import {
  countryCodeSchema,
  phoneNumberValueSchema,
  PhoneNumberRequestDto,
} from './phone-number.dto.js';

export const changePhoneNumberSchema = z.object({
  countryCode: countryCodeSchema,
  number: phoneNumberValueSchema,
});

export type ChangePhoneNumberDto = z.infer<typeof changePhoneNumberSchema>;

export class ChangePhoneNumberRequestDto
  extends PhoneNumberRequestDto
  implements ChangePhoneNumberDto {}
