import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { buildVerificationEmail } from './templates/verification-email.template';
import { buildPasswordResetEmail } from './templates/password-reset.template';
import { buildMfaCodeEmail } from './templates/mfa-code.template';
import {
  SendEmailPayload,
  VerificationEmailParams,
  PasswordResetEmailParams,
  MfaCodeEmailParams,
} from './types/send-email.types';
import { buildVerificationUrl } from './utils/mail';
import { generateToken } from 'src/common/utils/crypto-hash';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly senderEmail: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.error('RESEND_API_KEY is not configured');
      throw new BadRequestException();
    }
    this.resend = new Resend(apiKey);

    const senderEmail = this.configService.get<string>('SENDER_EMAIL');
    if (!senderEmail) {
      this.logger.error('SENDER_EMAIL is not configured');
      throw new BadRequestException();
    }
    this.senderEmail = senderEmail;
  }

  async sendVerificationEmail(params: VerificationEmailParams) {
    const url = this.configService.get<string>('EMAIL_VERIFICATION_URL');
    if (!url) {
      this.logger.error('EMAIL_VERIFICATION_URL is not configured');
      throw new BadRequestException();
    }
    const { rawToken, digest, expiresAt } = generateToken();
    const verificationUrl = buildVerificationUrl(rawToken, url);
    const template = buildVerificationEmail({
      userName: params.userName,
      verificationLink: verificationUrl,
    });

    await this.sendEmail({ ...template, to: params.to });
    return { rawToken, digest, expiresAt };
  }

  async sendPasswordResetEmail(params: PasswordResetEmailParams) {
    const url = this.configService.get<string>('FRONTEND_PASSWORD_RESET_URL');
    if (!url) {
      this.logger.error('FRONTEND_PASSWORD_RESET_URL is not configured');
      throw new BadRequestException();
    }
    const { rawToken, digest, expiresAt } = generateToken();
    const verificationUrl = buildVerificationUrl(rawToken, url);

    const template = buildPasswordResetEmail({
      userName: params.userName,
      resetLink: verificationUrl,
    });

    await this.sendEmail({ ...template, to: params.to });
    return { rawToken, digest, expiresAt };
  }

  async sendMfaCodeEmail(params: MfaCodeEmailParams) {
    const template = buildMfaCodeEmail({
      userName: params.userName,
      code: params.code,
    });

    return await this.sendEmail({ ...template, to: params.to });
  }

  async sendEmail(payload: SendEmailPayload) {
    try {
      return await this.resend.emails.send({
        from: this.senderEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
    } catch (error) {
      this.logger.error('Failed to send email via Resend', error as Error);
      throw error;
    }
  }
}
