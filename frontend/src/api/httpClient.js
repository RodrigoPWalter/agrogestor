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
    if (error.response) {
      markApiReachable();
    } else {
      markApiUnavailable();
    }

    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new Error(
          "O servidor demorou para responder. Antes de repetir um lançamento, confira se ele apareceu na lista.",
        ),
      );
    }

    if (!error.response && navigator.onLine === false) {
      return Promise.reject(
        new Error(
          "Sem internet. Os dados não foram enviados; conecte-se e tente novamente.",
        ),
      );
    }

    if (!error.response) {
      return Promise.reject(
        new Error(
          "O servidor não respondeu e pode estar iniciando. Aguarde alguns instantes e tente novamente.",
        ),
      );
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

    return Promise.reject(
      new Error(
        fieldMessage ||
          response?.data?.message ||
          "Não foi possível concluir a operação.",
      ),
    );
  },
);
