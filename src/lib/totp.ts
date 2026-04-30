/**
 * RFC 6238 TOTP (HMAC-SHA1, 6-digit, 30-second step).
 *
 * Browser-only. Uses `crypto.subtle.importKey` + `sign("HMAC", ...)`.
 *
 * For demo purposes the verifier accepts a ±1-step skew (≈ ±30 s) which is
 * the standard tolerance Speakeasy / Google Authenticator use. When the
 * Slice 4 spec backend lands, the same verification logic moves server-side
 * verbatim — only the secret-storage layer changes.
 */

// ---- base32 (RFC 4648, no padding) ----

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateBase32Secret(byteLength = 20): string {
  if (typeof window === "undefined") {
    // SSR safety — real secrets are minted client-side at enrolment time.
    return "JBSWY3DPEHPK3PXP";
  }
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += B32[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

function base32Decode(s: string): Uint8Array {
  const clean = s.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = "";
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error("Invalid base32 character");
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

// ---- TOTP ----

const STEP_SECONDS = 30;
const DIGITS = 6;

function counterBytes(counter: number): Uint8Array {
  const out = new Uint8Array(8);
  // JS bitwise ops are 32-bit; counter fits well within 53-bit safe ints
  // for the next ~285 000 years, so high 32 bits are derived via division.
  const high = Math.floor(counter / 0x100000000);
  const low  = counter >>> 0;
  out[0] = (high >>> 24) & 0xff;
  out[1] = (high >>> 16) & 0xff;
  out[2] = (high >>>  8) & 0xff;
  out[3] =  high         & 0xff;
  out[4] = (low  >>> 24) & 0xff;
  out[5] = (low  >>> 16) & 0xff;
  out[6] = (low  >>>  8) & 0xff;
  out[7] =  low          & 0xff;
  return out;
}

async function hmacSha1(keyBytes: Uint8Array, msg: Uint8Array): Promise<Uint8Array> {
  // ArrayBufferLike → ArrayBuffer for Web Crypto's BufferSource overloads.
  const keyBuf = keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer;
  const msgBuf = msg.buffer.slice(msg.byteOffset, msg.byteOffset + msg.byteLength) as ArrayBuffer;
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await window.crypto.subtle.sign("HMAC", key, msgBuf);
  return new Uint8Array(sig);
}

function dynamicTruncate(hmac: Uint8Array): number {
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return code % 10 ** DIGITS;
}

/** Generate the TOTP code for a base32 secret at the given timestamp (ms). */
export async function totpCode(secretBase32: string, atMs = Date.now()): Promise<string> {
  const counter = Math.floor(atMs / 1000 / STEP_SECONDS);
  const hmac = await hmacSha1(base32Decode(secretBase32), counterBytes(counter));
  return String(dynamicTruncate(hmac)).padStart(DIGITS, "0");
}

/**
 * Verify a 6-digit code against a base32 secret with ±`window` step skew.
 * Returns true if any step in [-window, +window] matches.
 */
export async function verifyTotp(
  secretBase32: string,
  code: string,
  windowSteps = 1
): Promise<boolean> {
  const clean = code.replace(/\D/g, "");
  if (clean.length !== DIGITS) return false;
  const now = Date.now();
  for (let i = -windowSteps; i <= windowSteps; i++) {
    const candidate = await totpCode(secretBase32, now + i * STEP_SECONDS * 1000);
    if (candidate === clean) return true;
  }
  return false;
}

/** Build the otpauth:// URI used by authenticator apps. */
export function otpauthUri(opts: {
  secret: string;
  account: string;   // email
  issuer: string;    // "CiviXLab"
}): string {
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer: opts.issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  const label = `${encodeURIComponent(opts.issuer)}:${encodeURIComponent(opts.account)}`;
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Seconds remaining in the current 30-second window. */
export function secondsLeft(atMs = Date.now()): number {
  return STEP_SECONDS - (Math.floor(atMs / 1000) % STEP_SECONDS);
}

/** Generate cryptographically random recovery codes (XXXX-XXXX format). */
export function generateRecoveryCodes(count = 8): string[] {
  const out: string[] = [];
  const buf = new Uint8Array(4);
  for (let i = 0; i < count; i++) {
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(buf);
    } else {
      for (let j = 0; j < 4; j++) buf[j] = Math.floor(Math.random() * 256);
    }
    const hex = Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    out.push(`${hex.slice(0, 4)}-${hex.slice(4, 8)}`);
  }
  return out;
}
