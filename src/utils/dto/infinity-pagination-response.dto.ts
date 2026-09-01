import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class InfinityPaginationResponseDto<T> {
  data: T[];
  hasNextPage: boolean;
  total: number;
}

export function InfinityPaginationResponse<T>(classReference: Type<T>) {
  abstract class Pagination {
    @ApiProperty({ type: [classReference], description: '列表数据' })
    data!: T[];

    @ApiProperty({
      type: Boolean,
      example: true,
      description: '是否有下一页',
    })
    hasNextPage: boolean;

    @ApiProperty({
      type: Number,
      example: 100,
      description: '总条数',
    })
    total: number;
  }

  Object.defineProperty(Pagination, 'name', {
    writable: false,
    value: `InfinityPagination${classReference.name}ResponseDto`,
  });

  return Pagination;
}
