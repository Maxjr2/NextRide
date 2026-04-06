/** Minimal class name combiner — avoids a full clsx dependency. */
export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
