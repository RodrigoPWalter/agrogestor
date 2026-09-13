export const AUTH_STORAGE_KEY = "agrogestor.auth";
export const APP_CACHE_KEY_PREFIX = "agrogestor:cache:";
export const OFFLINE_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const LEGACY_CACHE_KEYS = ["agrogestor:dashboard-cache:v1"];
const LEGACY_OWNER_PREFIX = "agrogestor:offline-owner:v1:";

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
    if (!hasValidShape(session)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    rememberLegacyOwner(session);

    if (session.expiresAt <= Date.now()) {
      const offlineAccessValid =
        typeof navigator !== "undefined" &&
        navigator.onLine === false &&
        session.offlineAccessUntil > Date.now();
      if (offlineAccessValid) {
        return { ...session, offlineAccess: true };
      }
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return { ...session, offlineAccess: false };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveSession(session) {
  // Preserva a identidade anterior: um novo login com o mesmo e-mail não
  // comprova que a conta é dona da fila antiga.
  try {
    rememberLegacyOwner(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)));
  } catch {
    // A falta do vínculo legado não impede o login.
  }
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ ...session, storageVersion: 2 }),
  );
}

export function clearSession() {
  // Rascunhos e lançamentos pendentes pertencem à conta, não ao token.
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAccessToken() {
  const session = readSession();
  return session && session.expiresAt > Date.now() ? session.accessToken : null;
}

export function getCurrentUserCacheScope() {
  return getUserCacheScope(readSession()?.user);
}

export function getUserCacheScope(user) {
  if (!user?.id) return "anonymous";
  return `user:${encodeURIComponent(user.id)}:property:${encodeURIComponent(user.propertyId ?? "none")}`;
}

function rememberLegacyOwner(session) {
  if (
    !hasValidShape(session) ||
    session.storageVersion === 2 ||
    !session.user.id
  )
    return;
  const key = `${LEGACY_OWNER_PREFIX}${session.user.email.toLowerCase()}`;
  const scope = getUserCacheScope(session.user);
  const previous = localStorage.getItem(key);
  localStorage.setItem(
    key,
    previous && previous !== scope ? "ambiguous" : scope,
  );
}

export function getLegacyScopesForUser(user) {
  const scope = getUserCacheScope(user);
  if (scope === "anonymous") return [];
  return Object.keys(localStorage)
    .filter(
      (key) =>
        key.startsWith(LEGACY_OWNER_PREFIX) &&
        localStorage.getItem(key) === scope,
    )
    .map((key) => key.slice(LEGACY_OWNER_PREFIX.length));
}

export function moveLocalCacheScope(previousScope, nextScope) {
  const prefix = `${APP_CACHE_KEY_PREFIX}${previousScope}:`;
  Object.keys(localStorage)
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => {
      const nextKey = `${APP_CACHE_KEY_PREFIX}${nextScope}:${key.slice(prefix.length)}`;
      // Em caso de conflito, preserva ambas as cópias para não sobrescrever rascunhos.
      if (localStorage.getItem(nextKey) === null) {
        localStorage.setItem(nextKey, localStorage.getItem(key));
        localStorage.removeItem(key);
      }
    });
}

export function captureSessionContext() {
  const session = readSession();
  return Object.freeze({
    scope: getUserCacheScope(session?.user),
    accessToken: session?.accessToken ?? null,
    expiresAt: session?.expiresAt ?? null,
  });
}

export function isSessionContextCurrent(context) {
  if (!context) return false;
  const current = captureSessionContext();
  return (
    current.scope === context.scope &&
    current.accessToken === context.accessToken
  );
}

export function assertSessionContextCurrent(context) {
  if (isSessionContextCurrent(context)) return;
  const error = new Error(
    "A conta ou sessão mudou. Atualize a tela para continuar.",
  );
  error.sessionChanged = true;
  throw error;
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
