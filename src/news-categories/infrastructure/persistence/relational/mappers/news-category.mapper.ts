import { NewsCategory } from '../../../../domain/news-category';
import { NewsCategoryEntity } from '../entities/news-category.entity';

export class NewsCategoryMapper {
  static toDomain(raw: NewsCategoryEntity): NewsCategory {
    const domainEntity = new NewsCategory();
    domainEntity.name = raw.name;
    domainEntity.sortOrder = raw.sortOrder;
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: NewsCategory): NewsCategoryEntity {
    const persistenceEntity = new NewsCategoryEntity();
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.sortOrder = domainEntity.sortOrder;
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;
    return persistenceEntity;
  }
}
