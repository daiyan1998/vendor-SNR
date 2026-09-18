import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedSession {
  id: string;
  userId: string;
  token: string;
}

export type RequestWithSession = Request & { session?: AuthenticatedSession };

// Reads the Session that SessionGuard attached to the request. Throwing
// when the guard didn't run first surfaces a wiring mistake immediately,
// rather than letting a handler silently see `undefined`.
export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedSession => {
    const request = ctx.switchToHttp().getRequest<RequestWithSession>();
    if (!request.session) {
      throw new Error('@CurrentSession() used on a route without SessionGuard');
    }
    return request.session;
  },
);
