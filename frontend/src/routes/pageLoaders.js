function createPageLoader(importPage, exportName) {
  let pagePromise;

  return () => {
    if (!pagePromise) {
      pagePromise = importPage().then((module) => ({
        default: module[exportName],
      }));
    }

    return pagePromise;
  };
}

export const privatePageLoaders = {
  "/": createPageLoader(
    () => import("../pages/DashboardPage"),
    "DashboardPage",
  ),
  "/plantios": createPageLoader(
    () => import("../pages/PlantingsPage"),
    "PlantingsPage",
  ),
  "/gastos": createPageLoader(
    () => import("../pages/ExpensesPage"),
    "ExpensesPage",
  ),
  "/estoque": createPageLoader(
    () => import("../pages/InventoryPage"),
    "InventoryPage",
  ),
  "/maquinas": createPageLoader(
    () => import("../pages/MachinesPage"),
    "MachinesPage",
  ),
  "/diario": createPageLoader(
    () => import("../pages/FieldDiaryPage"),
    "FieldDiaryPage",
  ),
  "/chuvas": createPageLoader(
    () => import("../pages/RainfallPage"),
    "RainfallPage",
  ),
};

export const loginPageLoader = createPageLoader(
  () => import("../pages/LoginPage"),
  "LoginPage",
);

export function preloadPrivatePage(path) {
  return privatePageLoaders[path]?.();
}

export function schedulePrivatePagesPreload({
  windowObject = window,
  online = navigator.onLine,
  loaders = Object.values(privatePageLoaders),
} = {}) {
  if (!online) return () => {};

  const preload = () => {
    loaders.forEach((loadPage) => {
      loadPage().catch(() => {});
    });
  };

  if (typeof windowObject.requestIdleCallback === "function") {
    const idleId = windowObject.requestIdleCallback(preload, {
      timeout: 2500,
    });
    return () => windowObject.cancelIdleCallback?.(idleId);
  }

  const timeoutId = windowObject.setTimeout(preload, 1200);
  return () => windowObject.clearTimeout(timeoutId);
}
