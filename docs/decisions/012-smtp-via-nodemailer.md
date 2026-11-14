# ADR 012: Send reset emails over SMTP with nodemailer

- Status: accepted
- Date: 2026-11-15

## Context
`Mailer` in kotoba-be only logged the reset link, so a user who forgot their password could not get back in without someone reading the server log. Phase 38 (AC-9) makes it send real email. The project owner supplies the SMTP account; no mail service is signed up for here.

## Options
1. Speak SMTP by hand over `node:net`/`node:tls`. No dependency, but STARTTLS, AUTH, dot-stuffing and multi-line replies are easy to get wrong, and a wrong mailer fails silently.
2. A provider HTTP API (Resend, SES, ...) with `fetch`. No dependency, but ties the app to one vendor and its account.
3. `nodemailer`: the standard Node SMTP client, no runtime dependencies of its own, works with any SMTP server.

## Decision
Option 3.
- `SMTP_URL` (e.g. `smtps://user:pass@host:465`) and `MAIL_FROM` set: send with nodemailer.
- Either unset: log the link as before (dev and E2E need no mail server).
- A send failure is logged; `/auth/forgot` still answers 204, so the response never tells whether an email exists or was sent.

## Consequences
- One runtime dependency (`nodemailer`) and one dev dependency (`@types/nodemailer`).
- A wrong SMTP setting shows only in the log; whoever deploys must check it once.
