import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestPrisma, resetDb } from '../../../test/setup/prisma-test.util.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { RequestWithSession } from './current-session.decorator.js';
import { SessionGuard } from './session.guard.js';

function contextFor(authorization: string | undefined): {
  context: ExecutionContext;
  request: RequestWithSession;
} {
  const request = { headers: { authorization } } as RequestWithSession;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('SessionGuard', () => {
  let prisma: PrismaService;
  let guard: SessionGuard;

  beforeEach(async () => {
    prisma ??= await createTestPrisma();
    await resetDb(prisma);
    guard = new SessionGuard(prisma);
  });

  it('rejects a request with no Authorization header', async () => {
    const { context } = contextFor(undefined);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a bearer token that matches no Session', async () => {
    const { context } = contextFor('Bearer does-not-exist');
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the Session and allows the request through for a valid token', async () => {
    const user = await prisma.user.create({
      data: { displayName: 'Asha', tosAcceptedAt: new Date() },
    });
    const session = await prisma.session.create({
      data: { userId: user.id, token: 'valid-token' },
    });

    const { context, request } = contextFor(`Bearer ${session.token}`);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.session).toEqual({ id: session.id, userId: user.id, token: session.token });
  });
});
