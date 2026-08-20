import { NewsArticle } from '../../../../domain/news-article';

import { NewsArticleEntity } from '../entities/news-article.entity';

export class NewsArticleMapper {
  static toDomain(raw: NewsArticleEntity): NewsArticle {
    const domainEntity = new NewsArticle();
    domainEntity.coverColor = raw.coverColor;

    domainEntity.sourceName = raw.sourceName;

    domainEntity.sourceId = raw.sourceId;

    domainEntity.publishedAt = raw.publishedAt;

    domainEntity.coverImage = raw.coverImage;

    domainEntity.category = raw.category;

    domainEntity.url = raw.url;

    domainEntity.summary = raw.summary;

    domainEntity.title = raw.title;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: NewsArticle): NewsArticleEntity {
    const persistenceEntity = new NewsArticleEntity();
    persistenceEntity.coverColor = domainEntity.coverColor;

    persistenceEntity.sourceName = domainEntity.sourceName;

    persistenceEntity.sourceId = domainEntity.sourceId;

    persistenceEntity.publishedAt = domainEntity.publishedAt;

    persistenceEntity.coverImage = domainEntity.coverImage;

    persistenceEntity.category = domainEntity.category;

    persistenceEntity.url = domainEntity.url;

    persistenceEntity.summary = domainEntity.summary;

    persistenceEntity.title = domainEntity.title;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
