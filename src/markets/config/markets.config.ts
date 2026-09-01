import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional, IsUrl, Min } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { MarketsConfig } from './markets-config.type';

class EnvironmentVariablesValidator {
  @IsOptional()
  @IsUrl({ require_tld: false })
  BINANCE_BASE_URL?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  COINGECKO_BASE_URL?: string;

  @IsOptional()
  @IsInt()
  @Min(1000)
  MARKETS_TICKER_INTERVAL_MS?: number;

  @IsOptional()
  @IsInt()
  @Min(60000)
  MARKETS_EXCHANGE_INFO_INTERVAL_MS?: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  MARKETS_HTTP_TIMEOUT_MS?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  MARKETS_LOGO_SYNC_BATCH_SIZE?: number;
}

export default registerAs<MarketsConfig>('markets', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    binanceBaseUrl: (
      process.env.BINANCE_BASE_URL || 'https://data-api.binance.vision'
    ).replace(/\/$/, ''),
    coingeckoBaseUrl: (
      process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com'
    ).replace(/\/$/, ''),
    tickerIntervalMs: process.env.MARKETS_TICKER_INTERVAL_MS
      ? parseInt(process.env.MARKETS_TICKER_INTERVAL_MS, 10)
      : 10_000,
    exchangeInfoIntervalMs: process.env.MARKETS_EXCHANGE_INFO_INTERVAL_MS
      ? parseInt(process.env.MARKETS_EXCHANGE_INFO_INTERVAL_MS, 10)
      : 3_600_000,
    httpTimeoutMs: process.env.MARKETS_HTTP_TIMEOUT_MS
      ? parseInt(process.env.MARKETS_HTTP_TIMEOUT_MS, 10)
      : 5_000,
    logoSyncBatchSize: process.env.MARKETS_LOGO_SYNC_BATCH_SIZE
      ? parseInt(process.env.MARKETS_LOGO_SYNC_BATCH_SIZE, 10)
      : 20,
  };
});
