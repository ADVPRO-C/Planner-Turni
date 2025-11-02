import axios from "axios";

// Configurazione axios globale
const apiBaseURL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
axios.defaults.baseURL = apiBaseURL;

// Funzione helper per aggiungere il token alle richieste
export const addTokenToRequest = (config = {}) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Aggiungi header X-Congregazione-Id se presente
  // Prima controlla activeCongregazione nel localStorage (per super_admin)
  // Se non presente, usa la congregazione dal token (decodificata)
  let congregazioneId = null;
  
  const activeCongregazione = localStorage.getItem("activeCongregazione");
  if (activeCongregazione) {
    try {
      const congregazione = JSON.parse(activeCongregazione);
      if (congregazione?.id) {
        congregazioneId = congregazione.id;
      }
    } catch (e) {
      // Ignora errori di parsing
    }
  }
  
  // Se non c'è activeCongregazione, prova a decodificare dal token
  if (!congregazioneId && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.congregazione_id) {
        congregazioneId = payload.congregazione_id;
      }
    } catch (e) {
      // Ignora errori di parsing del token
    }
  }
  
  if (congregazioneId) {
    config.headers = config.headers || {};
    config.headers["X-Congregazione-Id"] = congregazioneId;
  }
  
  return config;
};

// Funzione helper per gestire gli errori di autenticazione
export const handleApiError = (error, logoutCallback) => {
  if (error.response?.status === 401) {
    logoutCallback && logoutCallback(false);
    return { success: false, error: "Sessione scaduta" };
  }
  return {
    success: false,
    error: error.response?.data?.message || "Errore di connessione",
  };
};

// Funzioni API predefinite
export const api = {
  get: async (url, config = {}) => {
    try {
      const authConfig = addTokenToRequest(config);
      return await axios.get(url, authConfig);
    } catch (error) {
      throw error;
    }
  },

  post: async (url, data, config = {}) => {
    try {
      const authConfig = addTokenToRequest(config);
      return await axios.post(url, data, authConfig);
    } catch (error) {
      throw error;
    }
  },

  put: async (url, data, config = {}) => {
    try {
      const authConfig = addTokenToRequest(config);
      return await axios.put(url, data, authConfig);
    } catch (error) {
      throw error;
    }
  },

  delete: async (url, config = {}) => {
    try {
      const authConfig = addTokenToRequest(config);
      return await axios.delete(url, authConfig);
    } catch (error) {
      throw error;
    }
  },
};
