import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { AppUpdateNotice } from "./components/AppUpdateNotice";
import { ConfirmationProvider } from "./components/ConfirmationProvider";
import { registerAgroGestorServiceWorker } from "./pwa/registerServiceWorker";
import "./styles.css";

registerAgroGestorServiceWorker();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppErrorBoundary>
          <ConfirmationProvider>
            <App />
            <AppUpdateNotice />
          </ConfirmationProvider>
        </AppErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
