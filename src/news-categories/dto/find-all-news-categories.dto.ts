import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { DeletedStatus } from '../../utils/types/deleted-status';

export class FindAllNewsCategoriesDto {
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
    enum: DeletedStatus,
    description: 'all=全部，notDeleted=未删除，deleted=已删除；默认 all',
    default: DeletedStatus.All,
  })
  @IsEnum(DeletedStatus)
  @IsOptional()
  deletedStatus?: DeletedStatus;
}
