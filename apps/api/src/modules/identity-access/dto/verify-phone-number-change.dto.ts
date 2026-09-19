import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import {
  countryCodeSchema,
  phoneNumberValueSchema,
  PhoneNumberRequestDto,
} from './phone-number.dto.js';
import { OTP_CODE_LENGTH } from '../otp/otp.constants.js';

export const verifyPhoneNumberChangeSchema = z.object({
  countryCode: countryCodeSchema,
  number: phoneNumberValueSchema,
  code: z
    .string()
    .regex(new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`), `code must be ${OTP_CODE_LENGTH} digits`),
});

export type VerifyPhoneNumberChangeDto = z.infer<typeof verifyPhoneNumberChangeSchema>;

export class VerifyPhoneNumberChangeRequestDto
  extends PhoneNumberRequestDto
  implements VerifyPhoneNumberChangeDto
{
  @ApiProperty({
    description: `${OTP_CODE_LENGTH}-digit code sent to the new number`,
    example: '483920',
  })
  code: string;
}
