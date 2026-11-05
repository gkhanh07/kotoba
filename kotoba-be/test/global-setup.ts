import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

// Fresh database per run: e2e specs share it, so they also run serially.
export default function setup() {
  process.env.DATABASE_URL = 'file:./test.db';
  rmSync('test.db', { force: true });
  execSync('npx prisma migrate deploy', { stdio: 'ignore', env: process.env });
}
