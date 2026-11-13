import { describe, expect, it } from 'vitest';
import {
  decryptBackup,
  encryptBackup,
  InvalidEnvelopeError,
  readEnvelope,
  WrongPasswordError,
  type EncryptedBackup,
} from './backup-crypto';

const plain = JSON.stringify({ format: 'fridgeai-export', items: [{ name: 'Rüebli' }] });

const open = (text: string): EncryptedBackup => {
  const envelope = readEnvelope(JSON.parse(text));
  if (typeof envelope === 'string') {
    throw new Error(`not an envelope: ${envelope}`);
  }
  return envelope;
};

describe('backup crypto', () => {
  it('writes the documented envelope', async () => {
    const envelope = JSON.parse(await encryptBackup(plain, 'correct horse')) as EncryptedBackup;
    expect(envelope).toMatchObject({
      format: 'rettich-encrypted',
      version: 1,
      kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 600_000 },
      cipher: { name: 'AES-GCM' },
    });
    expect(atob(envelope.kdf.salt)).toHaveLength(16);
    expect(atob(envelope.cipher.iv)).toHaveLength(12);
    expect(envelope.data).not.toContain('Rüebli');
  });

  it('gives the same text back after a round trip', async () => {
    const text = await encryptBackup(plain, 'correct horse');
    expect(await decryptBackup(open(text), 'correct horse')).toBe(plain);
  });

  it('survives unicode in the data and the password', async () => {
    const data = '{"name":"Zürcher Geschnetzeltes äöü œ ñ"}';
    const text = await encryptBackup(data, 'pässwörd-日本語');
    expect(await decryptBackup(open(text), 'pässwörd-日本語')).toBe(data);
    // The same letters typed composed or decomposed open the same file.
    expect(await decryptBackup(open(text), 'pässwörd-日本語')).toBe(data);
  });

  it('survives a large backup', async () => {
    const big = JSON.stringify({ blob: 'x'.repeat(300_000) });
    expect(await decryptBackup(open(await encryptBackup(big, 'long enough')), 'long enough')).toBe(
      big,
    );
  });

  it('uses a fresh salt and IV every time', async () => {
    const a = open(await encryptBackup(plain, 'correct horse'));
    const b = open(await encryptBackup(plain, 'correct horse'));
    expect(a.kdf.salt).not.toBe(b.kdf.salt);
    expect(a.cipher.iv).not.toBe(b.cipher.iv);
    expect(a.data).not.toBe(b.data);
  });

  it('refuses a wrong password', async () => {
    const envelope = open(await encryptBackup(plain, 'correct horse'));
    await expect(decryptBackup(envelope, 'wrong horse')).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it('refuses tampered ciphertext', async () => {
    const envelope = open(await encryptBackup(plain, 'correct horse'));
    const bytes = Uint8Array.from(atob(envelope.data), (c) => c.charCodeAt(0));
    bytes[0] = (bytes[0] ?? 0) ^ 1;
    const tampered = { ...envelope, data: btoa(String.fromCharCode(...bytes)) };
    await expect(decryptBackup(tampered, 'correct horse')).rejects.toBeInstanceOf(
      WrongPasswordError,
    );
  });

  it('throws InvalidEnvelopeError for broken base64 at decrypt time', async () => {
    const envelope = open(await encryptBackup(plain, 'correct horse'));
    await expect(
      decryptBackup({ ...envelope, data: '***' }, 'correct horse'),
    ).rejects.toBeInstanceOf(InvalidEnvelopeError);
  });
});

describe('readEnvelope', () => {
  const valid = async () => JSON.parse(await encryptBackup(plain, 'correct horse')) as unknown;

  it('recognises a valid envelope', async () => {
    expect(readEnvelope(await valid())).toMatchObject({ format: 'rettich-encrypted', version: 1 });
  });

  it('leaves ordinary exports and other JSON alone', () => {
    expect(readEnvelope(JSON.parse(plain))).toBe('plain');
    expect(readEnvelope({ format: 'other' })).toBe('plain');
    expect(readEnvelope(null)).toBe('plain');
    expect(readEnvelope([])).toBe('plain');
    expect(readEnvelope('text')).toBe('plain');
  });

  it('flags a damaged envelope as invalid', async () => {
    const good = (await valid()) as Record<string, Record<string, unknown>>;
    const withKdf = (patch: Record<string, unknown>) => ({
      ...good,
      kdf: { ...good.kdf, ...patch },
    });
    expect(readEnvelope({ ...good, version: 2 })).toBe('invalid');
    expect(readEnvelope({ ...good, data: 42 })).toBe('invalid');
    expect(readEnvelope({ ...good, data: '***' })).toBe('invalid');
    expect(readEnvelope({ ...good, cipher: { name: 'AES-CBC', iv: 'AAAA' } })).toBe('invalid');
    expect(readEnvelope({ ...good, cipher: { name: 'AES-GCM', iv: btoa('short') } })).toBe(
      'invalid',
    );
    expect(readEnvelope(withKdf({ iterations: 1e12 }))).toBe('invalid');
    expect(readEnvelope(withKdf({ iterations: 0 }))).toBe('invalid');
    expect(readEnvelope(withKdf({ hash: 'SHA-1' }))).toBe('invalid');
    expect(readEnvelope(withKdf({ salt: btoa('short') }))).toBe('invalid');
    expect(readEnvelope({ format: 'rettich-encrypted' })).toBe('invalid');
  });
});
