import React, { createContext, useContext, useState, useEffect } from "react";
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

  // Verifica del token all'avvio
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await api.get("/auth/verify");
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      // Rimuovi il token senza mostrare toast durante la verifica iniziale
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post("/auth/login", { email, password });
      const { token, user } = response.data;

      localStorage.setItem("token", token);

      setUser(user);
      setIsAuthenticated(true);

      toast.success("Accesso effettuato con successo!");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Errore durante l'accesso";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = (showToast = true) => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
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
    login,
    logout,
    register,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
