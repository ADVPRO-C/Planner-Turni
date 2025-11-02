import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { toastSuccess, toastError } from "../utils/toast";

const Login = () => {
  const [congregazioneCode, setCongregazioneCode] = useState("001");
  const [identificatore, setIdentificatore] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Reindirizza se già autenticato
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const normalizedCode = congregazioneCode?.trim().padStart(3, "0");

    if (!congregazioneCode?.trim()) {
      toastError("Inserisci l'ID congregazione (es. 001)");
      setLoading(false);
      return;
    }

    if (!identificatore?.trim()) {
      toastError("Inserisci email o numero di telefono");
      setLoading(false);
      return;
    }

    const result = await login(identificatore, password, normalizedCode);
    if (result.success) {
      // Toast di benvenuto dopo login riuscito
      setTimeout(() => {
        toastSuccess(`Benvenuto, ${result.user?.nome || "Utente"}!`, {
          duration: 3000,
          icon: "👋",
        });
      }, 500); // Piccolo delay per permettere la navigazione

      navigate("/");
    }

    setLoading(false);
  };

  // Mostra loading screen mentre verifica l'autenticazione
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Accedi al tuo account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inserisci le tue credenziali per accedere al sistema.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="congregazione" className="sr-only">
                ID Congregazione
              </label>
              <input
                id="congregazione"
                name="congregazione"
                type="text"
                inputMode="numeric"
                pattern="^[0-9]{3}$"
                title="Inserisci un ID congregazione di 3 cifre (es. 001)"
                autoComplete="off"
                maxLength={3}
                required
                value={congregazioneCode}
                onChange={(e) =>
                  setCongregazioneCode(e.target.value.replace(/\D/g, ""))
                }
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="ID Congregazione (es. 001)"
              />
            </div>
            <div>
              <label htmlFor="identificatore" className="sr-only">
                Email o telefono
              </label>
              <input
                id="identificatore"
                name="identificatore"
                type="text"
                autoComplete="username"
                required
                value={identificatore}
                onChange={(e) => setIdentificatore(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email o numero di telefono"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm pr-10"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Accesso in corso...
                </div>
              ) : (
                "Accedi"
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Credenziali di test: ID 001 · admin@planner.com · password123
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
