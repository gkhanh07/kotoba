import { readFileSync } from 'node:fs';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { KINDS, searchText } from './content.js';
import { PrismaClient } from './generated/prisma/client.js';

// Resolves from src/ (dev, tests) and dist/ alike.
const CONTENT = new URL('../content/', import.meta.url);

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
  // ponytail: reseeds on every boot, fine at a few thousand rows; diff by hash if boot gets slow.
  async onModuleInit() {
    const ops = [];
    for (const [kind, file] of Object.entries(KINDS)) {
      const items = JSON.parse(readFileSync(new URL(`${file}.json`, CONTENT), 'utf8')) as Record<string, unknown>[];
      ops.push(this.item.deleteMany({ where: { kind, id: { notIn: items.map((d) => d.id as string) } } }));
      items.forEach((d, sort) => {
        const row = { kind, sort, lesson: (d.lesson as number | undefined) ?? null, search: searchText(d), data: JSON.stringify(d) };
        ops.push(this.item.upsert({ where: { id: d.id as string }, create: { id: d.id as string, ...row }, update: row }));
      });
    }
    await this.$transaction(ops);
  }

  onModuleDestroy() {
    return this.$disconnect();
  }
}
