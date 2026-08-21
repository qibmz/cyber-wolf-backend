import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UserDto {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
