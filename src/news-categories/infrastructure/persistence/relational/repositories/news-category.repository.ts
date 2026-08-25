import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { NewsCategoryEntity } from '../entities/news-category.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { DeletedStatus } from '../../../../../utils/types/deleted-status';
import { NewsCategory } from '../../../../domain/news-category';
import { NewsCategoryRepository } from '../../news-category.repository';
import { NewsCategoryMapper } from '../mappers/news-category.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { PaginatedResult } from '../../../../../utils/types/paginated-result.type';
import { NewsArticleEntity } from '../../../../../news-articles/infrastructure/persistence/relational/entities/news-article.entity';

@Injectable()
export class NewsCategoryRelationalRepository implements NewsCategoryRepository {
  constructor(
    @InjectRepository(NewsCategoryEntity)
    private readonly newsCategoryRepository: Repository<NewsCategoryEntity>,
    @InjectRepository(NewsArticleEntity)
    private readonly newsArticleRepository: Repository<NewsArticleEntity>,
  ) {}

  async create(
    data: Omit<NewsCategory, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<NewsCategory> {
    const newEntity = await this.newsCategoryRepository.save(
      this.newsCategoryRepository.create({
        name: data.name,
        sortOrder: data.sortOrder,
      }),
    );
    return NewsCategoryMapper.toDomain(newEntity);
  }

  async findPage({
    paginationOptions,
    deletedStatus = DeletedStatus.All,
  }: {
    paginationOptions: IPaginationOptions;
    deletedStatus?: DeletedStatus;
  }): Promise<PaginatedResult<NewsCategory>> {
    const qb = this.newsCategoryRepository.createQueryBuilder('newsCategory');

    if (deletedStatus === DeletedStatus.Deleted) {
      qb.andWhere('newsCategory.deletedAt IS NOT NULL');
      qb.addOrderBy('newsCategory.deletedAt', 'DESC');
    } else if (deletedStatus === DeletedStatus.NotDeleted) {
      qb.andWhere('newsCategory.deletedAt IS NULL');
    } else {
      qb.addOrderBy('newsCategory.deletedAt', 'DESC', 'NULLS LAST');
    }

    qb.addOrderBy('newsCategory.sortOrder', 'ASC')
      .addOrderBy('newsCategory.createdAt', 'ASC')
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map((entity) => NewsCategoryMapper.toDomain(entity)),
      total,
      paginationOptions,
    };
  }

  async findAllActive(): Promise<NewsCategory[]> {
    const entities = await this.newsCategoryRepository.find({
      where: { deletedAt: IsNull() },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });

    return entities.map((entity) => NewsCategoryMapper.toDomain(entity));
  }

  async findById(id: NewsCategory['id']): Promise<NullableType<NewsCategory>> {
    const entity = await this.newsCategoryRepository.findOne({
      where: { id },
    });

    return entity ? NewsCategoryMapper.toDomain(entity) : null;
  }

  async findByName(
    name: NewsCategory['name'],
  ): Promise<NullableType<NewsCategory>> {
    const entity = await this.newsCategoryRepository.findOne({
      where: { name, deletedAt: IsNull() },
    });

    return entity ? NewsCategoryMapper.toDomain(entity) : null;
  }

  async findSoftDeletedByName(
    name: NewsCategory['name'],
  ): Promise<NullableType<NewsCategory>> {
    const entity = await this.newsCategoryRepository.findOne({
      where: { name, deletedAt: Not(IsNull()) },
      order: { deletedAt: 'DESC' },
    });

    return entity ? NewsCategoryMapper.toDomain(entity) : null;
  }

  async update(
    id: NewsCategory['id'],
    payload: Partial<NewsCategory>,
  ): Promise<NewsCategory | null> {
    const entity = await this.newsCategoryRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.newsCategoryRepository.save(
      this.newsCategoryRepository.create(
        NewsCategoryMapper.toPersistence({
          ...NewsCategoryMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return NewsCategoryMapper.toDomain(updatedEntity);
  }

  async updateAndSyncArticleCategory(
    id: NewsCategory['id'],
    payload: Partial<Pick<NewsCategory, 'name' | 'sortOrder'>>,
    previousName: string,
  ): Promise<NewsCategory | null> {
    return this.newsCategoryRepository.manager.transaction(async (manager) => {
      const categoryRepo = manager.getRepository(NewsCategoryEntity);
      const articleRepo = manager.getRepository(NewsArticleEntity);

      const entity = await categoryRepo.findOne({ where: { id } });
      if (!entity) {
        return null;
      }

      if (payload.name !== undefined) {
        entity.name = payload.name;
      }
      if (payload.sortOrder !== undefined) {
        entity.sortOrder = payload.sortOrder;
      }

      const saved = await categoryRepo.save(entity);

      if (payload.name !== undefined && payload.name !== previousName) {
        await articleRepo.update(
          { category: previousName },
          { category: payload.name },
        );
      }

      return NewsCategoryMapper.toDomain(saved);
    });
  }

  async remove(id: NewsCategory['id']): Promise<void> {
    await this.newsCategoryRepository.update(id, { deletedAt: new Date() });
  }

  async restore(id: NewsCategory['id']): Promise<NewsCategory | null> {
    const entity = await this.newsCategoryRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    entity.deletedAt = null;
    return NewsCategoryMapper.toDomain(
      await this.newsCategoryRepository.save(entity),
    );
  }
}
