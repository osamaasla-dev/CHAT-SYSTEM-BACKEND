export interface UserProfileInfo {
  avatarUrl: string | null;
  username: string;
  name: string;
  email: string;
  hasPassword: boolean;
}

export interface ChangeAvatarParams {
  userId: string;
  stream: NodeJS.ReadableStream | undefined;
}

export interface ChangeAvatarResult {
  avatarUrl: string;
  publicId: string;
}
