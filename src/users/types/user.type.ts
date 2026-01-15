import { User } from '@prisma/client';

export type FindAllResponse = {
  items: User[];
  meta: { limit: number; nextCursor: string | null };
};
