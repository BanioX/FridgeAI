import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UnlockBackup } from './UnlockBackup';

describe('UnlockBackup', () => {
  afterEach(cleanup);

  it('asks for the password of the named file, as a current password', () => {
    render(<UnlockBackup fileName="rettich.json" onUnlock={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/^rettich\.json ist mit einem Passwort geschützt\./)).toBeDefined();
    const field = screen.getByLabelText<HTMLInputElement>('Passwort');
    expect(field.type).toBe('password');
    expect(field.autocomplete).toBe('current-password');
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Öffnen' }).disabled).toBe(true);
  });

  it('shows and hides the password', async () => {
    render(<UnlockBackup fileName="a.json" onUnlock={vi.fn()} onCancel={vi.fn()} />);
    const field = screen.getByLabelText<HTMLInputElement>('Passwort');
    await userEvent.click(screen.getByRole('button', { name: 'Passwort anzeigen' }));
    expect(field.type).toBe('text');
    await userEvent.click(screen.getByRole('button', { name: 'Passwort verbergen' }));
    expect(field.type).toBe('password');
  });

  it('says calmly that the password does not fit and lets the person try again', async () => {
    const onUnlock = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    render(<UnlockBackup fileName="a.json" onUnlock={onUnlock} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Passwort'), 'falsch');
    await userEvent.click(screen.getByRole('button', { name: 'Öffnen' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Das Passwort passt nicht zu dieser Sicherung.',
    );
    expect(onUnlock).toHaveBeenLastCalledWith('falsch');
    // Typing again clears the message; a second try goes through.
    await userEvent.type(screen.getByLabelText('Passwort'), '2');
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Öffnen' }));
    expect(onUnlock).toHaveBeenLastCalledWith('falsch2');
    expect(onUnlock).toHaveBeenCalledTimes(2);
  });

  it('can be cancelled', async () => {
    const onCancel = vi.fn();
    render(<UnlockBackup fileName="a.json" onUnlock={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
