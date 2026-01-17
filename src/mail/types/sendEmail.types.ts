export type SendEmailPayload = {
  to: string | string[];
} & EmailTemplateContent;

export type VerificationEmailParams = {
  to: string;
  userName: string;
  verificationLink: string;
};

export type PasswordResetEmailParams = {
  to: string;
  userName: string;
  resetLink: string;
};

export type MfaCodeEmailParams = {
  to: string;
  userName: string;
  code: string;
};

export type EmailTemplateContent = {
  subject: string;
  html: string;
  text: string;
};
