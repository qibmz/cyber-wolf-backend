import {
  // decorators here

  IsString,
  IsOptional,
  IsDate,
} from 'class-validator';

import {
  // decorators here
  ApiProperty,
} from '@nestjs/swagger';

import {
  // decorators here

  Transform,
} from 'class-transformer';

export class CreateNewsArticleDto {
  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  sourceName: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  sourceId: string;

  @ApiProperty({
    required: true,
    type: () => Date,
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  publishedAt: Date;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  category: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  url: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  summary: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  title: string;

  // Don't forget to use the class-validator decorators in the DTO properties.
}
