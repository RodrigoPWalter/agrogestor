import { expect, test } from "@playwright/test";

function pageOf(content) {
  return {
    content,
    page: 0,
    size: content.length,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
  };
}

function plantingFrom(payload) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    ...payload,
    status: "ACTIVE",
    statusName: "Ativo",
    plantedAreaHectares: 0,
    remainingAreaHectares: payload.plannedAreaHectares,
    plantedPercentage: 0,
    plantingProgressStatus: "NOT_STARTED",
    plantingProgressStatusName: "Não iniciado",
    harvestedAreaHectares: 0,
    harvestRemainingAreaHectares: 0,
    harvestedPercentage: 0,
    harvestProgressStatus: "NOT_STARTED",
    harvestProgressStatusName: "Não iniciada",
    createdAt: "2026-08-16T12:00:00Z",
    updatedAt: "2026-08-16T12:00:00Z",
  };
}

async function mockApi(page) {
  let plantings = [];
  let expenses = [];
  let productionSales = [];
  const productionBase = {
    plantingId: "33333333-3333-4333-8333-333333333333",
    crop: "Soja",
    harvest: "2026/2027",
    fieldName: "Talhão Norte",
    plantingStatus: "HARVESTED",
    harvestedBags: 300,
  };

  function productionStock() {
    const soldBags = productionSales.reduce(
      (total, sale) => total + sale.quantityBags,
      0,
    );
    const revenue = productionSales.reduce(
      (total, sale) => total + sale.totalAmount,
      0,
    );
    return {
      ...productionBase,
      soldBags,
      availableBags: productionBase.harvestedBags - soldBags,
      revenue,
      averageSalePrice: soldBags ? revenue / soldBags : 0,
      saleCount: productionSales.length,
    };
  }

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    let body;

    if (path === "/api/v1/auth/login" && method === "POST") {
      body = {
        accessToken: "token-e2e-assinado",
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          nome: "Produtor de teste",
          email: "produtor@agrogestor.test",
          role: "ADMIN",
          propertyId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          propertyName: "Propriedade de teste",
        },
      };
    } else if (path === "/api/v1/dashboard") {
      body = {
        metrics: {
          plantedAreaHectares: 0,
          plannedAreaHectares: 0,
          activePlantingsCount: plantings.length,
          totalExpenses: expenses.reduce((sum, item) => sum + item.amount, 0),
          expenseCount: expenses.length,
          inventoryProductCount: 0,
          lowStockProductCount: 0,
          costPerHectare: 0,
        },
        recentPlantings: [],
        recentExpenses: [],
        inventoryProducts: [],
      };
    } else if (path === "/api/v1/commodity-quotes") {
      body = {
        sourceName: "Cotricampo",
        sourceUrl: "https://www.cotricampo.com.br",
        quotationDate: "2026-08-16",
        quotes: [],
        history: [],
        stale: false,
      };
    } else if (path === "/api/v1/plantings" && method === "POST") {
      const created = plantingFrom(request.postDataJSON());
      plantings = [created];
      body = created;
    } else if (path === "/api/v1/plantings") {
      const status = url.searchParams.get("status");
      body = pageOf(
        status === "HARVESTED"
          ? []
          : plantings.filter((item) => !status || item.status === status),
      );
    } else if (path === "/api/v1/expenses" && method === "POST") {
      const payload = request.postDataJSON();
      const created = {
        id: "22222222-2222-4222-8222-222222222222",
        ...payload,
        amount: Number(payload.amount),
        categoryDisplayName: "Fertilizantes",
        origin: "DIRECT",
      };
      expenses = [created];
      body = created;
    } else if (path === "/api/v1/expenses") {
      const plantingId = url.searchParams.get("plantingId");
      const unassignedOnly = url.searchParams.get("unassignedOnly") === "true";
      body = pageOf(
        expenses.filter((item) =>
          unassignedOnly
            ? !item.plantingId
            : !plantingId || item.plantingId === plantingId,
        ),
      );
    } else if (path === "/api/v1/expenses/plantings/summaries") {
      body = [];
    } else if (path.match(/^\/api\/v1\/expenses\/plantings\/[^/]+\/summary$/)) {
      const total = expenses.reduce((sum, item) => sum + item.amount, 0);
      body = {
        totalExpenses: total,
        expensePerHectare: total / 12,
        expenseCount: expenses.length,
        categories: [],
      };
    } else if (path === "/api/v1/expenses/property/summary") {
      body = {
        totalExpenses: 0,
        averageExpense: 0,
        expenseCount: 0,
        categoryCount: 0,
        categories: [],
      };
    } else if (path === "/api/v1/production/stock") {
      body = [productionStock()];
    } else if (path.match(/\/production-stock$/)) {
      body = productionStock();
    } else if (path.match(/\/sales$/) && method === "POST") {
      const payload = request.postDataJSON();
      const created = {
        id: "44444444-4444-4444-8444-444444444444",
        plantingId: productionBase.plantingId,
        ...payload,
        totalAmount: payload.quantityBags * payload.pricePerBag,
      };
      productionSales = [created];
      body = created;
    } else if (path.match(/\/sales$/)) {
      body = productionSales;
    } else if (path === "/api/v1/field-diary") {
      body = pageOf([]);
    } else if (path === "/api/v1/rainfall/summary") {
      body = {
        totalMillimeters: 0,
        measurementCount: 0,
        lastRainfallDate: null,
      };
    } else if (
      path === "/api/v1/inventory/products" ||
      path === "/api/v1/machines" ||
      path === "/api/v1/rainfall"
    ) {
      body = [];
    } else {
      body = {};
    }

    await route.fulfill({
      status: method === "POST" ? 201 : 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("login, cadastro de plantio e lançamento de gasto", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Fluxo completo coberto no desktop",
  );
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("produtor@agrogestor.test");
  await page.locator("#login-password").fill("senha-segura");
  await page.getByRole("button", { name: "Entrar no AgroGestor" }).click();
  await expect(
    page.getByRole("heading", { name: "Visão geral da propriedade" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Plantios" }).first().click();
  await page.getByRole("button", { name: "Novo plantio" }).click();
  await page.getByLabel("Cultura").fill("Soja");
  await page.getByLabel("Safra").fill("2026/2027");
  await page.getByLabel("Talhão ou área").fill("Talhão Norte");
  await page.getByLabel("Área total prevista (ha)").fill("12");
  await page.getByLabel("Variedade planejada").fill("BRS 284");
  await page.getByLabel("Taxa de semeadura").fill("50");
  await page
    .getByLabel("Unidade da taxa")
    .selectOption("KILOGRAMS_PER_HECTARE");
  await page
    .getByRole("dialog", { name: "Novo plantio" })
    .getByRole("button", { name: "Cadastrar plantio" })
    .click();
  await expect(page.getByRole("heading", { name: "Soja" })).toBeVisible();

  await page.getByRole("link", { name: "Gastos" }).first().click();
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await page.getByLabel("Descrição").fill("Adubo de base");
  await page.getByLabel("Valor (R$)").fill("1200");
  await page
    .getByRole("dialog", { name: "Registrar gasto" })
    .getByRole("button", { name: "Registrar gasto" })
    .click();
  await expect(page.getByText("Adubo de base")).toBeVisible();
});

test("layout móvel não cria rolagem horizontal", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile",
    "Verificação exclusiva do celular",
  );
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("produtor@agrogestor.test");
  await page.locator("#login-password").fill("senha-segura");
  await page.getByRole("button", { name: "Entrar no AgroGestor" }).click();
  await expect(
    page.getByRole("heading", { name: "Visão geral da propriedade" }),
  ).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  await expect(
    page.getByRole("navigation", { name: "Navegação móvel" }),
  ).toBeVisible();
});

test("diário oferece lançamentos rápidos no celular", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile",
    "Verificação exclusiva do celular",
  );
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("produtor@agrogestor.test");
  await page.locator("#login-password").fill("senha-segura");
  await page.getByRole("button", { name: "Entrar no AgroGestor" }).click();

  await page.goto("/diario");
  await expect(page.getByRole("heading", { name: "Diário" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Registrar gasto" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Registrar chuva" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Registrar plantio" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Registrar gasto" }).click();
  const dialog = page.getByRole("dialog", { name: "Registrar gasto" });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Descrição do gasto")).toBeVisible();

  const [dimensions, dialogBox] = await Promise.all([
    page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    })),
    dialog.boundingBox(),
  ]);
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dialogBox.width).toBeLessThanOrEqual(dimensions.viewport);
});

test("estoque da produção registra venda e mantém o layout responsivo", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("produtor@agrogestor.test");
  await page.locator("#login-password").fill("senha-segura");
  await page.getByRole("button", { name: "Entrar no AgroGestor" }).click();

  await page.goto("/producao");
  await expect(page.getByRole("heading", { name: "Produção" })).toBeVisible();
  await expect(page.getByText("300 sc").first()).toBeVisible();
  await page.getByRole("button", { name: "Gerenciar vendas" }).click();
  await page.getByRole("button", { name: "Registrar venda" }).click();
  await page.getByLabel("Quantidade (sacas de 60 kg)").fill("50");
  await page.getByLabel("Preço por saca").fill("72.5");
  await page.getByLabel("Comprador (opcional)").fill("Cooperativa local");
  await page.getByRole("button", { name: "Salvar venda" }).click();

  await expect(page.getByText("Cooperativa local")).toBeVisible();
  await expect(
    page
      .getByRole("dialog", { name: "Vendas — Soja" })
      .getByText("R$ 3.625,00")
      .last(),
  ).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});
