import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { toastSuccess, toastError } from "../utils/toast";
import {
  CogIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  BellIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const Impostazioni = () => {
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [cleanupStats, setCleanupStats] = useState({
    oldDisponibilitaCount: 0,
    loading: false,
  });
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Carica statistiche cleanup per super admin
  useEffect(() => {
    if (user?.ruolo === "super_admin") {
      fetchCleanupStats();
    }
  }, [user?.ruolo]);

  const fetchCleanupStats = async () => {
    setCleanupStats((prev) => ({ ...prev, loading: true }));
    try {
      const response = await api.get("/admin/cleanup-disponibilita/stats");
      setCleanupStats({
        oldDisponibilitaCount: response.data.oldDisponibilitaCount || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Errore nel caricamento statistiche cleanup:", error);
      setCleanupStats((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCleanup = async () => {
    if (
      !window.confirm(
        `Sei sicuro di voler eliminare ${cleanupStats.oldDisponibilitaCount} disponibilità vecchie? Questa operazione non può essere annullata.`
      )
    ) {
      return;
    }

    setCleanupLoading(true);
    try {
      const response = await api.post(
        "/admin/cleanup-disponibilita?beforeCurrentMonth=true"
      );
      toastSuccess(
        response.data.message || `Cleanup completato: ${response.data.deletedCount} record eliminati.`
      );
      // Ricarica le statistiche
      await fetchCleanupStats();
    } catch (error) {
      console.error("Errore durante il cleanup:", error);
      toastError(
        error.response?.data?.message ||
          "Errore durante il cleanup delle disponibilità"
      );
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CogIcon className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
        </div>
        <p className="text-gray-600">
          Configura le impostazioni del sistema e del tuo account.
        </p>
      </div>

      <div className="space-y-6">
        {/* Informazioni Account */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <UserCircleIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Informazioni Account
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <p className="text-gray-900">
                {user?.nome} {user?.cognome}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{user?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ruolo
              </label>
              <p className="text-gray-900 capitalize">
                {user?.ruolo || "volontario"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato
              </label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {user?.stato || "attivo"}
              </span>
            </div>
          </div>
        </div>

        {/* Sicurezza */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Sicurezza</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Cambia Password
                </h3>
                <p className="text-sm text-gray-500">
                  Aggiorna la tua password per mantenere sicuro l'account
                </p>
              </div>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
              >
                Modifica
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Sessioni Attive
                </h3>
                <p className="text-sm text-gray-500">
                  Gestisci i dispositivi connessi al tuo account
                </p>
              </div>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200">
                Visualizza
              </button>
            </div>
          </div>
        </div>

        {/* Notifiche */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BellIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Notifiche</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Notifiche Email
                </h3>
                <p className="text-sm text-gray-500">
                  Ricevi notifiche via email per turni e aggiornamenti
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Promemoria Turni
                </h3>
                <p className="text-sm text-gray-500">
                  Ricevi promemoria prima dei tuoi turni assegnati
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Utility - Solo Super Admin */}
        {user?.ruolo === "super_admin" && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <WrenchScrewdriverIcon className="h-6 w-6 text-gray-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Utility</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      Cleanup Disponibilità
                    </h3>
                    {cleanupStats.loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {cleanupStats.oldDisponibilitaCount} disponibilità vecchie
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Elimina le disponibilità di mesi precedenti per mantenere il database pulito
                  </p>
                </div>
                <button
                  onClick={handleCleanup}
                  disabled={cleanupLoading || cleanupStats.oldDisponibilitaCount === 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {cleanupLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Eliminazione...</span>
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4" />
                      <span>Cleanup</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sistema */}
        {user?.ruolo === "admin" && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CogIcon className="h-6 w-6 text-gray-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Configurazione Sistema
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Backup Database
                  </h3>
                  <p className="text-sm text-gray-500">
                    Esegui backup manuale del database
                  </p>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200">
                  Esegui Backup
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Log Sistema
                  </h3>
                  <p className="text-sm text-gray-500">
                    Visualizza i log di sistema e errori
                  </p>
                </div>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200">
                  Visualizza Log
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cambio Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Cambia Password
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  
                  // Validazione
                  if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                    toastError("Tutti i campi sono obbligatori");
                    return;
                  }

                  if (passwordData.newPassword.length < 6) {
                    toastError("La nuova password deve essere di almeno 6 caratteri");
                    return;
                  }

                  if (passwordData.newPassword !== passwordData.confirmPassword) {
                    toastError("Le password non corrispondono");
                    return;
                  }

                  if (passwordData.currentPassword === passwordData.newPassword) {
                    toastError("La nuova password deve essere diversa dalla password corrente");
                    return;
                  }

                  setLoading(true);
                  try {
                    await api.put("/auth/change-password", {
                      currentPassword: passwordData.currentPassword,
                      newPassword: passwordData.newPassword,
                    });

                    toastSuccess("Password cambiata con successo!");
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  } catch (error) {
                    console.error("Errore nel cambio password:", error);
                    toastError(
                      error.response?.data?.message || "Errore durante il cambio password"
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Corrente *
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Inserisci la password corrente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuova Password *
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Minimo 6 caratteri"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La password deve contenere almeno 6 caratteri
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conferma Nuova Password *
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Ripeti la nuova password"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={loading}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Salvataggio..." : "Salva"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Impostazioni;
