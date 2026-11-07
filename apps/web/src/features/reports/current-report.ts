/**
 * The report just created, for the viewer page (ADR-0030). Kept in memory only: a PDF of the
 * household's data is not stored anywhere; after a reload the viewer asks to create it again.
 */
export interface OpenReport {
  file: File;
  title: string;
}

let current: OpenReport | null = null;

export function openReport(report: OpenReport): void {
  current = report;
}

export function currentReport(): OpenReport | null {
  return current;
}
