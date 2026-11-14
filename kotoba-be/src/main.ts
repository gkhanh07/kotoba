import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

try {
  process.loadEnvFile();
} catch {
  // no .env: rely on the real environment
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.useBodyParser('json', { limit: '1mb' });
  // Loopback only: kotoba-fe's server is the sole client, and it is trusted to
  // pass the real visitor IP in X-Client-IP for rate limiting.
  await app.listen(Number(process.env.PORT ?? 4000), '127.0.0.1');
}
await bootstrap();
