import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { Db } from '../src/db.js';

describe('progress (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let token: string;
  const put = (body: unknown, t = token) => http.put('/progress').set('Authorization', `Bearer ${t}`).send(body as object);
  const card = (box: number, at: number) => ({ box, due: '2026-11-02', at });

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    http = request(app.getHttpServer());
    await app.get(Db).user.deleteMany({ where: { email: 'sync@example.com' } });
    const res = await http.post('/auth/register').send({ email: 'sync@example.com', password: 'password-1', goal: 'N5' }).expect(201);
    token = res.body.token;
  });

  afterAll(() => app.close());

  it('needs a session and a valid body', async () => {
    await put({}, 'nope').expect(401);
    await put({ cards: { 'hiragana:a': { box: 1 } } }).expect(400);
    await put({ forget: [{ prefix: '', at: 1 }] }).expect(400);
  });

  it('merges pushes: newer wins, unknown ids dropped, activity unioned', async () => {
    const first = await put({
      cards: { 'hiragana:a': card(1, 100), 'hiragana:i': card(2, 100), 'vocab:水': card(1, 100), 'nope:x': card(1, 100) },
      activity: { days: { '2026-11-01': { minutes: [1], kana: ['hiragana:a'], vocab: [] } } },
    }).expect(200);
    expect(Object.keys(first.body.cards).sort()).toEqual(['hiragana:a', 'hiragana:i', 'vocab:水']);

    const second = await put({
      cards: { 'hiragana:a': card(3, 200), 'hiragana:i': card(0, 50) },
      activity: { days: { '2026-11-01': { minutes: [2], kana: [], vocab: ['vocab:水'] } }, last: { area: 'vocab', ref: 'vocab:水' } },
    }).expect(200);
    expect(second.body.cards['hiragana:a']).toEqual(card(3, 200));
    expect(second.body.cards['hiragana:i']).toEqual(card(2, 100));
    expect(second.body.activity).toEqual({
      days: { '2026-11-01': { minutes: [1, 2], kana: ['hiragana:a'], vocab: ['vocab:水'] } },
      last: { area: 'vocab', ref: 'vocab:水' },
    });
  });

  it('treats an empty push as a pull', async () => {
    const res = await put({}).expect(200);
    expect(Object.keys(res.body.cards)).toHaveLength(3);
    expect(res.body.activity.last.ref).toBe('vocab:水');
  });

  it('applies a reset to cards older than it, keeping later reviews', async () => {
    const res = await put({ forget: [{ prefix: 'hiragana:', at: 150 }], cards: { 'hiragana:u': card(1, 160) } }).expect(200);
    expect(Object.keys(res.body.cards).sort()).toEqual(['hiragana:a', 'hiragana:u', 'vocab:水']);
  });
});
