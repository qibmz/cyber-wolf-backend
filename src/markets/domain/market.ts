import { ApiProperty } from '@nestjs/swagger';

export class Market {
  @ApiProperty({ example: 'BTCUSDT', description: '交易对' })
  symbol: string;

  @ApiProperty({ example: 'BTC', description: '基础币种' })
  baseAsset: string;

  @ApiProperty({ example: 'USDT', description: '计价币种' })
  quoteAsset: string;

  @ApiProperty({ example: '65432.10', description: '最新价' })
  lastPrice: string;

  @ApiProperty({ example: '1.23', description: '24h 涨跌幅（%）' })
  priceChangePercent: string;

  @ApiProperty({ example: '66000.00', description: '24h 最高价' })
  highPrice: string;

  @ApiProperty({ example: '64000.00', description: '24h 最低价' })
  lowPrice: string;

  @ApiProperty({ example: '1234.56', description: '24h 成交量（基础币）' })
  volume: string;

  @ApiProperty({ example: '80000000.00', description: '24h 成交额（USDT）' })
  quoteVolume: string;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'https://cdn.example.com/market-logos/btc.png',
    description: '币种图标 URL',
  })
  logoUrl: string | null;
}
