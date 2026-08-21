import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NewsArticleSchemaClass } from '../entities/news-article.schema';
import { NewsArticleRepository } from '../../news-article.repository';
import { NewsArticle } from '../../../../domain/news-article';
import { NewsArticleMapper } from '../mappers/news-article.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { PaginatedResult } from '../../../../../utils/types/paginated-result.type';

@Injectable()
export class NewsArticleDocumentRepository implements NewsArticleRepository {
  constructor(
    @InjectModel(NewsArticleSchemaClass.name)
    private readonly newsArticleModel: Model<NewsArticleSchemaClass>,
  ) {}

  async create(data: NewsArticle): Promise<NewsArticle> {
    const persistenceModel = NewsArticleMapper.toPersistence(data);
    const createdEntity = new this.newsArticleModel(persistenceModel);
    const entityObject = await createdEntity.save();
    return NewsArticleMapper.toDomain(entityObject);
  }

  async findPage({
    paginationOptions,
    category,
  }: {
    paginationOptions: IPaginationOptions;
    category?: string;
  }): Promise<PaginatedResult<NewsArticle>> {
    const where = category ? { category } : {};

    const [entityObjects, total] = await Promise.all([
      this.newsArticleModel
        .find(where)
        .sort({ publishedAt: -1 })
        .skip((paginationOptions.page - 1) * paginationOptions.limit)
        .limit(paginationOptions.limit),
      this.newsArticleModel.countDocuments(where),
    ]);

    return {
      data: entityObjects.map((entityObject) =>
        NewsArticleMapper.toDomain(entityObject),
      ),
      total,
      paginationOptions,
    };
  }

  async findCategories(): Promise<string[]> {
    const categories = await this.newsArticleModel.distinct('category');
    return categories
      .filter((category): category is string => typeof category === 'string')
      .sort();
  }

  async findByUrl(url: string): Promise<NullableType<NewsArticle>> {
    const entityObject = await this.newsArticleModel.findOne({ url });
    return entityObject ? NewsArticleMapper.toDomain(entityObject) : null;
  }

  async findByUrls(urls: string[]): Promise<NewsArticle[]> {
    if (!urls.length) {
      return [];
    }

    const entityObjects = await this.newsArticleModel.find({
      url: { $in: urls },
    });
    return entityObjects.map((entityObject) =>
      NewsArticleMapper.toDomain(entityObject),
    );
  }

  async findById(id: NewsArticle['id']): Promise<NullableType<NewsArticle>> {
    const entityObject = await this.newsArticleModel.findById(id);
    return entityObject ? NewsArticleMapper.toDomain(entityObject) : null;
  }

  async findByIds(ids: NewsArticle['id'][]): Promise<NewsArticle[]> {
    const entityObjects = await this.newsArticleModel.find({
      _id: { $in: ids },
    });
    return entityObjects.map((entityObject) =>
      NewsArticleMapper.toDomain(entityObject),
    );
  }

  async update(
    id: NewsArticle['id'],
    payload: Partial<NewsArticle>,
  ): Promise<NullableType<NewsArticle>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.newsArticleModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject = await this.newsArticleModel.findOneAndUpdate(
      filter,
      NewsArticleMapper.toPersistence({
        ...NewsArticleMapper.toDomain(entity),
        ...clonedPayload,
      }),
      { new: true },
    );

    return entityObject ? NewsArticleMapper.toDomain(entityObject) : null;
  }

  async remove(id: NewsArticle['id']): Promise<void> {
    await this.newsArticleModel.deleteOne({ _id: id });
  }
}
