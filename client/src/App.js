import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
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
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./index.css";

// Componente per il layout protetto
const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

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
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};

// Componente per le pagine protette
const ProtectedRoute = ({ children }) => {
  return <ProtectedLayout>{children}</ProtectedLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
            }}
          />

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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
