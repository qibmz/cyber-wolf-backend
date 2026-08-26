import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthWalletLoginDto {
  @ApiProperty({
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'EIP-4361 / SIWE message',
    example: 'app.example.com wants you to sign in...',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: '0x...',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    example: 'abc123',
  })
  @IsString()
  @IsNotEmpty()
  nonce: string;
}
