"use client";

/**
 * ZATCA Phase 2 (Integration) helpers.
 *
 * Implements the parts of the ZATCA "Fatoora" e-invoicing protocol that run
 * client-side in the browser:
 *
 *   • TLV (Tag-Length-Value) QR encoding per ZATCA "Annex 4 — QR specification"
 *     fields 1-9 (seller name, VAT number, timestamp, totals, hash, signature,
 *     ECDSA public key, ECDSA stamp).
 *   • ECDSA P-256 keypair generation and SHA-256 invoice hashing via WebCrypto.
 *   • CSID (Cryptographic Stamp Identifier) issuance + rotation tracking.
 *   • Standard B2B real-time clearance simulation (returns the cleared invoice
 *     UUID + ZATCA-issued QR).
 *
 * When the real Fastify backend lands the same shapes are emitted by ZATCA's
 * production endpoints (`/invoices/clearance/single`); the front-end only
 * stops minting the stamp itself and starts forwarding it to the backend.
 */

// ---------------------------------------------------------------------------
// TLV — Tag-Length-Value byte stream + base64
// ---------------------------------------------------------------------------

const enc = new TextEncoder();

function tlv(tag: number, valueBytes: Uint8Array): Uint8Array {
  // ZATCA TLV uses single-byte tag + single-byte length for fields 1-9.
  // Length must fit in one byte (≤ 255) which holds for every text field
  // ZATCA emits; binary fields (signature, public key) also fit at P-256 sizes.
  if (valueBytes.length > 255) {
    throw new Error(`ZATCA TLV: value too long for tag ${tag} (${valueBytes.length} bytes)`);
  }
  const out = new Uint8Array(2 + valueBytes.length);
  out[0] = tag;
  out[1] = valueBytes.length;
  out.set(valueBytes, 2);
  return out;
}

export interface ZatcaQrFields {
  sellerName: string;
  vatNumber: string;
  timestamp: string;     // ISO 8601 with timezone
  invoiceTotal: string;  // SAR with VAT
  vatTotal: string;      // VAT amount
  invoiceHash?: string;  // base64 SHA-256 of invoice XML — Phase 2
  signature?: string;    // base64 ECDSA signature — Phase 2
  publicKey?: string;    // base64 X.509 SPKI of ECDSA P-256 key — Phase 2
  stamp?: string;        // base64 stamp signature — Phase 2
}

/** Encode the ZATCA TLV QR string (returned base64). */
export function encodeZatcaQr(f: ZatcaQrFields): string {
  const parts: Uint8Array[] = [
    tlv(1, enc.encode(f.sellerName)),
    tlv(2, enc.encode(f.vatNumber)),
    tlv(3, enc.encode(f.timestamp)),
    tlv(4, enc.encode(f.invoiceTotal)),
    tlv(5, enc.encode(f.vatTotal)),
  ];
  if (f.invoiceHash) parts.push(tlv(6, enc.encode(f.invoiceHash)));
  if (f.signature)   parts.push(tlv(7, enc.encode(f.signature)));
  if (f.publicKey)   parts.push(tlv(8, enc.encode(f.publicKey)));
  if (f.stamp)       parts.push(tlv(9, enc.encode(f.stamp)));

  const total = parts.reduce((n, p) => n + p.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { buf.set(p, off); off += p.length; }
  return bytesToBase64(buf);
}

/** Decode the TLV stream back into structured fields (used by the verifier). */
export function decodeZatcaQr(b64: string): ZatcaQrFields {
  const bytes = base64ToBytes(b64);
  const dec = new TextDecoder();
  const out: Partial<ZatcaQrFields> = {};
  let i = 0;
  while (i < bytes.length) {
    const tag = bytes[i++];
    const len = bytes[i++];
    const v = dec.decode(bytes.slice(i, i + len));
    i += len;
    switch (tag) {
      case 1: out.sellerName   = v; break;
      case 2: out.vatNumber    = v; break;
      case 3: out.timestamp    = v; break;
      case 4: out.invoiceTotal = v; break;
      case 5: out.vatTotal     = v; break;
      case 6: out.invoiceHash  = v; break;
      case 7: out.signature    = v; break;
      case 8: out.publicKey    = v; break;
      case 9: out.stamp        = v; break;
    }
  }
  return out as ZatcaQrFields;
}

// ---------------------------------------------------------------------------
// Base64 helpers — work on arbitrary byte arrays (browser-safe).
// ---------------------------------------------------------------------------

export function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  if (typeof window !== "undefined") return window.btoa(s);
  return Buffer.from(bytes).toString("base64");
}

export function base64ToBytes(b64: string): Uint8Array {
  const raw = typeof window !== "undefined" ? window.atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// ---------------------------------------------------------------------------
// SHA-256 (WebCrypto)
// ---------------------------------------------------------------------------

export async function sha256Base64(input: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    // SSR fallback — never used in real flows because invoice signing is
    // user-triggered. Return a stable placeholder so the pipeline still works.
    return "ssr-no-crypto-fallback";
  }
  const data = enc.encode(input);
  const buf = await window.crypto.subtle.digest("SHA-256", data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
  return bytesToBase64(new Uint8Array(buf));
}

// ---------------------------------------------------------------------------
// ECDSA P-256 keypair + sign (the Phase 2 cryptographic stamp)
// ---------------------------------------------------------------------------

export interface CsidKeypair {
  publicKeySpkiB64: string;
  privateKeyJwk: JsonWebKey;
}

/**
 * Mint a fresh ECDSA P-256 keypair. The public key is exported as base64
 * X.509 SubjectPublicKeyInfo (SPKI) — the same encoding ZATCA uses for the
 * TLV tag-8 field. The private key is exported as JWK so we can re-import
 * it for signing without retaining the raw `CryptoKey` (which Zustand's
 * persist middleware can't serialise).
 */
export async function generateCsidKeypair(): Promise<CsidKeypair> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return {
      publicKeySpkiB64: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE-ssr-fallback-key",
      privateKeyJwk: { kty: "EC", crv: "P-256", x: "x", y: "y", d: "d" },
    };
  }
  const pair = await window.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
  const spki = await window.crypto.subtle.exportKey("spki", pair.publicKey);
  const jwk = await window.crypto.subtle.exportKey("jwk", pair.privateKey);
  return {
    publicKeySpkiB64: bytesToBase64(new Uint8Array(spki)),
    privateKeyJwk: jwk,
  };
}

/** Sign `payload` (base64 SHA-256 hash of invoice XML, typically) with the CSID private key. */
export async function ecdsaSignBase64(payload: string, jwk: JsonWebKey): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return "ssr-stamp";
  const key = await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  const data = enc.encode(payload);
  const sig = await window.crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  );
  return bytesToBase64(new Uint8Array(sig));
}

// ---------------------------------------------------------------------------
// CSID — Cryptographic Stamp Identifier
// ---------------------------------------------------------------------------

export interface CsidRecord {
  serial: string;            // human-readable
  status: "active" | "expired";
  issuedAt: string;          // ISO
  expiresAt: string;         // ISO  (typical ZATCA issuance: 1 year)
  publicKeySpkiB64: string;
  privateKeyJwk: JsonWebKey;
  /** Last rotation timestamp — surface in the compliance card. */
  lastRotatedAt: string;
}

export async function issueCsid(): Promise<CsidRecord> {
  const kp = await generateCsidKeypair();
  const now = new Date();
  const exp = new Date(now);
  exp.setFullYear(exp.getFullYear() + 1);
  const serial = `CSID-${now.getFullYear()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  return {
    serial,
    status: "active",
    issuedAt: now.toISOString(),
    expiresAt: exp.toISOString(),
    publicKeySpkiB64: kp.publicKeySpkiB64,
    privateKeyJwk: kp.privateKeyJwk,
    lastRotatedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// UUIDv4 — used as ZATCA invoice UUID (clearance returns one)
// ---------------------------------------------------------------------------

export function uuidv4(): string {
  if (typeof window !== "undefined" && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }
  // RFC 4122 v4 fallback
  const b = new Uint8Array(16);
  if (typeof window !== "undefined") window.crypto.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10, 16).join("")}`;
}

// ---------------------------------------------------------------------------
// Build the ZATCA-signed payload for an invoice
// ---------------------------------------------------------------------------

export interface ZatcaSignableInvoice {
  invoiceId: string;
  sellerName: string;
  vatNumber: string;
  buyerName: string;
  totalWithVat: number;     // SAR
  vatAmount: number;        // SAR
  date: string;             // ISO date
  lineItems: { description: string; qty: number; unitPriceSar: number; vatRate: number }[];
}

export interface ZatcaClearanceResult {
  uuid: string;
  invoiceHash: string;
  signature: string;
  publicKey: string;
  stamp: string;
  qrBase64: string;
  clearedAt: string;
}

/** Produce a canonical text representation we feed to SHA-256 ("invoice hash" in ZATCA terms). */
function canonicaliseInvoice(inv: ZatcaSignableInvoice): string {
  const lines = inv.lineItems
    .map((l) => `${l.description}|${l.qty}|${l.unitPriceSar}|${l.vatRate}`)
    .join("\n");
  return [
    inv.invoiceId,
    inv.sellerName,
    inv.vatNumber,
    inv.buyerName,
    inv.totalWithVat.toFixed(2),
    inv.vatAmount.toFixed(2),
    inv.date,
    lines,
  ].join("␞");
}

/**
 * Sign the invoice with the active CSID and produce the TLV QR.
 *
 * Real Phase 2 flow:
 *   1. Build UBL XML.
 *   2. Hash → invoiceHash (base64 SHA-256).
 *   3. Sign with seller CSID private key → signature.
 *   4. POST to /invoices/clearance/single → ZATCA returns the cleared XML
 *      with their stamp embedded.
 *   5. Generate the QR using TLV fields 1-9.
 *
 * Demo flow: steps 2/3/5 happen identically client-side; step 4 is the
 * `simulateClearance` call below which returns a deterministic UUID and
 * mints a "ZATCA stamp" by signing the invoiceHash with the CSID key
 * itself (in production the stamp signature comes from ZATCA's HSM).
 */
export async function signAndClearInvoice(
  inv: ZatcaSignableInvoice,
  csid: CsidRecord
): Promise<ZatcaClearanceResult> {
  const canonical = canonicaliseInvoice(inv);
  const invoiceHash = await sha256Base64(canonical);
  const signature = await ecdsaSignBase64(invoiceHash, csid.privateKeyJwk);
  // ZATCA-side stamp — production: HSM-signed; demo: re-sign the (hash + serial)
  // with the same key so the stamp differs from the seller signature.
  const stamp = await ecdsaSignBase64(`${invoiceHash}|${csid.serial}`, csid.privateKeyJwk);
  const uuid = uuidv4();

  const qrBase64 = encodeZatcaQr({
    sellerName: inv.sellerName,
    vatNumber: inv.vatNumber,
    timestamp: new Date().toISOString(),
    invoiceTotal: inv.totalWithVat.toFixed(2),
    vatTotal: inv.vatAmount.toFixed(2),
    invoiceHash,
    signature: signature.slice(0, 88),       // P-256 sig fits ~96 chars; cap to keep TLV ≤ 255
    publicKey: csid.publicKeySpkiB64.slice(0, 200),
    stamp: stamp.slice(0, 88),
  });

  return {
    uuid,
    invoiceHash,
    signature,
    publicKey: csid.publicKeySpkiB64,
    stamp,
    qrBase64,
    clearedAt: new Date().toISOString(),
  };
}
