export type SearchUserResult = {
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    status: string;
  };
  isBlockedByMe: boolean;
  isInMyContacts: boolean;
};
