import { buildUserCacheKey } from "../auth/session";

const DASHBOARD_CACHE_NAME = "dashboard:v1";

export function getDashboardCacheKey() {
  return buildUserCacheKey(DASHBOARD_CACHE_NAME);
}

export function readDashboardCache(cacheKey = getDashboardCacheKey()) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawCache = window.localStorage.getItem(cacheKey);
    return rawCache ? JSON.parse(rawCache) : null;
  } catch {
    return null;
  }
}

export function writeDashboardCache(
  nextCache,
  cacheKey = getDashboardCacheKey(),
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const currentCache = readDashboardCache(cacheKey) ?? {};
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        ...currentCache,
        ...nextCache,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Cache é conveniência; se o navegador não aceitar, o app segue funcionando online.
  }
}

export function isSameLocalDay(dateValue) {
  if (!dateValue) {
    return false;
  }

  const checkedDate = new Date(dateValue);
  const today = new Date();

  return (
    checkedDate.getFullYear() === today.getFullYear() &&
    checkedDate.getMonth() === today.getMonth() &&
    checkedDate.getDate() === today.getDate()
  );
}
