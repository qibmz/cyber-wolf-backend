import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class NewsArticleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
