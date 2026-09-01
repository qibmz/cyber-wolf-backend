import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { Market } from '../domain/market';

export type UsdtSymbolMeta = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
};

type BinanceExchangeSymbol = {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
};

type BinanceTicker24hr = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
};

@Injectable()
export class BinanceMarketClient {
  private readonly logger = new Logger(BinanceMarketClient.name);

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  private baseUrl(): string {
    return this.configService.getOrThrow('markets.binanceBaseUrl', {
      infer: true,
    });
  }

  private timeoutMs(): number {
    return this.configService.getOrThrow('markets.httpTimeoutMs', {
      infer: true,
    });
  }

  async fetchUsdtTradingSymbols(): Promise<UsdtSymbolMeta[]> {
    const data = await this.getJson<{ symbols: BinanceExchangeSymbol[] }>(
      '/api/v3/exchangeInfo',
    );
    return (data.symbols ?? [])
      .filter((s) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
      .map((s) => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
      }));
  }

  /**
   * Pull full 24hr book once (weight 80), then keep only allow-listed USDT symbols.
   */
  async fetchUsdtTickers(symbols: UsdtSymbolMeta[]): Promise<Market[]> {
    const allowed = new Map(symbols.map((s) => [s.symbol, s] as const));
    const tickers = await this.fetchAllTickers24hr();
    const markets: Market[] = [];

    for (const ticker of tickers) {
      const meta = allowed.get(ticker.symbol);
      if (!meta) {
        continue;
      }
      markets.push({
        symbol: meta.symbol,
        baseAsset: meta.baseAsset,
        quoteAsset: meta.quoteAsset,
        lastPrice: ticker.lastPrice,
        priceChangePercent: ticker.priceChangePercent,
        highPrice: ticker.highPrice,
        lowPrice: ticker.lowPrice,
        volume: ticker.volume,
        quoteVolume: ticker.quoteVolume,
        logoUrl: null,
      });
    }

    markets.sort(
      (a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume),
    );
    return markets;
  }

  private async fetchAllTickers24hr(): Promise<BinanceTicker24hr[]> {
    const data = await this.getJson<BinanceTicker24hr[]>('/api/v3/ticker/24hr');
    return Array.isArray(data) ? data : [];
  }

  private async getJson<T>(path: string): Promise<T> {
    const url = `${this.baseUrl()}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs());

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Binance HTTP ${response.status} for ${path}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      this.logger.warn(`Binance request failed ${path}: ${String(error)}`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
