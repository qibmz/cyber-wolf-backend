import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class FindAllMarketsDto {
  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: '每页条数（最大 50）',
    example: 10,
    default: 10,
  })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: '搜索关键词（匹配 symbol / baseAsset，如 BTC、BTCUSDT）',
    example: 'BTC',
  })
  @IsString()
  @IsOptional()
  q?: string;
}
