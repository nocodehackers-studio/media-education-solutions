import * as Sentry from '@sentry/react';

export function initSentry(): void {
  // Only initialize in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      // Performance monitoring (optional, can be enabled later)
      // tracesSampleRate: 0.1,
      // Session replay (optional, can be enabled later)
      // replaysSessionSampleRate: 0.1,
      // replaysOnErrorSampleRate: 1.0,
    });
  }
}

export { Sentry };
