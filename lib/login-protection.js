'use strict';

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const attemptsByIp = new Map();
const attemptsByEmail = new Map();

function now() {
  return Date.now();
}

function cleanupBucket(bucket) {
  const cutoff = now() - WINDOW_MS;
  for (const [key, value] of bucket.entries()) {
    if ((value.lastFailedAt || 0) < cutoff && (value.lockedUntil || 0) < cutoff) {
      bucket.delete(key);
    }
  }
}

function getState(bucket, key) {
  cleanupBucket(bucket);
  const current = bucket.get(key) || { count: 0, nextAllowedAt: 0, lockedUntil: 0, lastFailedAt: 0 };
  if (current.lastFailedAt && now() - current.lastFailedAt > WINDOW_MS) {
    return { count: 0, nextAllowedAt: 0, lockedUntil: 0, lastFailedAt: 0 };
  }
  return current;
}

function putState(bucket, key, state) {
  bucket.set(key, state);
}

function checkState(state) {
  const ts = now();
  if (state.lockedUntil > ts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((state.lockedUntil - ts) / 1000)),
      reason: 'locked',
    };
  }
  if (state.nextAllowedAt > ts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((state.nextAllowedAt - ts) / 1000)),
      reason: 'cooldown',
    };
  }
  return { allowed: true, retryAfterSeconds: 0, reason: null };
}

function getProtectionStatus(ip, email) {
  const ipState = ip ? getState(attemptsByIp, ip) : null;
  const emailState = email ? getState(attemptsByEmail, email) : null;
  const candidates = [ipState, emailState].filter(Boolean).map(checkState);
  const blocked = candidates.find((item) => !item.allowed);
  return blocked || { allowed: true, retryAfterSeconds: 0, reason: null };
}

function registerFailure(ip, email) {
  const keys = [];
  if (ip) keys.push([attemptsByIp, ip]);
  if (email) keys.push([attemptsByEmail, email]);

  let delayMs = 1000;
  let lockedUntil = 0;

  for (const [bucket, key] of keys) {
    const state = getState(bucket, key);
    const count = state.count + 1;
    delayMs = Math.max(delayMs, Math.min(8000, 2 ** Math.min(count - 1, 3) * 1000));
    lockedUntil = count >= MAX_FAILURES ? now() + LOCK_MS : 0;

    putState(bucket, key, {
      count,
      lastFailedAt: now(),
      nextAllowedAt: lockedUntil || (now() + delayMs),
      lockedUntil,
    });
  }

  return { delayMs, lockedUntil };
}

function clearFailures(ip, email) {
  if (ip) attemptsByIp.delete(ip);
  if (email) attemptsByEmail.delete(email);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  clearFailures,
  getProtectionStatus,
  registerFailure,
  sleep,
};

