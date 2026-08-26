import { Test } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthProvidersEnum } from './auth-providers.enum';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { MailService } from '../mail/mail.service';

describe('AuthService (wallet / dual-login)', () => {
  let authService: AuthService;
  let usersService: {
    findByWalletAddress: jest.Mock;
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let sessionService: { create: jest.Mock };
  let jwtService: { signAsync: jest.Mock };
  let configService: { getOrThrow: jest.Mock };

  const baseUser = {
    id: 10,
    nickname: null,
    email: null,
    password: undefined,
    provider: 'wallet',
    socialId: null,
    walletAddress: '0xabc',
    role: { id: RoleEnum.user },
    status: { id: StatusEnum.active },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    usersService = {
      findByWalletAddress: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    sessionService = {
      create: jest.fn().mockResolvedValue({ id: 99, hash: 'h', user: {} }),
    };
    jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    };
    configService = {
      getOrThrow: jest.fn((key: string) => {
        switch (key) {
          case 'auth.expires':
            return '15m';
          case 'auth.secret':
            return 'secret';
          case 'auth.refreshSecret':
            return 'refresh-secret';
          case 'auth.refreshExpires':
            return '30d';
          case 'auth.uniformErrors':
            return false;
          default:
            throw new Error(`Unknown config key: ${key}`);
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
        { provide: SessionService, useValue: sessionService },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateLogin (dual-login)', () => {
    it('should allow email and password login even when provider is wallet (password is set)', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      const user = {
        ...baseUser,
        provider: AuthProvidersEnum.wallet,
        email: 'a@b.com',
        password: passwordHash,
      };
      usersService.findByEmail.mockResolvedValue(user);

      const dto: AuthEmailLoginDto = {
        email: 'a@b.com',
        password: 'password123',
      };

      const result = await authService.validateLogin(dto);

      expect(result).toMatchObject({
        token: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('a@b.com');
    });

    it('should still reject email and password when the account has no password', async () => {
      const user = {
        ...baseUser,
        provider: AuthProvidersEnum.wallet,
        email: 'a@b.com',
        password: undefined,
      };
      usersService.findByEmail.mockResolvedValue(user);

      const dto: AuthEmailLoginDto = {
        email: 'a@b.com',
        password: 'password123',
      };

      await expect(authService.validateLogin(dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
      await expect(authService.validateLogin(dto)).rejects.toMatchObject({
        response: { errors: { password: 'incorrectPassword' } },
      });
    });
  });

  describe('loginWithWallet', () => {
    it('should create a user on first login (find-or-create) and issue tokens', async () => {
      const created = { ...baseUser, id: 10 };
      usersService.findByWalletAddress.mockResolvedValue(null);
      usersService.create.mockResolvedValue(created);
      usersService.findById.mockResolvedValue(created);

      const result = await authService.loginWithWallet('0xABC');

      expect(usersService.findByWalletAddress).toHaveBeenCalledWith('0xabc');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: null,
          nickname: null,
          walletAddress: '0xabc',
          provider: AuthProvidersEnum.wallet,
          role: { id: RoleEnum.user },
          status: { id: StatusEnum.active },
        }),
      );
      expect(result).toMatchObject({
        token: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({ id: 10 }),
      });
    });

    it('should log into an existing account without creating a new one', async () => {
      const existing = { ...baseUser, id: 10 };
      usersService.findByWalletAddress.mockResolvedValue(existing);

      const result = await authService.loginWithWallet('0xabc');

      expect(usersService.findByWalletAddress).toHaveBeenCalledWith('0xabc');
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result).toMatchObject({ token: 'access-token' });
    });
  });

  describe('bindWallet', () => {
    it('should bind the wallet address to the current user', async () => {
      usersService.findByWalletAddress.mockResolvedValue(null);
      usersService.update.mockResolvedValue({ ...baseUser, id: 1 });

      const result = await authService.bindWallet(1, '0xABC');

      expect(usersService.update).toHaveBeenCalledWith(1, {
        walletAddress: '0xabc',
      });
      expect(result).toMatchObject({ id: 1 });
    });

    it('should reject binding a wallet already owned by another account', async () => {
      usersService.findByWalletAddress.mockResolvedValue({
        ...baseUser,
        id: 5,
      });

      await expect(authService.bindWallet(1, '0xabc')).rejects.toThrow(
        UnprocessableEntityException,
      );
      await expect(authService.bindWallet(1, '0xabc')).rejects.toMatchObject({
        response: { errors: { walletAddress: 'walletAlreadyBound' } },
      });
    });
  });

  describe('bindEmail', () => {
    it('should update the account with the lowercased email and an optional password', async () => {
      usersService.update.mockResolvedValue({ ...baseUser, id: 2 });

      const result = await authService.bindEmail(2, 'JOHN@example.com', 'x1');

      expect(usersService.update).toHaveBeenCalledWith(2, {
        email: 'john@example.com',
        password: 'x1',
      });
      expect(result).toMatchObject({ id: 2 });
    });

    it('should omit the password when it is not provided', async () => {
      usersService.update.mockResolvedValue({ ...baseUser, id: 2 });

      await authService.bindEmail(2, 'john@example.com');

      expect(usersService.update).toHaveBeenCalledWith(2, {
        email: 'john@example.com',
      });
    });
  });
});
