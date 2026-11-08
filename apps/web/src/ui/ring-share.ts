/** Share of `part` in `part + other`, by value; by count when nothing has a value. */
export function ringShare(
  part: { rappen: number; count: number },
  other: { rappen: number; count: number },
): number {
  const value = part.rappen + other.rappen;
  if (value > 0) {
    return part.rappen / value;
  }
  const count = part.count + other.count;
  return count === 0 ? 0 : part.count / count;
}
