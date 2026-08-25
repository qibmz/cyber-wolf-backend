import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
import { toInfinityPagination } from '../utils/infinity-pagination';
import { FindAllNewsArticlesDto } from './dto/find-all-news-articles.dto';
import { FetchResult } from './news-articles.service';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { NewsCategory } from '../news-categories/domain/news-category';
import { DeletedStatus } from '../utils/types/deleted-status';

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
  ): Promise<InfinityPaginationResponseDto<NewsArticle>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return toInfinityPagination(
      await this.newsArticlesService.findPage({
        paginationOptions: {
          page,
          limit,
        },
        category: query.category,
        deletedStatus: DeletedStatus.NotDeleted,
      }),
    );
  }

  @Post('fetch')
  @HttpCode(HttpStatus.OK)
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
    description: '返回启用中的资讯分类列表',
    type: [NewsCategory],
  })
  findCategories(): Promise<NewsCategory[]> {
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
    return this.newsArticlesService.findPublicById(id);
  }
}
