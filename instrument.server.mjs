import * as Sentry from '@sentry/tanstackstart-react'

Sentry.init({
  dsn: "https://669ad24a79c04ae2c9042162115d266a@o4509176406212608.ingest.de.sentry.io/4510573750714448",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
})
