import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({ description: 'Bearer token for this Session', example: 'a1b2c3…' })
  sessionToken: string;

  @ApiProperty()
  userId: string;
}
