import { EmailTemplateContent } from '../types/sendEmail.types';

interface MfaCodeTemplateParams {
  userName: string;
  code: string;
}

export const buildMfaCodeEmail = (
  params: MfaCodeTemplateParams,
): EmailTemplateContent => {
  const { userName, code } = params;

  const subject = 'Your verification code';
  const text = `Hi ${userName},\n\nUse the following verification code to continue: ${code}\n\nThis code expires in 60 seconds.`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2933;">
      <h2 style="margin-bottom: 8px;">Hi ${userName},</h2>
      <p style="margin-bottom: 12px;">Use the verification code below to continue. This code expires in 60 seconds.</p>
      <div style="font-size: 32px; letter-spacing: 6px; font-weight: 600; color: #2563eb; margin: 20px 0;">${code}</div>
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">If you didn't request this, please ignore this message.</p>
    </div>
  `;

  return { subject, html, text };
};
