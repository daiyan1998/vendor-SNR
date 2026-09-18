import { ApiProperty } from '@nestjs/swagger';

export class LoggedOutResponseDto {
  @ApiProperty({ example: 'logged_out' })
  status: 'logged_out';
}
