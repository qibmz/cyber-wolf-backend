import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { NewsArticle } from './domain/news-article';
import { CreateNewsArticleDto } from './dto/create-news-article.dto';
import { FindAllAdminNewsArticlesDto } from './dto/find-all-news-articles.dto';
import { UpdateNewsArticleDto } from './dto/update-news-article.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { toInfinityPagination } from '../utils/infinity-pagination';
import { DeletedStatus } from '../utils/types/deleted-status';
import { NewsArticlesService } from './news-articles.service';

@ApiTags('Admin News')
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'admin/news',
  version: '1',
})
export class NewsArticlesAdminController {
  constructor(private readonly newsArticlesService: NewsArticlesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: NewsArticle })
  create(@Body() payload: CreateNewsArticleDto): Promise<NewsArticle> {
    return this.newsArticlesService.create(payload);
  }

  @Get()
  @ApiOkResponse({ type: InfinityPaginationResponse(NewsArticle) })
  async findAll(
    @Query() query: FindAllAdminNewsArticlesDto,
  ): Promise<InfinityPaginationResponseDto<NewsArticle>> {
    const page = query?.page ?? 1;
    const limit = Math.min(query?.limit ?? 10, 50);

    return toInfinityPagination(
      await this.newsArticlesService.findPage({
        paginationOptions: { page, limit },
        category: query.category,
        deletedStatus: query.deletedStatus ?? DeletedStatus.All,
      }),
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: NewsArticle })
  findById(@Param('id') id: string) {
    return this.newsArticlesService.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: NewsArticle })
  update(@Param('id') id: string, @Body() payload: UpdateNewsArticleDto) {
    return this.newsArticlesService.update(id, payload);
  }

  @Patch(':id/restore')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: NewsArticle })
  restore(@Param('id') id: string) {
    return this.newsArticlesService.restore(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string): Promise<void> {
    return this.newsArticlesService.remove(id);
  }
}
