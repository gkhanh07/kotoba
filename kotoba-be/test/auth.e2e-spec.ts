import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { Db } from '../src/db.js';
import { Mailer } from '../src/mailer.js';

const outbox: { to: string; text: string }[] = [];

describe('auth (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  const email = 'mai@example.com';

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Mailer)
      .useValue({ send: (to: string, _s: string, text: string) => void outbox.push({ to, text }) })
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
