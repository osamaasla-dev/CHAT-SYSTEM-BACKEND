export interface TokenIntrospectionResponse {
  token: {
    active: boolean;
    type: 'access';
    issuedAt: string | null;
    expiresAt: string | null;
  };
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
}
