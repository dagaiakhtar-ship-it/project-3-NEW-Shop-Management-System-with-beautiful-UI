/**
 * Secure cryptographic helper functions using the Web Crypto API.
 * Provides offline password hashing and verification without external dependencies.
 */

/**
 * Generates a SHA-256 hash of a plain text string.
 * @param text The plain text string to hash.
 * @returns A promise that resolves to the hex-encoded hash string.
 */
export async function hashPassword(text: string): Promise<string> {
  if (!text) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verifies a plain text password against a hash.
 * @param password The plain text password to verify.
 * @param hash The hex-encoded SHA-256 hash to compare against.
 * @returns A promise that resolves to true if the password matches the hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

/**
 * Simple client-side password strength checker.
 * @param password The password string to evaluate.
 * @returns A number between 0 and 4 representing password strength.
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) {
    return { score: 0, label: 'Empty', color: 'bg-slate-200' };
  }

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

  const strengthMap = [
    { score: 1, label: 'Very Weak', color: 'bg-red-500' },
    { score: 2, label: 'Weak', color: 'bg-amber-500' },
    { score: 3, label: 'Good', color: 'bg-sky-500' },
    { score: 4, label: 'Strong', color: 'bg-emerald-500' },
  ];

  return strengthMap[Math.min(score - 1, 3)] || { score: 1, label: 'Very Weak', color: 'bg-red-500' };
}
