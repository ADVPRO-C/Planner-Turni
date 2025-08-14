import React from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  CogIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const Impostazioni = () => {
  const { user } = useAuth();

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
              <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200">
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
    </div>
  );
};

export default Impostazioni;
