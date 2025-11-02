import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { TrashIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const Congregazioni = () => {
  const { user, activeCongregazione, setActiveCongregazione } = useAuth();
  const [congregazioni, setCongregazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [congregazioneToDelete, setCongregazioneToDelete] = useState(null);

  useEffect(() => {
    const loadCongregazioni = async () => {
      if (user?.ruolo !== "super_admin") {
        setCongregazioni([]);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/congregazioni");
        setCongregazioni(response.data);
      } catch (error) {
        console.error("Errore nel caricamento congregazioni:", error);
        toast.error("Impossibile caricare le congregazioni");
      } finally {
        setLoading(false);
      }
    };

    loadCongregazioni();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Inserisci un nome per la congregazione");
      return;
    }

    try {
      setCreating(true);
      const response = await api.post("/congregazioni", {
        nome: nome.trim(),
      });

      setCongregazioni((prev) => [...prev, response.data]);
      toast.success("Congregazione creata con successo");
      setNome("");
    } catch (error) {
      console.error("Errore creazione congregazione:", error);
      const message =
        error.response?.data?.message || "Impossibile creare la congregazione";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectActive = (congregazione) => {
    setActiveCongregazione({
      id: congregazione.id,
      codice: congregazione.codice,
      nome: congregazione.nome,
    });
    toast.success(
      `Congregazione attiva impostata: ${congregazione.codice} - ${congregazione.nome}`
    );
  };

  const handleDeleteClick = (congregazione) => {
    setCongregazioneToDelete(congregazione);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!congregazioneToDelete) return;

    try {
      setDeletingId(congregazioneToDelete.id);
      await api.delete(`/congregazioni/${congregazioneToDelete.id}`);

      // Se la congregazione eliminata era quella attiva, rimuovila
      if (activeCongregazione?.id === congregazioneToDelete.id) {
        setActiveCongregazione(null);
      }

      // Rimuovi dalla lista
      setCongregazioni((prev) =>
        prev.filter((c) => c.id !== congregazioneToDelete.id)
      );

      toast.success(
        `Congregazione ${congregazioneToDelete.codice} - ${congregazioneToDelete.nome} eliminata con successo`
      );
      setShowDeleteModal(false);
      setCongregazioneToDelete(null);
    } catch (error) {
      console.error("Errore eliminazione congregazione:", error);
      const message =
        error.response?.data?.message ||
        "Impossibile eliminare la congregazione";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCongregazioneToDelete(null);
  };

  if (user?.ruolo !== "super_admin") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Congregazioni</h1>
        <p className="mt-2 text-gray-600">
          Solo il SuperAdmin può accedere alla gestione delle congregazioni.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 w-1/4 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestione Congregazioni</h1>
        <p className="text-gray-600 mt-1">
          Crea nuove congregazioni, imposta quella attiva e visualizza l’elenco
          completo.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Congregazione attiva
        </h2>
        {activeCongregazione?.id ? (
          <p className="mt-2 text-gray-700">
            <span className="font-medium">{activeCongregazione.codice}</span> ·{" "}
            {activeCongregazione.nome}
          </p>
        ) : (
          <p className="mt-2 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">
            Nessuna congregazione attiva selezionata. Scegline una dall’elenco
            per operare sulle relative postazioni, volontari e turni.
          </p>
        )}
      </div>

      <form
        onSubmit={handleCreate}
        className="bg-white shadow rounded-lg p-6 space-y-4"
      >
        <div>
          <label
            htmlFor="nome"
            className="block text-sm font-medium text-gray-700"
          >
            Nome nuova congregazione
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            placeholder="Es. Palermo Uditore"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? "Creazione..." : "Crea Congregazione"}
        </button>
      </form>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Elenco congregazioni
          </h2>
          <p className="text-sm text-gray-600">
            Seleziona una congregazione per impostarla come attiva e lavorare sui
            relativi dati.
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {congregazioni.map((congregazione) => {
            const isActive = activeCongregazione?.id === congregazione.id;
            return (
              <li key={congregazione.id} className="p-6 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {congregazione.codice} · {congregazione.nome}
                  </p>
                  <p className="text-xs text-gray-500">
                    Creata il {new Date(congregazione.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectActive(congregazione)}
                    className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors ${
                      isActive
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-primary-600 border-primary-600 hover:bg-primary-50"
                    }`}
                  >
                    {isActive ? "Congregazione attiva" : "Imposta come attiva"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(congregazione)}
                    disabled={deletingId === congregazione.id}
                    className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-red-600 border border-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Elimina
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        
        {/* Modale di conferma eliminazione */}
        {showDeleteModal && congregazioneToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Conferma eliminazione
                  </h3>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  Stai per eliminare la congregazione:
                </p>
                <p className="text-base font-medium text-gray-900 mb-4">
                  {congregazioneToDelete.codice} · {congregazioneToDelete.nome}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-red-800">
                    <strong>Attenzione:</strong> La cancellazione comporterà la
                    perdita di tutti i dati associati a questa congregazione
                    (volontari, postazioni, turni, disponibilità, ecc.).
                  </p>
                  <p className="text-sm text-red-700 mt-2 font-medium">
                    L'azione è irreversibile. Vuoi procedere?
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteCancel}
                    disabled={deletingId !== null}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={deletingId !== null}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId !== null ? "Eliminazione..." : "Elimina"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Congregazioni;
