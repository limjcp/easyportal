const MS_PER_DAY = 86400000;
const ANNUAL_DAYS = 365;

export function isFireSafetyDue(lastUpload: string | null): boolean {
  if (!lastUpload) return true;
  const days = (Date.now() - new Date(lastUpload).getTime()) / MS_PER_DAY;
  return days >= ANNUAL_DAYS;
}

export function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getNextDueDate(lastUpload: string | null): string {
  if (!lastUpload) {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }
  const next = new Date(lastUpload);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().slice(0, 10);
}

export function isTermExpiringSoon(termEndDate: string, withinDays = 90): boolean {
  const days = (new Date(termEndDate).getTime() - Date.now()) / MS_PER_DAY;
  return days >= 0 && days <= withinDays;
}
