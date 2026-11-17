import { defineConfig, env } from 'prisma/config';

try {
  process.loadEnvFile();
} catch {
  // no .env: DATABASE_URL must come from the environment
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
