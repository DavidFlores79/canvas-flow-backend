export interface JwtPayload {
  group: string;
  sub: string;
  iat: number;
  aud: string;
  iss: string;
}
