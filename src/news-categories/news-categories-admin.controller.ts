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
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { NewsCategory } from './domain/news-category';
import { CreateNewsCategoryDto } from './dto/create-news-category.dto';
import { FindAllNewsCategoriesDto } from './dto/find-all-news-categories.dto';
import { UpdateNewsCategoryDto } from './dto/update-news-category.dto';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { toInfinityPagination } from '../utils/infinity-pagination';
import { DeletedStatus } from '../utils/types/deleted-status';
import { NewsCategoriesService } from './news-categories.service';
import {
  ApiSuccessPaginationResponse,
  ApiSuccessResponse,
} from '../utils/dto/api-success-response.dto';

@ApiTags('后台-资讯分类')
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'admin/news-categories',
  version: '1',
})
export class NewsCategoriesAdminController {
  constructor(private readonly newsCategoriesService: NewsCategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建资讯分类' })
  @ApiCreatedResponse({
    type: ApiSuccessResponse(NewsCategory, { codeExample: 201 }),
  })
  create(@Body() payload: CreateNewsCategoryDto): Promise<NewsCategory> {
    return this.newsCategoriesService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: '资讯分类列表（后台）' })
  @ApiOkResponse({ type: ApiSuccessPaginationResponse(NewsCategory) })
  async findAll(
    @Query() query: FindAllNewsCategoriesDto,
  ): Promise<InfinityPaginationResponseDto<NewsCategory>> {
    const page = query?.page ?? 1;
    const limit = Math.min(query?.limit ?? 10, 50);

    return toInfinityPagination(
      await this.newsCategoriesService.findPage({
        paginationOptions: { page, limit },
        deletedStatus: query.deletedStatus ?? DeletedStatus.All,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '资讯分类详情' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    type: ApiSuccessResponse(NewsCategory, { nullable: true }),
  })
  findById(@Param('id') id: string) {
    return this.newsCategoriesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新资讯分类' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    type: ApiSuccessResponse(NewsCategory, { nullable: true }),
  })
  update(@Param('id') id: string, @Body() payload: UpdateNewsCategoryDto) {
    return this.newsCategoriesService.update(id, payload);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: '恢复资讯分类' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: ApiSuccessResponse(NewsCategory) })
  restore(@Param('id') id: string) {
    return this.newsCategoriesService.restore(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除资讯分类' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string): Promise<void> {
    return this.newsCategoriesService.remove(id);
  }
}
