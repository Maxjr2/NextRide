/** Format a Date/ISO string as German long date, e.g. "Freitag, 10. April". */
export function fmtDate(d: Date | string | undefined | null): string {
  if (!d) return 'Flexibel';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Format a time slot as "10:00 – 12:00". */
export function fmtSlot(start?: string, end?: string): string {
  if (!start) return '';
  return end ? `${start} – ${end}` : start;
}

export const STATUS_LABEL: Record<string, string> = {
  open: 'Offen',
  matched: 'Angefragt',
  confirmed: 'Bestätigt',
  completed: 'Abgeschlossen',
  cancelled: 'Abgesagt',
};
