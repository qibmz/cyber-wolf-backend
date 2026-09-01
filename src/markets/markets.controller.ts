import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiSuccessPaginationResponse,
  ApiSuccessResponse,
} from '../utils/dto/api-success-response.dto';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { toInfinityPagination } from '../utils/infinity-pagination';
import { Market } from './domain/market';
import { FindAllMarketsDto } from './dto/find-all-markets.dto';
import { MarketsService } from './markets.service';

@ApiTags('markets')
@Controller({
  path: 'markets',
  version: '1',
})
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  @ApiOperation({ summary: 'USDT 行情列表' })
  @ApiOkResponse({
    description: '默认按 24h 成交额降序',
    type: ApiSuccessPaginationResponse(Market),
  })
  findAll(
    @Query() query: FindAllMarketsDto,
  ): InfinityPaginationResponseDto<Market> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return toInfinityPagination(
      this.marketsService.findPage({
        paginationOptions: { page, limit },
        q: query.q,
      }),
    );
  }

  @Get(':symbol')
  @ApiOperation({ summary: '单币行情详情' })
  @ApiParam({
    name: 'symbol',
    description: '交易对，如 BTCUSDT',
    example: 'BTCUSDT',
  })
  @ApiOkResponse({
    description: '未找到或行情不可用时 data 为 null',
    type: ApiSuccessResponse(Market, { nullable: true }),
  })
  findOne(@Param('symbol') symbol: string): Market | null {
    return this.marketsService.findBySymbol(symbol);
  }
}
