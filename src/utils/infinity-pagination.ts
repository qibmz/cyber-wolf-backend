import { IPaginationOptions } from './types/pagination-options';
import { PaginatedResult } from './types/paginated-result.type';
import { InfinityPaginationResponseDto } from './dto/infinity-pagination-response.dto';

export const infinityPagination = <T>(
  data: T[],
  options: IPaginationOptions,
  total: number,
): InfinityPaginationResponseDto<T> => {
  return {
    data,
    hasNextPage: options.page * options.limit < total,
    total,
  };
};

export const toInfinityPagination = <T>(
  page: PaginatedResult<T>,
): InfinityPaginationResponseDto<T> => {
  return infinityPagination(page.data, page.paginationOptions, page.total);
};
