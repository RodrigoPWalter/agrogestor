import axios from "axios";
import { getAccessToken } from "../auth/session";

export const AUTH_EXPIRED_EVENT = "agrogestor:auth-expired";
const apiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

export const httpClient = axios.create({
  baseURL: apiBaseUrl || undefined,
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
  (response) => response,
  (error) => {
    const response = error.response;
    const fieldMessage = response?.data?.fieldErrors
      ? Object.values(response.data.fieldErrors)[0]
      : null;

    if (
      response?.status === 401 &&
      getAccessToken() &&
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
