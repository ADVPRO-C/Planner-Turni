import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const RiepilogoDisponibilita = () => {
  const { user: _user } = useAuth();
  const [riepilogo, setRiepilogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState({
    inizio: new Date().toISOString().split("T")[0],
    fine: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });
  const [showAttentionOnly, setShowAttentionOnly] = useState(false);

  // Carica il riepilogo delle disponibilità
  const loadRiepilogo = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/disponibilita/riepilogo?data_inizio=${filterDate.inizio}&data_fine=${filterDate.fine}`
      );
      setRiepilogo(response.data);
    } catch (error) {
      console.error("Errore:", error);
      if (error.response?.status === 401) {
        toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
      } else {
        toast.error(error.response?.data?.message || "Errore nel caricamento del riepilogo");
      }
    } finally {
      setLoading(false);
    }
  }, [filterDate.inizio, filterDate.fine]);

  useEffect(() => {
    loadRiepilogo();
  }, [loadRiepilogo]);

  // Filtra i risultati per mostrare solo quelli critici o con attenzione
  const filteredRiepilogo = showAttentionOnly
    ? riepilogo.filter((item) => item.critico || item.attenzione)
    : riepilogo;

  // Raggruppa per data
  const groupedByDate = filteredRiepilogo.reduce((acc, item) => {
    if (!acc[item.data]) {
      acc[item.data] = [];
    }
    acc[item.data].push(item);
    return acc;
  }, {});

  // Ottieni il nome del giorno
  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const days = [
      "Domenica",
      "Lunedì",
      "Martedì",
      "Mercoledì",
      "Giovedì",
      "Venerdì",
      "Sabato",
    ];
    return days[date.getDay()];
  };

  // Formatta la data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Calcola statistiche
  const stats = {
    total: riepilogo.length,
    critico: riepilogo.filter((item) => item.critico).length,
    attention: riepilogo.filter((item) => item.attenzione && !item.critico).length,
    sufficient: riepilogo.filter((item) => item.sufficiente).length,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Riepilogo Disponibilità
          </h1>
          <p className="text-gray-600 mt-1">
            Panoramica delle disponibilità per l'autocompilazione dei turni
          </p>
        </div>
        <button
          onClick={loadRiepilogo}
          className="btn-primary flex items-center"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Aggiorna
        </button>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Totale Slot</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sufficienti</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.sufficient}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Attenzione</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.attention}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Critici</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.critico}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inizio
            </label>
            <input
              type="date"
              value={filterDate.inizio}
              onChange={(e) =>
                setFilterDate((prev) => ({ ...prev, inizio: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Fine
            </label>
            <input
              type="date"
              value={filterDate.fine}
              onChange={(e) =>
                setFilterDate((prev) => ({ ...prev, fine: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showAttentionOnly}
                onChange={(e) => setShowAttentionOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Mostra solo slot critici o con attenzione
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Lista disponibilità */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Disponibilità ({filteredRiepilogo.length} slot)
          </h3>
        </div>
        <div className="overflow-x-auto">
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Nessuna disponibilità trovata per il periodo selezionato
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(groupedByDate).map(([data, items]) => (
                <div key={data} className="p-6">
                  <div className="flex items-center mb-4">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h4 className="text-lg font-medium text-gray-900">
                      {getDayName(data)} {formatDate(data)}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map((item, index) => {
                      // Determina il colore e l'icona in base allo stato
                      let cardClasses = "";
                      let iconComponent = null;
                      
                      if (item.critico) {
                        cardClasses = "border-red-300 bg-red-50";
                        iconComponent = <XCircleIcon className="h-5 w-5 text-red-600" />;
                      } else if (item.attenzione) {
                        cardClasses = "border-yellow-300 bg-yellow-50";
                        iconComponent = <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
                      } else {
                        cardClasses = "border-green-300 bg-green-50";
                        iconComponent = <CheckCircleIcon className="h-5 w-5 text-green-600" />;
                      }

                      return (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${cardClasses}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {item.postazione}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {item.orario_inizio} - {item.orario_fine}
                            </p>
                          </div>
                          {iconComponent}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Totali:</span>
                            <span className="ml-1 font-medium">
                              {item.totale_disponibili}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Uomini:</span>
                            <span
                              className={`ml-1 font-medium ${
                                item.uomini === 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {item.uomini}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Donne:</span>
                            <span className="ml-1 font-medium text-blue-600">
                              {item.donne}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Max {item.max_volontari} volontari per slot
                        </div>
                        {item.critico && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                            🔴 Critico: {item.totale_disponibili < item.max_volontari 
                              ? `Solo ${item.totale_disponibili} disponibile/i su ${item.max_volontari} richiesti`
                              : "Nessun uomo disponibile e non ci sono abbastanza persone"}
                          </div>
                        )}
                        {item.attenzione && !item.critico && (
                          <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                            ⚠️ Attenzione: Nessun uomo disponibile per questo turno
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Informazioni */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">
              Informazioni per l'autocompilazione
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Gli slot <span className="font-medium text-red-600">critici (rosso)</span>{" "}
                  non hanno abbastanza disponibili o mancano uomini
                </li>
                <li>
                  Gli slot con <span className="font-medium text-yellow-600">attenzione (giallo)</span>{" "}
                  hanno abbastanza persone ma nessun uomo disponibile
                </li>
                <li>
                  Gli slot <span className="font-medium text-green-600">sufficienti (verde)</span>{" "}
                  hanno abbastanza disponibili e almeno 1 uomo
                </li>
                <li>
                  Utilizza i filtri per concentrarti sui periodi specifici
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiepilogoDisponibilita;
