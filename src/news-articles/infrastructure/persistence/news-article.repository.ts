import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { NewsArticle } from '../../domain/news-article';

export abstract class NewsArticleRepository {
  abstract create(
    data: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<NewsArticle>;

  abstract findAllWithPagination({
    paginationOptions,
    category,
  }: {
    paginationOptions: IPaginationOptions;
    category?: string;
  }): Promise<NewsArticle[]>;

  abstract count({ category }: { category?: string }): Promise<number>;

  abstract findCategories(): Promise<string[]>;

  abstract findByUrl(url: string): Promise<NullableType<NewsArticle>>;

  abstract findByUrls(urls: string[]): Promise<NewsArticle[]>;

  abstract findById(id: NewsArticle['id']): Promise<NullableType<NewsArticle>>;

  abstract findByIds(ids: NewsArticle['id'][]): Promise<NewsArticle[]>;

  abstract update(
    id: NewsArticle['id'],
    payload: DeepPartial<NewsArticle>,
  ): Promise<NewsArticle | null>;

  abstract remove(id: NewsArticle['id']): Promise<void>;
}
