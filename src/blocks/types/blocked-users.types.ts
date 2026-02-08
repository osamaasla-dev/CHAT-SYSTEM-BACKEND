import { UserStatus } from '@prisma/client';

export interface GetBlockedUsersParams {
  userId: string;
  limit?: number;
  cursor?: string;
}

export interface BlockedUserItem {
  blockId: string;
  blockedUserId: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  status: UserStatus;
  blockedAt: Date;
}

export interface BlockedUsersResult {
  items: BlockedUserItem[];
  meta: {
    limit: number;
    nextCursor: string | null;
  };
}
