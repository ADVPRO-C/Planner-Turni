import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { api, handleApiError } from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve essere usato all'interno di un AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCongregazione, setActiveCongregazione] = useState(() => {
    try {
      const stored = localStorage.getItem("activeCongregazione");
      return stored ? JSON.parse(stored) : null;
    } catch (_error) {
      return null;
    }
  });

  const originalFetchRef = useRef(window.fetch);

  const applyCongregazioneHeader = useCallback((congregazione) => {
    if (congregazione?.id) {
      axios.defaults.headers.common["X-Congregazione-Id"] = congregazione.id;
    } else {
      delete axios.defaults.headers.common["X-Congregazione-Id"];
    }
  }, []);

  useEffect(() => {
    applyCongregazioneHeader(activeCongregazione);
  }, [activeCongregazione, applyCongregazioneHeader]);

  useEffect(() => {
    const originalFetch = originalFetchRef.current;

    const patchedFetch = (input, init = {}) => {
      const newInit = { ...init };
      const headers = new Headers(init?.headers || {});

      if (activeCongregazione?.id) {
        headers.set("X-Congregazione-Id", activeCongregazione.id);
      } else {
        headers.delete("X-Congregazione-Id");
      }

      newInit.headers = headers;
      return originalFetch(input, newInit);
    };

    window.fetch = patchedFetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, [activeCongregazione]);

  const updateActiveCongregazione = useCallback(
    (congregazione) => {
      setActiveCongregazione(congregazione);
      applyCongregazioneHeader(congregazione);
      if (congregazione) {
        localStorage.setItem(
          "activeCongregazione",
          JSON.stringify(congregazione)
        );
      } else {
        localStorage.removeItem("activeCongregazione");
      }
    },
    [applyCongregazioneHeader]
  );

  // Verifica del token all'avvio
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const syncActiveCongregazioneWithUser = useCallback(
    (userData, preserveExisting = false) => {
      if (!userData) {
        updateActiveCongregazione(null);
        return;
      }

      if (userData.ruolo === "super_admin") {
        if (preserveExisting && activeCongregazione?.id) {
          updateActiveCongregazione(activeCongregazione);
        } else {
          try {
            const stored = localStorage.getItem("activeCongregazione");
            if (stored) {
              updateActiveCongregazione(JSON.parse(stored));
              return;
            }
          } catch (_error) {
            // ignore
          }
          updateActiveCongregazione(null);
        }
      } else {
        updateActiveCongregazione({
          id: userData.congregazione_id,
          codice: userData.congregazione_codice,
          nome: userData.congregazione_nome,
        });
      }
    },
    [activeCongregazione, updateActiveCongregazione]
  );

  const verifyToken = async () => {
    try {
      const response = await api.get("/auth/verify");
      setUser(response.data.user);
      setIsAuthenticated(true);
      syncActiveCongregazioneWithUser(response.data.user, true);
    } catch (error) {
      // Rimuovi il token senza mostrare toast durante la verifica iniziale
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identificatore, password, congregazioneCodice) => {
    try {
      const payload = {
        identificatore: identificatore?.trim(),
        password,
      };

      if (congregazioneCodice) {
        payload.congregazione_codice = congregazioneCodice.padStart(3, "0");
      }

      const response = await axios.post("/auth/login", payload);
      const { token, user } = response.data;

      localStorage.setItem("token", token);

      setUser(user);
      setIsAuthenticated(true);
      syncActiveCongregazioneWithUser(user);

      toast.success("Accesso effettuato con successo!");
      return { success: true, user };
    } catch (error) {
      const message =
        error.response?.data?.message || "Errore durante l'accesso";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = (showToast = true) => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeCongregazione");
    setUser(null);
    setIsAuthenticated(false);
    updateActiveCongregazione(null);
    if (showToast) {
      toast.success("Logout effettuato con successo");
    }
  };

  const register = async (userData) => {
    try {
      const _response = await axios.post("/auth/register", userData);
      toast.success("Registrazione completata con successo!");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Errore durante la registrazione";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await api.put("/auth/profile", userData);
      setUser(response.data.user);
      toast.success("Profilo aggiornato con successo!");
      return { success: true };
    } catch (error) {
      const result = handleApiError(error, logout);
      if (result.error === "Sessione scaduta") {
        toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
      } else {
        toast.error(result.error);
      }
      return { success: false, error: result.error };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    activeCongregazione,
    setActiveCongregazione: updateActiveCongregazione,
    login,
    logout,
    register,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
