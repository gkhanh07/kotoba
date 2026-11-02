import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.js';
import { Db } from './db.js';
import { Mailer } from './mailer.js';

@Module({
  controllers: [AuthController],
  providers: [Db, Mailer, AuthGuard],
})
export class AppModule {}
