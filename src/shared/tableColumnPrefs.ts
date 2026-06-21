export function loadVisibleColumnKeys(storageKey: string, allKeys: string[]): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set(allKeys);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set(allKeys);
    const valid = parsed.filter((key): key is string => typeof key === "string" && allKeys.includes(key));
    return valid.length > 0 ? new Set(valid) : new Set(allKeys);
  } catch {
    return new Set(allKeys);
  }
}

export function saveVisibleColumnKeys(storageKey: string, visibleKeys: string[]) {
  localStorage.setItem(storageKey, JSON.stringify(visibleKeys));
}

export function filterColumnsByKey<T extends { key: string }>(
  columns: T[],
  visibleKeys: Set<string>
): T[] {
  return columns.filter((column) => visibleKeys.has(column.key));
}
