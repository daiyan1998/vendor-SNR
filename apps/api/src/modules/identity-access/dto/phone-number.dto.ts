import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const countryCodeSchema = z
  .string()
  .regex(/^\d{1,3}$/, 'countryCode must be 1-3 digits, no leading "+"');

export const phoneNumberValueSchema = z
  .string()
  .regex(/^\d{4,14}$/, 'number must be 4-14 digits, no spaces or symbols');

// Swagger-visible base for every request DTO keyed by phone number; extend
// it rather than repeating these two @ApiProperty fields (zod is still the
// runtime validator — see countryCodeSchema/phoneNumberValueSchema above).
export class PhoneNumberRequestDto {
  @ApiProperty({ description: 'Calling code, no leading "+"', example: '880' })
  countryCode: string;

  @ApiProperty({ description: 'Local number, digits only', example: '1710000000' })
  number: string;
}
