// ==============================================================================
// Amar Dokan (আমার দোকান) Local Credential Hashing
// Offline logins still need a secret check. Storing the raw password in
// IndexedDB means anyone with the device reads every staff password, so we keep
// only a salted SHA-256 digest. Supabase Auth stays the source of truth online.
// ==============================================================================

const HASH_PREFIX = 'sha256$';

/**
 * Salted digest of a secret. The phone number acts as a per-user salt so the
 * same PIN used by two staff members does not produce the same digest.
 */
export async function hashSecret(identity: string, secret: string): Promise<string> {
  const salted = `amardokan:v1:${identity.trim().toLowerCase()}:${secret}`;

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const bytes = new TextEncoder().encode(salted);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `${HASH_PREFIX}${hex}`;
  }

  // Non-secure contexts (plain http on a LAN till) have no SubtleCrypto.
  // Fall back to a weak digest rather than storing the secret in the clear.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < salted.length; i++) {
    const c = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return `${HASH_PREFIX}fallback.${h1.toString(16)}${h2.toString(16)}`;
}

export function isHashedSecret(value?: string | null): boolean {
  return typeof value === 'string' && value.startsWith(HASH_PREFIX);
}

/**
 * Verifies a secret against a stored value that may be either a digest or a
 * legacy plaintext password from an older install / the demo seed.
 */
export async function verifySecret(
  identity: string,
  secret: string,
  stored?: string | null
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  if (!stored) return { valid: false, needsUpgrade: false };

  if (isHashedSecret(stored)) {
    const candidate = await hashSecret(identity, secret);
    return { valid: candidate === stored, needsUpgrade: false };
  }

  // Legacy plaintext record: accept once, then re-store as a digest.
  const valid = stored === secret;
  return { valid, needsUpgrade: valid };
}
