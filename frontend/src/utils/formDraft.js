import { buildUserCacheKey } from "../auth/session";

const DRAFT_VERSION = "v1";
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function draftKey(name) {
  return buildUserCacheKey(`draft:${name}:${DRAFT_VERSION}`);
}

export function readFormDraft(name, now = Date.now()) {
  if (typeof window === "undefined") return null;

  try {
    const saved = JSON.parse(window.localStorage.getItem(draftKey(name)));
    const savedAt = new Date(saved?.savedAt).getTime();

    if (!saved?.value || !Number.isFinite(savedAt)) {
      return null;
    }

    if (now - savedAt > MAX_DRAFT_AGE_MS) {
      clearFormDraft(name);
      return null;
    }

    return saved.value;
  } catch {
    return null;
  }
}

export function writeFormDraft(name, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      draftKey(name),
      JSON.stringify({ value, savedAt: new Date().toISOString() }),
    );
  } catch {
    // O rascunho ajuda no celular, mas nunca deve impedir um lançamento.
  }
}

export function clearFormDraft(name) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(draftKey(name));
  } catch {
    // Sem ação: o armazenamento pode estar bloqueado pelo navegador.
  }
}
