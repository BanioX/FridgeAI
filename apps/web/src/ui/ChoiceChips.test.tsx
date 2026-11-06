import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChoiceChips } from './ChoiceChips';

describe('ChoiceChips', () => {
  afterEach(cleanup);

  const options = [
    { value: 'half', label: '½' },
    { value: 'all', label: 'alles' },
  ] as const;

  it('is a labelled radio group that reports the chosen value', async () => {
    const onChange = vi.fn();
    render(<ChoiceChips legend="Wie viel?" options={options} value="all" onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Wie viel?' })).toBeDefined();
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'alles' }).checked).toBe(true);
    await userEvent.click(screen.getByRole('radio', { name: '½' }));
    expect(onChange).toHaveBeenCalledWith('half');
  });

  it('can start with nothing chosen', () => {
    render(<ChoiceChips legend="Warum?" options={options} value={null} onChange={vi.fn()} />);
    for (const radio of screen.getAllByRole<HTMLInputElement>('radio')) {
      expect(radio.checked).toBe(false);
    }
  });
});
