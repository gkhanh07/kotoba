import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { Db } from '../src/db.js';

describe('app (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('boots and reaches the database', async () => {
    expect(await app.get(Db).user.count()).toBe(0);
  });

  it('has no hello route', () => request(app.getHttpServer()).get('/').expect(404));
});
