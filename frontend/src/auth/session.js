export const AUTH_STORAGE_KEY = "agrogestor.auth";
export const APP_CACHE_KEY_PREFIX = "agrogestor:cache:";
const LEGACY_CACHE_KEYS = ["agrogestor:dashboard-cache:v1"];

function hasValidShape(session) {
  return (
    typeof session?.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session?.expiresAt === "number" &&
    typeof session?.user?.email === "string"
  );
}

export function readSession() {
  try {
    const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedSession) {
      return null;
    }

    const session = JSON.parse(storedSession);
    if (!hasValidShape(session) || session.expiresAt <= Date.now()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  clearAppCache();
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAccessToken() {
  return readSession()?.accessToken ?? null;
}

export function getCurrentUserCacheScope() {
  return readSession()?.user.email.toLowerCase() ?? "anonymous";
}

export function buildUserCacheKey(name) {
  return `${APP_CACHE_KEY_PREFIX}${getCurrentUserCacheScope()}:${name}`;
}

export function clearAppCache() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(APP_CACHE_KEY_PREFIX))
    .forEach((key) => localStorage.removeItem(key));

  LEGACY_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
}
