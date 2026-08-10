import { isOfflineResult } from "./offlineSync";

export function mutationFeedback(result, onlineMessage) {
  return isOfflineResult(result)
    ? "Salvo neste aparelho. O AgroGestor enviará automaticamente quando houver conexão."
    : onlineMessage;
}
