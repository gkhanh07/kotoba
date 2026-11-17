import { Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { Mailer } from './mailer.js';

vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn() } }));

describe('Mailer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    ['', ''],
    ['smtp://localhost:1025', ''],
    ['', 'Kotoba <study@example.com>'],
  ])('logs mail when SMTP_URL=%s and MAIL_FROM=%s', async (url, from) => {
    vi.stubEnv('SMTP_URL', url);
    vi.stubEnv('MAIL_FROM', from);
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    await new Mailer().send('mai@example.com', 'Reset', 'Open this link');
    expect(log).toHaveBeenCalledWith('to=mai@example.com subject="Reset"\nOpen this link');
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('creates the SMTP transport lazily once and sends each mail with MAIL_FROM', async () => {
    vi.stubEnv('SMTP_URL', 'smtp://localhost:1025');
    vi.stubEnv('MAIL_FROM', 'Kotoba <study@example.com>');
    const sendMail = vi.fn().mockResolvedValue({});
    vi.mocked(nodemailer.createTransport, { partial: true }).mockReturnValue({ sendMail });
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    const mailer = new Mailer();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    await mailer.send('mai@example.com', 'Reset', 'First link');
    await mailer.send('an@example.com', 'Reset again', 'Second link');
    expect(nodemailer.createTransport).toHaveBeenCalledExactlyOnceWith('smtp://localhost:1025');
    expect(sendMail).toHaveBeenNthCalledWith(1, {
      from: 'Kotoba <study@example.com>', to: 'mai@example.com', subject: 'Reset', text: 'First link',
    });
    expect(sendMail).toHaveBeenNthCalledWith(2, {
      from: 'Kotoba <study@example.com>', to: 'an@example.com', subject: 'Reset again', text: 'Second link',
    });
    expect(log).not.toHaveBeenCalled();
  });

  it('propagates a send failure for the caller to handle', async () => {
    vi.stubEnv('SMTP_URL', 'smtp://localhost:1025');
    vi.stubEnv('MAIL_FROM', 'study@example.com');
    const error = new Error('SMTP unavailable');
    const sendMail = vi.fn().mockRejectedValue(error);
    vi.mocked(nodemailer.createTransport, { partial: true }).mockReturnValue({ sendMail });
    await expect(new Mailer().send('mai@example.com', 'Reset', 'Link')).rejects.toBe(error);
  });
});
