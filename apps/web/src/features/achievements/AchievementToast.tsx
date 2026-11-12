import { useEffect, useRef, useState } from 'react';
import { messages } from '../../app/messages.de-CH';
import { useAchievements } from './use-achievements';

const TOAST_MS = 5000;

/**
 * A calm note when a tier newly appears («Neues Abzeichen: Resteküche.»): compared with the last
 * state known in memory during this session, so nothing is stored and nothing is announced for
 * what was already there when the app opened. No sound, no confetti.
 */
export function AchievementToast() {
  const views = useAchievements();
  const known = useRef<Map<string, number> | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (views === undefined) {
      return;
    }
    const before = known.current;
    known.current = new Map(views.map((view) => [view.id, view.state.tier]));
    if (before === null) {
      return;
    }
    const added = views.filter((view) => view.state.tier > (before.get(view.id) ?? 0));
    if (added.length > 0) {
      setText(messages.achievements.toast(added.map((view) => view.name).join(', ')));
    }
  }, [views]);

  useEffect(() => {
    if (text === '') {
      return;
    }
    const timer = window.setTimeout(() => {
      setText('');
    }, TOAST_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [text]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(8.5rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-xl px-4">
      <div
        role="status"
        className="pointer-events-auto rounded-2xl bg-onyx px-4 py-3 font-semibold text-white shadow-card empty:hidden"
      >
        {text === '' ? null : text}
      </div>
    </div>
  );
}
