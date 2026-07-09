import { httpClient } from "./httpClient";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function request(path, options = {}) {
  const { body, data, ...config } = options;
  const response = await httpClient.request({
    url: path,
    ...config,
    data: data ?? (body ? JSON.parse(body) : undefined),
  });

  return response.status === 204 ? null : response.data;
}

export const api = {
  login: (credentials) =>
    request("/api/v1/auth/login", {
      method: "POST",
      data: credentials,
    }),
  getCommodityQuotes: () => request("/api/v1/commodity-quotes"),
  getPlantings: () =>
    request("/api/v1/plantings?status=ACTIVE&page=0&size=100"),
  getAllPlantings: () => request("/api/v1/plantings?page=0&size=100"),
  getPlantingHistory: () =>
    request("/api/v1/plantings?status=HARVESTED&page=0&size=100"),
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

  getExpenses: (plantingId) => {
    const query = plantingId
      ? `?plantingId=${plantingId}&size=100`
      : "?size=100";
    return request(`/api/v1/expenses${query}`);
  },
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

  getDiaryEntries: (plantingId) => {
    const query = plantingId
      ? `?plantingId=${plantingId}&size=100`
      : "?size=100";
    return request(`/api/v1/field-diary${query}`);
  },
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
