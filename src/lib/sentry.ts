import * as Sentry from '@sentry/react-native';

// Public ingest DSN (safe to ship in the client — it can only SEND events,
// not read them). Region: EU (.de).
const SENTRY_DSN =
  'https://2a524488020af5ed2471edb2fdbcca6f@o4511496282505216.ingest.de.sentry.io/4511496289583184';

export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Crash reporting only for now — no performance tracing (keeps event
    // volume low so we stay on the free plan). Enable later if needed.
    tracesSampleRate: 0,
    enableNative: true,
    // Tag events so we can tell debug builds apart from release in Sentry.
    environment: __DEV__ ? 'development' : 'production',
  });
}

export { Sentry };
