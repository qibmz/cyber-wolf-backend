export interface RssFeedConfig {
  id: string;
  name: string;
  url: string;
  defaultCategory: string;
  coverColor: string;
}

/**
 * RSS 源配置（写死在代码中，如需后台可配置再迁移到数据库）。
 * 结构与前端 RSS_FEEDS 保持一致。
 */
export const RSS_FEEDS: RssFeedConfig[] = [
  {
    id: 'cointelegraph',
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
    defaultCategory: 'Market',
    coverColor: '#F7931A',
  },
  {
    id: 'decrypt',
    name: 'Decrypt',
    url: 'https://decrypt.co/feed',
    defaultCategory: 'Technology',
    coverColor: '#627EEA',
  },
  {
    id: 'bitcoinmagazine',
    name: 'Bitcoin Magazine',
    url: 'https://bitcoinmagazine.com/.rss/full/',
    defaultCategory: 'Market',
    coverColor: '#F7931A',
  },
];
