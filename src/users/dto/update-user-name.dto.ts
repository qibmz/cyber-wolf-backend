import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserNameDto {
  @ApiPropertyOptional({ example: 'John', type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;
}
