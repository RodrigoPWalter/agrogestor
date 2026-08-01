const SLOW_CONNECTION_TYPES = new Set(["slow-2g", "2g"]);

export function createPageLoader(importPage, exportName) {
  let pagePromise;

  return () => {
    if (!pagePromise) {
      pagePromise = importPage().then((module) => ({
        default: module[exportName],
      }));
      pagePromise.catch(() => {
        pagePromise = undefined;
      });
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

export function preloadPrivatePage(
  path,
  { online = navigator.onLine, connection = navigator.connection } = {},
) {
  const shouldSaveData = connection?.saveData;
  const slowConnection = SLOW_CONNECTION_TYPES.has(connection?.effectiveType);

  if (!online || shouldSaveData || slowConnection) return undefined;

  return privatePageLoaders[path]?.();
}
