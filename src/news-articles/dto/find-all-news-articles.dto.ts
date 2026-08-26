import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DeletedStatus } from '../../utils/types/deleted-status';

export { DeletedStatus };

/** 公开资讯列表查询 */
export class FindAllNewsArticlesDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: '按分类筛选（如 Market / Technology）',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: '按分类 id 筛选（存在时优先于 category 名字）',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;
}

/** 后台资讯列表查询 */
export class FindAllAdminNewsArticlesDto extends FindAllNewsArticlesDto {
  @ApiPropertyOptional({
    enum: DeletedStatus,
    description: 'all=全部，notDeleted=未删除，deleted=已删除；默认 all',
    default: DeletedStatus.All,
  })
  @IsEnum(DeletedStatus)
  @IsOptional()
  deletedStatus?: DeletedStatus;
}
