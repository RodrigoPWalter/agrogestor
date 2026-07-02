const JSON_HEADERS = { "Content-Type": "application/json" };

async function request(path, options = {}) {
  const response = await fetch(path, options);

  if (response.status === 204) {
    return null;
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const fieldMessage = body?.fieldErrors
      ? Object.values(body.fieldErrors)[0]
      : null;
    throw new Error(
      fieldMessage || body?.message || "Não foi possível concluir a operação.",
    );
  }

  return body;
}

export const api = {
  getCommodityQuotes: () => request("/api/v1/commodity-quotes"),
  getWeatherForecast: () => request("/api/v1/weather/forecast"),
  getPlantings: () => request("/api/v1/plantings?page=0&size=100"),
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

  calculateProduction: (data) =>
    request("/api/v1/production-estimates/calculate", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  calculateSeeding: (data) =>
    request("/api/v1/seeding-estimates/calculate", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),

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
};
