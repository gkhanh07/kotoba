import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class Mailer {
  private log = new Logger('Mailer');
  private transport?: ReturnType<typeof nodemailer.createTransport>;

  async send(to: string, subject: string, text: string): Promise<void> {
    if (process.env.SMTP_URL && process.env.MAIL_FROM) {
      this.transport ??= nodemailer.createTransport(process.env.SMTP_URL);
      await this.transport.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
      return;
    }
    this.log.log(`to=${to} subject="${subject}"\n${text}`);
  }
}
