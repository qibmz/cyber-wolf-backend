import { ApiProperty } from '@nestjs/swagger';

export class AuthWalletNonceResponseDto {
  @ApiProperty({
    example: 'abc123',
  })
  nonce: string;
}
