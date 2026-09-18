import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import {
  countryCodeSchema,
  phoneNumberValueSchema,
  PhoneNumberRequestDto,
} from './phone-number.dto.js';

export const registerSchema = z.object({
  countryCode: countryCodeSchema,
  number: phoneNumberValueSchema,
  displayName: z.string().trim().min(1).max(120),
  tosAccepted: z.boolean(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

// zod (via registerSchema) is the runtime validator; this class exists so
// Swagger can render a request-body schema — `implements RegisterDto` keeps
// the two from drifting apart.
export class RegisterRequestDto extends PhoneNumberRequestDto implements RegisterDto {
  @ApiProperty({ example: 'Asha' })
  displayName: string;

  @ApiProperty({ description: 'Must be true to register', example: true })
  tosAccepted: boolean;
}
