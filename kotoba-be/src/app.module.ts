import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { ContentController } from './content.controller.js';
import { AuthGuard } from './auth.js';
import { Db } from './db.js';
import { Mailer } from './mailer.js';

@Module({
  controllers: [AuthController, ContentController],
  providers: [Db, Mailer, AuthGuard],
})
export class AppModule {}
