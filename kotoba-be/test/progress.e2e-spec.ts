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
  // Every card the API returns carries lapses; a card pushed without it reads 0 (phase 16, AC-2).
  const read = (box: number, at: number, lapses = 0) => ({ ...card(box, at), lapses });

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
    expect(second.body.cards['hiragana:a']).toEqual(read(3, 200));
    expect(second.body.cards['hiragana:i']).toEqual(read(2, 100));
    expect(second.body.activity).toEqual({
      days: { '2026-11-01': { minutes: [1, 2], kana: ['hiragana:a'], kanji: [], vocab: ['vocab:水'] } },
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

  describe('lapses (phase 16)', () => {
    const EMAIL = 'lapses@example.com';
    let lt: string;
    const lput = (body: unknown) => put(body, lt);
    const clean = () => app.get(Db).user.deleteMany({ where: { email: EMAIL } });

    beforeAll(async () => {
      await clean();
      const res = await http.post('/auth/register').send({ email: EMAIL, password: 'password-1', goal: 'N5' }).expect(201);
      lt = res.body.token;
    });
    afterAll(clean);

    it('stores lapses with the card and returns it from the push and the next pull', async () => {
      const pushed = await lput({ cards: { 'hiragana:a': { ...card(0, 100), lapses: 3 } } }).expect(200);
      expect(pushed.body.cards['hiragana:a']).toEqual(read(0, 100, 3));
      const pulled = await lput({}).expect(200);
      expect(pulled.body.cards['hiragana:a']).toEqual(read(0, 100, 3));
    });

    it('accepts a card without lapses and returns lapses: 0', async () => {
      const res = await lput({ cards: { 'hiragana:i': card(1, 100) } }).expect(200);
      expect(res.body.cards['hiragana:i']).toEqual(read(1, 100, 0));
    });

    it('lets lapses travel with the newer card and keeps the stored count when the push is older', async () => {
      await lput({ cards: { 'hiragana:u': { ...card(0, 100), lapses: 2 } } }).expect(200);
      const newerPush = await lput({ cards: { 'hiragana:u': { ...card(0, 200), lapses: 4 } } }).expect(200);
      expect(newerPush.body.cards['hiragana:u']).toEqual(read(0, 200, 4));
      const olderPush = await lput({ cards: { 'hiragana:u': { ...card(0, 150), lapses: 9 } } }).expect(200);
      expect(olderPush.body.cards['hiragana:u']).toEqual(read(0, 200, 4));
    });

    it('reads a row created before the migration (no lapses written) as 0', async () => {
      const db = app.get(Db);
      const user = await db.user.findUniqueOrThrow({ where: { email: EMAIL }, select: { id: true } });
      await db.$executeRawUnsafe(
        'INSERT INTO "Card" ("userId", "itemId", "box", "due", "at") VALUES (?, ?, ?, ?, ?)',
        user.id, 'hiragana:e', 2, '2026-11-02', 50,
      );
      const res = await lput({}).expect(200);
      expect(res.body.cards['hiragana:e']).toEqual(read(2, 50, 0));
    });

    it('accepts lapses 0 and the maximum 10000', async () => {
      const res = await lput({ cards: { 'hiragana:o': { ...card(0, 100), lapses: 0 }, 'hiragana:ka': { ...card(0, 100), lapses: 10000 } } }).expect(200);
      expect(res.body.cards['hiragana:o'].lapses).toBe(0);
      expect(res.body.cards['hiragana:ka'].lapses).toBe(10000);
    });

    it.each([
      ['negative', -1],
      ['a fraction', 1.5],
      ['a string', '2'],
      ['above the maximum', 10001],
      ['null', null],
    ])('rejects lapses that is %s with 400 "cards"', async (_name, lapses) => {
      const res = await lput({ cards: { 'hiragana:ki': { ...card(0, 100), lapses } } }).expect(400);
      expect(res.body.message).toBe('cards');
      const after = await lput({}).expect(200);
      expect(after.body.cards['hiragana:ki']).toBeUndefined();
    });
  });
});
