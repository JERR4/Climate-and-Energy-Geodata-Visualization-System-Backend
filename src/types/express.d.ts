import type { JwtPayload } from 'src/auth/types';
import 'express';

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}
