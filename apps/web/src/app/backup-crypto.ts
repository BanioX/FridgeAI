/**
 * Password protection for the full backup (ADR-0087). WebCrypto only, nothing leaves the device:
 * PBKDF2-SHA-256 (600000 rounds, random 16-byte salt) turns the password into an AES-GCM 256-bit
 * key; every file gets a fresh 12-byte IV. The result is a small JSON envelope around the base64
 * ciphertext. It lives in `apps/web` because WebCrypto is a runtime API (core stays pure).
 */

export const ENCRYPTED_FORMAT = 'rettich-encrypted';
export const MIN_PASSWORD_LENGTH = 8;
const ITERATIONS = 600_000;
/** Upper bound for files from elsewhere: a huge count would freeze the tab. */
const MAX_ITERATIONS = 5_000_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface EncryptedBackup {
  format: typeof ENCRYPTED_FORMAT;
  version: 1;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  cipher: { name: 'AES-GCM'; iv: string };
  data: string;
}

/** Wrong password, or the file was changed: AES-GCM cannot tell the two apart. */
export class WrongPasswordError extends Error {
  constructor() {
    super('wrong password or damaged backup');
    this.name = 'WrongPasswordError';
  }
}

/** The envelope itself is malformed (not the password). */
export class InvalidEnvelopeError extends Error {
  constructor() {
    super('invalid encrypted backup');
    this.name = 'InvalidEnvelopeError';
  }
}

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  // Chunks keep `fromCharCode` below the argument limit for large backups.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

const fromBase64 = (text: string): Uint8Array<ArrayBuffer> => {
  try {
    return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
  } catch {
    throw new InvalidEnvelopeError();
  }
};

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  // NFC: the same password typed on another device must give the same bytes.
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password.normalize('NFC')),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypts the backup text and returns the envelope as JSON text. */
export async function encryptBackup(plain: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, ITERATIONS);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  );
  const envelope: EncryptedBackup = {
    format: ENCRYPTED_FORMAT,
    version: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: toBase64(salt) },
    cipher: { name: 'AES-GCM', iv: toBase64(iv) },
    data: toBase64(new Uint8Array(encrypted)),
  };
  return `${JSON.stringify(envelope, null, 2)}\n`;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * What a parsed file is: a valid envelope, a damaged one (it says it is encrypted but is not
 * usable), or something else (an ordinary export, handled as before).
 */
export function readEnvelope(json: unknown): EncryptedBackup | 'invalid' | 'plain' {
  if (!isRecord(json) || json.format !== ENCRYPTED_FORMAT) {
    return 'plain';
  }
  const { kdf, cipher, data } = json;
  if (
    json.version !== 1 ||
    !isRecord(kdf) ||
    !isRecord(cipher) ||
    kdf.name !== 'PBKDF2' ||
    kdf.hash !== 'SHA-256' ||
    typeof kdf.iterations !== 'number' ||
    !Number.isInteger(kdf.iterations) ||
    kdf.iterations < 1 ||
    kdf.iterations > MAX_ITERATIONS ||
    typeof kdf.salt !== 'string' ||
    cipher.name !== 'AES-GCM' ||
    typeof cipher.iv !== 'string' ||
    typeof data !== 'string'
  ) {
    return 'invalid';
  }
  try {
    if (fromBase64(kdf.salt).length !== SALT_BYTES || fromBase64(cipher.iv).length !== IV_BYTES) {
      return 'invalid';
    }
    fromBase64(data);
  } catch {
    return 'invalid';
  }
  return {
    format: ENCRYPTED_FORMAT,
    version: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: kdf.iterations, salt: kdf.salt },
    cipher: { name: 'AES-GCM', iv: cipher.iv },
    data,
  };
}

/** Returns the original backup text; throws `WrongPasswordError` if it does not open. */
export async function decryptBackup(envelope: EncryptedBackup, password: string): Promise<string> {
  const salt = fromBase64(envelope.kdf.salt);
  const iv = fromBase64(envelope.cipher.iv);
  const data = fromBase64(envelope.data);
  const key = await deriveKey(password, salt, envelope.kdf.iterations);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder('utf-8', { fatal: true }).decode(plain);
  } catch {
    throw new WrongPasswordError();
  }
}
