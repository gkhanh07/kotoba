import { Test } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { Db } from '../src/db.js';
import { Mailer } from '../src/mailer.js';
import { hashToken, newToken } from '../src/auth.js';

const outbox: { to: string; text: string }[] = [];

describe('auth (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  const email = 'mai@example.com';

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Mailer)
      .useValue({ send: async (to: string, _s: string, text: string) => void outbox.push({ to, text }) })
      .compile();
    app = mod.createNestApplication();
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(() => app.close());

  const login = (password: string, ip = '1.1.1.1') =>
    http.post('/auth/login').set('X-Client-IP', ip).send({ email, password });
  const me = (token: string) => http.get('/me').set('Authorization', `Bearer ${token}`);

  it('registers, rejects bad input and duplicates', async () => {
    await http.post('/auth/register').send({ email: 'nope', password: 'longenough', goal: 'N5' }).expect(400);
    await http.post('/auth/register').send({ email, password: 'short', goal: 'N5' }).expect(400);
    const res = await http.post('/auth/register').send({ email: 'Mai@Example.com', password: 'password-1', goal: 'N5' }).expect(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.onboarded).toBe(false);
    await http.post('/auth/register').send({ email, password: 'password-1', goal: 'N5' }).expect(409);
  });

  it('logs in, reads and updates the profile', async () => {
    const { body } = await login('password-1').expect(200);
    await me(body.token).expect(200, { email, goal: 'N5' });
    const upd = await http
      .patch('/me')
      .set('Authorization', `Bearer ${body.token}`)
      .send({ name: 'Mai', exam: '2027-07', minutes: 15 })
      .expect(200);
    expect(upd.body).toEqual({ email, name: 'Mai', goal: 'N5', exam: '2027-07', minutes: 15 });
    await http.patch('/me').set('Authorization', `Bearer ${body.token}`).send({ minutes: 7 }).expect(400);
    expect((await login('password-1')).body.onboarded).toBe(true);
    await me('not-a-token').expect(401);
    await http.get('/me').expect(401);
  });

  it('logs out a session', async () => {
    const { body } = await login('password-1').expect(200);
    await http.post('/auth/logout').set('Authorization', `Bearer ${body.token}`).expect(204);
    await me(body.token).expect(401);
  });

  it('removes expired session and reset tokens of every user when logging in', async () => {
    const db = app.get(Db);
    const otherEmail = 'expired-tokens@example.com';
    await http.post('/auth/register').send({ email: otherEmail, password: 'password-1', goal: 'N5' }).expect(201);
    const users = await db.user.findMany({ where: { email: { in: [email, otherEmail] } } });
    expect(users).toHaveLength(2);
    const expired = users.flatMap((user) => ['session', 'reset'].map((kind) => ({
      hash: hashToken(newToken()), userId: user.id, kind, expiresAt: new Date(Date.now() - 1000),
    })));
    const valid = { hash: hashToken(newToken()), userId: users[0].id, kind: 'reset', expiresAt: new Date(Date.now() + 60000) };
    await db.token.createMany({ data: [...expired, valid] });
    const active = await db.token.findMany({ where: { expiresAt: { gt: new Date() } } });
    const res = await login('password-1').expect(200);
    expect(await db.token.count({ where: { hash: { in: expired.map((t) => t.hash) } } })).toBe(0);
    expect(await db.token.count({ where: { hash: { in: active.map((t) => t.hash) } } })).toBe(active.length);
    await me(res.body.token).expect(200);
  });

  it.each(['password', 'delete'])('shares five wrong-password attempts across account routes, starting with %s', async (first) => {
    const email = `limited-${first}@example.com`;
    const res = await http.post('/auth/register').send({ email, password: 'password-1', goal: 'N5' }).expect(201);
    const auth = { Authorization: `Bearer ${res.body.token}` };
    const other = await http.post('/auth/login').send({ email, password: 'password-1' }).expect(200);
    for (let i = 0; i < 5; i++) {
      const change = (i % 2 === 0) === (first === 'password');
      const req = change
        ? http.post('/me/password').send({ current: 'wrong-password', password: 'password-2' })
        : http.delete('/me').send({ password: 'wrong-password' });
      await req.set(auth).set('X-Client-IP', `account-${i}`).expect(401);
    }
    const change = await http.post('/me/password').set(auth).send({ current: 'password-1', password: 'password-2' }).expect(429);
    const remove = await http.delete('/me').set('Authorization', `Bearer ${other.body.token}`).send({ password: 'password-1' }).expect(429);
    expect(change.body.message).toBe('rate');
    expect(remove.body.message).toBe('rate');
    await me(res.body.token).expect(200);
    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 15 * 60 * 1000);
    try {
      await http.post('/me/password').set(auth).send({ current: 'password-1', password: 'password-2' }).expect(204);
    } finally {
      clock.mockRestore();
    }
  });

  // The hit lands before the scrypt await, so a burst cannot all slip past the check.
  it('holds the limits against parallel attempts', async () => {
    const res = await http.post('/auth/register').send({ email: 'burst@example.com', password: 'password-1', goal: 'N5' }).expect(201);
    const auth = { Authorization: `Bearer ${res.body.token}` };
    const wrong = await Promise.all(Array.from({ length: 8 }, () =>
      http.post('/me/password').set(auth).send({ current: 'wrong-password', password: 'password-2' })));
    expect(wrong.map((r) => r.status).sort()).toEqual([401, 401, 401, 401, 401, 429, 429, 429]);
    const resets = await Promise.all(Array.from({ length: 12 }, () =>
      http.post('/auth/reset').set('X-Client-IP', 'reset-burst').send({ token: 'bogus', password: 'password-2' })));
    expect(resets.filter((r) => r.status === 429)).toHaveLength(2);
    const logins = await Promise.all(Array.from({ length: 7 }, (_, i) =>
      http.post('/auth/login').set('X-Client-IP', `burst-${i}`).send({ email: 'burst@example.com', password: 'wrong-password' })));
    expect(logins.filter((r) => r.status === 429)).toHaveLength(2);
  });

  it('a right password does not use up the limit', async () => {
    await http.post('/auth/register').send({ email: 'often@example.com', password: 'password-1', goal: 'N5' }).expect(201);
    for (let i = 0; i < 6; i++) {
      await http.post('/auth/login').set('X-Client-IP', 'often').send({ email: 'often@example.com', password: 'password-1' }).expect(200);
    }
  });

  it('blocks reset after ten invalid tokens per IP for fifteen minutes, including valid tokens', async () => {
    const db = app.get(Db);
    const res = await http.post('/auth/register').send({ email: 'reset-limit@example.com', password: 'password-1', goal: 'N5' }).expect(201);
    const user = await db.user.findUniqueOrThrow({ where: { email: 'reset-limit@example.com' } });
    const expired = newToken();
    const valid = newToken();
    await db.token.createMany({ data: [
      { hash: hashToken(expired), userId: user.id, kind: 'reset', expiresAt: new Date(Date.now() - 1000) },
      { hash: hashToken(valid), userId: user.id, kind: 'reset', expiresAt: new Date(Date.now() + 60000) },
    ] });
    for (let i = 0; i < 10; i++) {
      const token = ['bogus', expired, res.body.token][i % 3];
      const bad = await http.post('/auth/reset').set('X-Client-IP', 'reset-limited').send({ token, password: 'password-2' }).expect(400);
      expect(bad.body.message).toBe('token');
    }
    const blocked = await http.post('/auth/reset').set('X-Client-IP', 'reset-limited').send({ token: valid, password: 'password-2' }).expect(429);
    expect(blocked.body.message).toBe('rate');
    await http.post('/auth/reset').set('X-Client-IP', 'reset-other').send({ token: valid, password: 'password-2' }).expect(204);
    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 15 * 60 * 1000);
    try {
      const bad = await http.post('/auth/reset').set('X-Client-IP', 'reset-limited').send({ token: 'bogus', password: 'password-2' }).expect(400);
      expect(bad.body.message).toBe('token');
    } finally {
      clock.mockRestore();
    }
  });

  it('logs a mail failure and still returns 204 for forgot password', async () => {
    const error = new Error('SMTP unavailable');
    const send = vi.spyOn(app.get(Mailer), 'send').mockRejectedValueOnce(error);
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    try {
      await http.post('/auth/forgot').send({ email }).expect(204);
      expect(send).toHaveBeenCalledOnce();
      expect(log).toHaveBeenCalledWith('Failed to send password reset email', error);
    } finally {
      send.mockRestore();
      log.mockRestore();
    }
  });

  it('locks an email after 5 failed logins, even with the right password', async () => {
    for (let i = 0; i < 5; i++) await login('wrong-password', `2.2.2.${i}`).expect(401);
    await login('password-1', '2.2.2.9').expect(429);
    await http.post('/auth/login').send({ email: 'ghost@example.com', password: 'whatever1' }).expect(401);
  });

  it('resets a password with an emailed token and ends old sessions', async () => {
    const db = app.get(Db);
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    const sessionsBefore = await db.token.count({ where: { userId: user.id, kind: 'session' } });
    expect(sessionsBefore).toBeGreaterThan(0);

    await http.post('/auth/forgot').send({ email: 'ghost@example.com' }).expect(204);
    expect(outbox).toHaveLength(0);
    await http.post('/auth/forgot').send({ email }).expect(204);
    expect(outbox).toHaveLength(1);
    const token = /token=([\w-]+)/.exec(outbox[0].text)![1];
    expect(outbox[0].text).toBe(
      `Mở liên kết dưới đây trong vòng 30 phút để đặt mật khẩu mới:\n${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password?token=${token}\n\nNếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`,
    );

    await http.post('/auth/reset').send({ token: 'bogus', password: 'password-2' }).expect(400);
    await http.post('/auth/reset').send({ token, password: 'password-2' }).expect(204);
    await http.post('/auth/reset').send({ token, password: 'password-3' }).expect(400);
    expect(await db.token.count({ where: { userId: user.id } })).toBe(0);
  });

  it('changes the password, keeping only the current session', async () => {
    // A fresh account: mai@example.com is still locked out from the failed logins above.
    const db = app.get(Db);
    const res = await http.post('/auth/register').send({ email: 'an@example.com', password: 'password-1', goal: 'N4' }).expect(201);
    const other = (await http.post('/auth/login').send({ email: 'an@example.com', password: 'password-1' }).expect(200)).body.token;
    const auth = { Authorization: `Bearer ${res.body.token}` };
    await http.post('/me/password').set(auth).send({ current: 'wrong-pass', password: 'password-9' }).expect(401);
    await http.post('/me/password').set(auth).send({ current: 'password-1', password: 'password-9' }).expect(204);
    await me(res.body.token).expect(200);
    await me(other).expect(401);
    await http.post('/auth/login').send({ email: 'an@example.com', password: 'password-9' }).expect(200);

    await http.delete('/me').set(auth).send({ password: 'password-1' }).expect(401);
    await http.delete('/me').set(auth).send({ password: 'password-9' }).expect(204);
    expect(await db.user.count({ where: { email: 'an@example.com' } })).toBe(0);
    expect(await db.token.count({ where: { user: { email: 'an@example.com' } } })).toBe(0);
    await me(res.body.token).expect(401);
  });
});
