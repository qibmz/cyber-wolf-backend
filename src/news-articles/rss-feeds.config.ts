export interface RssFeedConfig {
  id: string;
  name: string;
  url: string;
  /** item 无 categories 时的兜底分类 */
  fallbackCategory: string;
}

/**
 * RSS 源配置（写死在代码中，如需后台可配置再迁移到数据库）。
 * 分类优先取 RSS item.categories；没有时用 fallbackCategory。
 */
export const RSS_FEEDS: RssFeedConfig[] = [
  {
    id: 'cointelegraph',
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
    fallbackCategory: 'Market',
  },
  {
    id: 'decrypt',
    name: 'Decrypt',
    url: 'https://decrypt.co/feed',
    fallbackCategory: 'Technology',
  },
  {
    id: 'bitcoinmagazine',
    name: 'Bitcoin Magazine',
    url: 'https://bitcoinmagazine.com/.rss/full/',
    fallbackCategory: 'Market',
  },
];
