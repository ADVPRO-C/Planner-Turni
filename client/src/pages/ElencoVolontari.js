import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const ElencoVolontari = () => {
  const { user: _user } = useAuth();
  const [allVolontari, setAllVolontari] = useState([]); // Tutti i volontari dal server
  const [filteredVolontari, setFilteredVolontari] = useState([]); // Volontari filtrati
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    stato: "",
    sesso: "",
    search: "",
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [_searchTimeout, _setSearchTimeout] = useState(null);

  const fetchVolontari = useCallback(async () => {
    try {
      setLoading(true);
      // Richiedi tutti i volontari senza paginazione per le statistiche
      const response = await axios.get(`/volontari?limit=1000`);

      if (response.data.volontari) {
        setAllVolontari(response.data.volontari);
      } else {
        setAllVolontari(response.data);
      }
    } catch (error) {
      console.error("Errore nel caricamento dei volontari:", error);
      toast.error("Errore nel caricamento dei volontari");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVolontari();
  }, [fetchVolontari]);

  // Filtro client-side in tempo reale
  useEffect(() => {
    let filtered = [...(allVolontari || [])];

    // Filtro per ricerca (nome o cognome)
    if (searchInput.trim()) {
      const searchTerm = searchInput.toLowerCase().trim();
      filtered = filtered.filter(
        (volontario) =>
          volontario.nome?.toLowerCase().includes(searchTerm) ||
          volontario.cognome?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro per stato
    if (filters.stato) {
      filtered = filtered.filter(
        (volontario) => volontario.stato === filters.stato
      );
    }

    // Filtro per sesso
    if (filters.sesso) {
      filtered = filtered.filter(
        (volontario) => volontario.sesso === filters.sesso
      );
    }

    setFilteredVolontari(filtered);
    // Reset alla prima pagina quando cambiano i filtri
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [allVolontari, searchInput, filters.stato, filters.sesso]);

  // Cleanup del timeout quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (_searchTimeout) {
        clearTimeout(_searchTimeout);
      }
    };
  }, [_searchTimeout]);

  const getStatusColor = (stato) => {
    return stato === "attivo"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getSessoIcon = (sesso) => {
    return sesso === "M" ? "👨" : "👩";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Mai";
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
      page: 1,
    }));
  };

  const handleSearch = (searchTerm) => {
    // Aggiorna immediatamente il valore dell'input
    setSearchInput(searchTerm);
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const _handleLimitChange = (newLimit) => {
    setPagination((prev) => ({
      ...prev,
      limit: parseInt(newLimit),
      page: 1,
    }));
  };

  // Calcola i volontari paginati
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedVolontari = (filteredVolontari || []).slice(
    startIndex,
    endIndex
  );
  const totalPages = Math.ceil(
    (filteredVolontari || []).length / pagination.limit
  );

  const clearFilters = () => {
    setFilters({
      stato: "",
      sesso: "",
      search: "",
      page: 1,
      limit: 10,
    });
    setSearchInput("");
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Caricamento volontari...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Elenco Proclamatori
        </h1>
        <p className="text-gray-600 mt-1">
          Visualizza tutti i proclamatori registrati nel sistema
        </p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {searchInput.trim() || filters.stato || filters.sesso
                  ? "Risultati"
                  : "Totali"}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {searchInput.trim() || filters.stato || filters.sesso
                  ? (filteredVolontari || []).length
                  : (allVolontari || []).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100">
              <UserIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {searchInput.trim() || filters.stato || filters.sesso
                  ? "Uomini (filtro)"
                  : "Uomini"}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {searchInput.trim() || filters.stato || filters.sesso
                  ? (filteredVolontari || []).filter((v) => v.sesso === "M")
                      .length
                  : (allVolontari || []).filter((v) => v.sesso === "M").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-pink-100">
              <UserIcon className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {searchInput.trim() || filters.stato || filters.sesso
                  ? "Donne (filtro)"
                  : "Donne"}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {searchInput.trim() || filters.stato || filters.sesso
                  ? (filteredVolontari || []).filter((v) => v.sesso === "F")
                      .length
                  : (allVolontari || []).filter((v) => v.sesso === "F").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <UserIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {searchInput.trim() || filters.stato || filters.sesso
                  ? "Attivi (filtro)"
                  : "Attivi"}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {searchInput.trim() || filters.stato || filters.sesso
                  ? (filteredVolontari || []).filter(
                      (v) => v.stato === "attivo"
                    ).length
                  : (allVolontari || []).filter((v) => v.stato === "attivo")
                      .length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtri
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancella filtri
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Stato</label>
            <select
              className="form-input py-2"
              value={filters.stato}
              onChange={(e) => handleFilterChange("stato", e.target.value)}
            >
              <option value="">Tutti</option>
              <option value="attivo">Attivo</option>
              <option value="non_attivo">Non Attivo</option>
            </select>
          </div>
          <div>
            <label className="form-label">Sesso</label>
            <select
              className="form-input py-2"
              value={filters.sesso}
              onChange={(e) => handleFilterChange("sesso", e.target.value)}
            >
              <option value="">Tutti</option>
              <option value="M">Uomini</option>
              <option value="F">Donne</option>
            </select>
          </div>
          <div>
            <label className="form-label">Cerca per nome</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nome o cognome..."
                className="form-input pl-10 py-2"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          <div className="flex items-end space-x-4">
            <div className="text-sm text-gray-600">
              Risultati: {(filteredVolontari || []).length} volontari
            </div>
            <div>
              <label className="form-label">Mostra</label>
              <select
                className="form-input py-2"
                value={pagination.limit}
                onChange={(e) => {
                  setPagination((prev) => ({
                    ...prev,
                    limit: parseInt(e.target.value),
                    page: 1,
                  }));
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista Volontari */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Elenco Volontari ({(filteredVolontari || []).length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                  Volontario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contatti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sesso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ultima Assegnazione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turni Completati
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruolo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedVolontari.map((volontario) => (
                <tr key={volontario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap min-w-[150px]">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {getSessoIcon(volontario.sesso)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {volontario.nome} {volontario.cognome}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {volontario.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {volontario.email || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {volontario.telefono || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {volontario.sesso === "M" ? "Uomo" : "Donna"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        volontario.stato
                      )}`}
                    >
                      {volontario.stato === "attivo" ? "Attivo" : "Non Attivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(volontario.ultima_assegnazione)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {volontario.turni_completati || "0"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {volontario.ruolo === "admin"
                        ? "Amministratore"
                        : "Volontario"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginazione */}
        {(filteredVolontari || []).length > 10 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a{" "}
                {Math.min(endIndex, (filteredVolontari || []).length)} di{" "}
                {(filteredVolontari || []).length} risultati
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Precedente
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Pagina {pagination.page} di {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Successiva
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElencoVolontari;
