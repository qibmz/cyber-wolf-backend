import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { FileDriver } from '../../files/config/file-config.type';
import {
  buildObjectKey,
  createFileS3Client,
  publicUrlForKey,
} from '../../files/infrastructure/uploader/s3-client.factory';

const COINGECKO_INDEX_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_LOGO_BYTES = 512 * 1024;

type CoingeckoMarketRow = {
  symbol?: string;
  image?: string;
};

@Injectable()
export class MarketLogoService {
  private readonly logger = new Logger(MarketLogoService.name);
  private syncing = false;
  private readonly logos: Record<string, string | null> = {};
  private coingeckoImages: Record<string, string> = {};
  private coingeckoFetchedAt = 0;

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  async syncMissingLogos(
    baseAssets: string[],
  ): Promise<Record<string, string | null>> {
    if (this.syncing) {
      return this.logos;
    }

    this.syncing = true;
    try {
      const missing = [
        ...new Set(
          baseAssets
            .map((a) => a.toUpperCase())
            .filter((a) => this.logos[a] === undefined),
        ),
      ];

      if (missing.length === 0) {
        return this.logos;
      }

      if (!this.canUploadToObjectStorage()) {
        this.logger.debug(
          'Skip logo sync: S3/R2 public upload is not configured',
        );
        return this.logos;
      }

      const index = await this.ensureCoingeckoIndex();
      const batchSize = this.configService.getOrThrow(
        'markets.logoSyncBatchSize',
        { infer: true },
      );
      const batch = missing.slice(0, batchSize);

      for (const asset of batch) {
        const sourceUrl = index[asset];
        if (!sourceUrl) {
          // Confirmed missing in CoinGecko index — no point retrying until index refresh.
          this.logos[asset] = null;
          continue;
        }
        try {
          this.logos[asset] = await this.uploadLogo(asset, sourceUrl);
        } catch (error) {
          // Leave undefined so the next hourly sync can retry transient failures.
          this.logger.warn(`Logo upload failed for ${asset}: ${String(error)}`);
        }
      }

      return this.logos;
    } finally {
      this.syncing = false;
    }
  }

  applyLogos<T extends { baseAsset: string; logoUrl: string | null }>(
    items: T[],
  ): T[] {
    return items.map((item) => ({
      ...item,
      logoUrl: this.logos[item.baseAsset.toUpperCase()] ?? null,
    }));
  }

  private canUploadToObjectStorage(): boolean {
    const file = this.configService.get('file', { infer: true });
    if (!file) {
      return false;
    }
    if (
      file.driver !== FileDriver.S3 &&
      file.driver !== FileDriver.S3_PRESIGNED
    ) {
      return false;
    }
    return Boolean(
      file.awsDefaultS3Bucket &&
      file.accessKeyId &&
      file.secretAccessKey &&
      file.awsS3PublicBaseUrl,
    );
  }

  private async ensureCoingeckoIndex(): Promise<Record<string, string>> {
    if (
      this.coingeckoFetchedAt &&
      Date.now() - this.coingeckoFetchedAt < COINGECKO_INDEX_MAX_AGE_MS
    ) {
      return this.coingeckoImages;
    }

    this.coingeckoImages = await this.fetchCoingeckoImages();
    this.coingeckoFetchedAt = Date.now();
    return this.coingeckoImages;
  }

  private async fetchCoingeckoImages(): Promise<Record<string, string>> {
    const baseUrl = this.configService.getOrThrow('markets.coingeckoBaseUrl', {
      infer: true,
    });
    const timeoutMs = this.configService.getOrThrow('markets.httpTimeoutMs', {
      infer: true,
    });
    const images: Record<string, string> = {};

    for (let page = 1; page <= 4; page += 1) {
      const url = `${baseUrl}/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`;
      const rows = await this.getJson<CoingeckoMarketRow[]>(url, timeoutMs);
      for (const row of rows) {
        const symbol = row.symbol?.toUpperCase();
        if (!symbol || !row.image || images[symbol]) {
          continue;
        }
        images[symbol] = row.image;
      }
    }

    this.logger.log(
      `CoinGecko index loaded: ${Object.keys(images).length} symbols`,
    );
    return images;
  }

  private async uploadLogo(
    baseAsset: string,
    sourceUrl: string,
  ): Promise<string | null> {
    const fileCfg = this.configService.getOrThrow('file', { infer: true });
    const timeoutMs = this.configService.getOrThrow('markets.httpTimeoutMs', {
      infer: true,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(sourceUrl, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = (response.headers.get('content-type') || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      if (!contentType.startsWith('image/')) {
        throw new Error(`Unexpected content-type: ${contentType || 'empty'}`);
      }

      const body = Buffer.from(await response.arrayBuffer());
      if (body.length === 0 || body.length > MAX_LOGO_BYTES) {
        throw new Error(`Invalid logo size: ${body.length}`);
      }

      const ext = contentType.includes('jpeg')
        ? 'jpg'
        : contentType.includes('webp')
          ? 'webp'
          : contentType.includes('gif')
            ? 'gif'
            : 'png';
      const key = buildObjectKey(
        fileCfg,
        `market-logos/${baseAsset.toLowerCase()}.${ext}`,
      );
      const s3 = createFileS3Client(fileCfg);
      await s3.send(
        new PutObjectCommand({
          Bucket: fileCfg.awsDefaultS3Bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: 'public, max-age=604800',
        }),
      );
      return publicUrlForKey(fileCfg, key);
    } finally {
      clearTimeout(timer);
    }
  }

  private async getJson<T>(url: string, timeoutMs: number): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`CoinGecko HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
