import { IPaginationOptions } from './pagination-options';

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  paginationOptions: IPaginationOptions;
};
