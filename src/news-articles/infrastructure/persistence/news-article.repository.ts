import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { PaginatedResult } from '../../../utils/types/paginated-result.type';
import { DeletedStatus } from '../../../utils/types/deleted-status';
import { NewsArticle } from '../../domain/news-article';

export abstract class NewsArticleRepository {
  abstract create(
    data: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<NewsArticle>;

  abstract findPage({
    paginationOptions,
    category,
    deletedStatus,
  }: {
    paginationOptions: IPaginationOptions;
    category?: string;
    deletedStatus?: DeletedStatus;
  }): Promise<PaginatedResult<NewsArticle>>;

  abstract findByUrl(url: string): Promise<NullableType<NewsArticle>>;

  abstract findByUrls(urls: string[]): Promise<NewsArticle[]>;

  abstract findById(id: NewsArticle['id']): Promise<NullableType<NewsArticle>>;

  abstract findByIds(ids: NewsArticle['id'][]): Promise<NewsArticle[]>;

  abstract update(
    id: NewsArticle['id'],
    payload: DeepPartial<NewsArticle>,
  ): Promise<NewsArticle | null>;

  abstract remove(id: NewsArticle['id']): Promise<void>;

  abstract restore(id: NewsArticle['id']): Promise<NewsArticle | null>;
}
