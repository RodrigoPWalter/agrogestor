import { httpClient } from "./httpClient";

const JSON_HEADERS = { "Content-Type": "application/json" };
const DEFAULT_PAGE_SIZE = 100;

async function request(path, options = {}) {
  const { body, data, ...config } = options;
  const response = await httpClient.request({
    url: path,
    ...config,
    data: data ?? (body ? JSON.parse(body) : undefined),
  });

  return response.status === 204 ? null : response.data;
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
  login: (credentials) =>
    request("/api/v1/auth/login", {
      method: "POST",
      data: credentials,
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
  getSeasonClosing: (id, salePricePerUnit) => {
    const query =
      salePricePerUnit && Number(salePricePerUnit) > 0
        ? `?salePricePerUnit=${encodeURIComponent(salePricePerUnit)}`
        : "";
    return request(`/api/v1/plantings/${id}/season-closing${query}`);
  },

  getExpenses: (plantingId) =>
    requestAllPages("/api/v1/expenses", { plantingId }),
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
