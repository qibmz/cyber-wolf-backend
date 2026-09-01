import { ApiProperty } from '@nestjs/swagger';

export class AppInfoDto {
  @ApiProperty({ example: 'Cyber Wolf API', description: '应用名称' })
  name: string;
}
