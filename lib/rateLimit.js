/**
 * Simple in-memory rate limiter for OTP requests.
 * In production with multiple servers, replace with Redis.
 *
 * Limits: max 3 OTP requests per identifier per 10-minute window.
 */

const store = new Map(); // identifier → { count, resetAt }

const MAX_OTP_REQUESTS = 3;
const WINDOW_MS        = 10 * 60 * 1000; // 10 minutes

/**
 * Check if OTP request is allowed for this identifier (mobile/email).
 * Returns { allowed: true, remaining } or { allowed: false, waitSec }.
 */
export function checkOtpLimit(identifier) {
  const key = identifier.trim().toLowerCase();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_OTP_REQUESTS - 1 };
  }

  if (entry.count >= MAX_OTP_REQUESTS) {
    const waitSec = Math.ceil((entry.resetAt - now) / 1000);
    const waitMin = Math.ceil(waitSec / 60);
    return {
      allowed: false,
      waitSec,
      message: `Aapne bahut zyada OTP maange hain. ${waitMin} minute baad dobara try karein.`,
    };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_OTP_REQUESTS - entry.count };
}

/**
 * Reset limit for an identifier (call after successful OTP verify).
 */
export function resetOtpLimit(identifier) {
  store.delete(identifier.trim().toLowerCase());
}

// ─── OTP verify attempt limiter ─────────────────────────────────────────────
// Separate from send limit: max 5 wrong OTP attempts before lockout

const verifyStore = new Map(); // identifier → { count, lockedUntil }

const MAX_VERIFY_ATTEMPTS = 5;
const LOCK_MS             = 15 * 60 * 1000; // 15 minutes

export function checkVerifyLimit(identifier) {
  const key = identifier.trim().toLowerCase();
  const now = Date.now();
  const entry = verifyStore.get(key);

  if (!entry) return { allowed: true };

  if (entry.lockedUntil && now < entry.lockedUntil) {
    const waitMin = Math.ceil((entry.lockedUntil - now) / 60000);
    return {
      allowed: false,
      message: `Bahut zyada galat OTP. ${waitMin} minute baad try karein.`,
    };
  }

  // Lock expired — reset
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    verifyStore.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedVerify(identifier) {
  const key = identifier.trim().toLowerCase();
  const entry = verifyStore.get(key) || { count: 0 };
  entry.count++;
  if (entry.count >= MAX_VERIFY_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_MS;
  }
  verifyStore.set(key, entry);
}

export function resetVerifyLimit(identifier) {
  verifyStore.delete(identifier.trim().toLowerCase());
}

// ─── Cleanup stale entries every hour ───────────────────────────────────────
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of store.entries()) {
      if (now > val.resetAt) store.delete(key);
    }
    for (const [key, val] of verifyStore.entries()) {
      if (val.lockedUntil && now > val.lockedUntil) verifyStore.delete(key);
    }
  }, 60 * 60 * 1000);
}
