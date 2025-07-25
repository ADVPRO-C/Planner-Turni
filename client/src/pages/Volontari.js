import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const Volontari = () => {
  const { user } = useAuth();
  const [volontari, setVolontari] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVolontario, setEditingVolontario] = useState(null);
  const [selectedVolontario, setSelectedVolontario] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    password: "",
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchVolontari = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.stato) params.append("stato", filters.stato);
      if (filters.sesso) params.append("sesso", filters.sesso);
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await axios.get(`/volontari?${params.toString()}`);

      if (response.data.volontari) {
        setVolontari(response.data.volontari);
        setPagination(response.data.pagination);
      } else {
        setVolontari(response.data);
      }
    } catch (error) {
      console.error("Errore nel caricamento dei volontari:", error);
      toast.error("Errore nel caricamento dei volontari");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVolontari();
  }, [fetchVolontari]);

  // Popola il form quando si seleziona un volontario per la modifica
  useEffect(() => {
    if (editingVolontario) {
      setFormData({
        nome: editingVolontario.nome,
        cognome: editingVolontario.cognome,
        email: editingVolontario.email || "",
        telefono: editingVolontario.telefono || "",
        password: "",
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
    return date.toLocaleDateString("it-IT");
  };

  const handleViewDetails = (volontario) => {
    setSelectedVolontario(volontario);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
      page: 1, // Reset alla prima pagina quando cambiano i filtri
    }));
  };

  const handleSearch = (searchTerm) => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      cognome: "",
      email: "",
      telefono: "",
      password: "",
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

    try {
      if (editingVolontario) {
        // Per l'aggiornamento, rimuovi la password se è vuota
        const updateData = { ...formData };
        if (!updateData.password || updateData.password.trim() === "") {
          delete updateData.password;
        }
        await axios.put(`/volontari/${editingVolontario.id}`, updateData);
        toast.success("Volontario aggiornato con successo");
      } else {
        // Crea nuovo volontario
        await axios.post("/volontari", formData);
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
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleDelete = async (volontarioId) => {
    // Trova il volontario da eliminare
    const volontarioToDelete = volontari.find((v) => v.id === volontarioId);

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

    // Imposta lo stato di eliminazione
    setDeletingId(volontarioId);

    // Ottimizzazione: rimuovi immediatamente dalla lista locale
    const updatedVolontari = volontari.filter((v) => v.id !== volontarioId);
    setVolontari(updatedVolontari);

    try {
      console.log("Tentativo di eliminazione volontario ID:", volontarioId);
      console.log("URL richiesta:", `/volontari/${volontarioId}`);

      const response = await axios.delete(`/volontari/${volontarioId}`);
      console.log("Risposta eliminazione:", response.data);

      toast.success("Volontario eliminato con successo");

      // Aggiorna la lista solo se necessario (per sincronizzazione)
      setTimeout(() => {
        fetchVolontari();
      }, 100);
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
      console.error("URL tentata:", error.config?.url);
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);

      // Ripristina la lista in caso di errore
      fetchVolontari();
      toast.error(error.response?.data?.message || "Errore nell'eliminazione");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Proclamatori</h1>
          <p className="text-gray-600 mt-1">
            Gestione dei volontari e delle loro disponibilità
          </p>
        </div>
        {user?.ruolo === "admin" && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuovo Volontario
          </button>
        )}
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totali</p>
              <p className="text-2xl font-semibold text-gray-900">
                {volontari.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attivi</p>
              <p className="text-2xl font-semibold text-gray-900">
                {volontari.filter((v) => v.stato === "attivo").length}
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
              <p className="text-sm font-medium text-gray-600">Uomini</p>
              <p className="text-2xl font-semibold text-gray-900">
                {volontari.filter((v) => v.sesso === "M").length}
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
              <p className="text-sm font-medium text-gray-600">Donne</p>
              <p className="text-2xl font-semibold text-gray-900">
                {volontari.filter((v) => v.sesso === "F").length}
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
              className="form-input"
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
              className="form-input"
              value={filters.sesso}
              onChange={(e) => handleFilterChange("sesso", e.target.value)}
            >
              <option value="">Tutti</option>
              <option value="M">Uomini</option>
              <option value="F">Donne</option>
            </select>
          </div>
          <div>
            <label className="form-label">Ultima Assegnazione</label>
            <select className="form-input">
              <option value="">Tutti</option>
              <option value="7">Ultimi 7 giorni</option>
              <option value="30">Ultimi 30 giorni</option>
              <option value="90">Ultimi 90 giorni</option>
            </select>
          </div>
          <div>
            <label className="form-label">Cerca</label>
            <input
              type="text"
              placeholder="Nome o cognome..."
              className="form-input"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista Volontari */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Elenco Volontari ({volontari.length})
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
              {volontari.map((volontario) => (
                <tr key={volontario.id} className="hover:bg-gray-50">
                  <td className="table-cell min-w-[150px]">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">
                        {getSessoIcon(volontario.sesso)}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {volontario.nome} {volontario.cognome}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">
                        {volontario.email || "Email non specificata"}
                      </div>
                      {volontario.telefono && (
                        <div className="text-gray-500">
                          📞 {volontario.telefono}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">
                      {volontario.sesso === "M" ? "Uomo" : "Donna"}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        volontario.stato
                      )}`}
                    >
                      {volontario.stato === "attivo" ? "Attivo" : "Non Attivo"}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {formatDate(volontario.ultima_assegnazione)}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {volontario.turni_completati || 0} turni
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {volontario.ruolo === "admin" ? "Admin" : "Volontario"}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(volontario)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Visualizza dettagli"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {user?.ruolo === "admin" && (
                        <>
                          <button
                            onClick={() => {
                              setEditingVolontario(volontario);
                              setShowModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Modifica"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(volontario.id)}
                            disabled={deletingId === volontario.id}
                            className={`${
                              deletingId === volontario.id
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-900"
                            }`}
                            title={
                              deletingId === volontario.id
                                ? "Eliminazione in corso..."
                                : "Elimina"
                            }
                          >
                            {deletingId === volontario.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginazione */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                di {pagination.total} risultati
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Precedente
                </button>
                <span className="text-sm text-gray-700">
                  Pagina {pagination.page} di {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Successiva
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dettagli Volontario */}
      {selectedVolontario && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Dettagli Volontario
                </h3>
                <button
                  onClick={() => setSelectedVolontario(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Nome Completo</label>
                  <p className="text-gray-900">
                    {selectedVolontario.nome} {selectedVolontario.cognome}
                  </p>
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <p className="text-gray-900">
                    {selectedVolontario.email || "Non specificata"}
                  </p>
                </div>
                <div>
                  <label className="form-label">Telefono</label>
                  <p className="text-gray-900">
                    {selectedVolontario.telefono || "Non specificato"}
                  </p>
                </div>
                <div>
                  <label className="form-label">Sesso</label>
                  <p className="text-gray-900">
                    {selectedVolontario.sesso === "M" ? "Uomo" : "Donna"}
                  </p>
                </div>
                <div>
                  <label className="form-label">Stato</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedVolontario.stato
                    )}`}
                  >
                    {selectedVolontario.stato === "attivo"
                      ? "Attivo"
                      : "Non Attivo"}
                  </span>
                </div>
                <div>
                  <label className="form-label">Ultima Assegnazione</label>
                  <p className="text-gray-900">
                    {formatDate(selectedVolontario.ultima_assegnazione)}
                  </p>
                </div>
                <div>
                  <label className="form-label">Turni Completati</label>
                  <p className="text-gray-900">
                    {selectedVolontario.turni_completati || 0}
                  </p>
                </div>
                <div>
                  <label className="form-label">Ruolo</label>
                  <p className="text-gray-900">
                    {selectedVolontario.ruolo === "admin"
                      ? "Admin"
                      : "Volontario"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal per aggiunta/modifica volontario */}
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
                      className="form-input"
                      value={formData.nome}
                      onChange={(e) => handleFormChange("nome", e.target.value)}
                      placeholder="Nome"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Cognome *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.cognome}
                      onChange={(e) =>
                        handleFormChange("cognome", e.target.value)
                      }
                      placeholder="Cognome"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    placeholder="email@esempio.com"
                  />
                </div>
                <div>
                  <label className="form-label">Telefono</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.telefono}
                    onChange={(e) =>
                      handleFormChange("telefono", e.target.value)
                    }
                    placeholder="+39 123 456 7890"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Sesso *</label>
                    <select
                      className="form-input"
                      value={formData.sesso}
                      onChange={(e) =>
                        handleFormChange("sesso", e.target.value)
                      }
                      required
                    >
                      <option value="">Seleziona</option>
                      <option value="M">Uomo</option>
                      <option value="F">Donna</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Stato</label>
                    <select
                      className="form-input"
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
                {!editingVolontario && (
                  <div>
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) =>
                        handleFormChange("password", e.target.value)
                      }
                      placeholder="Minimo 6 caratteri"
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingVolontario(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn-primary">
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

export default Volontari;
