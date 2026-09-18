import { ApiProperty } from '@nestjs/swagger';

export class SessionRevokedResponseDto {
  @ApiProperty({ example: 'revoked' })
  status: 'revoked';
}
