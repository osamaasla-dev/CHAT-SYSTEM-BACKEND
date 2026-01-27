import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { UserStatus } from '@prisma/client';
import { AUTH_RATE_LIMITS } from 'src/auth/constants/rate-limit.constants';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { AccountLoggingService } from './account-logging.service';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly rateLimitService: RateLimitService,
    private readonly accountLoggingService: AccountLoggingService,
  ) {}

  async execute(params: { name: string; email: string; password: string }) {
    const { name, email, password } = params;

    await this.accountLoggingService.signupStarted(email, name);

    const { limit, windowSeconds, keyPrefix } = AUTH_RATE_LIMITS.SIGNUP;
    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: email,
      limit,
      windowSeconds,
      logContext: `email=${email}`,
    });

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
      await this.accountLoggingService.signupFailed(email, 'EMAIL_EXISTS');
      throw new BadRequestException('EMAIL_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      if (existingUser.status !== UserStatus.PENDING) {
        this.logger.warn('User already exists', email);
        await this.accountLoggingService.signupFailed(
          email,
          'USER_ALREADY_EXISTS',
        );
        throw new BadRequestException('EMAIL_EXISTS');
      }

      const { digest, expiresAt } =
        await this.mailService.sendVerificationEmail({
          to: email,
          userName: name,
        });

      const refreshedUser = await this.usersService.refreshPendingUser(
        existingUser.id,
        {
          name,
          hashedPassword,
          verificationDigest: digest,
          verificationExpiresAt: expiresAt,
        },
      );

      await this.accountLoggingService.verificationEmailSent(
        refreshedUser.email,
        refreshedUser.id,
      );

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

    const username = await this.usersService.generateUniqueUsername(name);

    const { digest, expiresAt } = await this.mailService.sendVerificationEmail({
      to: email,
      userName: name,
    });

    const user = await this.usersService.createUser({
      name,
      username,
      email,
      password: hashedPassword,
      status: UserStatus.PENDING,
      emailVerificationToken: digest,
      emailVerificationExpiresAt: expiresAt,
      emailVerifiedAt: null,
    });

    await this.accountLoggingService.signupCompleted(
      user.id,
      user.email,
      user.name,
    );
    await this.accountLoggingService.verificationEmailSent(user.email, user.id);

    this.logger.log('User created', user.id);
    this.logger.log('Verification email sent', user.id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
