import { Injectable, Logger } from '@nestjs/common';

// ponytail: prints mail to the log instead of sending it. Add an SMTP client
// (e.g. nodemailer + SMTP_URL) here when real email is needed; callers stay the same.
@Injectable()
export class Mailer {
  private log = new Logger('Mailer');

  send(to: string, subject: string, text: string): Promise<void> {
    this.log.log(`to=${to} subject="${subject}"\n${text}`);
    return Promise.resolve();
  }
}
