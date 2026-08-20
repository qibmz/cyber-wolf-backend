import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NewsArticlesService } from './news-articles.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { NewsArticle } from './domain/news-article';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllNewsArticlesDto } from './dto/find-all-news-articles.dto';
import { FetchResult } from './news-articles.service';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';

@ApiTags('News')
@Controller({
  path: 'news',
  version: '1',
})
export class NewsArticlesController {
  constructor(private readonly newsArticlesService: NewsArticlesService) {}

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(NewsArticle),
  })
  async findAll(
    @Query() query: FindAllNewsArticlesDto,
  ): Promise<InfinityPaginationResponseDto<NewsArticle> & { total: number }> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const [articles, total] = await Promise.all([
      this.newsArticlesService.findAllWithPagination({
        paginationOptions: {
          page,
          limit,
        },
        category: query.category,
      }),
      this.newsArticlesService.count(query.category),
    ]);

    return {
      ...infinityPagination(articles, { page, limit }),
      total,
    };
  }

  @Post('fetch')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOkResponse({
    description: '触发一次 RSS 抓取，返回每个源的入库统计',
  })
  fetch(): Promise<FetchResult[]> {
    return this.newsArticlesService.fetchAll();
  }

  @Get('categories')
  @ApiOkResponse({
    description: '返回已入库资讯的去重分类列表',
    type: [String],
  })
  findCategories(): Promise<string[]> {
    return this.newsArticlesService.findCategories();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: NewsArticle,
  })
  findById(@Param('id') id: string) {
    return this.newsArticlesService.findById(id);
  }
}
