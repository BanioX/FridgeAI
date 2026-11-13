import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserDeviceUnlock, fromBase64Url, toBase64Url } from './browser-device-unlock';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('browserDeviceUnlock', () => {
  it('encodes ids as base64url and back', () => {
    const bytes = new Uint8Array([251, 255, 254, 0, 1, 2]);
    const text = toBase64Url(bytes.buffer);
    expect(text).toBe('-__-AAEC');
    expect([...fromBase64Url(text)]).toEqual([...bytes]);
  });

  it('is not available without WebAuthn or without a platform authenticator', async () => {
    expect(await browserDeviceUnlock.isAvailable()).toBe(false);
    vi.stubGlobal('PublicKeyCredential', {
      isUserVerifyingPlatformAuthenticatorAvailable: () => Promise.resolve(false),
    });
    expect(await browserDeviceUnlock.isAvailable()).toBe(false);
    vi.stubGlobal('PublicKeyCredential', {
      isUserVerifyingPlatformAuthenticatorAvailable: () => Promise.resolve(true),
    });
    expect(await browserDeviceUnlock.isAvailable()).toBe(true);
  });

  it('creates a platform credential that needs the owner and keeps nothing remote', async () => {
    const create = vi.fn(() => Promise.resolve({ rawId: new Uint8Array([1, 2, 3]).buffer }));
    vi.stubGlobal('navigator', { credentials: { create } });
    expect(await browserDeviceUnlock.register()).toBe('AQID');
    const calls = create.mock.calls as unknown as [
      { publicKey: PublicKeyCredentialCreationOptions },
    ][];
    const options = calls[0]?.[0].publicKey;
    expect(options?.authenticatorSelection).toEqual({
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'discouraged',
    });
    expect(options?.attestation).toBe('none');
    expect(options?.pubKeyCredParams.map((param) => param.alg)).toEqual([-7, -257]);
  });

  it('asks for exactly the stored credential and maps a «no» to cancelled', async () => {
    const get = vi.fn(() => Promise.reject(new DOMException('no', 'NotAllowedError')));
    vi.stubGlobal('navigator', { credentials: { get } });
    await expect(browserDeviceUnlock.verify('AQID')).rejects.toMatchObject({ kind: 'cancelled' });
    const calls = get.mock.calls as unknown as [{ publicKey: PublicKeyCredentialRequestOptions }][];
    const options = calls[0]?.[0].publicKey;
    expect(options?.userVerification).toBe('required');
    expect(
      options?.allowCredentials?.map((entry) => [...new Uint8Array(entry.id as ArrayBuffer)]),
    ).toEqual([[1, 2, 3]]);
  });

  it('maps anything else to failed', async () => {
    vi.stubGlobal('navigator', { credentials: { get: () => Promise.resolve(null) } });
    await expect(browserDeviceUnlock.verify('AQID')).rejects.toMatchObject({ kind: 'failed' });
  });
});
