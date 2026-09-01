import { Module } from '@nestjs/common';
import { BinanceMarketClient } from './binance/binance-market.client';
import { MarketLogoService } from './logos/market-logo.service';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';

@Module({
  controllers: [MarketsController],
  providers: [MarketsService, BinanceMarketClient, MarketLogoService],
  exports: [MarketsService],
})
export class MarketsModule {}
