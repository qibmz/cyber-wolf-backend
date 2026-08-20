import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NewsArticleEntity } from '../entities/news-article.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { NewsArticle } from '../../../../domain/news-article';
import { NewsArticleRepository } from '../../news-article.repository';
import { NewsArticleMapper } from '../mappers/news-article.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class NewsArticleRelationalRepository implements NewsArticleRepository {
  constructor(
    @InjectRepository(NewsArticleEntity)
    private readonly newsArticleRepository: Repository<NewsArticleEntity>,
  ) {}

  async create(data: NewsArticle): Promise<NewsArticle> {
    const persistenceModel = NewsArticleMapper.toPersistence(data);
    const newEntity = await this.newsArticleRepository.save(
      this.newsArticleRepository.create(persistenceModel),
    );
    return NewsArticleMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
    category,
  }: {
    paginationOptions: IPaginationOptions;
    category?: string;
  }): Promise<NewsArticle[]> {
    const entities = await this.newsArticleRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: category ? { category } : {},
      order: {
        publishedAt: 'DESC',
      },
    });

    return entities.map((entity) => NewsArticleMapper.toDomain(entity));
  }

  async count({ category }: { category?: string }): Promise<number> {
    return this.newsArticleRepository.count({
      where: category ? { category } : {},
    });
  }

  async findCategories(): Promise<string[]> {
    const rows = await this.newsArticleRepository
      .createQueryBuilder('newsArticle')
      .select('DISTINCT newsArticle.category', 'category')
      .where('newsArticle.category IS NOT NULL')
      .orderBy('newsArticle.category', 'ASC')
      .getRawMany();

    return rows.map((row) => row.category as string);
  }

  async findByUrl(url: string): Promise<NullableType<NewsArticle>> {
    const entity = await this.newsArticleRepository.findOne({
      where: { url },
    });

    return entity ? NewsArticleMapper.toDomain(entity) : null;
  }

  async findByUrls(urls: string[]): Promise<NewsArticle[]> {
    if (!urls.length) {
      return [];
    }

    const entities = await this.newsArticleRepository.find({
      where: { url: In(urls) },
    });

    return entities.map((entity) => NewsArticleMapper.toDomain(entity));
  }

  async findById(id: NewsArticle['id']): Promise<NullableType<NewsArticle>> {
    const entity = await this.newsArticleRepository.findOne({
      where: { id },
    });

    return entity ? NewsArticleMapper.toDomain(entity) : null;
  }

  async findByIds(ids: NewsArticle['id'][]): Promise<NewsArticle[]> {
    const entities = await this.newsArticleRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => NewsArticleMapper.toDomain(entity));
  }

  async update(
    id: NewsArticle['id'],
    payload: Partial<NewsArticle>,
  ): Promise<NewsArticle> {
    const entity = await this.newsArticleRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.newsArticleRepository.save(
      this.newsArticleRepository.create(
        NewsArticleMapper.toPersistence({
          ...NewsArticleMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return NewsArticleMapper.toDomain(updatedEntity);
  }

  async remove(id: NewsArticle['id']): Promise<void> {
    await this.newsArticleRepository.delete(id);
  }
}
