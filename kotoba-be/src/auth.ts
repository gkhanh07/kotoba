import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { Db } from './db.js';
import type { User } from './generated/prisma/client.js';

// OWASP's scrypt baseline. Parameters live in the stored string so they can rise later.
const N = 2 ** 17, R = 8, P = 1, KEYLEN = 32;

function derive(password: string, salt: Buffer, n: number, r: number, p: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, KEYLEN, { N: n, r, p, maxmem: 256 * n * r }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [alg, n, r, p, salt, hash] = stored.split('$');
  if (alg !== 'scrypt') return false;
  const want = Buffer.from(hash, 'base64');
  const got = await derive(password, Buffer.from(salt, 'base64'), +n, +r, +p);
  return got.length === want.length && timingSafeEqual(got, want);
}

// Run on unknown emails so a login takes as long whether or not the account exists.
const DUMMY = hashPassword('kotoba-dummy-password');
export const burnTime = async (password: string) => {
  await verifyPassword(password, await DUMMY);
};

export const newToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

// ponytail: in-memory, one process. Move to the DB or Redis if the API ever runs as several processes.
export class Limiter {
  private hits = new Map<string, number[]>();

  constructor(private max: number, private windowMs: number) {}

  blocked(key: string, now = Date.now()) {
    const recent = (this.hits.get(key) ?? []).filter((t) => t > now - this.windowMs);
    if (recent.length) this.hits.set(key, recent);
    else this.hits.delete(key);
    return recent.length >= this.max;
  }

  hit(key: string, now = Date.now()) {
    this.blocked(key, now);
    this.hits.set(key, [...(this.hits.get(key) ?? []), now]);
  }
}

// Only kotoba-fe's server talks to this API (it listens on loopback), so its header is trusted.
export const clientIp = (req: Request) => {
  const h = req.headers['x-client-ip'];
  return (typeof h === 'string' && h) || req.ip || 'unknown';
};

export type Authed = Request & { user: User; tokenHash: string };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private db: Db) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Authed>();
    const m = /^Bearer (\S+)$/.exec(req.headers.authorization ?? '');
    if (!m) throw new UnauthorizedException();
    const tokenHash = hashToken(m[1]);
    const row = await this.db.token.findUnique({ where: { hash: tokenHash }, include: { user: true } });
    if (!row || row.kind !== 'session') throw new UnauthorizedException();
    if (row.expiresAt <= new Date()) {
      await this.db.token.delete({ where: { hash: tokenHash } });
      throw new UnauthorizedException();
    }
    req.user = row.user;
    req.tokenHash = tokenHash;
    return true;
  }
}
