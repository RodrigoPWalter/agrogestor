import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { ConfirmationProvider } from "./components/ConfirmationProvider";
import "./styles.css";

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateServiceWorker(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    setInterval(
      () => {
        registration.update();
      },
      10 * 60 * 1000,
    );
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppErrorBoundary>
          <ConfirmationProvider>
            <App />
          </ConfirmationProvider>
        </AppErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
