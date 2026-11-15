import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type Authed } from './auth.js';
import { Db } from './db.js';
import { MAX_LIST_TESTS, MAX_PUSH_CARDS } from './config.js';
import { cardsOf, isActivity, isCards, isForget, isTestScores, mergeActivity, newer, parseActivity, testsOf } from './progress.js';
import { body, check } from './validate.js';

@Controller('progress')
@UseGuards(AuthGuard)
export class ProgressController {
  constructor(private db: Db) {}

  // One call does it all: apply resets, write the newer cards, union the activity log,
  // and answer with the whole account state. An empty push is a pull.
  @Put()
  async put(@Req() req: Authed, @Body() raw: unknown) {
    const b = body(raw);
    const cards = b.cards ?? {};
    const forget = b.forget ?? [];
    const pushed = b.activity ?? null;
    const tests = b.tests ?? [];
    check(isCards(cards), 'cards');
    check(Object.keys(cards).length <= MAX_PUSH_CARDS, 'cards');
    check(pushed === null || isActivity(pushed), 'activity');
    check(Array.isArray(forget) && forget.length <= 50 && forget.every(isForget), 'forget');
    check(isTestScores(tests), 'tests');
    const userId = req.user.id;

    return this.db.$transaction(async (tx) => {
      // A reset removes what was there at reset time; anything reviewed after it stays.
      for (const f of forget) await tx.card.deleteMany({ where: { userId, itemId: { startsWith: f.prefix }, at: { lte: f.at } } });
      const ids = Object.keys(cards);
      const known = new Set((await tx.item.findMany({ where: { id: { in: ids } }, select: { id: true } })).map((i) => i.id));
      const server = cardsOf(await tx.card.findMany({ where: { userId } }));
      for (const [itemId, pushedCard] of Object.entries(newer(server, cards, known))) {
        // Only the known fields are written; a missing lapses is an old client's card and counts 0, a missing saved is false.
        const c = { box: pushedCard.box, due: pushedCard.due, at: pushedCard.at, lapses: pushedCard.lapses ?? 0, saved: pushedCard.saved === true };
        await tx.card.upsert({ where: { userId_itemId: { userId, itemId } }, create: { userId, itemId, ...c }, update: c });
      }

      // Test scores are only ever added; a (testId, at) already stored is a resend and is skipped.
      // Named fields only: an extra userId in the payload must not pick the account.
      const key = (t: { testId: string; at: number }) => `${t.testId}@${t.at}`;
      const stored = new Set((await tx.testResult.findMany({ where: { userId }, select: { testId: true, at: true } })).map(key));
      const fresh = new Map(tests.filter((t) => !stored.has(key(t))).map((t) => [key(t), t]));
      if (fresh.size) await tx.testResult.createMany({ data: [...fresh.values()].map(({ testId, score, total, at }) => ({ userId, testId, score, total, at })) });

      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { activity: true } });
      let activity = parseActivity(user.activity);
      if (pushed) {
        activity = mergeActivity(activity, pushed);
        await tx.user.update({ where: { id: userId }, data: { activity: JSON.stringify(activity) } });
      }
      return { cards: cardsOf(await tx.card.findMany({ where: { userId } })), activity };
    });
  }

  // The account's test scores, newest first, for the dashboard (phase 40g).
  @Get('tests')
  async tests(@Req() req: Authed) {
    return testsOf(await this.db.testResult.findMany({ where: { userId: req.user.id }, orderBy: { at: 'desc' }, take: MAX_LIST_TESTS }));
  }
}
