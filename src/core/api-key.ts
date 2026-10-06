// Local secret-key validation. Hand-written runtime.
//
// Secret keys are `sk_live_` or `sk_test_` followed by 40 base62 characters. The last 6 characters
// are the CRC32 (IEEE) of the preceding 34, base62-encoded and zero-padded, so a mistyped key is
// rejected before any request is sent.

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KEY = /^sk_(live|test)_([0-9A-Za-z]{40})$/;
const RANDOM_LENGTH = 34;

let table: Uint32Array | undefined;

/** CRC32 (IEEE 802.3, polynomial 0xEDB88320) of the UTF-8 bytes of `input`. */
export function crc32(input: string): number {
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of new TextEncoder().encode(input)) crc = (table[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function base62(value: number, width: number): string {
  let out = "";
  for (let v = value; v > 0; v = Math.floor(v / 62)) out = BASE62[v % 62] + out;
  return out.padStart(width, "0");
}

/** True if `key` has the secret-key format and a matching checksum. Makes no network call. */
export function isValidApiKey(key: string): boolean {
  const m = KEY.exec(key);
  const body = m?.[2];
  if (body === undefined) return false;
  return base62(crc32(body.slice(0, RANDOM_LENGTH)), 6) === body.slice(RANDOM_LENGTH);
}

/** Masked form for messages: `sk_test_...` plus the last 4 characters. Never echo a full key. */
export function maskApiKey(key: string): string {
  const prefix = key.startsWith("sk_live_") ? "sk_live_" : key.startsWith("sk_test_") ? "sk_test_" : "";
  return key.length > 12 ? `${prefix}...${key.slice(-4)}` : "(too short)";
}
