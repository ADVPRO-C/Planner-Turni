import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ClockIcon,
  MapPinIcon,
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const ElencoPostazioni = () => {
  const { user } = useAuth();
  const [postazioni, setPostazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    stato: "",
    giorno: "",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPostazione, setSelectedPostazione] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadPostazioni = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      // Per i proclamatori, mostra solo postazioni attive
      if (user.ruolo === "volontario") {
        params.append("stato", "attiva");
      } else if (filters.stato) {
        params.append("stato", filters.stato);
      }
      if (filters.giorno) params.append("giorno", filters.giorno);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/postazioni?${params}`);
      setPostazioni(response.data);
    } catch (error) {
      console.error("Errore:", error);
      if (error.response?.status !== 401) {
        toast.error("Errore di connessione. Riprova.");
      }
    } finally {
      setLoading(false);
    }
  }, [filters, user.ruolo]);

  useEffect(() => {
    loadPostazioni();
  }, [loadPostazioni]);

  const giorniSettimana = {
    1: "Lunedì",
    2: "Martedì",
    3: "Mercoledì",
    4: "Giovedì",
    5: "Venerdì",
    6: "Sabato",
    7: "Domenica",
  };

  const formatGiorni = (giorni) => {
    return giorni.map((g) => giorniSettimana[g]).join(", ");
  };

  const getStatusColor = (stato) => {
    return stato === "attiva"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ stato: "", giorno: "", search: "" });
  };

  const handleViewDetails = (postazione) => {
    setSelectedPostazione(postazione);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPostazione(null);
  };

  const filteredPostazioni = postazioni.filter((postazione) => {
    if (filters.stato && postazione.stato !== filters.stato) return false;
    if (
      filters.giorno &&
      !postazione.giorni_settimana.includes(parseInt(filters.giorno))
    )
      return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        postazione.luogo.toLowerCase().includes(searchLower) ||
        postazione.indirizzo.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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
            Elenco Postazioni
          </h1>
          <p className="text-gray-600 mt-1">
            Consulta le postazioni disponibili e i loro orari
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtri
          </button>
        </div>
      </div>

      {/* Filtri Espandibili */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {user.ruolo !== "volontario" && (
              <div>
                <label className="form-label">Stato</label>
                <select
                  className="form-input"
                  value={filters.stato}
                  onChange={(e) => handleFilterChange("stato", e.target.value)}
                >
                  <option value="">Tutti</option>
                  <option value="attiva">Attiva</option>
                  <option value="inattiva">Inattiva</option>
                </select>
              </div>
            )}
            <div>
              <label className="form-label">Giorno</label>
              <select
                className="form-input"
                value={filters.giorno}
                onChange={(e) => handleFilterChange("giorno", e.target.value)}
              >
                <option value="">Tutti i giorni</option>
                {Object.entries(giorniSettimana).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Cerca</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cerca per luogo..."
                  className="form-input pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="btn-secondary w-full">
                Pulisci Filtri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiche Rapide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPinIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Totale Postazioni
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {postazioni.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attive</p>
              <p className="text-2xl font-bold text-gray-900">
                {postazioni.filter((p) => p.stato === "attiva").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Slot Orari</p>
              <p className="text-2xl font-bold text-gray-900">
                {postazioni.reduce(
                  (total, p) => total + (p.slot_orari?.length || 0),
                  0
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Turni Assegnati
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {postazioni.reduce(
                  (total, p) => total + (p.turni_assegnati || 0),
                  0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista Postazioni */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Postazioni ({filteredPostazioni.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Postazione</th>
                <th className="table-header">Orari</th>
                <th className="table-header">Giorni</th>
                <th className="table-header">Max Proclamatori</th>
                {user.ruolo !== "volontario" && (
                  <th className="table-header">Stato</th>
                )}
                <th className="table-header">Turni Assegnati</th>
                <th className="table-header">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPostazioni.map((postazione) => (
                <tr key={postazione.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">
                        {postazione.luogo}
                      </div>
                      <div className="text-sm text-gray-500">
                        {postazione.indirizzo}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="space-y-1">
                      {postazione.slot_orari?.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center text-sm text-gray-900"
                        >
                          <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {slot.orario_inizio} - {slot.orario_fine}
                          <span className="ml-2 text-xs text-gray-500">
                            (max {slot.max_volontari})
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {formatGiorni(postazione.giorni_settimana)}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">
                        {postazione.max_proclamatori || 3}
                      </span>{" "}
                      proclamatori
                    </div>
                  </td>
                  {user.ruolo !== "volontario" && (
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          postazione.stato
                        )}`}
                      >
                        {postazione.stato === "attiva" ? "Attiva" : "Inattiva"}
                      </span>
                    </td>
                  )}
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {postazione.turni_assegnati || 0} turni
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-primary-600 hover:text-primary-900"
                        title="Visualizza dettagli"
                        onClick={() => handleViewDetails(postazione)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPostazioni.length === 0 && (
          <div className="text-center py-12">
            <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nessuna postazione trovata
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Prova a modificare i filtri di ricerca.
            </p>
          </div>
        )}
      </div>

      {/* Modal Dettagli Postazione */}
      {showDetailModal && selectedPostazione && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Dettagli Postazione
                </h3>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Informazioni Base */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-primary-600" />
                    Informazioni Postazione
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Luogo
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedPostazione.luogo}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Indirizzo
                      </label>
                      <p className="text-lg text-gray-900">
                        {selectedPostazione.indirizzo}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Stato
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          selectedPostazione.stato
                        )}`}
                      >
                        {selectedPostazione.stato === "attiva"
                          ? "Attiva"
                          : "Inattiva"}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Max Proclamatori
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedPostazione.max_proclamatori || 3} proclamatori
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Turni Assegnati
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedPostazione.turni_assegnati || 0} turni
                      </p>
                    </div>
                  </div>
                </div>

                {/* Giorni della Settimana */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-primary-600" />
                    Giorni di Attività
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPostazione.giorni_settimana.map((giorno) => (
                      <span
                        key={giorno}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                      >
                        {giorniSettimana[giorno]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Slot Orari */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
                    Slot Orari
                  </h4>
                  <div className="space-y-3">
                    {selectedPostazione.slot_orari?.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">
                              {slot.orario_inizio} - {slot.orario_fine}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">
                              Max {slot.max_volontari} volontari
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            slot.stato === "attivo"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {slot.stato === "attivo" ? "Attivo" : "Inattivo"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statistiche */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Statistiche
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {selectedPostazione.slot_orari?.length || 0}
                      </p>
                      <p className="text-sm text-gray-600">Slot Orari</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {selectedPostazione.turni_assegnati || 0}
                      </p>
                      <p className="text-sm text-gray-600">Turni Assegnati</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={closeDetailModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElencoPostazioni;
