import { EmailTemplateContent } from '../types/send-email.types';

interface VerificationTemplateParams {
  userName: string;
  verificationLink: string;
}

export const buildVerificationEmail = (
  params: VerificationTemplateParams,
): EmailTemplateContent => {
  const { userName, verificationLink } = params;

  const subject = 'Verify your email address';
  const text = `Hi ${userName},\n\nPlease verify your email by clicking the link below:\n${verificationLink}\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2933;">
      <h2 style="margin-bottom: 16px;">Hi ${userName},</h2>
      <p style="margin-bottom: 12px;">Thanks for joining Chat System! Please confirm your email to activate your account.</p>
      <a
        href="${verificationLink}"
        style="display: inline-block; margin: 16px 0; padding: 12px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px;"
      >Verify Email</a>
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 14px; word-break: break-all;">${verificationLink}</p>
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">If you didn't create an account, please ignore this message.</p>
    </div>
  `;

  return { subject, html, text };
};
