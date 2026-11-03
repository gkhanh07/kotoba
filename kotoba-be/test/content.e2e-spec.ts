import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { Db } from '../src/db.js';
import vocab from '../content/vocab.json' with { type: 'json' };
import grammar from '../content/grammar.json' with { type: 'json' };

describe('content (e2e)', () => {
  let app: INestApplication;
  const get = (path: string) => request(app.getHttpServer()).get(path);

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('serves every kind from the seeded files', async () => {
    for (const [kind, n] of [['kana', 224], ['kanji', 103], ['vocab', vocab.length], ['lesson', 25], ['grammar', grammar.length]] as const) {
      const res = await get(`/content/${kind}`).expect(200);
      expect(res.body, kind).toHaveLength(n);
    }
    await get('/content/nope').expect(404);
  });

  it('filters by field and lesson', async () => {
    const yoon = await get('/content/kana?script=hiragana&group=yoon').expect(200);
    expect(yoon.body).toHaveLength(33);
    const l13 = await get('/content/vocab?lesson=13').expect(200);
    expect(l13.body.map((v: { id: string }) => v.id)).toEqual(vocab.filter((v) => v.lesson === 13).map((v) => v.id));
    await get('/content/vocab?lesson=x').expect(400);
  });

  it('returns a kanji with the words written with it', async () => {
    const res = await get(`/content/item/${encodeURIComponent('kanji:水')}`).expect(200);
    expect(res.body.hv).toBeDefined();
    expect(res.body.words.map((w: { id: string }) => w.id)).toEqual(['vocab:水', 'vocab:すいようび']); // すいようび counts through its kanji form 水曜日
    await get('/content/item/kanji:nope').expect(404);
  });

  it('searches across kinds, accent- and script-blind', async () => {
    const ids = async (q: string) =>
      (await get(`/search?q=${encodeURIComponent(q)}`).expect(200)).body.map((d: { id: string }) => d.id);
    expect(await ids('nhat')).toContain('kanji:日');
    expect(await ids('Nhật')).toContain('kanji:日');
    expect(await ids('タベ')).toContain('vocab:食べる');
    expect(await ids('gakko')).toContain('vocab:学校');
    expect(await ids('yori')).not.toContain('grammar:yori'); // slugs are not searchable
    expect(await ids('より')).toContain('grammar:yori');
    await get('/search?q=').expect(400);
    await get(`/search?q=${'a'.repeat(51)}`).expect(400);
  });

  it('serves mock test papers', async () => {
    const list = await get('/tests').expect(200);
    expect(list.body).toEqual([{ id: 'n5-1', title: { vi: 'Đề 1', en: 'Paper 1' }, minutes: 50, questions: 45 }]);
    const paper = await get('/tests/n5-1').expect(200);
    expect(paper.body.parts[0].questions[0].choices).toHaveLength(4);
    await get('/tests/nope').expect(404);
  });

  it('reseeds idempotently', async () => {
    const db = app.get(Db);
    const before = await db.item.count();
    await db.onModuleInit();
    expect(await db.item.count()).toBe(before);
  });
});
