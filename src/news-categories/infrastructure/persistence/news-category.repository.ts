import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { PaginatedResult } from '../../../utils/types/paginated-result.type';
import { DeletedStatus } from '../../../utils/types/deleted-status';
import { NewsCategory } from '../../domain/news-category';

export abstract class NewsCategoryRepository {
  abstract create(
    data: Omit<NewsCategory, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<NewsCategory>;

  abstract findPage({
    paginationOptions,
    deletedStatus,
  }: {
    paginationOptions: IPaginationOptions;
    deletedStatus?: DeletedStatus;
  }): Promise<PaginatedResult<NewsCategory>>;

  abstract findAllActive(): Promise<NewsCategory[]>;

  abstract findById(
    id: NewsCategory['id'],
  ): Promise<NullableType<NewsCategory>>;

  abstract findByName(
    name: NewsCategory['name'],
  ): Promise<NullableType<NewsCategory>>;

  abstract findSoftDeletedByName(
    name: NewsCategory['name'],
  ): Promise<NullableType<NewsCategory>>;

  abstract update(
    id: NewsCategory['id'],
    payload: DeepPartial<NewsCategory>,
  ): Promise<NewsCategory | null>;

  /**
   * 更新分类；若名称变更，同一事务内同步 news_article.category。
   */
  abstract updateAndSyncArticleCategory(
    id: NewsCategory['id'],
    payload: Partial<Pick<NewsCategory, 'name' | 'sortOrder'>>,
    previousName: string,
  ): Promise<NewsCategory | null>;

  abstract remove(id: NewsCategory['id']): Promise<void>;

  abstract restore(id: NewsCategory['id']): Promise<NewsCategory | null>;
}
