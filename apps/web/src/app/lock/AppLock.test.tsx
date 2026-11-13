import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppLockGate, AppLockProvider } from './AppLock';
import { FakeDeviceUnlock } from './fake-device-unlock';
import { useAppLock } from './lock-context';
import { readLockSettings } from './lock-settings';
import { AppLockSection } from '../../features/household/AppLockSection';
import { messages } from '../messages.de-CH';

const t = messages.appLock;
let clock = 0;
let device: FakeDeviceUnlock;

function setVisibility(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

/** The app as main.tsx wires it, with the setting next to a stand-in for the app content. */
function renderApp() {
  render(
    <AppLockProvider unlock={device} now={() => clock}>
      <AppLockGate>
        <p>App content</p>
        <AppLockSection />
        <Probe />
      </AppLockGate>
    </AppLockProvider>,
  );
}

function Probe() {
  const { after, enabled } = useAppLock();
  return <output aria-label="state">{`${String(enabled)} ${after}`}</output>;
}

/** Sends the app to the background for `ms` and back. */
function away(ms: number) {
  act(() => {
    setVisibility('hidden');
  });
  clock += ms;
  act(() => {
    setVisibility('visible');
  });
}

const toggle = () => screen.findByRole('switch', { name: t.switchLabel });

/** The app content is on screen: present and not inside the hidden part of a later lock. */
function contentShown(): boolean {
  const content = screen.queryByText('App content');
  return content !== null && content.closest('[hidden]') === null;
}

async function switchOn() {
  await userEvent.click(await toggle());
  await screen.findByText(t.switchedOn);
}

describe('app lock', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clock = 1_000;
    device = new FakeDeviceUnlock();
  });
  afterEach(() => {
    cleanup();
    setVisibility('visible');
  });

  it('is off by default: the app is open and nothing was asked of the device', async () => {
    renderApp();
    expect(await toggle()).toHaveProperty('ariaChecked', 'false');
    expect(screen.getByText('App content')).toBeTruthy();
    expect(device.registered).toBe(0);
  });

  it('turning it on creates a credential and keeps it on this device, one minute by default', async () => {
    renderApp();
    await switchOn();
    expect(device.registered).toBe(1);
    expect(readLockSettings()).toEqual({ credentialId: 'credential-1', after: '1m' });
    expect(screen.getByText('App content')).toBeTruthy();
    expect((await screen.findByLabelText('state')).textContent).toBe('true 1m');
  });

  it('stays off when the owner cancels', async () => {
    device.failWith = 'cancelled';
    renderApp();
    await userEvent.click(await toggle());
    await screen.findByText(t.problem.cancelled);
    expect(readLockSettings()).toBeNull();
    expect(screen.getByRole('switch', { name: t.switchLabel }).ariaChecked).toBe('false');
  });

  it('is shown disabled with a reason when the device cannot verify its owner', async () => {
    device.available = false;
    renderApp();
    expect(await screen.findByText(t.unavailable)).toBeTruthy();
    expect((await toggle()).hasAttribute('disabled')).toBe(true);
  });

  it('starts locked and renders none of the app content', () => {
    window.localStorage.setItem(
      'fridgeai:app-lock',
      JSON.stringify({ credentialId: 'abc', after: '5m' }),
    );
    renderApp();
    expect(screen.getByRole('heading', { level: 1, name: t.lockedTitle })).toBeTruthy();
    expect(screen.queryByText('App content')).toBeNull();
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('locks only after the chosen time in the background', async () => {
    renderApp();
    await switchOn();
    away(59_000);
    expect(screen.getByText('App content')).toBeTruthy();
    away(60_000);
    expect(screen.getByRole('heading', { name: t.lockedTitle })).toBeTruthy();
    expect(contentShown()).toBe(false);
  });

  it('«Sofort» locks on every return, «5 Minuten» waits longer', async () => {
    renderApp();
    await switchOn();
    await userEvent.click(screen.getByRole('radio', { name: t.after5m, hidden: true }));
    expect(readLockSettings()?.after).toBe('5m');
    away(240_000);
    expect(screen.getByText('App content')).toBeTruthy();
    await userEvent.click(screen.getByRole('radio', { name: t.afterNow, hidden: true }));
    away(0);
    expect(contentShown()).toBe(false);
  });

  it('unlocks after the device confirms, and stays locked after a cancel', async () => {
    window.localStorage.setItem(
      'fridgeai:app-lock',
      JSON.stringify({ credentialId: 'abc', after: '1m' }),
    );
    renderApp();
    device.failWith = 'cancelled';
    await userEvent.click(screen.getByRole('button', { name: t.unlock }));
    expect((await screen.findByRole('status')).textContent).toBe(t.problem.cancelled);
    expect(contentShown()).toBe(false);

    device.failWith = null;
    await userEvent.click(screen.getByRole('button', { name: t.unlock }));
    await screen.findByText('App content');
    expect(device.verified).toEqual(['abc']);
  });

  it('«Sperre neu einrichten» replaces the credential and unlocks', async () => {
    window.localStorage.setItem(
      'fridgeai:app-lock',
      JSON.stringify({ credentialId: 'lost', after: '5m' }),
    );
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: t.resetup }));
    await screen.findByText('App content');
    expect(readLockSettings()).toEqual({ credentialId: 'credential-1', after: '5m' });
  });

  it('switching off needs a successful unlock first', async () => {
    renderApp();
    await switchOn();
    device.failWith = 'failed';
    await userEvent.click(await toggle());
    await screen.findByText(t.problem.failed);
    expect(readLockSettings()).not.toBeNull();

    device.failWith = null;
    await userEvent.click(await toggle());
    await screen.findByText(t.switchedOff);
    expect(device.verified).toEqual(['credential-1']);
    expect(readLockSettings()).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole('switch').ariaChecked).toBe('false');
    });
  });

  it('keeps work in progress through a lock in the background', async () => {
    window.localStorage.setItem(
      'fridgeai:app-lock',
      JSON.stringify({ credentialId: 'abc', after: '1m' }),
    );
    render(
      <AppLockProvider unlock={device} now={() => clock}>
        <AppLockGate>
          <label>
            Notiz
            <input />
          </label>
        </AppLockGate>
      </AppLockProvider>,
    );
    const unlock = () =>
      userEvent.click(screen.getByRole('button', { name: new RegExp(t.unlock) }));
    await unlock();
    await userEvent.type(await screen.findByRole('textbox', { name: 'Notiz' }), 'halb fertig');
    away(60_000);
    expect(screen.queryByRole('textbox', { name: 'Notiz' })).toBeNull();
    await unlock();
    expect(await screen.findByRole('textbox', { name: 'Notiz' })).toHaveProperty(
      'value',
      'halb fertig',
    );
  });
});
