import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { messages } from '../messages.de-CH';
import { AppLockProvider } from './AppLock';
import { FakeDeviceUnlock } from './fake-device-unlock';
import { LockView } from './LockView';

const t = messages.appLock;

describe('LockView', () => {
  afterEach(cleanup);

  function renderView(device = new FakeDeviceUnlock()) {
    window.localStorage.setItem(
      'fridgeai:app-lock',
      JSON.stringify({ credentialId: 'abc', after: '1m' }),
    );
    render(
      <AppLockProvider unlock={device}>
        <LockView />
      </AppLockProvider>,
    );
  }

  afterEach(() => {
    window.localStorage.clear();
  });

  it('names itself, puts focus on the heading and offers both ways in', () => {
    renderView();
    const heading = screen.getByRole('heading', { level: 1, name: t.lockedTitle });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('button', { name: t.unlock })).toBeTruthy();
    expect(screen.getByText(t.unlockHint)).toBeTruthy();
    expect(screen.getByRole('button', { name: t.resetup })).toBeTruthy();
  });

  it('says calmly when it did not work and allows another try', async () => {
    const device = new FakeDeviceUnlock();
    device.failWith = 'failed';
    renderView(device);
    await userEvent.click(screen.getByRole('button', { name: t.unlock }));
    expect((await screen.findByRole('status')).textContent).toBe(t.problem.failed);
    expect(screen.getByRole('button', { name: t.unlock }).hasAttribute('disabled')).toBe(false);
  });
});
