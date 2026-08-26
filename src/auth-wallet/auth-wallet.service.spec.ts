import { Test } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HDNodeWallet, Wallet } from 'ethers';
import { SiweMessage } from 'siwe';
import { AuthService } from '../auth/auth.service';
import { AuthWalletService } from './auth-wallet.service';
import { AuthWalletLoginDto } from './dto/auth-wallet-login.dto';

describe('AuthWalletService', () => {
  let service: AuthWalletService;
  let authService: {
    loginWithWallet: jest.Mock;
    bindWallet: jest.Mock;
    bindEmail: jest.Mock;
  };

  const nonceTtl = 5 * 60 * 1000;

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'wallet.nonceTtl') {
        return nonceTtl;
      }
      throw new Error(`Unknown config key: ${key}`);
    }),
    get: jest.fn(() => undefined),
  };

  beforeEach(async () => {
    authService = {
      loginWithWallet: jest.fn().mockResolvedValue({
        token: 'access',
        refreshToken: 'refresh',
        tokenExpires: 1,
        user: { id: 1 },
      }),
      bindWallet: jest.fn().mockResolvedValue({ id: 1 }),
      bindEmail: jest.fn().mockResolvedValue({ id: 1 }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthWalletService,
        { provide: ConfigService, useValue: configService },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = moduleRef.get(AuthWalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Issue a fresh nonce via the service, then build a valid SIWE message and
   * sign it with a random wallet. Returns the signed DTO plus the wallet.
   */
  async function buildSignedDto(
    overrides: Partial<AuthWalletLoginDto> = {},
  ): Promise<{ dto: AuthWalletLoginDto; wallet: HDNodeWallet }> {
    const wallet = Wallet.createRandom();
    const { nonce } = service.getNonce();
    const siwe = new SiweMessage({
      domain: 'app.example.com',
      address: wallet.address,
      nonce,
      uri: 'https://app.example.com',
      version: '1',
      chainId: 1,
      statement: 'Sign in to Cyber Wolf',
      issuedAt: new Date().toISOString(),
    });
    const message = siwe.prepareMessage();
    const signature = await wallet.signMessage(message);

    const dto: AuthWalletLoginDto = {
      address: wallet.address,
      message,
      signature,
      nonce,
      ...overrides,
    };
    return { dto, wallet };
  }

  async function expectWalletError(
    promise: Promise<unknown>,
    field: string,
    key: string,
  ): Promise<void> {
    try {
      await promise;
      throw new Error('Expected the promise to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      const response = (
        error as UnprocessableEntityException
      ).getResponse() as Record<string, any>;
      expect(response.errors).toMatchObject({ [field]: key });
    }
  }

  describe('getNonce', () => {
    it('should return a nonce and register it with the configured TTL', () => {
      const { nonce } = service.getNonce();

      expect(nonce).toEqual(expect.any(String));
      expect(nonce.length).toBeGreaterThan(0);
      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'wallet.nonceTtl',
        expect.anything(),
      );
    });
  });

  describe('login', () => {
    it('should verify the signature and log in with the recovered lowercased address', async () => {
      const { dto, wallet } = await buildSignedDto();

      const result = await service.login(dto);

      expect(authService.loginWithWallet).toHaveBeenCalledWith(
        wallet.address.toLowerCase(),
      );
      expect(result).toMatchObject({ token: 'access' });
    });

    it('should reject a signature that does not match the message address', async () => {
      const { dto } = await buildSignedDto();
      const attacker = Wallet.createRandom();
      const badSignature = await attacker.signMessage(dto.message);

      dto.signature = badSignature;

      await expectWalletError(
        service.login(dto),
        'message',
        'invalidSignature',
      );
    });

    it('should reject when the claimed address differs from the recovered signer', async () => {
      const { dto, wallet } = await buildSignedDto();
      const differentWallet = Wallet.createRandom();

      dto.address = differentWallet.address;

      expect(wallet.address.toLowerCase()).not.toBe(
        differentWallet.address.toLowerCase(),
      );

      await expectWalletError(
        service.login(dto),
        'address',
        'invalidSignature',
      );
    });

    it('should reject a nonce that was never issued', async () => {
      const wallet = Wallet.createRandom();
      const nonce = 'validFakeNonce123';
      const siwe = new SiweMessage({
        domain: 'app.example.com',
        address: wallet.address,
        nonce,
        uri: 'https://app.example.com',
        version: '1',
        chainId: 1,
        issuedAt: new Date().toISOString(),
      });
      const message = siwe.prepareMessage();
      const signature = await wallet.signMessage(message);

      const dto: AuthWalletLoginDto = {
        address: wallet.address,
        message,
        signature,
        nonce,
      };

      await expectWalletError(service.login(dto), 'nonce', 'nonceExpired');
    });

    it('should reject a malformed SIWE message', async () => {
      const { nonce } = service.getNonce();

      const dto: AuthWalletLoginDto = {
        address: '0x1234567890123456789012345678901234567890',
        message: 'not a siwe message',
        signature: '0x00000000',
        nonce,
      };

      await expectWalletError(
        service.login(dto),
        'message',
        'invalidSignature',
      );
    });
  });

  describe('bindWallet', () => {
    it('should bind the verified wallet address to the given user', async () => {
      const { dto, wallet } = await buildSignedDto();
      const userId = 42;

      const result = await service.bindWallet(userId, dto);

      expect(authService.bindWallet).toHaveBeenCalledWith(
        userId,
        wallet.address.toLowerCase(),
      );
      expect(result).toMatchObject({ id: 1 });
    });
  });

  describe('bindEmail', () => {
    it('should delegate email and password binding to the auth service', async () => {
      const userId = 7;

      const result = await service.bindEmail(userId, 'A@B.com', 'secret123');

      expect(authService.bindEmail).toHaveBeenCalledWith(
        userId,
        'A@B.com',
        'secret123',
      );
      expect(result).toMatchObject({ id: 1 });
    });
  });
});
