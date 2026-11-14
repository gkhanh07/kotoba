import {
  Body, ConflictException, Controller, Delete, Get, HttpCode, HttpException, Patch, Post, Req,
  UnauthorizedException, UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, burnTime, clientIp, hashPassword, hashToken, Limiter, newToken, verifyPassword, type Authed } from './auth.js';
import { Db } from './db.js';
import type { User } from './generated/prisma/client.js';
import { EXPORT_VERSION } from './config.js';
import { Mailer } from './mailer.js';
import { cardsOf, parseActivity } from './progress.js';
import { body, check, isEmail, isExam, isGoal, isMinutes, isName, isPassword, normEmail } from './validate.js';

const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

const tooMany = () => new HttpException('rate', 429);

export const profile = (u: User) => ({
  email: u.email,
  name: u.name ?? undefined,
  goal: u.goal ?? undefined,
  exam: u.exam ?? undefined,
  minutes: u.minutes ?? undefined,
});

@Controller()
export class AuthController {
  // Failed logins per email and per IP; reset requests per email; sign-ups per IP.
  private loginEmail = new Limiter(5, 15 * MIN);
  private loginIp = new Limiter(20, 15 * MIN);
  private forgotEmail = new Limiter(3, 60 * MIN);
  private registerIp = new Limiter(10, 60 * MIN);

  constructor(private db: Db, private mailer: Mailer) {}

  private async session(userId: string, remember: boolean) {
    const token = newToken();
    const expiresAt = new Date(Date.now() + (remember ? 30 : 7) * DAY);
    await this.db.token.create({ data: { hash: hashToken(token), userId, kind: 'session', expiresAt } });
    return { token, expiresAt: expiresAt.toISOString() };
  }

  @Post('auth/register')
  async register(@Body() raw: unknown, @Req() req: Request) {
    const b = body(raw);
    check(isEmail(b.email), 'email');
    check(isPassword(b.password), 'password');
    check(isGoal(b.goal), 'goal');
    const ip = clientIp(req);
    if (this.registerIp.blocked(ip)) throw tooMany();
    this.registerIp.hit(ip);
    const email = normEmail(b.email);
    if (await this.db.user.findUnique({ where: { email } })) throw new ConflictException('taken');
    const user = await this.db.user.create({
      data: { email, passwordHash: await hashPassword(b.password), goal: b.goal },
    });
    return { ...(await this.session(user.id, false)), onboarded: false };
  }

  @Post('auth/login')
  @HttpCode(200)
  async login(@Body() raw: unknown, @Req() req: Request) {
    const b = body(raw);
    check(isEmail(b.email), 'email');
    check(typeof b.password === 'string' && b.password.length <= 200, 'password');
    const email = normEmail(b.email);
    const ip = clientIp(req);
    if (this.loginEmail.blocked(email) || this.loginIp.blocked(ip)) throw tooMany();
    const user = await this.db.user.findUnique({ where: { email } });
    let ok = false;
    if (user) ok = await verifyPassword(b.password, user.passwordHash);
    else await burnTime(b.password);
    if (!user || !ok) {
      this.loginEmail.hit(email);
      this.loginIp.hit(ip);
      throw new UnauthorizedException('credentials');
    }
    return { ...(await this.session(user.id, b.remember === true)), onboarded: user.minutes !== null };
  }

  @Post('auth/logout')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async logout(@Req() req: Authed) {
    await this.db.token.delete({ where: { hash: req.tokenHash } });
  }

  // Always 204 so the reply never tells which emails have accounts.
  @Post('auth/forgot')
  @HttpCode(204)
  async forgot(@Body() raw: unknown) {
    const b = body(raw);
    check(isEmail(b.email), 'email');
    const email = normEmail(b.email);
    if (this.forgotEmail.blocked(email)) return;
    this.forgotEmail.hit(email);
    const user = await this.db.user.findUnique({ where: { email } });
    if (!user) return;
    const token = newToken();
    await this.db.$transaction([
      this.db.token.deleteMany({ where: { userId: user.id, kind: 'reset' } }),
      this.db.token.create({
        data: { hash: hashToken(token), userId: user.id, kind: 'reset', expiresAt: new Date(Date.now() + 30 * MIN) },
      }),
    ]);
    const link = `${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;
    await this.mailer.send(
      user.email,
      'Đặt lại mật khẩu Kotoba',
      `Mở liên kết dưới đây trong vòng 30 phút để đặt mật khẩu mới:\n${link}\n\nNếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`,
    );
  }

  // A reset ends every session: whoever knew the old password is logged out.
  @Post('auth/reset')
  @HttpCode(204)
  async reset(@Body() raw: unknown) {
    const b = body(raw);
    check(typeof b.token === 'string' && b.token.length <= 100, 'token');
    check(isPassword(b.password), 'password');
    const row = await this.db.token.findUnique({ where: { hash: hashToken(b.token) } });
    if (!row || row.kind !== 'reset' || row.expiresAt <= new Date()) throw new HttpException('token', 400);
    const passwordHash = await hashPassword(b.password);
    await this.db.$transaction([
      this.db.user.update({ where: { id: row.userId }, data: { passwordHash } }),
      this.db.token.deleteMany({ where: { userId: row.userId } }),
    ]);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: Authed) {
    return profile(req.user);
  }

  // Everything the account holds about the learner's study (phase 21). Built field by field, so a
  // password hash, session or token can never slip in (AGENTS.md §8.4).
  @Get('me/export')
  @UseGuards(AuthGuard)
  async export(@Req() req: Authed) {
    const userId = req.user.id;
    const rows = await this.db.card.findMany({ where: { userId }, orderBy: { itemId: 'asc' } });
    return {
      format: 'kotoba-export',
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      profile: profile(req.user),
      cards: cardsOf(rows),
      activity: parseActivity(req.user.activity),
    };
  }

  // Fields left out stay as they are; name: null clears the name.
  @Patch('me')
  @UseGuards(AuthGuard)
  async update(@Body() raw: unknown, @Req() req: Authed) {
    const b = body(raw);
    const data: Partial<Pick<User, 'name' | 'goal' | 'exam' | 'minutes'>> = {};
    if (b.name !== undefined) {
      check(b.name === null || isName(b.name), 'name');
      data.name = b.name;
    }
    if (b.goal !== undefined) {
      check(isGoal(b.goal), 'goal');
      data.goal = b.goal;
    }
    if (b.exam !== undefined) {
      check(isExam(b.exam), 'exam');
      data.exam = b.exam;
    }
    if (b.minutes !== undefined) {
      check(isMinutes(b.minutes), 'minutes');
      data.minutes = b.minutes;
    }
    return profile(await this.db.user.update({ where: { id: req.user.id }, data }));
  }

  // Keeps the session making the change, ends the others.
  @Post('me/password')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async password(@Body() raw: unknown, @Req() req: Authed) {
    const b = body(raw);
    check(typeof b.current === 'string' && b.current.length <= 200, 'current');
    check(isPassword(b.password), 'password');
    if (!(await verifyPassword(b.current, req.user.passwordHash))) throw new UnauthorizedException('credentials');
    const passwordHash = await hashPassword(b.password);
    await this.db.$transaction([
      this.db.user.update({ where: { id: req.user.id }, data: { passwordHash } }),
      this.db.token.deleteMany({ where: { userId: req.user.id, hash: { not: req.tokenHash } } }),
    ]);
  }

  @Delete('me')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async remove(@Body() raw: unknown, @Req() req: Authed) {
    const b = body(raw);
    check(typeof b.password === 'string' && b.password.length <= 200, 'password');
    if (!(await verifyPassword(b.password, req.user.passwordHash))) throw new UnauthorizedException('credentials');
    await this.db.user.delete({ where: { id: req.user.id } });
  }
}
