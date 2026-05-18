'use strict';

require('dotenv').config();

let Sentry;
let nodeProfilingIntegration;

try {
  Sentry = require('@sentry/node');
  ({ nodeProfilingIntegration } = require('@sentry/profiling-node'));
} catch (error) {
  const noop = () => {};
  const passthroughSpan = (_options, callback) => {
    if (typeof callback === 'function') return callback();
    return undefined;
  };

  module.exports = {
    Sentry: {
      init: noop,
      captureException: noop,
      captureMessage: noop,
      setupExpressErrorHandler: noop,
      startSpan: passthroughSpan,
      withScope(callback) {
        if (typeof callback === 'function') {
          callback({
            setTag: noop,
            setContext: noop,
            setLevel: noop,
          });
        }
      },
      logger: {
        info: noop,
        warn: noop,
        error: noop,
      },
      metrics: {
        count: noop,
      },
    },
    sentryEnabled: false,
    reportError: noop,
  };
}

function toBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function toSampleRate(value, defaultValue) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.max(0, Math.min(parsed, 1));
}

function sanitizeObject(input, seen = new WeakSet()) {
  if (input === null || input === undefined) return input;
  if (typeof input === 'string') return input;
  if (typeof input !== 'object') return input;
  if (seen.has(input)) return '[Circular]';
  seen.add(input);

  if (Array.isArray(input)) {
    return input.map((value) => sanitizeObject(value, seen));
  }

  const redacted = {};
  for (const [key, value] of Object.entries(input)) {
    const lower = key.toLowerCase();
    if (
      lower.includes('password') ||
      lower.includes('passwd') ||
      lower.includes('secret') ||
      lower.includes('token') ||
      lower.includes('authorization') ||
      lower.includes('cookie') ||
      lower.includes('set-cookie') ||
      lower.includes('card') ||
      lower.includes('cvv') ||
      lower.includes('iban') ||
      lower.includes('cnp')
    ) {
      redacted[key] = '[Redacted]';
      continue;
    }

    if (lower === 'email' || lower === 'phone' || lower === 'telefon' || lower === 'name') {
      redacted[key] = '[Filtered]';
      continue;
    }

    redacted[key] = sanitizeObject(value, seen);
  }
  return redacted;
}

function reportError(error, context = {}) {
  if (!Sentry || !process.env.SENTRY_DSN) return;
  if (typeof Sentry.withScope === 'function') {
    Sentry.withScope((scope) => {
      if (context.level && typeof scope.setLevel === 'function') {
        scope.setLevel(context.level);
      }
      if (context.tags && typeof scope.setTag === 'function') {
        for (const [key, value] of Object.entries(context.tags)) {
          scope.setTag(key, String(value));
        }
      }
      if (context.extra && typeof scope.setContext === 'function') {
        scope.setContext('extra', sanitizeObject(context.extra));
      }
      Sentry.captureException(error);
    });
    return;
  }
  Sentry.captureException(error);
}

if (Sentry) {
  const sentryEnabled = !!process.env.SENTRY_DSN;

  if (sentryEnabled) {
    const integrations = [];
    if (typeof nodeProfilingIntegration === 'function') {
      integrations.push(nodeProfilingIntegration());
    }

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations,
      enabled: sentryEnabled,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.APP_RELEASE || process.env.K_REVISION || undefined,
      enableLogs: toBoolean(process.env.SENTRY_ENABLE_LOGS, true),
      tracesSampleRate: toSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.2),
      profileSessionSampleRate: toSampleRate(process.env.SENTRY_PROFILE_SESSION_SAMPLE_RATE, 0.1),
      profileLifecycle: process.env.SENTRY_PROFILE_LIFECYCLE || 'trace',
      sendDefaultPii: toBoolean(process.env.SENTRY_SEND_DEFAULT_PII, false),
      ignoreErrors: [
        /fetch aborted/i,
        /network error/i,
        /timeout/i,
        /aborterror/i,
      ],
      beforeSend(event) {
        const nextEvent = { ...event };

        if (nextEvent.user) {
          delete nextEvent.user.email;
          delete nextEvent.user.ip_address;
          delete nextEvent.user.username;
          delete nextEvent.user.name;
        }

        if (nextEvent.request) {
          nextEvent.request = sanitizeObject(nextEvent.request);
        }

        if (nextEvent.extra) {
          nextEvent.extra = sanitizeObject(nextEvent.extra);
        }

        if (nextEvent.contexts) {
          nextEvent.contexts = sanitizeObject(nextEvent.contexts);
        }

        return nextEvent;
      },
    });
  }

  module.exports = {
    Sentry,
    sentryEnabled,
    reportError,
  };
}
