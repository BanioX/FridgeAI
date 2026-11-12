import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DropTarget } from './drop-target';
import { SettlePots } from './SettlePots';

function renderPots(props: { disabled?: boolean; dragging?: boolean; over?: DropTarget | null }) {
  const onPick = vi.fn();
  render(
    <SettlePots
      disabled={props.disabled ?? false}
      dragging={props.dragging ?? false}
      over={props.over ?? null}
      onPick={onPick}
    />,
  );
  return onPick;
}

describe('SettlePots', () => {
  afterEach(cleanup);

  it('shows four pots in a region and tells the drop target of each', () => {
    renderPots({});
    const region = screen.getByRole('region', { name: 'Auswahl abschliessen' });
    const buttons = within(region).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Verwertet',
      'Entsorgt',
      'Verarbeiten',
      'Nachkaufen',
    ]);
    expect(buttons.map((button) => button.getAttribute('data-drop-target'))).toEqual([
      'action:eaten',
      'action:wasted',
      'action:process',
      'action:rebuy',
    ]);
  });

  it('calls the handler of the tapped pot', async () => {
    const onPick = renderPots({});
    await userEvent.click(screen.getByRole('button', { name: 'Entsorgt' }));
    await userEvent.click(screen.getByRole('button', { name: 'Verarbeiten' }));
    expect(onPick.mock.calls).toEqual([['wasted'], ['process']]);
  });

  it('is disabled while nothing is chosen or something is saved', async () => {
    const onPick = renderPots({ disabled: true });
    for (const button of screen.getAllByRole('button')) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
    await userEvent.click(screen.getByRole('button', { name: 'Verwertet' }));
    expect(onPick).not.toHaveBeenCalled();
  });

  it('shows the drop look while dragging and lifts the pot under the finger', () => {
    renderPots({ dragging: true, over: { kind: 'action', action: 'eaten' } });
    expect(screen.getByRole('button', { name: 'Entsorgt' }).className).toContain('outline-dashed');
    const lifted = screen.getByRole('button', { name: 'Verwertet' });
    expect(lifted.className).toContain('scale-105');
    expect(lifted.className).not.toContain('outline-dashed');
  });
});
