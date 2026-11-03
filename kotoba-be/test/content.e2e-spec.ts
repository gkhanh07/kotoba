import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { Db } from '../src/db.js';
import kana from '../content/kana.json' with { type: 'json' };
import kanji from '../content/kanji.json' with { type: 'json' };
import vocab from '../content/vocab.json' with { type: 'json' };
import lessons from '../content/lessons.json' with { type: 'json' };
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
    for (const [kind, n] of [['kana', kana.length], ['kanji', kanji.length], ['vocab', vocab.length], ['lesson', lessons.length], ['grammar', grammar.length]] as const) {
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
    // The first two are N5 (すいようび counts through its kanji form 水曜日); N4 words with 水 follow in file order.
    const withMizu = vocab.filter((v) => [v.word, (v as { kanji?: string }).kanji].some((w) => w?.includes('水'))).map((v) => v.id);
    expect(withMizu.slice(0, 2)).toEqual(['vocab:水', 'vocab:すいようび']);
    expect(res.body.words.map((w: { id: string }) => w.id)).toEqual(withMizu);
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
    expect(list.body).toEqual([
      { id: 'n5-1', title: { vi: 'Đề 1', en: 'Paper 1' }, minutes: 60, questions: 45 },
      { id: 'n4-1', title: { vi: 'Đề thi thử N4 số 1', en: 'N4 mock test 1' }, minutes: 80, questions: 58 },
    ]);
    const paper = await get('/tests/n5-1').expect(200);
    expect(paper.body.parts[0].questions[0].choices).toHaveLength(4);
    await get('/tests/nope').expect(404);
  });

  // Phase 22: levels and paging.
  it('seeds every row with the level from its JSON', async () => {
    const rows = await app.get(Db).item.findMany({ select: { id: true, level: true } });
    const json = [...kana, ...kanji, ...vocab, ...lessons, ...grammar];
    expect(rows).toHaveLength(json.length);
    expect(new Map(rows.map((r) => [r.id, r.level]))).toEqual(new Map(json.map((d) => [d.id, d.level])));
  });

  it('gives rows written without a level the default N5', async () => {
    const db = app.get(Db);
    await db.$executeRaw`INSERT INTO "Item" ("id", "kind", "sort", "search", "data") VALUES ('vocab:__old_row', 'vocab', 99999, '', '{}')`;
    try {
      expect((await db.item.findUniqueOrThrow({ where: { id: 'vocab:__old_row' } })).level).toBe(5);
    } finally {
      await db.item.delete({ where: { id: 'vocab:__old_row' } });
    }
  });

  it('filters content by level', async () => {
    const ids = (body: { id: string }[]) => body.map((d) => d.id);
    // Counts come from the JSON so new levels need no edit here; N2 has no content until phase 31.
    expect(ids((await get('/content/kanji?level=5').expect(200)).body)).toEqual(kanji.filter((k) => k.level === 5).map((k) => k.id));
    expect(ids((await get('/content/kanji?level=4').expect(200)).body)).toEqual(kanji.filter((k) => k.level === 4).map((k) => k.id));
    expect((await get('/content/kanji?level=2').expect(200)).body).toEqual([]);
    expect(ids((await get('/content/vocab?lesson=13&level=5').expect(200)).body)).toEqual(vocab.filter((v) => v.lesson === 13).map((v) => v.id));
    for (const bad of ['6', '1', 'x', '', '4.5', '5&level=4']) {
      const res = await get(`/content/kanji?level=${bad}`).expect(400);
      expect(res.body.message, bad).toBe('level');
    }
  });

  it('filters search and mock tests by level', async () => {
    const n5 = (await get(`/search?q=${encodeURIComponent('Nhật')}&level=5`).expect(200)).body as { id: string; level: number }[];
    expect(n5.map((d) => d.id)).toContain('kanji:日');
    expect(n5.filter((d) => d.level !== 5)).toEqual([]);
    expect((await get(`/search?q=${encodeURIComponent('Nhật')}&level=2`).expect(200)).body).toEqual([]);
    expect((await get('/search?q=nhat&level=x').expect(400)).body.message).toBe('level');
    expect((await get('/tests?level=5').expect(200)).body.map((p: { id: string }) => p.id)).toEqual(['n5-1']);
    expect((await get('/tests?level=4').expect(200)).body.map((p: { id: string }) => p.id)).toEqual(['n4-1']);
    expect((await get('/tests?level=2').expect(200)).body).toEqual([]);
    expect((await get('/tests?level=0').expect(400)).body.message).toBe('level');
  });

  it('pages a list when asked, and only then', async () => {
    const total = vocab.length;
    const pages = Math.ceil(total / 100);
    const first = await get('/content/vocab?page=1').expect(200);
    expect(first.body).toEqual({ items: vocab.slice(0, 100), page: 1, pages, total });
    const last = await get(`/content/vocab?page=${pages}`).expect(200);
    expect(last.body).toEqual({ items: vocab.slice((pages - 1) * 100), page: pages, pages, total });
    expect(last.body.items).toHaveLength(total % 100 || 100);
    expect((await get(`/content/vocab?page=${pages + 1}`).expect(200)).body).toEqual({ items: [], page: pages + 1, pages, total });
    expect(Array.isArray((await get('/content/vocab').expect(200)).body)).toBe(true);
    for (const bad of ['0', '-1', 'x', '1.5', '']) {
      expect((await get(`/content/vocab?page=${bad}`).expect(400)).body.message, bad).toBe('page');
    }
  });

  it('pages after the field, lesson and level filters', async () => {
    const hiragana = kana.filter((k) => k.script === 'hiragana');
    expect((await get('/content/kana?script=hiragana&page=2').expect(200)).body).toEqual({
      items: hiragana.slice(100, 200),
      page: 2,
      pages: Math.ceil(hiragana.length / 100),
      total: hiragana.length,
    });
    expect((await get('/content/kanji?level=2&page=1').expect(200)).body).toEqual({ items: [], page: 1, pages: 1, total: 0 });
  });

  describe('with 5,000 synthetic level-3 words', () => {
    const N = 5000;
    const id = (n: number) => `vocab:__synthetic_${n}`;

    beforeAll(async () => {
      await app.get(Db).item.createMany({
        data: Array.from({ length: N }, (_, n) => ({
          id: id(n),
          kind: 'vocab',
          level: 3,
          sort: 100000 + n,
          search: '',
          data: JSON.stringify({ id: id(n), level: 3 }),
        })),
      });
    });

    afterAll(() => app.get(Db).item.deleteMany({ where: { id: { startsWith: 'vocab:__synthetic_' } } }));

    it('pages them correctly and quickly without touching the N5 lists', async () => {
      for (let page = 1; page <= 51; page++) {
        const started = performance.now();
        const res = await get(`/content/vocab?level=3&page=${page}`).expect(200);
        expect(performance.now() - started, `page ${page}`).toBeLessThan(200);
        const ids = Array.from({ length: page <= 50 ? 100 : 0 }, (_, i) => id((page - 1) * 100 + i));
        expect(res.body).toEqual({ items: ids.map((i) => ({ id: i, level: 3 })), page, pages: 50, total: N });
      }
      expect((await get('/content/vocab?level=5&page=1').expect(200)).body.total).toBe(vocab.filter((v) => v.level === 5).length);
      expect((await get('/content/vocab?page=1').expect(200)).body.total).toBe(vocab.length + N);
    });
  });

  // SQLite caps a statement at 999 parameters; a kind past that once failed the boot (phase 22).
  it('seeds a kind with more items than SQLite takes parameters', async () => {
    const db = app.get(Db);
    const before = await db.item.count();
    const extra = Array.from({ length: 1500 }, (_, n) => ({ id: `vocab:__big_${n}`, level: 3 }));
    try {
      await db.seed({ kana, kanji, vocab: [...vocab, ...extra], lesson: lessons, grammar });
      expect(await db.item.count({ where: { kind: 'vocab' } })).toBe(vocab.length + extra.length);
      await db.onModuleInit();
      expect(await db.item.count()).toBe(before);
    } finally {
      await db.item.deleteMany({ where: { id: { startsWith: 'vocab:__big_' } } });
    }
  });

  it('rewrites on reseed a row that no longer matches its JSON', async () => {
    const db = app.get(Db);
    const id = 'kanji:日';
    const seeded = await db.item.findUniqueOrThrow({ where: { id } });
    await db.item.update({ where: { id }, data: { level: 4, search: '', data: '{}' } });
    await db.onModuleInit();
    expect(await db.item.findUniqueOrThrow({ where: { id } })).toEqual(seeded);
  });

  it('reseeds idempotently', async () => {
    const db = app.get(Db);
    const before = await db.item.count();
    await db.onModuleInit();
    expect(await db.item.count()).toBe(before);
  });
});
