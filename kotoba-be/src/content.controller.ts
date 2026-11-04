import { readFileSync } from 'node:fs';
import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { PAGE_SIZE } from './config.js';
import { isKind, KINDS, normalize, paginate } from './content.js';
import { Db } from './db.js';
import { check, isLevel, isPage } from './validate.js';

type Data = Record<string, unknown>;
const parse = (rows: { data: string }[]) => rows.map((r) => JSON.parse(r.data) as Data);

// Mock test papers stay out of the Item table: they are served whole, never searched or reviewed.
type Paper = { id: string; title: unknown; minutes: number; level: number; parts: { questions: unknown[] }[] };
const PAPERS = JSON.parse(readFileSync(new URL('../content/tests.json', import.meta.url), 'utf8')) as Paper[];

// Exact-match filters on item fields, e.g. /content/kana?script=hiragana&group=yoon.
const FILTERS = ['script', 'group', 'topic'];

// Query numbers arrive as strings; an absent param stays undefined, anything else must pass the guard.
function numberParam(v: unknown, ok: (n: number) => boolean, field: string): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(v);
  check(ok(n), field);
  return n;
}
const levelParam = (v: unknown) => numberParam(v, isLevel, 'level');

@Controller()
export class ContentController {
  constructor(private db: Db) {}

  @Get('content/:kind')
  async list(@Param('kind') kind: string, @Query() q: Record<string, unknown>) {
    if (!isKind(kind)) throw new NotFoundException();
    const lesson = numberParam(q.lesson, Number.isInteger, 'lesson');
    const level = levelParam(q.level);
    const page = numberParam(q.page, isPage, 'page');
    // /kanji shows a page grouped by lesson, so paged kanji go lesson by lesson; kanji.json itself is by frequency (BUG-010).
    const byLesson = kind === 'kanji' && page !== undefined;
    const rows = await this.db.item.findMany({
      where: { kind, lesson, level },
      orderBy: byLesson ? [{ lesson: 'asc' }, { sort: 'asc' }] : { sort: 'asc' },
    });
    const items = parse(rows).filter((d) => FILTERS.every((f) => q[f] === undefined || d[f] === q[f]));
    // Without ?page= the bare array, as before phase 22.
    return page === undefined ? items : paginate(items, page, PAGE_SIZE);
  }

  // A kanji comes with the words written with it.
  @Get('content/item/:id')
  async item(@Param('id') id: string) {
    const row = await this.db.item.findUnique({ where: { id } });
    if (!row) throw new NotFoundException();
    const d = JSON.parse(row.data) as Data;
    if (row.kind !== 'kanji') return d;
    const char = d.char as string;
    const vocab = parse(await this.db.item.findMany({ where: { kind: 'vocab', data: { contains: char } }, orderBy: { sort: 'asc' } }));
    return { ...d, words: vocab.filter((v) => [v.word, v.kanji].some((w) => typeof w === 'string' && w.includes(char))) };
  }

  // Up to 20 per kind, so short queries matching many kana still show words and kanji.
  @Get('search')
  async search(@Query('q') raw: unknown, @Query('level') rawLevel: unknown) {
    check(typeof raw === 'string', 'q');
    const q = normalize(raw);
    check(q.length >= 1 && q.length <= 50, 'q');
    const level = levelParam(rawLevel);
    const groups = await Promise.all(
      Object.keys(KINDS).map(async (kind) =>
        parse(await this.db.item.findMany({ where: { kind, level, search: { contains: q } }, orderBy: { sort: 'asc' }, take: 20 })).map(
          (d) => ({ kind, ...d }),
        ),
      ),
    );
    return groups.flat();
  }

  @Get('tests')
  tests(@Query('level') raw: unknown) {
    const level = levelParam(raw);
    return PAPERS.filter((p) => level === undefined || p.level === level).map(({ id, title, minutes, parts }) => ({
      id,
      title,
      minutes,
      questions: parts.reduce((n, p) => n + p.questions.length, 0),
    }));
  }

  // ponytail: answers ship with the paper, fine for self-study; score on the server if results ever count.
  @Get('tests/:id')
  test(@Param('id') id: string) {
    const paper = PAPERS.find((p) => p.id === id);
    if (!paper) throw new NotFoundException();
    return paper;
  }
}
