export const AUTH_STORAGE_KEY = "agrogestor.auth";

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
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAccessToken() {
  return readSession()?.accessToken ?? null;
}
