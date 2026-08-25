import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateNewsCategoryDto {
  @ApiProperty({
    required: true,
    type: () => String,
    example: 'Market',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    type: () => Number,
    example: 0,
    description: '越小越靠前',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
