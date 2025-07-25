import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const GestioneVolontari = () => {
  const { user } = useAuth();
  const [allVolontari, setAllVolontari] = useState([]); // Tutti i volontari dal server
  const [filteredVolontari, setFilteredVolontari] = useState([]); // Volontari filtrati
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVolontario, setEditingVolontario] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    password: "",
    confermaPassword: "",
    sesso: "",
    stato: "attivo",
    ruolo: "volontario",
  });
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

  // Controllo autorizzazione - spostato dopo gli hooks
  const isAuthorized = user?.ruolo === "admin";

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

  // Popola il form quando si seleziona un volontario per la modifica
  useEffect(() => {
    if (editingVolontario) {
      setFormData({
        nome: editingVolontario.nome,
        cognome: editingVolontario.cognome,
        email: editingVolontario.email || "",
        telefono: editingVolontario.telefono || "",
        password: "",
        confermaPassword: "",
        sesso: editingVolontario.sesso,
        stato: editingVolontario.stato,
        ruolo: editingVolontario.ruolo,
      });
    } else {
      resetForm();
    }
  }, [editingVolontario]);

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

  const resetForm = () => {
    setFormData({
      nome: "",
      cognome: "",
      email: "",
      telefono: "",
      password: "",
      confermaPassword: "",
      sesso: "",
      stato: "attivo",
      ruolo: "volontario",
    });
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validazione password per nuovi volontari
    if (!editingVolontario) {
      if (formData.password.length < 6) {
        toast.error("La password deve essere di almeno 6 caratteri");
        return;
      }
      if (formData.password !== formData.confermaPassword) {
        toast.error("Le password non coincidono");
        return;
      }
    }

    // Validazione password per aggiornamento
    if (
      editingVolontario &&
      formData.password &&
      formData.password.length < 6
    ) {
      toast.error("La nuova password deve essere di almeno 6 caratteri");
      return;
    }

    try {
      if (editingVolontario) {
        // Per l'aggiornamento, rimuovi la password se è vuota
        const updateData = { ...formData };
        if (!updateData.password || updateData.password.trim() === "") {
          delete updateData.password;
        }
        delete updateData.confermaPassword; // Rimuovi sempre confermaPassword
        await axios.put(`/volontari/${editingVolontario.id}`, updateData);
        toast.success("Volontario aggiornato con successo");
      } else {
        // Crea nuovo volontario
        const createData = { ...formData };
        delete createData.confermaPassword; // Rimuovi confermaPassword
        await axios.post("/volontari", createData);
        toast.success("Volontario creato con successo");
      }

      setShowModal(false);
      setEditingVolontario(null);
      resetForm();
      fetchVolontari();
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      toast.error(error.response?.data?.message || "Errore nel salvataggio");
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleDelete = async (volontarioId) => {
    // Trova il volontario da eliminare
    const volontarioToDelete = (allVolontari || []).find(
      (v) => v.id === volontarioId
    );

    // Impedisci l'eliminazione dell'admin corrente
    if (
      volontarioToDelete?.ruolo === "admin" &&
      volontarioToDelete?.id === user?.id
    ) {
      toast.error("Non puoi eliminare il tuo account admin");
      return;
    }

    if (!window.confirm("Sei sicuro di voler eliminare questo volontario?")) {
      return;
    }

    setDeletingId(volontarioId);

    // Ottimizzazione: rimuovi immediatamente dalla lista locale
    const updatedVolontari = (allVolontari || []).filter(
      (v) => v.id !== volontarioId
    );
    setAllVolontari(updatedVolontari);

    try {
      await axios.delete(`/volontari/${volontarioId}`);
      toast.success("Volontario eliminato con successo");

      // Aggiorna la lista solo se necessario
      setTimeout(() => {
        fetchVolontari();
      }, 1000);
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
      toast.error("Errore nell'eliminazione del volontario");

      // Ripristina la lista in caso di errore
      fetchVolontari();
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (volontario) => {
    setEditingVolontario(volontario);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingVolontario(null);
    setShowModal(true);
  };

  // Calcola i volontari per la pagina corrente
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedVolontari = (filteredVolontari || []).slice(
    startIndex,
    endIndex
  );
  const totalPages = Math.ceil(
    (filteredVolontari || []).length / pagination.limit
  );

  // Controllo autorizzazione
  if (!isAuthorized) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Accesso Negato
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Solo gli amministratori possono accedere a questa sezione.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestione Proclamatori
            </h1>
            <p className="text-gray-600 mt-1">
              Crea, modifica ed elimina i proclamatori del sistema
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuovo Volontario
          </button>
        </div>
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
            Gestione Volontari ({(filteredVolontari || []).length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header min-w-[150px]">Volontario</th>
                <th className="table-header">Contatti</th>
                <th className="table-header">Sesso</th>
                <th className="table-header">Stato</th>
                <th className="table-header">Ultima Assegnazione</th>
                <th className="table-header">Turni Completati</th>
                <th className="table-header">Ruolo</th>
                <th className="table-header">Azioni</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(volontario)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Modifica"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(volontario.id)}
                        disabled={deletingId === volontario.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Elimina"
                      >
                        {deletingId === volontario.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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
                Mostrando{" "}
                {(filteredVolontari || []).length > 0
                  ? (pagination.page - 1) * pagination.limit + 1
                  : 0}{" "}
                a{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  (filteredVolontari || []).length
                )}{" "}
                di {(filteredVolontari || []).length} risultati
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

      {/* Modal per creazione/modifica */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingVolontario ? "Modifica Volontario" : "Nuovo Volontario"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nome *</label>
                    <input
                      type="text"
                      required
                      className="form-input py-2"
                      value={formData.nome}
                      onChange={(e) => handleFormChange("nome", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Cognome *</label>
                    <input
                      type="text"
                      required
                      className="form-input py-2"
                      value={formData.cognome}
                      onChange={(e) =>
                        handleFormChange("cognome", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input py-2"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Telefono</label>
                  <input
                    type="tel"
                    className="form-input py-2"
                    value={formData.telefono}
                    onChange={(e) =>
                      handleFormChange("telefono", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="form-label">
                    {editingVolontario
                      ? "Nuova Password (lasciare vuoto per non cambiare)"
                      : "Password *"}
                  </label>
                  <input
                    type="password"
                    className="form-input py-2"
                    value={formData.password}
                    onChange={(e) =>
                      handleFormChange("password", e.target.value)
                    }
                    placeholder={
                      editingVolontario
                        ? "Inserisci nuova password..."
                        : "Inserisci password..."
                    }
                    minLength={editingVolontario ? 0 : 6}
                    required={!editingVolontario}
                  />
                  {editingVolontario && (
                    <p className="text-xs text-gray-500 mt-1">
                      Lascia vuoto per mantenere la password attuale
                    </p>
                  )}
                  {!editingVolontario && (
                    <p className="text-xs text-gray-500 mt-1">
                      Minimo 6 caratteri
                    </p>
                  )}
                </div>
                {!editingVolontario && (
                  <div>
                    <label className="form-label">Conferma Password *</label>
                    <input
                      type="password"
                      className="form-input py-2"
                      value={formData.confermaPassword}
                      onChange={(e) =>
                        handleFormChange("confermaPassword", e.target.value)
                      }
                      placeholder="Conferma la password..."
                      required
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Sesso *</label>
                    <select
                      required
                      className="form-input py-2"
                      value={formData.sesso}
                      onChange={(e) =>
                        handleFormChange("sesso", e.target.value)
                      }
                    >
                      <option value="">Seleziona</option>
                      <option value="M">Uomo</option>
                      <option value="F">Donna</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Stato</label>
                    <select
                      className="form-input py-2"
                      value={formData.stato}
                      onChange={(e) =>
                        handleFormChange("stato", e.target.value)
                      }
                    >
                      <option value="attivo">Attivo</option>
                      <option value="non_attivo">Non Attivo</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Ruolo</label>
                  <select
                    className="form-input py-2"
                    value={formData.ruolo}
                    onChange={(e) => handleFormChange("ruolo", e.target.value)}
                  >
                    <option value="volontario">Volontario</option>
                    <option value="admin">Amministratore</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingVolontario(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                  >
                    {editingVolontario ? "Aggiorna" : "Crea"}
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

export default GestioneVolontari;
