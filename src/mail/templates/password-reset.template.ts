import { EmailTemplateContent } from '../types/send-email.types';

interface PasswordResetTemplateParams {
  userName: string;
  resetLink: string;
}

export const buildPasswordResetEmail = (
  params: PasswordResetTemplateParams,
): EmailTemplateContent => {
  const { userName, resetLink } = params;

  const subject = 'Reset your password';
  const text = `Hi ${userName},\n\nYou recently requested to reset your password. Use the link below to set a new password:\n${resetLink}\n\nIf you did not request a password reset, please ignore this email.`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2933;">
      <h2 style="margin-bottom: 16px;">Hi ${userName},</h2>
      <p style="margin-bottom: 12px;">You requested to reset your Chat System password. Tap the button below to continue.</p>
      <a
        href="${resetLink}"
        style="display: inline-block; margin: 16px 0; padding: 12px 20px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 6px;"
      >Reset Password</a>
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 14px; word-break: break-all;">${resetLink}</p>
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">If you didn't request this change, you can safely ignore this message.</p>
    </div>
  `;

  return { subject, html, text };
};
