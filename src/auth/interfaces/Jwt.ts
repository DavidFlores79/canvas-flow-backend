import { JwtHeader } from './JwtHeader';
import { JwtPayload } from './JwtPayload';

export interface Jwt {
  header: JwtHeader;
  payload: JwtPayload;
}
