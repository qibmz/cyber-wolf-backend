import { ApiProperty } from '@nestjs/swagger';

export class NewsArticle {
  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  coverColor: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  sourceName: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  sourceId: string;

  @ApiProperty({
    type: () => Date,
    nullable: false,
  })
  publishedAt: Date;

  @ApiProperty({
    type: () => String,
    nullable: true,
    required: false,
  })
  coverImage?: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  category: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  url: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  summary: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  title: string;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
