import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthProviderRepository } from 'src/auth/providers/google/repository/auth-provider.repository';
import { UsersService } from 'src/users/users.service';
import { AuthProviderType, Prisma, User, UserStatus } from '@prisma/client';
import type { GoogleUserInfo } from 'src/auth/providers/google/types/google.types';
import { UserAuthEmailService } from 'src/users/features/credentials/user-auth-email.service';
import { UserAuthAccountService } from 'src/users/features/credentials/user-auth-account.service';
import { PrivacyService } from 'src/settings/features/privacy/privacy.service';
import { NotificationsSettingsService } from 'src/settings/features/notifications/notifications-settings.service';

@Injectable()
export class GoogleUserResolverService {
  private readonly logger = new Logger(GoogleUserResolverService.name);

  constructor(
    private readonly authProviderRepository: AuthProviderRepository,
    private readonly usersService: UsersService,
    private readonly userAuthEmailService: UserAuthEmailService,
    private readonly userAuthAccountService: UserAuthAccountService,
    private readonly privacyService: PrivacyService,
    private readonly notificationsSettingsService: NotificationsSettingsService,
  ) {}

  async resolveUser(
    profile: GoogleUserInfo,
    tx: Prisma.TransactionClient,
  ): Promise<User> {
    this.logger.log('provider lookup: start');
    const existingProvider = await this.authProviderRepository.findByProvider(
      AuthProviderType.GOOGLE,
      profile.sub,
      tx,
    );

    if (existingProvider) {
      this.logger.log('provider found, loading linked user');
      const linkedUser = await this.usersService.findById(
        existingProvider.userId,
        tx,
      );

      if (!linkedUser) {
        this.logger.error('Google provider linked user not found', {
          providerId: existingProvider.providerId,
        });
        throw new UnauthorizedException('Linked account not found');
      }

      this.ensureUserActive(linkedUser);
      const ensuredUser = await this.ensureUserVerified(linkedUser, tx);
      await this.touchProviderRecord(profile, tx);
      return ensuredUser;
    }

    this.logger.log('provider not found, resolving by email');
    const existingUser = await this.userAuthEmailService.findByEmail(
      profile.email,
      tx,
    );

    if (existingUser) {
      this.ensureUserActive(existingUser);
      const ensuredUser = await this.ensureUserVerified(existingUser, tx);
      await this.createProviderRecord(ensuredUser.id, profile, tx);
      return ensuredUser;
    }

    this.logger.log('no user found by email, creating new user');
    const newUser = await this.createUserFromGoogleProfile(profile, tx);
    await this.privacyService.ensureSettingsForUser(newUser.id, tx);
    await this.notificationsSettingsService.ensureSettingsForUser(
      newUser.id,
      tx,
    );
    await this.createProviderRecord(newUser.id, profile, tx);
    return newUser;
  }

  private ensureUserActive(user: User) {
    if (user.status === UserStatus.BANNED) {
      this.logger.warn('Account is banned');
      throw new UnauthorizedException('Account is banned');
    }
  }

  private async ensureUserVerified(
    user: User,
    tx: Prisma.TransactionClient,
  ): Promise<User> {
    if (!user.emailVerifiedAt || user.status === UserStatus.PENDING) {
      this.logger.log('mark email verified for user');
      return this.userAuthEmailService.markEmailVerified(user.id, tx);
    }

    return user;
  }

  private async touchProviderRecord(
    profile: GoogleUserInfo,
    tx: Prisma.TransactionClient,
  ) {
    this.logger.log('update google provider timestamp');
    await this.authProviderRepository.update(
      {
        provider_providerId: {
          provider: AuthProviderType.GOOGLE,
          providerId: profile.sub,
        },
      },
      {
        updatedAt: new Date(),
      },
      tx,
    );
  }

  private async createProviderRecord(
    userId: string,
    profile: GoogleUserInfo,
    tx: Prisma.TransactionClient,
  ) {
    this.logger.log('create google provider record');
    await this.authProviderRepository.create(
      {
        provider: AuthProviderType.GOOGLE,
        providerId: profile.sub,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      tx,
    );
  }

  private async createUserFromGoogleProfile(
    profile: GoogleUserInfo,
    tx: Prisma.TransactionClient,
  ): Promise<User> {
    const name =
      profile.name ||
      [profile.given_name, profile.family_name].filter(Boolean).join(' ') ||
      'Google User';

    const username =
      await this.userAuthAccountService.generateUniqueUsername(name);

    return this.userAuthAccountService.createUser(
      {
        name,
        username,
        email: profile.email,
        password: null,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
        avatarUrl: profile.picture ?? null,
        avatarPublicId: null,
      },
      tx,
    );
  }
}
