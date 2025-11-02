import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ElencoPostazioni from "./pages/ElencoPostazioni";
import GestionePostazioni from "./pages/GestionePostazioni";
import ElencoVolontari from "./pages/ElencoVolontari";
import GestioneVolontari from "./pages/GestioneVolontari";
import Disponibilita from "./pages/Disponibilita";
import RiepilogoDisponibilita from "./pages/RiepilogoDisponibilita";
import GestioneTurni from "./pages/GestioneTurni";
import TurniIncompleti from "./pages/TurniIncompleti";
import Notifiche from "./pages/Notifiche";
import Cronologia from "./pages/Cronologia";
import Assistenza from "./pages/Assistenza";
import Impostazioni from "./pages/Impostazioni";
import Congregazioni from "./pages/Congregazioni";
import IMieiTurni from "./pages/IMieiTurni";
import Esperienze from "./pages/Esperienze";
import Autorizzazioni from "./pages/Autorizzazioni";
import Istruzioni from "./pages/Istruzioni";
import ContattoResponsabile from "./pages/ContattoResponsabile";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./index.css";

// Componente per il layout protetto
const ProtectedLayout = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading, user, activeCongregazione } = useAuth();

  // Mostra loading screen mentre verifica il token
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  // Reindirizza al login se non autenticato
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">
          {user?.ruolo === "super_admin" &&
            !activeCongregazione?.id &&
            location.pathname !== "/congregazioni" && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3">
                Seleziona una congregazione attiva dalla sezione <strong>Congregazioni</strong> per operare sui dati.
              </div>
            )}
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

// Componente per le pagine protette
const ProtectedRoute = ({ children }) => {
  return <ProtectedLayout>{children}</ProtectedLayout>;
};

const SuperAdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.ruolo !== "super_admin") {
    return <Navigate to="/" replace />;
  }
  return <ProtectedLayout>{children}</ProtectedLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
                borderRadius: "8px",
                padding: "12px 16px",
              },
              dismissible: true,
              className: "custom-toast",
              ariaProps: {
                role: "status",
                "aria-live": "polite",
              },
            }}
            containerStyle={{
              maxWidth: "550px",
              minWidth: "350px",
              bottom: "24px",
              right: "24px",
              top: "auto",
              left: "auto",
            }}
            reverseOrder={false}
            gutter={12}
          >
            {(t) => (
              <ToastBar
                toast={t}
                style={{
                  width: "100%",
                }}
              >
                {({ icon, message }) => (
                  <div className="flex w-full items-start space-x-3">
                    {icon && <div className="mt-0.5">{icon}</div>}
                    <div className="flex-1 text-sm leading-relaxed">{message}</div>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="ml-2 text-white/70 hover:text-white focus:outline-none"
                      aria-label="close"
                    >
                      ×
                    </button>
                  </div>
                )}
              </ToastBar>
            )}
          </Toaster>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/miei-turni"
              element={
                <ProtectedRoute>
                  <IMieiTurni />
                </ProtectedRoute>
              }
            />
            <Route
              path="/postazioni"
              element={
                <ProtectedRoute>
                  <ElencoPostazioni />
                </ProtectedRoute>
              }
            />
            <Route
              path="/postazioni/gestione"
              element={
                <ProtectedRoute>
                  <GestionePostazioni />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volontari"
              element={
                <ProtectedRoute>
                  <ElencoVolontari />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volontari/gestione"
              element={
                <ProtectedRoute>
                  <GestioneVolontari />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volontari/disponibilita"
              element={
                <ProtectedRoute>
                  <Disponibilita />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volontari/riepilogo-disponibilita"
              element={
                <ProtectedRoute>
                  <RiepilogoDisponibilita />
                </ProtectedRoute>
              }
            />
            <Route
              path="/turni/gestione"
              element={
                <ProtectedRoute>
                  <GestioneTurni />
                </ProtectedRoute>
              }
            />
            <Route
              path="/turni/incompleti"
              element={
                <ProtectedRoute>
                  <TurniIncompleti />
                </ProtectedRoute>
              }
            />
            <Route
              path="/esperienze"
              element={
                <ProtectedRoute>
                  <Esperienze />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documenti/autorizzazioni"
              element={
                <ProtectedRoute>
                  <Autorizzazioni />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documenti/istruzioni"
              element={
                <ProtectedRoute>
                  <Istruzioni />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documenti/contatto-responsabile"
              element={
                <ProtectedRoute>
                  <ContattoResponsabile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifiche"
              element={
                <ProtectedRoute>
                  <Notifiche />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cronologia"
              element={
                <ProtectedRoute>
                  <Cronologia />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistenza"
              element={
                <ProtectedRoute>
                  <Assistenza />
                </ProtectedRoute>
              }
            />
            <Route
              path="/congregazioni"
              element={
                <SuperAdminRoute>
                  <Congregazioni />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/impostazioni"
              element={
                <ProtectedRoute>
                  <Impostazioni />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
