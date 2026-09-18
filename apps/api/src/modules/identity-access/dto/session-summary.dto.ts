import { ApiProperty } from '@nestjs/swagger';

export class SessionSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;
}
