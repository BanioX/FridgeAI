import { Info } from 'lucide-react';
import { Fragment } from 'react';
import { messages } from '../app/messages.de-CH';

/** In running text, `{i}` stands for the info mark of «Im Blick» (ADR-0073). */
export const INFO_MARK = '{i}';

/**
 * Running text that names the info mark: each `{i}` becomes the same circled i as after a name in
 * the lists, inline and as tall as the letters, with a name for screen readers. Alban, 13.11.2026:
 * «das Info i nicht in Klammern, sondern als eigenes Kreiszeichen».
 */
export function TextWithMarks({ text }: { text: string }) {
  const parts = text.split(INFO_MARK);
  return (
    <>
      {parts.map((part, index) => (
        // The parts never move or change order, so their position is a stable key.
        <Fragment key={index}>
          {index === 0 ? null : (
            <span
              role="img"
              aria-label={messages.attention.mark}
              className="inline-block align-[-0.125em]"
            >
              <Info size="1em" aria-hidden="true" />
            </span>
          )}
          {part}
        </Fragment>
      ))}
    </>
  );
}
