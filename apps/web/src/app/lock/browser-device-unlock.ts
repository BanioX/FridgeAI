import { DeviceUnlockError, type DeviceUnlock } from './device-unlock';

const TIMEOUT_MS = 60_000;

const randomBytes = (length: number): Uint8Array<ArrayBuffer> =>
  crypto.getRandomValues(new Uint8Array(length));

export function toBase64Url(bytes: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/** Saying no, closing the sheet or letting it time out all arrive as these two errors. */
function failure(error: unknown): DeviceUnlockError {
  const name = error instanceof DOMException ? error.name : '';
  return new DeviceUnlockError(
    name === 'NotAllowedError' || name === 'AbortError' ? 'cancelled' : 'failed',
  );
}

async function isAvailable(): Promise<boolean> {
  try {
    return (
      typeof PublicKeyCredential !== 'undefined' &&
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function' &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

async function register(): Promise<string> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        rp: { name: 'Rettich' },
        user: { id: randomBytes(16), name: 'Rettich', displayName: 'Rettich' },
        challenge: randomBytes(32),
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged',
        },
        attestation: 'none',
        timeout: TIMEOUT_MS,
      },
    });
    if (credential === null) {
      throw new DeviceUnlockError('failed');
    }
    return toBase64Url((credential as PublicKeyCredential).rawId);
  } catch (error) {
    throw error instanceof DeviceUnlockError ? error : failure(error);
  }
}

async function verify(credentialId: string): Promise<void> {
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        allowCredentials: [{ type: 'public-key', id: fromBase64Url(credentialId) }],
        userVerification: 'required',
        timeout: TIMEOUT_MS,
      },
    });
    if (assertion === null) {
      throw new DeviceUnlockError('failed');
    }
  } catch (error) {
    throw error instanceof DeviceUnlockError ? error : failure(error);
  }
}

/** The real thing: WebAuthn with the platform authenticator. */
export const browserDeviceUnlock: DeviceUnlock = { isAvailable, register, verify };
