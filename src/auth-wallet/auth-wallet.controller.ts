import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoginResponseDto } from '../auth/dto/login-response.dto';
import { User } from '../users/domain/user';
import { AuthWalletService } from './auth-wallet.service';
import { AuthWalletLoginDto } from './dto/auth-wallet-login.dto';
import { AuthWalletBindEmailDto } from './dto/auth-wallet-bind-email.dto';
import { AuthWalletNonceResponseDto } from './dto/auth-wallet-nonce-response.dto';
import type { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import type { RequestWithUser } from '../utils/types/request-with-user.type';

@ApiTags('Auth')
@Controller({
  path: 'auth/wallet',
  version: '1',
})
export class AuthWalletController {
  constructor(private readonly authWalletService: AuthWalletService) {}

  @Get('nonce')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: AuthWalletNonceResponseDto,
  })
  nonce(): AuthWalletNonceResponseDto {
    return this.authWalletService.getNonce();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    groups: ['me'],
  })
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  login(@Body() loginDto: AuthWalletLoginDto): Promise<LoginResponseDto> {
    return this.authWalletService.login(loginDto);
  }

  @ApiBearerAuth()
  @Post('bind')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    groups: ['me'],
  })
  @ApiOkResponse({
    type: User,
  })
  bind(
    @Request() request: RequestWithUser<JwtPayloadType>,
    @Body() loginDto: AuthWalletLoginDto,
  ): Promise<User | null> {
    return this.authWalletService.bindWallet(request.user.id, loginDto);
  }

  @ApiBearerAuth()
  @Post('bind/email')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    groups: ['me'],
  })
  @ApiOkResponse({
    type: User,
  })
  bindEmail(
    @Request() request: RequestWithUser<JwtPayloadType>,
    @Body() bindEmailDto: AuthWalletBindEmailDto,
  ): Promise<User | null> {
    return this.authWalletService.bindEmail(
      request.user.id,
      bindEmailDto.email,
      bindEmailDto.password,
    );
  }
}
