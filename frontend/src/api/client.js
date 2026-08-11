import { httpClient } from "./httpClient";
import { getCurrentUserCacheScope } from "../auth/session";
import {
  getCachedResponse,
  putCachedResponse,
} from "../offline/offlineStorage";
import { queueMutation } from "../offline/offlineSync";

const JSON_HEADERS = { "Content-Type": "application/json" };
const DEFAULT_PAGE_SIZE = 100;

async function readCachedResponse(path) {
  try {
    return await getCachedResponse(getCurrentUserCacheScope(), path);
  } catch {
    return null;
  }
}

async function cacheResponse(path, data) {
  try {
    await putCachedResponse(getCurrentUserCacheScope(), path, data);
  } catch {
    // O cache melhora o uso no campo, mas nunca deve invalidar dados recebidos da API.
  }
}

function createRequestId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  const values = globalThis.crypto.getRandomValues(new Uint8Array(16));
  values[6] = (values[6] & 0x0f) | 0x40;
  values[8] = (values[8] & 0x3f) | 0x80;
  const hex = [...values].map((value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

async function request(path, options = {}) {
  const { body, data, offline = true, ...config } = options;
  const method = (config.method || "GET").toUpperCase();
  const requestData = data ?? (body ? JSON.parse(body) : undefined);
  const isMutation = method !== "GET" && method !== "HEAD";
  const requestId = isMutation && offline ? createRequestId() : null;
  const requestConfig = {
    url: path,
    ...config,
    data: requestData,
  };
  if (requestId) {
    requestConfig.headers = {
      ...config.headers,
      "X-Idempotency-Key": requestId,
    };
  }

  if (requestId && navigator.onLine === false) {
    return queueMutation({
      id: requestId,
      url: path,
      method,
      data: requestData,
      headers: config.headers,
    });
  }

  let response;
  try {
    response = await httpClient.request(requestConfig);
  } catch (error) {
    if (method === "GET" && error.offlineEligible) {
      const cached = await readCachedResponse(path);
      if (cached !== null) return cached;
      error.offlineCacheMiss = true;
      error.message =
        "Os dados desta tela ainda não foram salvos neste aparelho. Conecte-se uma vez para carregá-los.";
    }
    if (requestId && error.offlineEligible) {
      return queueMutation({
        id: requestId,
        url: path,
        method,
        data: requestData,
        headers: config.headers,
      });
    }
    throw error;
  }

  const responseData = response.status === 204 ? null : response.data;
  if (method === "GET") {
    await cacheResponse(path, responseData);
  }
  return responseData;
}

function withQueryParams(path, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const separator = path.includes("?") ? "&" : "?";
  return query.size > 0 ? `${path}${separator}${query.toString()}` : path;
}

async function requestAllPages(path, params = {}) {
  const firstPage = await request(
    withQueryParams(path, {
      ...params,
      page: 0,
      size: DEFAULT_PAGE_SIZE,
    }),
  );

  if (!firstPage || firstPage.totalPages <= 1) {
    return firstPage;
  }

  const remainingRequests = Array.from(
    { length: firstPage.totalPages - 1 },
    (_, index) =>
      request(
        withQueryParams(path, {
          ...params,
          page: index + 1,
          size: DEFAULT_PAGE_SIZE,
        }),
      ),
  );
  const remainingPages = await Promise.all(remainingRequests);
  const content = [
    ...firstPage.content,
    ...remainingPages.flatMap((page) => page.content),
  ];

  return {
    ...firstPage,
    content,
    size: content.length,
    totalElements: content.length,
    totalPages: 1,
    last: true,
  };
}

export const api = {
  getDashboardSummary: () => request("/api/v1/dashboard"),
  login: (credentials) =>
    request("/api/v1/auth/login", {
      method: "POST",
      data: credentials,
      offline: false,
    }),
  updateProfile: (data) =>
    request("/api/v1/auth/profile", {
      method: "PUT",
      data,
      offline: false,
    }),
  getUsers: () => request("/api/v1/users"),
  createUser: (data) =>
    request("/api/v1/users", {
      method: "POST",
      data,
      offline: false,
    }),
  getCommodityQuotes: () => request("/api/v1/commodity-quotes"),
  getPlantings: () =>
    requestAllPages("/api/v1/plantings", { status: "ACTIVE" }),
  getAllPlantings: () => requestAllPages("/api/v1/plantings"),
  getPlantingHistory: () =>
    requestAllPages("/api/v1/plantings", { status: "HARVESTED" }),
  createPlanting: (data) =>
    request("/api/v1/plantings", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  updatePlanting: (id, data) =>
    request(`/api/v1/plantings/${id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  deletePlanting: (id) =>
    request(`/api/v1/plantings/${id}`, { method: "DELETE" }),
  finishPlanting: (id) =>
    request(`/api/v1/plantings/${id}/finish`, { method: "PATCH" }),
  reactivatePlanting: (id) =>
    request(`/api/v1/plantings/${id}/reactivate`, { method: "PATCH" }),
  getPlantingSteps: (plantingId) =>
    request(`/api/v1/plantings/${plantingId}/steps`),
  createPlantingStep: (plantingId, data) =>
    request(`/api/v1/plantings/${plantingId}/steps`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  updatePlantingStep: (plantingId, stepId, data) =>
    request(`/api/v1/plantings/${plantingId}/steps/${stepId}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  deletePlantingStep: (plantingId, stepId) =>
    request(`/api/v1/plantings/${plantingId}/steps/${stepId}`, {
      method: "DELETE",
    }),
  getHarvestSteps: (plantingId) =>
    request(`/api/v1/plantings/${plantingId}/harvest-steps`),
  createHarvestStep: (plantingId, data) =>
    request(`/api/v1/plantings/${plantingId}/harvest-steps`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  updateHarvestStep: (plantingId, stepId, data) =>
    request(`/api/v1/plantings/${plantingId}/harvest-steps/${stepId}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  deleteHarvestStep: (plantingId, stepId) =>
    request(`/api/v1/plantings/${plantingId}/harvest-steps/${stepId}`, {
      method: "DELETE",
    }),
  getSeasonClosing: (id, salePricePerUnit) => {
    const query =
      salePricePerUnit && Number(salePricePerUnit) > 0
        ? `?salePricePerUnit=${encodeURIComponent(salePricePerUnit)}`
        : "";
    return request(`/api/v1/plantings/${id}/season-closing${query}`);
  },

  getExpenses: (plantingId) =>
    requestAllPages("/api/v1/expenses", { plantingId }),
  getPropertyExpenses: () =>
    requestAllPages("/api/v1/expenses", { unassignedOnly: true }),
  createExpense: (data) =>
    request("/api/v1/expenses", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  updateExpense: (id, data) =>
    request(`/api/v1/expenses/${id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  deleteExpense: (id) =>
    request(`/api/v1/expenses/${id}`, { method: "DELETE" }),
  getExpenseSummary: (plantingId) =>
    request(`/api/v1/expenses/plantings/${plantingId}/summary`),
  getPropertyExpenseSummary: () => request("/api/v1/expenses/property/summary"),

  getInventoryProducts: () => request("/api/v1/inventory/products"),
  createInventoryProduct: (data) =>
    request("/api/v1/inventory/products", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  updateInventoryProduct: (id, data) =>
    request(`/api/v1/inventory/products/${id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  deleteInventoryProduct: (id) =>
    request(`/api/v1/inventory/products/${id}`, { method: "DELETE" }),
  moveInventory: (id, data) =>
    request(`/api/v1/inventory/products/${id}/movements`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  getInventoryMovements: (id) =>
    request(`/api/v1/inventory/products/${id}/movements`),

  getMachines: () => request("/api/v1/machines"),
  createMachine: (data) =>
    request("/api/v1/machines", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  updateMachine: (id, data) =>
    request(`/api/v1/machines/${id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  deleteMachine: (id) =>
    request(`/api/v1/machines/${id}`, { method: "DELETE" }),
  getMaintenances: (machineId) =>
    request(`/api/v1/machines/${machineId}/maintenances`),
  createMaintenance: (machineId, data) =>
    request(`/api/v1/machines/${machineId}/maintenances`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  updateMaintenance: (id, data) =>
    request(`/api/v1/maintenances/${id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  deleteMaintenance: (id) =>
    request(`/api/v1/maintenances/${id}`, { method: "DELETE" }),

  getDiaryEntries: (plantingId) =>
    requestAllPages("/api/v1/field-diary", { plantingId }),
  createDiaryEntry: (data) =>
    request("/api/v1/field-diary", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  updateDiaryEntry: (id, data) =>
    request(`/api/v1/field-diary/${id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  deleteDiaryEntry: (id) =>
    request(`/api/v1/field-diary/${id}`, { method: "DELETE" }),

  getRainfall: () => request("/api/v1/rainfall"),
  getRainfallByPlanting: (plantingId) =>
    request(`/api/v1/rainfall/plantings/${plantingId}`),
  getRainfallSummary: () => request("/api/v1/rainfall/summary"),
  createRainfall: (data) =>
    request("/api/v1/rainfall", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  updateRainfall: (id, data) =>
    request(`/api/v1/rainfall/${id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  deleteRainfall: (id) =>
    request(`/api/v1/rainfall/${id}`, { method: "DELETE" }),
};
