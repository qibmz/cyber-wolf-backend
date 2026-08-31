import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** RSS 抓取结果（Swagger / 对外响应） */
export class FetchResultDto {
  @ApiProperty({ description: '来源名称' })
  source: string;

  @ApiProperty({ description: '新增条数' })
  added: number;

  @ApiProperty({ description: '跳过条数' })
  skipped: number;

  @ApiPropertyOptional({ description: '失败时的错误信息' })
  error?: string;
}
