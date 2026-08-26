import { Module } from '@nestjs/common';
import { AuthWalletService } from './auth-wallet.service';
import { ConfigModule } from '@nestjs/config';
import { AuthWalletController } from './auth-wallet.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [AuthWalletService],
  exports: [AuthWalletService],
  controllers: [AuthWalletController],
})
export class AuthWalletModule {}
