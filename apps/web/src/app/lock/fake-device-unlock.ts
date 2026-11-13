import { DeviceUnlockError, type DeviceUnlock, type DeviceUnlockFailure } from './device-unlock';

/** A device for tests: the owner says yes or no, and every call is recorded. */
export class FakeDeviceUnlock implements DeviceUnlock {
  available = true;
  /** `null`: the owner unlocks; otherwise the next calls fail like this. */
  failWith: DeviceUnlockFailure | null = null;
  registered = 0;
  verified: string[] = [];

  isAvailable(): Promise<boolean> {
    return Promise.resolve(this.available);
  }

  register(): Promise<string> {
    if (this.failWith !== null) {
      return Promise.reject(new DeviceUnlockError(this.failWith));
    }
    this.registered += 1;
    return Promise.resolve(`credential-${this.registered}`);
  }

  verify(credentialId: string): Promise<void> {
    if (this.failWith !== null) {
      return Promise.reject(new DeviceUnlockError(this.failWith));
    }
    this.verified.push(credentialId);
    return Promise.resolve();
  }
}
