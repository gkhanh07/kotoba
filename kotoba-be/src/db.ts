import { readFileSync } from 'node:fs';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { DEFAULT_LEVEL } from './config.js';
import { type Kind, KINDS, searchText } from './content.js';
import { PrismaClient } from './generated/prisma/client.js';

// Resolves from src/ (dev, tests) and dist/ alike.
const CONTENT = new URL('../content/', import.meta.url);
// The items of each kind, as in content/*.json.
export type Content = Record<Kind, Record<string, unknown>[]>;

@Injectable()
export class Db extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL ?? 'file:./dev.db',
      }),
    });
  }

  // Makes the Item table match content/*.json. Removing an item someone has a card for
  // fails the boot (Card -> Item is Restrict) instead of silently dropping their progress.
  onModuleInit() {
    return this.seed(
      Object.fromEntries(
        Object.entries(KINDS).map(([kind, file]) => [kind, JSON.parse(readFileSync(new URL(`${file}.json`, CONTENT), 'utf8'))]),
      ) as Content,
    );
  }

  // Writes only the rows that differ from the table: a full rewrite of 10k rows took ~5.5 s a boot,
  // the unchanged case is one read (phase 22). Stale ids are deleted with `in`, which Prisma splits
  // into chunks; `notIn` with a whole kind's ids is one statement and fails past 999 ids (Prisma P2029).
  async seed(content: Content) {
    const current = new Map((await this.item.findMany()).map((r) => [r.id, r]));
    const rows = Object.entries(content).flatMap(([kind, items]) =>
      items.map((d, sort) => ({
        id: d.id as string,
        row: {
          kind,
          lesson: (d.lesson as number | undefined) ?? null,
          level: (d.level as number | undefined) ?? DEFAULT_LEVEL,
          sort,
          search: searchText(d),
          data: JSON.stringify(d),
        },
      })),
    );
    const kept = new Set(rows.map((r) => r.id));
    const stale = [...current.keys()].filter((id) => !kept.has(id));
    const changed = rows.filter(({ id, row }) => {
      const old = current.get(id);
      return !old || Object.entries(row).some(([field, value]) => old[field as keyof typeof row] !== value);
    });
    await this.$transaction([
      this.item.deleteMany({ where: { id: { in: stale } } }),
      ...changed.map(({ id, row }) => this.item.upsert({ where: { id }, create: { id, ...row }, update: row })),
    ]);
  }

  onModuleDestroy() {
    return this.$disconnect();
  }
}
