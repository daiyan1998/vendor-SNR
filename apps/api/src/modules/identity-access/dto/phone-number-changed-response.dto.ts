import { ApiProperty } from '@nestjs/swagger';

export class PhoneNumberChangedResponseDto {
  @ApiProperty({ example: 'phone_number_changed' })
  status: 'phone_number_changed';
}
