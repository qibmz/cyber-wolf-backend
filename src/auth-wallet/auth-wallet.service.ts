import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateNonce, SiweMessage } from 'siwe';
import { AuthService } from '../auth/auth.service';
import { AllConfigType } from '../config/config.type';
import { User } from '../users/domain/user';
import { AuthWalletLoginDto } from './dto/auth-wallet-login.dto';

interface StoredNonce {
  expiresAt: number;
}

@Injectable()
export class AuthWalletService {
  // In-memory, single-instance store. For a horizontally scaled deployment
  // swap this for a shared store (Redis) keyed by the same nonce.
  private readonly nonceStore = new Map<string, StoredNonce>();

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly authService: AuthService,
  ) {}

  getNonce(): { nonce: string } {
    this.pruneExpiredNonces();

    const nonce = generateNonce();
    const ttl = this.getNonceTtl();
    this.nonceStore.set(nonce, { expiresAt: Date.now() + ttl });

    return { nonce };
  }

  async login(dto: AuthWalletLoginDto) {
    const address = await this.verify(dto);
    return this.authService.loginWithWallet(address);
  }

  async bindWallet(userId: User['id'], dto: AuthWalletLoginDto) {
    const address = await this.verify(dto);
    return this.authService.bindWallet(userId, address);
  }

  async bindEmail(userId: User['id'], email: string, password?: string) {
    return this.authService.bindEmail(userId, email, password);
  }

  /**
   * Verify an EIP-4361 (SIWE) message. Recovers the signer address from the
   * signature, ensures it matches the claimed `address`, validates the
   * server-issued one-time nonce, then consumes the nonce.
   */
  private async verify(dto: AuthWalletLoginDto): Promise<string> {
    const stored = this.nonceStore.get(dto.nonce);

    if (!stored || stored.expiresAt < Date.now()) {
      if (stored) {
        this.nonceStore.delete(dto.nonce);
      }
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          nonce: 'nonceExpired',
        },
      });
    }

    let siweMessage: SiweMessage;
    try {
      siweMessage = new SiweMessage(dto.message);
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          message: 'invalidSignature',
        },
      });
    }

    const domain = this.configService.get('wallet.domain', { infer: true });
    const verifyParams: { signature: string; nonce: string; domain?: string } =
      {
        signature: dto.signature,
        nonce: dto.nonce,
      };
    if (domain) {
      verifyParams.domain = domain;
    }

    let result;
    try {
      result = await siweMessage.verify(verifyParams);
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          message: 'invalidSignature',
        },
      });
    }

    if (!result.success) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          message: 'invalidSignature',
        },
      });
    }

    const recoveredAddress = result.data.address.toLowerCase();

    if (dto.address.toLowerCase() !== recoveredAddress) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          address: 'invalidSignature',
        },
      });
    }

    this.nonceStore.delete(dto.nonce);

    return recoveredAddress;
  }

  private getNonceTtl(): number {
    return this.configService.getOrThrow('wallet.nonceTtl', { infer: true });
  }

  private pruneExpiredNonces(): void {
    // Keep the in-memory store bounded: drop expired entries while we
    // already have a reasonable number of outstanding nonces.
    if (this.nonceStore.size < 1000) {
      return;
    }

    const now = Date.now();
    for (const [nonce, { expiresAt }] of this.nonceStore.entries()) {
      if (expiresAt < now) {
        this.nonceStore.delete(nonce);
      }
    }
  }
}
