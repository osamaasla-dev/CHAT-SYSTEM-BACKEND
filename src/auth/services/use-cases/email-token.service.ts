import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../../../mail/mail.service';

interface VerificationEmailParams {
  to: string;
  userName: string;
  token: string;
}

interface PasswordResetEmailParams {
  to: string;
  userName: string;
  token: string;
}

interface TokenPayload {
  rawToken: string;
  digest: string;
  expiresAt: Date;
}

@Injectable()
export class EmailTokenService {
  private readonly verificationBaseUrl: string;
  private readonly passwordResetBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.verificationBaseUrl =
      this.configService.get<string>('EMAIL_VERIFICATION_URL') ??
      'http://localhost:3000/auth/verify-email';

    this.passwordResetBaseUrl =
      this.configService.get<string>('PASSWORD_RESET_URL') ??
      'http://localhost:3000/auth/reset-password';
  }

  generateToken(ttlMs?: number): TokenPayload {
    const rawToken = randomBytes(32).toString('hex');
    const digest = this.hashToken(rawToken);
    const expiresAt = ttlMs ? new Date(Date.now() + ttlMs) : new Date();

    return {
      rawToken,
      digest,
      expiresAt,
    };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  generateEmailVerificationToken(): TokenPayload {
    return this.generateToken(24 * 60 * 60 * 1000);
  }

  generatePasswordResetToken(): TokenPayload {
    return this.generateToken(60 * 60 * 1000);
  }

  generateMfaToken(ttlMs = 60 * 1000): TokenPayload {
    return this.generateToken(ttlMs);
  }

  async sendVerificationEmail(params: VerificationEmailParams) {
    const verificationLink = `${this.verificationBaseUrl}?token=${params.token}`;
    await this.mailService.sendVerificationEmail({
      to: params.to,
      userName: params.userName,
      verificationLink,
    });
  }

  async sendPasswordResetEmail(params: PasswordResetEmailParams) {
    const resetLink = `${this.passwordResetBaseUrl}?token=${params.token}`;
    await this.mailService.sendPasswordResetEmail({
      to: params.to,
      userName: params.userName,
      resetLink,
    });
  }
}
