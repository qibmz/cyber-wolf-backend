import {
  // common
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Parser from 'rss-parser';
import { CreateNewsArticleDto } from './dto/create-news-article.dto';
import { UpdateNewsArticleDto } from './dto/update-news-article.dto';
import { NewsArticleRepository } from './infrastructure/persistence/news-article.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NewsArticle } from './domain/news-article';
import { RssFeedConfig, RSS_FEEDS } from './rss-feeds.config';

type RssItem = Parser.Item & {
  'media:content'?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
};

export interface FetchResult {
  source: string;
  added: number;
  skipped: number;
  error?: string;
}

@Injectable()
export class NewsArticlesService {
  private readonly logger = new Logger(NewsArticlesService.name);
  private readonly parser: Parser<unknown, RssItem>;

  constructor(
    // Dependencies here
    private readonly newsArticleRepository: NewsArticleRepository,
  ) {
    this.parser = new Parser({
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
      },
      customFields: {
        item: [['media:content', 'media:content', { keepArray: true }]],
      },
    });
  }

  create(createNewsArticleDto: CreateNewsArticleDto) {
    return this.newsArticleRepository.create({
      coverColor: createNewsArticleDto.coverColor,
      sourceName: createNewsArticleDto.sourceName,
      sourceId: createNewsArticleDto.sourceId,
      publishedAt: createNewsArticleDto.publishedAt,
      coverImage: createNewsArticleDto.coverImage,
      category: createNewsArticleDto.category,
      url: createNewsArticleDto.url,
      summary: createNewsArticleDto.summary,
      title: createNewsArticleDto.title,
    });
  }

  /**
   * 定时自动抓取：每 3 小时执行一次（增量，按 url 去重）。
   */
  @Cron(CronExpression.EVERY_3_HOURS, { name: 'news-fetch' })
  async handleScheduledFetch(): Promise<void> {
    this.logger.log('Scheduled RSS fetch started');
    const results = await this.fetchAll();
    this.logger.log(`Scheduled RSS fetch finished: ${JSON.stringify(results)}`);
  }

  /**
   * 遍历所有 RSS 源，解析并转换为统一格式入库。
   * 按原文链接去重（已存在则跳过）；单个源失败不影响其他源。
   */
  async fetchAll(): Promise<FetchResult[]> {
    const results: FetchResult[] = [];

    for (const feed of RSS_FEEDS) {
      try {
        results.push(await this.fetchFeed(feed));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to fetch RSS from ${feed.name}: ${message}`);
        results.push({
          source: feed.name,
          added: 0,
          skipped: 0,
          error: message,
        });
      }
    }

    return results;
  }

  private async fetchFeed(feed: RssFeedConfig): Promise<FetchResult> {
    const parsed = await this.parser.parseURL(feed.url);
    let added = 0;
    let skipped = 0;

    const candidates = parsed.items
      .map((item) => {
        const url = item.link?.trim();
        if (!url) {
          return null;
        }

        return {
          item,
          url,
          title: item.title?.trim() || 'Untitled',
          summary: item.contentSnippet ?? item.summary ?? '',
          coverImage: this.extractImage(item),
          publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
        };
      })
      .filter(
        (
          candidate,
        ): candidate is {
          item: RssItem;
          url: string;
          title: string;
          summary: string;
          coverImage: string | undefined;
          publishedAt: Date;
        } => candidate !== null,
      );

    if (!candidates.length) {
      return { source: feed.name, added: 0, skipped: parsed.items.length };
    }

    const existing = await this.newsArticleRepository.findByUrls(
      candidates.map((candidate) => candidate.url),
    );
    const existingUrls = new Set(existing.map((article) => article.url));

    for (const candidate of candidates) {
      if (existingUrls.has(candidate.url)) {
        skipped++;
        continue;
      }

      try {
        await this.newsArticleRepository.create({
          title: candidate.title,
          summary: candidate.summary,
          url: candidate.url,
          category: feed.defaultCategory,
          coverImage: candidate.coverImage,
          publishedAt: candidate.publishedAt,
          sourceId: feed.id,
          sourceName: feed.name,
          coverColor: feed.coverColor,
        });
        existingUrls.add(candidate.url);
        added++;
      } catch (error) {
        // Concurrent fetch / unique(url) race: treat as skipped.
        if (this.isUniqueViolation(error)) {
          skipped++;
          continue;
        }
        throw error;
      }
    }

    // Items without a link were filtered out earlier.
    skipped += parsed.items.length - candidates.length;

    return { source: feed.name, added, skipped };
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const codes = [
      (error as { code?: string }).code,
      (error as { driverError?: { code?: string } }).driverError?.code,
    ].filter(Boolean);

    // Postgres unique_violation / Mongo duplicate key
    if (codes.some((code) => code === '23505' || code === '11000')) {
      return true;
    }

    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error);
    return (
      message.includes('duplicate') ||
      message.includes('unique') ||
      message.includes('e11000')
    );
  }

  private extractImage(item: RssItem): string | undefined {
    const enclosureUrl = item.enclosure?.url;
    if (enclosureUrl) {
      return enclosureUrl;
    }

    const media = item['media:content'];
    if (Array.isArray(media)) {
      return media[0]?.$?.url;
    }
    return media?.$?.url;
  }

  findAllWithPagination({
    paginationOptions,
    category,
  }: {
    paginationOptions: IPaginationOptions;
    category?: string;
  }) {
    return this.newsArticleRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
      category,
    });
  }

  count(category?: string) {
    return this.newsArticleRepository.count({ category });
  }

  findCategories() {
    return this.newsArticleRepository.findCategories();
  }

  findById(id: NewsArticle['id']) {
    return this.newsArticleRepository.findById(id);
  }

  findByIds(ids: NewsArticle['id'][]) {
    return this.newsArticleRepository.findByIds(ids);
  }

  async update(
    id: NewsArticle['id'],

    updateNewsArticleDto: UpdateNewsArticleDto,
  ) {
    return this.newsArticleRepository.update(id, {
      coverColor: updateNewsArticleDto.coverColor,
      sourceName: updateNewsArticleDto.sourceName,
      sourceId: updateNewsArticleDto.sourceId,
      publishedAt: updateNewsArticleDto.publishedAt,
      coverImage: updateNewsArticleDto.coverImage,
      category: updateNewsArticleDto.category,
      url: updateNewsArticleDto.url,
      summary: updateNewsArticleDto.summary,
      title: updateNewsArticleDto.title,
    });
  }

  remove(id: NewsArticle['id']) {
    return this.newsArticleRepository.remove(id);
  }
}
