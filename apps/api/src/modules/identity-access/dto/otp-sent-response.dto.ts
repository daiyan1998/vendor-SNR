import { ApiProperty } from '@nestjs/swagger';

export class OtpSentResponseDto {
  @ApiProperty({ example: 'otp_sent' })
  status: 'otp_sent';

  @ApiProperty({ example: '2026-01-01T00:05:00.000Z' })
  expiresAt: Date;
}
