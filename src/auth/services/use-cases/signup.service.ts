import { Injectable, Logger, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../users/users.service';
import { EmailTokenService } from './email-token.service';
import { UserStatus } from '@prisma/client';
import { AUTH_RATE_LIMITS } from '../../constants/rate-limit.constants';
import { RateLimitService } from '../../../common/services/rate-limit.service';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly emailTokenService: EmailTokenService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(params: { name: string; email: string; password: string }) {
    const { name, email, password } = params;

    const { limit, windowSeconds, keyPrefix } = AUTH_RATE_LIMITS.SIGNUP;
    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: email,
      limit,
      windowSeconds,
      limitExceededMessage: 'Too many signup attempts. Please try again later.',
    });

    try {
      this.logger.log('Signup flow started', email);
      const [existingUser, pendingEmailUser] = await Promise.all([
        this.usersService.findByEmail(email),
        this.usersService.findByPendingEmail(email),
      ]);

      if (pendingEmailUser) {
        this.logger.warn(
          'Email is pending verification on another account',
          email,
        );
        throw new ConflictException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const { rawToken, digest, expiresAt } =
        this.emailTokenService.generateEmailVerificationToken();

      if (existingUser) {
        if (existingUser.status !== UserStatus.PENDING) {
          this.logger.warn('User already exists', email);
          throw new ConflictException('User already exists');
        }

        const refreshedUser = await this.usersService.refreshPendingUser(
          existingUser.id,
          {
            name,
            hashedPassword,
            verificationDigest: digest,
            verificationExpiresAt: expiresAt,
          },
        );

        await this.emailTokenService.sendVerificationEmail({
          to: refreshedUser.email,
          userName: refreshedUser.name,
          token: rawToken,
        });

        this.logger.log(
          'Pending signup refreshed and verification resent',
          refreshedUser.id,
        );

        return {
          id: refreshedUser.id,
          email: refreshedUser.email,
          name: refreshedUser.name,
          role: refreshedUser.role,
        };
      }

      const user = await this.usersService.createUser({
        name,
        email,
        password: hashedPassword,
        status: UserStatus.PENDING,
        emailVerificationToken: digest,
        emailVerificationExpiresAt: expiresAt,
        emailVerifiedAt: null,
      });

      this.logger.log('User created', user.id);

      await this.emailTokenService.sendVerificationEmail({
        to: user.email,
        userName: user.name,
        token: rawToken,
      });

      this.logger.log('Verification email sent', user.id);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      this.logger.error('Signup flow failed', error as Error);
      throw error;
    }
  }
}
