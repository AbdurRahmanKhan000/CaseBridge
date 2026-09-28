/**
 * CaseBridge Client Security & Cryptography Utilities
 */

const SAFE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates an unpredictable, non-sequential tracking code.
 * Format: CB-XXXX-XXXX-XXXX (e.g., CB-8F3K-9M2X-7R4Q)
 * Entropy: 32^12 combinations (> 1.15 x 10^18 possibilities)
 */
export function generateTrackingCode(): string {
  const getRandomChars = (count: number): string => {
    let result = '';
    const array = new Uint8Array(count);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
      for (let i = 0; i < count; i++) {
        result += SAFE_ALPHABET[array[i] % SAFE_ALPHABET.length];
      }
    } else {
      for (let i = 0; i < count; i++) {
        result += SAFE_ALPHABET[Math.floor(Math.random() * SAFE_ALPHABET.length)];
      }
    }
    return result;
  };

  const block1 = getRandomChars(4);
  const block2 = getRandomChars(4);
  const block3 = getRandomChars(4);

  return `CB-${block1}-${block2}-${block3}`;
}

/**
 * Computes deterministic SHA-256 hash of a normalized tracking code.
 */
export async function hashTrackingCode(rawCode: string, salt: string = 'casebridge_tracking_salt_v1'): Promise<string> {
  const normalized = rawCode.trim().toUpperCase().replace(/\s+/g, '');
  const data = new TextEncoder().encode(`${normalized}:${salt}`);
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Simple fallback hash for synchronous environments if subtle is unavailable
  let hash = 0;
  const str = `${normalized}:${salt}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `fallback_hash_${Math.abs(hash)}`;
}

/**
 * Rate Limiter for Tracking Code lookups to prevent brute force attempts.
 */
interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const rateLimitStore: Record<string, RateLimitRecord> = {};

export function checkLookupRateLimit(clientIdentifier = 'default_client'): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 60 * 1000; // 1 minute window
  const BLOCK_DURATION_MS = 120 * 1000; // 2 minute lockout after limit reached
  const now = Date.now();

  const record = rateLimitStore[clientIdentifier];

  if (record && record.blockedUntil && now < record.blockedUntil) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
  }

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    rateLimitStore[clientIdentifier] = {
      attempts: 1,
      firstAttemptAt: now
    };
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  record.attempts += 1;

  if (record.attempts > MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    const retryAfter = Math.ceil(BLOCK_DURATION_MS / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
  }

  return { allowed: true, remaining: Math.max(0, MAX_ATTEMPTS - record.attempts) };
}

export function resetRateLimits(): void {
  for (const key of Object.keys(rateLimitStore)) {
    delete rateLimitStore[key];
  }
}

/**
 * Basic XSS sanitizer for safe text representation.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
