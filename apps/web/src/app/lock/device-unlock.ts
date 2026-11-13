/**
 * The app lock asks the device itself («Face ID, Touch ID or your code») through WebAuthn with
 * the platform authenticator (ADR-0086). Everything stays on the device: there is no server, and
 * nothing is verified beyond «the device owner just unlocked this device». The browser API sits
 * behind this small interface so the lock logic is testable without a browser.
 */

export type DeviceUnlockFailure = 'cancelled' | 'failed';

/** Why asking the device did not work: the person said no (or the prompt timed out) or it broke. */
export class DeviceUnlockError extends Error {
  readonly kind: DeviceUnlockFailure;

  constructor(kind: DeviceUnlockFailure) {
    super(kind);
    this.name = 'DeviceUnlockError';
    this.kind = kind;
  }
}

export interface DeviceUnlock {
  /** Whether this device can verify its owner (Face ID, Touch ID, device code). */
  isAvailable(): Promise<boolean>;
  /** Creates a credential after the owner unlocked the device; resolves to its id (base64url). */
  register(): Promise<string>;
  /** Asks the owner to unlock the device for the stored credential; rejects with `DeviceUnlockError`. */
  verify(credentialId: string): Promise<void>;
}
