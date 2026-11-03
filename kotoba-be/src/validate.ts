// Hand-written guards for request bodies. Same rules as kotoba-fe/src/lib/account.ts.
import { BadRequestException } from '@nestjs/common';
import { LEVELS } from './config.js';

export const GOALS = ['N5', 'N4', 'N3', 'N2', 'N1'];
export const MINUTES = [10, 15, 30, 60];

export const isEmail = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
// Upper bound keeps one request from making scrypt chew on megabytes.
export const isPassword = (v: unknown): v is string =>
  typeof v === 'string' && v.length >= 8 && v.length <= 200;
export const isGoal = (v: unknown): v is string => GOALS.includes(v as string);
export const isMinutes = (v: unknown): v is number => MINUTES.includes(v as number);
export const isExam = (v: unknown): v is string =>
  v === 'unknown' || (typeof v === 'string' && /^\d{4}-(07|12)$/.test(v));
export const isName = (v: unknown): v is string =>
  typeof v === 'string' && v.length >= 1 && v.length <= 40 && v.trim() === v;

// Content query params (phase 22); FE: kotoba-fe/src/lib/library.ts.
export const isLevel = (v: unknown): v is number => LEVELS.includes(v as number);
export const isPage = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 1;

export function body(v: unknown): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new BadRequestException('body');
  return v as Record<string, unknown>;
}

export function check(ok: boolean, field: string): asserts ok {
  if (!ok) throw new BadRequestException(field);
}

export const normEmail = (email: string) => email.trim().toLowerCase();
