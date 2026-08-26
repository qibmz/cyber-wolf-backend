import { registerAs } from '@nestjs/config';

import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { WalletConfig } from './wallet-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  WALLET_DOMAIN: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  WALLET_NONCE_TTL: number;
}

export default registerAs<WalletConfig>('wallet', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    domain: process.env.WALLET_DOMAIN,
    nonceTtl: process.env.WALLET_NONCE_TTL
      ? parseInt(process.env.WALLET_NONCE_TTL, 10)
      : 5 * 60 * 1000,
  };
});
