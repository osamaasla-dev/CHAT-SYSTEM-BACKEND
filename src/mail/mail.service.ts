import { Injectable, Logger } from '@nestjs/common';
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
} from './types/sendEmail.types';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly senderEmail: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    this.resend = new Resend(apiKey);

    const senderEmail = this.configService.get<string>('SENDER_EMAIL');
    if (!senderEmail) {
      throw new Error('SENDER_EMAIL is not configured');
    }
    this.senderEmail = senderEmail;
  }

  async sendVerificationEmail(params: VerificationEmailParams) {
    const template = buildVerificationEmail({
      userName: params.userName,
      verificationLink: params.verificationLink,
    });

    return this.sendEmail({ ...template, to: params.to });
  }

  async sendPasswordResetEmail(params: PasswordResetEmailParams) {
    const template = buildPasswordResetEmail({
      userName: params.userName,
      resetLink: params.resetLink,
    });

    return this.sendEmail({ ...template, to: params.to });
  }

  async sendMfaCodeEmail(params: MfaCodeEmailParams) {
    const template = buildMfaCodeEmail({
      userName: params.userName,
      code: params.code,
    });

    return this.sendEmail({ ...template, to: params.to });
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
