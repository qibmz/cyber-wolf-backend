import { Test } from '@nestjs/testing';
import { NewsArticlesService } from './news-articles.service';
import { NewsArticleRepository } from './infrastructure/persistence/news-article.repository';
import { NewsCategoriesService } from '../news-categories/news-categories.service';

describe('NewsArticlesService (categoryId filter)', () => {
  let service: NewsArticlesService;
  let repo: { findPage: jest.Mock };
  let categories: { getActiveNameById: jest.Mock };

  const pagination = { page: 1, limit: 10 };

  beforeEach(async () => {
    repo = {
      findPage: jest.fn().mockResolvedValue({
        data: [],
        total: 0,
        paginationOptions: pagination,
      }),
    };
    categories = { getActiveNameById: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        NewsArticlesService,
        { provide: NewsArticleRepository, useValue: repo },
        { provide: NewsCategoriesService, useValue: categories },
      ],
    }).compile();

    service = moduleRef.get(NewsArticlesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should filter by the category name when only category is provided', async () => {
    await service.findPage({
      paginationOptions: pagination,
      category: 'Technology',
    });

    expect(repo.findPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Technology' }),
    );
  });

  it('should resolve categoryId to a name and filter by it', async () => {
    categories.getActiveNameById.mockResolvedValue('Technology');

    await service.findPage({
      paginationOptions: pagination,
      categoryId: 'cat-1',
    });

    expect(categories.getActiveNameById).toHaveBeenCalledWith('cat-1');
    expect(repo.findPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Technology' }),
    );
  });

  it('should return an empty page when the categoryId does not resolve (not found / soft-deleted)', async () => {
    categories.getActiveNameById.mockResolvedValue(null);

    const result = await service.findPage({
      paginationOptions: pagination,
      categoryId: 'missing',
    });

    expect(result).toEqual({
      data: [],
      total: 0,
      paginationOptions: pagination,
    });
    expect(repo.findPage).not.toHaveBeenCalled();
  });

  it('should prefer categoryId over the category name', async () => {
    categories.getActiveNameById.mockResolvedValue('Market');

    await service.findPage({
      paginationOptions: pagination,
      category: 'Technology',
      categoryId: 'cat-2',
    });

    expect(repo.findPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Market' }),
    );
  });
});
