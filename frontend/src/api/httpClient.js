import axios from "axios";
import { getAccessToken } from "../auth/session";
import { markApiReachable, markApiUnavailable } from "./connectionStatus";

export const AUTH_EXPIRED_EVENT = "agrogestor:auth-expired";
const apiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
const requestTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 60_000;

export const httpClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: requestTimeout,
  headers: {
    Accept: "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    markApiReachable();
    return response;
  },
  (error) => {
    const loginRequest = error.config?.url?.includes("/api/v1/auth/login");
    if (error.response) {
      markApiReachable();
    } else {
      markApiUnavailable();
    }

    if (error.code === "ECONNABORTED") {
      const timeoutError = new Error(
        loginRequest
          ? "O servidor demorou para responder. Aguarde e tente entrar novamente."
          : "O servidor demorou para responder. O lançamento será sincronizado automaticamente.",
      );
      timeoutError.offlineEligible = !loginRequest;
      return Promise.reject(timeoutError);
    }

    if (!error.response && navigator.onLine === false) {
      const offlineError = new Error(
        loginRequest
          ? "É preciso estar conectado para fazer o primeiro acesso neste aparelho."
          : "Sem internet. O lançamento ficará salvo neste aparelho.",
      );
      offlineError.offlineEligible = !loginRequest;
      return Promise.reject(offlineError);
    }

    if (!error.response) {
      const unavailableError = new Error(
        loginRequest
          ? "O servidor não respondeu e pode estar iniciando. Aguarde e tente novamente."
          : "O servidor não respondeu. O lançamento ficará aguardando sincronização.",
      );
      unavailableError.offlineEligible = !loginRequest;
      return Promise.reject(unavailableError);
    }

    const response = error.response;
    const fieldMessage = response?.data?.fieldErrors
      ? Object.values(response.data.fieldErrors)[0]
      : null;

    if (
      response?.status === 401 &&
      error.config?.headers?.Authorization &&
      !error.config?.url?.includes("/api/v1/auth/login")
    ) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    const responseError = new Error(
      fieldMessage ||
        response?.data?.message ||
        "Não foi possível concluir a operação.",
    );
    responseError.status = response.status;
    return Promise.reject(responseError);
  },
);
