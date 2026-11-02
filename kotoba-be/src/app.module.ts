import { Module } from '@nestjs/common';
import { Db } from './db.js';

@Module({
  providers: [Db],
})
export class AppModule {}
