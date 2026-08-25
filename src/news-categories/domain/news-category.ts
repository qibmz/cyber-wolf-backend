import { ApiProperty } from '@nestjs/swagger';

export class NewsCategory {
  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  name: string;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  sortOrder: number;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    nullable: true,
    required: false,
  })
  deletedAt?: Date | null;
}
