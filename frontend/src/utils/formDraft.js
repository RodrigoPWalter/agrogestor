import {
  APP_CACHE_KEY_PREFIX,
  getCurrentUserCacheScope,
} from "../auth/session";

const DRAFT_VERSION = "v1";
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function draftKey(name, scope) {
  return `${APP_CACHE_KEY_PREFIX}${scope}:draft:${name}:${DRAFT_VERSION}`;
}

export function readFormDraft(
  name,
  now = Date.now(),
  scope = getCurrentUserCacheScope(),
) {
  if (typeof window === "undefined" || scope === "anonymous") return null;

  try {
    const saved = JSON.parse(
      window.localStorage.getItem(draftKey(name, scope)),
    );
    const savedAt = new Date(saved?.savedAt).getTime();

    if (!saved?.value || !Number.isFinite(savedAt)) {
      return null;
    }

    if (now - savedAt > MAX_DRAFT_AGE_MS) {
      clearFormDraft(name, scope);
      return null;
    }

    return saved.value;
  } catch {
    return null;
  }
}

export function writeFormDraft(
  name,
  value,
  scope = getCurrentUserCacheScope(),
) {
  if (typeof window === "undefined" || scope === "anonymous") return;

  try {
    window.localStorage.setItem(
      draftKey(name, scope),
      JSON.stringify({ value, savedAt: new Date().toISOString() }),
    );
  } catch {
    // O rascunho ajuda no celular, mas nunca deve impedir um lançamento.
  }
}

export function clearFormDraft(name, scope = getCurrentUserCacheScope()) {
  if (typeof window === "undefined" || scope === "anonymous") return;

  try {
    window.localStorage.removeItem(draftKey(name, scope));
  } catch {
    // Sem ação: o armazenamento pode estar bloqueado pelo navegador.
  }
}
