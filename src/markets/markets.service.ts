import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { PaginatedResult } from '../utils/types/paginated-result.type';
import { IPaginationOptions } from '../utils/types/pagination-options';
import {
  BinanceMarketClient,
  UsdtSymbolMeta,
} from './binance/binance-market.client';
import { Market } from './domain/market';
import { MarketLogoService } from './logos/market-logo.service';

@Injectable()
export class MarketsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketsService.name);
  private items: Market[] = [];
  private symbols: UsdtSymbolMeta[] = [];
  private tickerRefreshRequested = false;
  private tickerRefreshRunning: Promise<void> | null = null;
  private refreshingMeta = false;
  private tickerTimer: ReturnType<typeof setInterval> | null = null;
  private metaTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly binanceClient: BinanceMarketClient,
    private readonly logoService: MarketLogoService,
  ) {}

  onModuleInit(): void {
    void this.bootstrap();

    const tickerMs = this.configService.getOrThrow('markets.tickerIntervalMs', {
      infer: true,
    });
    const metaMs = this.configService.getOrThrow(
      'markets.exchangeInfoIntervalMs',
      { infer: true },
    );
    this.tickerTimer = setInterval(() => void this.refreshTickers(), tickerMs);
    this.metaTimer = setInterval(() => void this.refreshMeta(), metaMs);
  }

  onModuleDestroy(): void {
    if (this.tickerTimer) {
      clearInterval(this.tickerTimer);
      this.tickerTimer = null;
    }
    if (this.metaTimer) {
      clearInterval(this.metaTimer);
      this.metaTimer = null;
    }
  }

  findPage(options: {
    paginationOptions: IPaginationOptions;
    q?: string;
  }): PaginatedResult<Market> {
    const filtered = this.filterItems(options.q);
    const { page, limit } = options.paginationOptions;
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit),
      total: filtered.length,
      paginationOptions: options.paginationOptions,
    };
  }

  findBySymbol(symbol: string): Market | null {
    const normalized = symbol.trim().toUpperCase();
    return this.items.find((item) => item.symbol === normalized) ?? null;
  }

  private async bootstrap(): Promise<void> {
    await this.refreshMeta();
    if (!this.items.length) {
      await this.refreshTickers();
    }
  }

  private filterItems(q?: string): Market[] {
    if (!q?.trim()) {
      return this.items;
    }
    const needle = q.trim().toUpperCase();
    return this.items.filter(
      (item) => item.symbol.includes(needle) || item.baseAsset.includes(needle),
    );
  }

  /**
   * Coalesce concurrent callers: if a refresh is in flight, mark another pass
   * and await the same promise so callers (esp. meta) see updated symbols.
   */
  private async refreshTickers(): Promise<void> {
    this.tickerRefreshRequested = true;
    if (this.tickerRefreshRunning) {
      return this.tickerRefreshRunning;
    }

    this.tickerRefreshRunning = (async () => {
      while (this.tickerRefreshRequested) {
        this.tickerRefreshRequested = false;
        if (!this.symbols.length) {
          continue;
        }
        try {
          const markets = await this.binanceClient.fetchUsdtTickers(
            this.symbols,
          );
          this.items = this.logoService.applyLogos(markets);
          this.logger.debug(`Refreshed ${this.items.length} USDT markets`);
        } catch (error) {
          this.logger.warn(`Ticker refresh failed: ${String(error)}`);
        }
      }
    })().finally(() => {
      this.tickerRefreshRunning = null;
    });

    return this.tickerRefreshRunning;
  }

  private async refreshMeta(): Promise<void> {
    if (this.refreshingMeta) {
      return;
    }
    this.refreshingMeta = true;
    try {
      const symbols = await this.binanceClient.fetchUsdtTradingSymbols();
      if (symbols.length) {
        this.symbols = symbols;
        await this.refreshTickers();
      }

      const baseAssets = (this.symbols.length ? this.symbols : this.items).map(
        (item) => item.baseAsset,
      );
      if (baseAssets.length) {
        await this.logoService.syncMissingLogos(baseAssets);
        if (this.items.length) {
          this.items = this.logoService.applyLogos(this.items);
        }
      }
    } catch (error) {
      this.logger.warn(`Markets meta refresh failed: ${String(error)}`);
    } finally {
      this.refreshingMeta = false;
    }
  }
}
