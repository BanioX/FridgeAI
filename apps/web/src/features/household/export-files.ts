import type { LocalDate } from '@fridgeai/core';

/** «rettich-2026-11-06.json»: the date tells exports apart. */
export const exportFileName = (today: LocalDate, extension: 'json') =>
  `rettich-${today}.${extension}`;

/** Hands a file to the browser's download (no server involved). */
export function saveFile(name: string, type: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the URL goes away.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
