import { UserStatus } from '@prisma/client';

export interface MyProfileInfo {
  avatarUrl: string | null;
  username: string;
  name: string;
  email: string;
  hasPassword: boolean;
  status: UserStatus;
  deletedAt: Date | null;
}

export interface ChangeAvatarParams {
  userId: string;
  stream: NodeJS.ReadableStream | undefined;
}

export interface ChangeAvatarResult {
  avatarUrl: string;
  publicId: string;
}
