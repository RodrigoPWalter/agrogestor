import {
  Calculator,
  BookOpenText,
  CloudRain,
  LayoutDashboard,
  Leaf,
  Menu,
  ReceiptText,
  Sprout,
  Tractor,
  Warehouse,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const navigation = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/plantios", label: "Plantios", icon: Sprout },
  { to: "/estoque", label: "Estoque", icon: Warehouse },
  { to: "/maquinas", label: "Máquinas", icon: Tractor },
  { to: "/diario", label: "Diário", icon: BookOpenText },
  { to: "/chuvas", label: "Chuvas", icon: CloudRain },
  { to: "/calculadora", label: "Calculadora", icon: Calculator },
  { to: "/gastos", label: "Gastos", icon: ReceiptText },
];

const mobileNavigation = navigation.filter(({ to }) =>
  ["/", "/plantios", "/calculadora", "/gastos"].includes(to),
);

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <span className="brand__mark">
            <Leaf size={24} />
          </span>
          <div>
            <strong>AgroGestor</strong>
            <small>Gestão rural simples</small>
          </div>
          <button
            className="icon-button sidebar__close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="navigation" aria-label="Navegação principal">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `navigation__item ${isActive ? "is-active" : ""}`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <span className="status-dot" />
          <div>
            <strong>Sistema conectado</strong>
            <small>Dados salvos com segurança</small>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="mobile-header">
          <button
            className="icon-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <span className="mobile-header__brand">
            <Leaf size={20} /> AgroGestor
          </span>
          <span className="mobile-header__spacer" />
        </header>
        <Outlet />
      </main>

      <nav className="bottom-navigation" aria-label="Navegação móvel">
        {mobileNavigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `bottom-navigation__item ${isActive ? "is-active" : ""}`
            }
          >
            <Icon size={20} />
            <span>{label === "Visão geral" ? "Início" : label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
