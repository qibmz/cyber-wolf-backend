import { NewsArticle } from '../../../../domain/news-article';

import { NewsArticleSchemaClass } from '../entities/news-article.schema';

export class NewsArticleMapper {
  public static toDomain(raw: NewsArticleSchemaClass): NewsArticle {
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

    domainEntity.id = raw._id.toString();
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  public static toPersistence(
    domainEntity: NewsArticle,
  ): NewsArticleSchemaClass {
    const persistenceSchema = new NewsArticleSchemaClass();
    persistenceSchema.coverColor = domainEntity.coverColor;

    persistenceSchema.sourceName = domainEntity.sourceName;

    persistenceSchema.sourceId = domainEntity.sourceId;

    persistenceSchema.publishedAt = domainEntity.publishedAt;

    persistenceSchema.coverImage = domainEntity.coverImage;

    persistenceSchema.category = domainEntity.category;

    persistenceSchema.url = domainEntity.url;

    persistenceSchema.summary = domainEntity.summary;

    persistenceSchema.title = domainEntity.title;

    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;

    return persistenceSchema;
  }
}
