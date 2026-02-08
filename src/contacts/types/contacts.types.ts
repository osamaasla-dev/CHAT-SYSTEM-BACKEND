export interface GetContactsParams {
  ownerId: string;
  limit?: number;
  cursor?: string | null;
}

export interface ContactListItem {
  contactId: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  status: string | null;
  blockedAt: Date | null;
  addedAt: Date;
}

export interface ContactsResult {
  items: ContactListItem[];
  meta: {
    limit: number;
    nextCursor: string | null;
  };
}
