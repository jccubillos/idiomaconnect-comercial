/**
 * Sentry client init. Activated only when NEXT_PUBLIC_SENTRY_DSN is set.
 *
 * To enable:
 *   1. npm install @sentry/nextjs
 *   2. Set NEXT_PUBLIC_SENTRY_DSN and SENTRY_DSN in .env.local
 *   3. (Optional) Run `npx @sentry/wizard@latest -i nextjs` to upgrade source maps
 *
 * Until @sentry/nextjs is installed this file is a no-op.
 */

if (process.env.NEXT_PUBLIC_SENTRY_DSN && typeof window !== "undefined") {
  // Lazy require so the dep is only needed when DSN is set
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require("@sentry/nextjs");
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    // Don't send PII
    sendDefaultPii: false,
    beforeSend(event: any) {
      if (event.request?.headers) delete event.request.headers["cookie"];
      return event;
    },
  });
}
