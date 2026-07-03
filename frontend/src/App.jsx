import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute, PublicOnlyRoute } from "./auth/RouteGuards";
import { AppLayout } from "./components/AppLayout";
import { CalculatorPage } from "./pages/CalculatorPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FieldDiaryPage } from "./pages/FieldDiaryPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { PlantingsPage } from "./pages/PlantingsPage";
import { InventoryPage } from "./pages/InventoryPage";
import { MachinesPage } from "./pages/MachinesPage";
import { RainfallPage } from "./pages/RainfallPage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="login" element={<LoginPage />} />
      </Route>
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="plantios" element={<PlantingsPage />} />
          <Route path="calculadora" element={<CalculatorPage />} />
          <Route path="gastos" element={<ExpensesPage />} />
          <Route path="estoque" element={<InventoryPage />} />
          <Route path="maquinas" element={<MachinesPage />} />
          <Route path="diario" element={<FieldDiaryPage />} />
          <Route path="chuvas" element={<RainfallPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
