import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute, PublicOnlyRoute } from "./auth/RouteGuards";
import { AppLayout } from "./components/AppLayout";
import { LoadingState } from "./components/Feedback";
import { loginPageLoader, privatePageLoaders } from "./routes/pageLoaders";

const DashboardPage = lazy(privatePageLoaders["/"]);
const FieldDiaryPage = lazy(privatePageLoaders["/diario"]);
const ExpensesPage = lazy(privatePageLoaders["/gastos"]);
const PlantingsPage = lazy(privatePageLoaders["/plantios"]);
const InventoryPage = lazy(privatePageLoaders["/estoque"]);
const MachinesPage = lazy(privatePageLoaders["/maquinas"]);
const RainfallPage = lazy(privatePageLoaders["/chuvas"]);
const LoginPage = lazy(loginPageLoader);

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
