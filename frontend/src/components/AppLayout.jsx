import {
  BookOpenText,
  CloudRain,
  Ellipsis,
  ChevronDown,
  LoaderCircle,
  LayoutDashboard,
  ReceiptText,
  Sprout,
  Tractor,
  Warehouse,
  Wifi,
  WifiOff,
  LogOut,
  KeyRound,
  UserRound,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  CONNECTION_STATUS,
  getConnectionStatus,
  subscribeConnectionStatus,
} from "../api/connectionStatus";
import { useAuth } from "../auth/AuthContext";
import {
  preloadPrivatePage,
  schedulePrivatePagesPreload,
} from "../routes/pageLoaders";
import { ProfileSettingsModal } from "./ProfileSettingsModal";

const navigation = [
  {
    to: "/",
    label: "Visão geral",
    mobileLabel: "Início",
    icon: LayoutDashboard,
    end: true,
  },
  { to: "/plantios", label: "Plantios", icon: Sprout },
  { to: "/estoque", label: "Estoque", icon: Warehouse },
  { to: "/maquinas", label: "Máquinas", icon: Tractor },
  { to: "/diario", label: "Diário", icon: BookOpenText },
  { to: "/chuvas", label: "Chuvas", icon: CloudRain },
  { to: "/gastos", label: "Gastos", icon: ReceiptText },
];

const primaryMobilePaths = new Set(["/", "/plantios", "/diario", "/gastos"]);
const mobileNavigation = navigation.filter(({ to }) =>
  primaryMobilePaths.has(to),
);
const moreNavigation = navigation.filter(
  ({ to }) => !primaryMobilePaths.has(to),
);

export function AppLayout() {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const { user, logout, updateProfile } = useAuth();
  const connectionStatus = useSyncExternalStore(
    subscribeConnectionStatus,
    getConnectionStatus,
  );
  const location = useLocation();
  const moreMenuActive = moreNavigation.some(({ to }) =>
    location.pathname.startsWith(to),
  );
  const initials = user?.nome
    ?.split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const roleLabel = user?.role === "ADMIN" ? "Administrador" : "Usuário";
  const connectionPresentation = {
    [CONNECTION_STATUS.CHECKING]: {
      label: "Conectando...",
      icon: LoaderCircle,
    },
    [CONNECTION_STATUS.CONNECTED]: {
      label: "Sistema conectado",
      icon: Wifi,
    },
    [CONNECTION_STATUS.OFFLINE]: {
      label: "Sem internet",
      icon: WifiOff,
    },
    [CONNECTION_STATUS.UNAVAILABLE]: {
      label: "Servidor indisponível",
      icon: WifiOff,
    },
  }[connectionStatus];
  const ConnectionIcon = connectionPresentation.icon;

  useEffect(() => {
    setMoreMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => schedulePrivatePagesPreload(), []);

  function preloadNavigationTarget(path) {
    preloadPrivatePage(path);
  }

  return (
    <div className="app-shell app-shell--horizontal">
      <header className="app-header">
        <div className="app-header__inner">
          <NavLink
            className="app-brand"
            to="/"
            aria-label="Ir para a visão geral"
          >
            <span>
              <img src="/icons/agrogestor-icon.svg" alt="" aria-hidden="true" />
            </span>
            <strong>AgroGestor</strong>
          </NavLink>

          <nav className="desktop-navigation" aria-label="Navegação principal">
            {navigation.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onPointerEnter={() => preloadNavigationTarget(to)}
                onFocus={() => preloadNavigationTarget(to)}
                className={({ isActive }) =>
                  `desktop-navigation__item ${isActive ? "is-active" : ""}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="app-header__actions">
            <div
              className={`connection-status connection-status--${connectionStatus}`}
              aria-live="polite"
            >
              <ConnectionIcon
                className={
                  connectionStatus === CONNECTION_STATUS.CHECKING
                    ? "spin"
                    : undefined
                }
                size={14}
              />
              <span>{connectionPresentation.label}</span>
            </div>
            <div className="profile-menu">
              <button
                className="header-profile"
                type="button"
                aria-label="Abrir perfil"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen((current) => !current)}
              >
                <span>{initials || "AG"}</span>
                <div>
                  <strong>{user?.nome}</strong>
                  <small>{roleLabel}</small>
                </div>
                <ChevronDown size={13} />
              </button>
              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <div>
                    <UserRound size={16} />
                    <span>
                      <strong>{user?.nome}</strong>
                      <small>{user?.email}</small>
                    </span>
                  </div>
                  <button
                    className="profile-dropdown__settings"
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setProfileSettingsOpen(true);
                    }}
                  >
                    <KeyRound size={15} />
                    Alterar acesso
                  </button>
                  <button type="button" onClick={logout}>
                    <LogOut size={15} />
                    Sair da conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="main-content main-content--horizontal">
        <Outlet />
      </main>

      {profileSettingsOpen && (
        <ProfileSettingsModal
          user={user}
          onSave={updateProfile}
          onClose={() => setProfileSettingsOpen(false)}
        />
      )}

      {moreMenuOpen && (
        <>
          <button
            className="mobile-more-backdrop"
            type="button"
            aria-label="Fechar menu adicional"
            onClick={() => setMoreMenuOpen(false)}
          />
          <nav className="mobile-more-menu" aria-label="Outros módulos">
            <div>
              <strong>Outros módulos</strong>
              <small>Acesse as demais áreas do AgroGestor</small>
            </div>
            <div className="mobile-more-menu__grid">
              {moreNavigation.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreMenuOpen(false)}
                  onPointerEnter={() => preloadNavigationTarget(to)}
                  onFocus={() => preloadNavigationTarget(to)}
                  onTouchStart={() => preloadNavigationTarget(to)}
                  className={({ isActive }) => (isActive ? "is-active" : "")}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        </>
      )}

      <nav className="mobile-app-bar" aria-label="Navegação móvel">
        {mobileNavigation.map(({ to, label, mobileLabel, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMoreMenuOpen(false)}
            onPointerEnter={() => preloadNavigationTarget(to)}
            onFocus={() => preloadNavigationTarget(to)}
            onTouchStart={() => preloadNavigationTarget(to)}
            className={({ isActive }) => (isActive ? "is-active" : "")}
          >
            <Icon size={20} />
            <span>{mobileLabel || label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={moreMenuActive || moreMenuOpen ? "is-active" : ""}
          onClick={() => setMoreMenuOpen((current) => !current)}
          aria-expanded={moreMenuOpen}
          aria-label="Abrir outros módulos"
        >
          <Ellipsis size={21} />
          <span>Mais</span>
        </button>
      </nav>
    </div>
  );
}
