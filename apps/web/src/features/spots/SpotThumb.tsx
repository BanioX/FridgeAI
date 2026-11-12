import { MapPin } from 'lucide-react';

/** A spot's photo as a small rounded square, or a pin when there is none. Decorative. */
export function SpotThumb({ photo, size = 40 }: { photo?: string | undefined; size?: number }) {
  const box = { width: size, height: size };
  return photo === undefined ? (
    <span
      aria-hidden="true"
      style={box}
      className="flex shrink-0 items-center justify-center rounded-xl bg-surface-muted text-basil-700"
    >
      <MapPin size={Math.round(size / 2)} />
    </span>
  ) : (
    <img
      src={photo}
      alt=""
      style={box}
      className="shrink-0 rounded-xl border border-line bg-surface-muted object-cover"
    />
  );
}
