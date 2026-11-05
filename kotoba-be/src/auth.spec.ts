import { hashPassword, Limiter, verifyPassword } from './auth.js';

describe('passwords', () => {
  it('verifies the right password only', async () => {
    const stored = await hashPassword('correct horse');
    expect(stored).toMatch(/^scrypt\$131072\$8\$1\$/);
    expect(await verifyPassword('correct horse', stored)).toBe(true);
    expect(await verifyPassword('correct hors', stored)).toBe(false);
    expect(await hashPassword('correct horse')).not.toBe(stored);
  });
});

describe('Limiter', () => {
  it('blocks after max hits inside the window, then forgets', () => {
    const l = new Limiter(2, 1000);
    expect(l.blocked('a', 0)).toBe(false);
    l.hit('a', 0);
    l.hit('a', 500);
    expect(l.blocked('a', 900)).toBe(true);
    expect(l.blocked('b', 900)).toBe(false);
    expect(l.blocked('a', 1001)).toBe(false);
  });
});
