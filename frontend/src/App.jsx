import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute, PublicOnlyRoute } from "./auth/RouteGuards";
import { AppLayout } from "./components/AppLayout";
import { LoadingState } from "./components/Feedback";

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const FieldDiaryPage = lazy(() =>
  import("./pages/FieldDiaryPage").then((module) => ({
    default: module.FieldDiaryPage,
  })),
);
const ExpensesPage = lazy(() =>
  import("./pages/ExpensesPage").then((module) => ({
    default: module.ExpensesPage,
  })),
);
const PlantingsPage = lazy(() =>
  import("./pages/PlantingsPage").then((module) => ({
    default: module.PlantingsPage,
  })),
);
const InventoryPage = lazy(() =>
  import("./pages/InventoryPage").then((module) => ({
    default: module.InventoryPage,
  })),
);
const MachinesPage = lazy(() =>
  import("./pages/MachinesPage").then((module) => ({
    default: module.MachinesPage,
  })),
);
const RainfallPage = lazy(() =>
  import("./pages/RainfallPage").then((module) => ({
    default: module.RainfallPage,
  })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);

function PageLoader() {
  return (
    <div className="page page--loading">
      <LoadingState label="Abrindo módulo..." />
    </div>
  );
}

function lazyPage(PageComponent) {
  return (
    <Suspense fallback={<PageLoader />}>
      <PageComponent />
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="login" element={lazyPage(LoginPage)} />
      </Route>
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={lazyPage(DashboardPage)} />
          <Route path="plantios" element={lazyPage(PlantingsPage)} />
          <Route path="gastos" element={lazyPage(ExpensesPage)} />
          <Route path="estoque" element={lazyPage(InventoryPage)} />
          <Route path="maquinas" element={lazyPage(MachinesPage)} />
          <Route path="diario" element={lazyPage(FieldDiaryPage)} />
          <Route path="chuvas" element={lazyPage(RainfallPage)} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
