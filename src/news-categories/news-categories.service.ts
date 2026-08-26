import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateNewsCategoryDto } from './dto/create-news-category.dto';
import { UpdateNewsCategoryDto } from './dto/update-news-category.dto';
import { NewsCategoryRepository } from './infrastructure/persistence/news-category.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { DeletedStatus } from '../utils/types/deleted-status';
import { NewsCategory } from './domain/news-category';

@Injectable()
export class NewsCategoriesService {
  constructor(
    private readonly newsCategoryRepository: NewsCategoryRepository,
  ) {}

  async create(dto: CreateNewsCategoryDto): Promise<NewsCategory> {
    const name = dto.name.trim();
    if (!name) {
      throw new UnprocessableEntityException({
        errors: {
          name: 'categoryNameRequired',
        },
      });
    }

    const existing = await this.newsCategoryRepository.findByName(name);
    if (existing) {
      throw new ConflictException({
        errors: {
          name: 'categoryNameExists',
        },
      });
    }

    return this.newsCategoryRepository.create({
      name,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  findPage({
    paginationOptions,
    deletedStatus = DeletedStatus.All,
  }: {
    paginationOptions: IPaginationOptions;
    deletedStatus?: DeletedStatus;
  }) {
    return this.newsCategoryRepository.findPage({
      paginationOptions,
      deletedStatus,
    });
  }

  findAllActive() {
    return this.newsCategoryRepository.findAllActive();
  }

  async findById(id: NewsCategory['id']): Promise<NewsCategory> {
    const category = await this.newsCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException();
    }
    return category;
  }

  /**
   * 公开查询用：按 id 解析分类名，仅保留未软删的分类。
   * 返回 null 表示该分类不存在或已被软删（此时可按空结果处理）。
   */
  async getActiveNameById(id: NewsCategory['id']): Promise<string | null> {
    const category = await this.newsCategoryRepository.findById(id);
    if (!category || category.deletedAt) {
      return null;
    }
    return category.name;
  }

  async assertCategoryNameExists(name: string): Promise<string> {
    const trimmed = name.trim();
    const category = await this.newsCategoryRepository.findByName(trimmed);
    if (!category) {
      throw new UnprocessableEntityException({
        errors: {
          category: 'categoryNotExists',
        },
      });
    }
    return category.name;
  }

  /**
   * 按名称确保可用分类（RSS 同步用）。
   * - 已存在且未删除 → 返回该名称
   * - 同名已被软删 → 返回 null（视为禁用，不恢复、不新建）
   * - 不存在 → 自动创建并返回
   */
  async ensureByName(name: string): Promise<string | null> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new UnprocessableEntityException({
        errors: {
          name: 'categoryNameRequired',
        },
      });
    }

    const existing = await this.newsCategoryRepository.findByName(trimmed);
    if (existing) {
      return existing.name;
    }

    const softDeleted =
      await this.newsCategoryRepository.findSoftDeletedByName(trimmed);
    if (softDeleted) {
      return null;
    }

    try {
      const created = await this.newsCategoryRepository.create({
        name: trimmed,
        sortOrder: 0,
      });
      return created.name;
    } catch (error) {
      // 并发创建同名分类时回读
      const raced = await this.newsCategoryRepository.findByName(trimmed);
      if (raced) {
        return raced.name;
      }
      const racedDeleted =
        await this.newsCategoryRepository.findSoftDeletedByName(trimmed);
      if (racedDeleted) {
        return null;
      }
      throw error;
    }
  }

  async update(
    id: NewsCategory['id'],
    dto: UpdateNewsCategoryDto,
  ): Promise<NewsCategory> {
    const current = await this.findById(id);

    let nextName: string | undefined;
    if (dto.name !== undefined) {
      nextName = dto.name.trim();
      if (!nextName) {
        throw new UnprocessableEntityException({
          errors: {
            name: 'categoryNameRequired',
          },
        });
      }

      if (nextName !== current.name) {
        const existing = await this.newsCategoryRepository.findByName(nextName);
        if (existing && existing.id !== id) {
          throw new ConflictException({
            errors: {
              name: 'categoryNameExists',
            },
          });
        }
      }
    }

    const updated =
      await this.newsCategoryRepository.updateAndSyncArticleCategory(
        id,
        {
          ...(nextName !== undefined ? { name: nextName } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        },
        current.name,
      );

    if (!updated) {
      throw new NotFoundException();
    }

    return updated;
  }

  async remove(id: NewsCategory['id']): Promise<void> {
    await this.findById(id);
    await this.newsCategoryRepository.remove(id);
  }

  async restore(id: NewsCategory['id']): Promise<NewsCategory> {
    const current = await this.newsCategoryRepository.findById(id);
    if (!current) {
      throw new NotFoundException();
    }

    if (!current.deletedAt) {
      return current;
    }

    const conflict = await this.newsCategoryRepository.findByName(current.name);
    if (conflict) {
      throw new ConflictException({
        errors: {
          name: 'categoryNameExists',
        },
      });
    }

    const restored = await this.newsCategoryRepository.restore(id);
    if (!restored) {
      throw new NotFoundException();
    }
    return restored;
  }
}
