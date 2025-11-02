import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const GestionePostazioni = () => {
  const { user, activeCongregazione } = useAuth();
  const [postazioni, setPostazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPostazione, setEditingPostazione] = useState(null);
  const [formData, setFormData] = useState({
    luogo: "",
    indirizzo: "",
    max_proclamatori: 3,
    slotOrari: [{ orario_inizio: "", orario_fine: "" }],
    giorni_settimana: [],
  });

  const requireCongregazioneSelezionata = () => {
    if (user?.ruolo === "super_admin" && !activeCongregazione?.id) {
      toast.error(
        "Seleziona una congregazione attiva dalla pagina Congregazioni per continuare."
      );
      return false;
    }
    return true;
  };

  useEffect(() => {
    const loadPostazioni = async () => {
      if (!requireCongregazioneSelezionata()) {
        setPostazioni([]);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/postazioni");
        const data = response.data;
        // Assicuriamoci che ogni postazione abbia un array slot_orari
        const postazioniProcessate = data.map((postazione) => ({
          ...postazione,
          slot_orari: postazione.slot_orari || [],
        }));
        setPostazioni(postazioniProcessate);
      } catch (error) {
        console.error("Errore:", error);
        if (error.response?.status === 401) {
          toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
        } else {
          toast.error(error.response?.data?.message || "Errore nel caricamento delle postazioni");
        }
      } finally {
        setLoading(false);
      }
    };

    loadPostazioni();
  }, [activeCongregazione]);

  // Popola il form quando si seleziona una postazione per la modifica
  useEffect(() => {
    if (editingPostazione) {
      setFormData({
        luogo: editingPostazione.luogo,
        indirizzo: editingPostazione.indirizzo,
        max_proclamatori: editingPostazione.max_proclamatori || 3,
        stato: editingPostazione.stato || "attiva",
        giorni_settimana: editingPostazione.giorni_settimana || [],
        slotOrari: editingPostazione.slot_orari?.map((slot) => ({
          orario_inizio:
            slot.orario_inizio?.split(":").slice(0, 2).join(":") || "",
          orario_fine: slot.orario_fine?.split(":").slice(0, 2).join(":") || "",
          max_volontari: slot.max_volontari || 3,
        })) || [{ orario_inizio: "", orario_fine: "" }],
      });
    } else {
      // Reset del form quando non si sta modificando
      resetForm();
    }
  }, [editingPostazione]);

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

  const addSlotOrario = () => {
    setFormData((prev) => ({
      ...prev,
      slotOrari: [...prev.slotOrari, { orario_inizio: "", orario_fine: "" }],
    }));
  };

  const removeSlotOrario = (index) => {
    if (formData.slotOrari.length > 1) {
      setFormData((prev) => ({
        ...prev,
        slotOrari: prev.slotOrari.filter((_, i) => i !== index),
      }));
    }
  };

  const updateSlotOrario = (index, field, value) => {
    // Rimuovi i secondi dal valore dell'orario (mantieni solo HH:MM)
    const cleanValue = field.includes("orario")
      ? value.split(":").slice(0, 2).join(":")
      : value;

    setFormData((prev) => ({
      ...prev,
      slotOrari: prev.slotOrari.map((slot, i) =>
        i === index ? { ...slot, [field]: cleanValue } : slot
      ),
    }));
  };

  const handleGiornoChange = (giorno) => {
    setFormData((prev) => ({
      ...prev,
      giorni_settimana: prev.giorni_settimana.includes(giorno)
        ? prev.giorni_settimana.filter((g) => g !== giorno)
        : [...prev.giorni_settimana, giorno],
    }));
  };

  const resetForm = () => {
    setFormData({
      luogo: "",
      indirizzo: "",
      max_proclamatori: 3,
      stato: "attiva",
      slotOrari: [{ orario_inizio: "", orario_fine: "" }],
      giorni_settimana: [],
    });
  };

  const handleDelete = async (postazioneId) => {
    if (
      !window.confirm(
        "Sei sicuro di voler eliminare questa postazione? Questa azione non può essere annullata."
      )
    ) {
      return;
    }

    try {
        await api.delete(`/postazioni/${postazioneId}`);
        setPostazioni((prev) => prev.filter((p) => p.id !== postazioneId));
        toast.success("Postazione eliminata con successo!");
    } catch (error) {
      console.error("Errore:", error);
      if (error.response?.status === 401) {
        toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
      } else {
        toast.error(error.response?.data?.message || "Errore nell'eliminazione della postazione");
      }
    }
  };

  const handleToggleStato = async (postazioneId, currentStato) => {
    const newStato = currentStato === "attiva" ? "inattiva" : "attiva";
    const action = newStato === "attiva" ? "attivare" : "disattivare";

    if (
      !window.confirm(
        `Sei sicuro di voler ${action} questa postazione? Le postazioni inattive non saranno visibili ai proclamatori.`
      )
    ) {
      return;
    }

    try {
      if (!requireCongregazioneSelezionata()) {
        return;
      }

      const response = await api.put(`/postazioni/${postazioneId}`, {
        stato: newStato,
        // Mantieni gli altri campi invariati
        luogo: postazioni.find(p => p.id === postazioneId)?.luogo,
        indirizzo: postazioni.find(p => p.id === postazioneId)?.indirizzo,
        giorni_settimana: postazioni.find(p => p.id === postazioneId)?.giorni_settimana || [],
        max_proclamatori: postazioni.find(p => p.id === postazioneId)?.max_proclamatori || 3,
        slot_orari: postazioni.find(p => p.id === postazioneId)?.slot_orari || [],
      });

      const updatedPostazione = response.data;
      setPostazioni((prev) =>
        prev.map((p) => (p.id === postazioneId ? updatedPostazione : p))
      );
      toast.success(
        `Postazione ${
          newStato === "attiva" ? "attivata" : "disattivata"
        } con successo!`
      );
    } catch (error) {
      console.error("Errore:", error);
      if (error.response?.status === 401) {
        toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
      } else {
        toast.error(error.response?.data?.message || "Errore nel cambio di stato della postazione");
      }
    }
  };

  const handleSyncDisponibilita = async () => {
    if (
      window.confirm(
        "Vuoi sincronizzare le disponibilità con le configurazioni delle postazioni? Questa operazione eliminerà le disponibilità non coerenti."
      )
    ) {
      try {
        if (!requireCongregazioneSelezionata()) {
          return;
        }

        const response = await api.post("/postazioni/sync-disponibilita", {
          congregazione_id: activeCongregazione?.id,
        });

        const result = response.data;
        toast.success(
          `Sincronizzazione completata! Eliminate ${result.deletedCount} disponibilità non coerenti.`
        );

        // Mostra statistiche dettagliate
        if (result.stats && result.stats.length > 0) {
          const statsMessage = result.stats
            .map(
              (stat) =>
                `${stat.luogo}: ${stat.disponibilita_rimanenti} disponibilità (${stat.data_inizio} - ${stat.data_fine})`
            )
            .join("\n");
          console.log("Statistiche sincronizzazione:", statsMessage);
        }
      } catch (error) {
        console.error("Errore:", error);
        if (error.response?.status === 401) {
          toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
        } else {
          toast.error(error.response?.data?.message || "Errore nella sincronizzazione");
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validazione
    if (!formData.luogo.trim() || !formData.indirizzo.trim()) {
      toast.error("Inserisci luogo e indirizzo");
      return;
    }

    if (formData.giorni_settimana.length === 0) {
      toast.error("Seleziona almeno un giorno della settimana");
      return;
    }

    // Validazione slot orari
    for (let i = 0; i < formData.slotOrari.length; i++) {
      const slot = formData.slotOrari[i];
      if (!slot.orario_inizio || !slot.orario_fine) {
        toast.error(`Completa gli orari per lo slot ${i + 1}`);
        return;
      }
      if (slot.orario_inizio >= slot.orario_fine) {
        toast.error(
          `L'orario di fine deve essere successivo all'inizio per lo slot ${
            i + 1
          }`
        );
        return;
      }
    }

    try {
      if (!requireCongregazioneSelezionata()) {
        return;
      }

      const postazioneData = {
        luogo: formData.luogo.trim(),
        indirizzo: formData.indirizzo.trim(),
        max_proclamatori: formData.max_proclamatori,
        giorni_settimana: formData.giorni_settimana,
        stato: formData.stato,
        slot_orari: formData.slotOrari.map((slot) => ({
          orario_inizio: slot.orario_inizio,
          orario_fine: slot.orario_fine,
          max_volontari: slot.max_volontari || 3,
        })),
      };

      if (user?.ruolo === "super_admin" && activeCongregazione?.id) {
        postazioneData.congregazione_id = activeCongregazione.id;
      }

      const isEditing = editingPostazione !== null;
      let response;

      if (isEditing) {
        response = await api.put(`/postazioni/${editingPostazione.id}`, postazioneData);
      } else {
        response = await api.post("/postazioni", postazioneData);
      }

      const updatedPostazione = response.data;

      if (isEditing) {
        // Aggiorna la postazione esistente nella lista
        setPostazioni((prev) =>
          prev.map((p) =>
            p.id === editingPostazione.id ? updatedPostazione : p
          )
        );
        toast.success("Postazione aggiornata con successo!");
      } else {
        // Aggiungi la nuova postazione alla lista
        setPostazioni((prev) => [...prev, updatedPostazione]);
        toast.success("Postazione creata con successo!");
      }

      setShowModal(false);
      setEditingPostazione(null);
      resetForm();
    } catch (error) {
      console.error("Errore:", error);
      if (error.response?.status === 401) {
        toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
      } else {
        const isEditing = editingPostazione !== null;
        toast.error(
          error.response?.data?.message ||
            `Errore nella ${isEditing ? "modifica" : "creazione"} della postazione`
        );
      }
    }
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
            Gestione Postazioni
          </h1>
          <p className="text-gray-600 mt-1">
            Crea, modifica e gestisci le postazioni e i loro orari
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuova Postazione
          </button>
          <button
            onClick={handleSyncDisponibilita}
            className="btn-secondary flex items-center"
            title="Sincronizza disponibilità con configurazioni postazioni"
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            Sincronizza Disponibilità
          </button>
        </div>
      </div>

      {/* Lista Postazioni */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Elenco Postazioni ({postazioni.length})
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
                <th className="table-header">Stato</th>
                <th className="table-header">Turni Assegnati</th>
                <th className="table-header">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {postazioni.map((postazione) => (
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
                  <td className="table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        postazione.stato
                      )}`}
                    >
                      {postazione.stato === "attiva" ? "Attiva" : "Inattiva"}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {postazione.turni_assegnati} turni
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleToggleStato(postazione.id, postazione.stato)
                        }
                        className={`${
                          postazione.stato === "attiva"
                            ? "text-green-600 hover:text-green-900"
                            : "text-red-600 hover:text-red-900"
                        }`}
                        title={
                          postazione.stato === "attiva"
                            ? "Disattiva postazione"
                            : "Attiva postazione"
                        }
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingPostazione(postazione);
                          setShowModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="Modifica"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(postazione.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Elimina"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal per aggiunta/modifica postazione */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingPostazione
                    ? "Modifica Postazione"
                    : "Nuova Postazione"}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingPostazione(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Luogo
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={formData.luogo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        luogo: e.target.value,
                      }))
                    }
                    placeholder="Es. Piazza del Duomo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indirizzo
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={formData.indirizzo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        indirizzo: e.target.value,
                      }))
                    }
                    placeholder="Indirizzo completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Proclamatori per Postazione
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={formData.max_proclamatori}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_proclamatori: parseInt(e.target.value) || 3,
                      }))
                    }
                    placeholder="Numero massimo di proclamatori"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Numero massimo di proclamatori che possono essere assegnati
                    a questa postazione
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stato Postazione
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={formData.stato}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stato: e.target.value,
                      }))
                    }
                  >
                    <option value="attiva">Attiva</option>
                    <option value="inattiva">Inattiva</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Le postazioni inattive non saranno visibili ai proclamatori
                    per le disponibilità
                  </p>
                </div>

                {/* Slot Orari */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Slot Orari
                    </label>
                    <button
                      type="button"
                      onClick={addSlotOrario}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Aggiungi Slot
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.slotOrari.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Inizio
                            </label>
                            <input
                              type="time"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              value={slot.orario_inizio}
                              onChange={(e) =>
                                updateSlotOrario(
                                  index,
                                  "orario_inizio",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Fine
                            </label>
                            <input
                              type="time"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              value={slot.orario_fine}
                              onChange={(e) =>
                                updateSlotOrario(
                                  index,
                                  "orario_fine",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        {formData.slotOrari.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlotOrario(index)}
                            className="p-1 text-red-600 hover:text-red-800 focus:outline-none"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giorni della settimana
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(giorniSettimana).map(([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={formData.giorni_settimana.includes(
                            parseInt(key)
                          )}
                          onChange={() => handleGiornoChange(parseInt(key))}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {value}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPostazione(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {editingPostazione ? "Aggiorna" : "Crea"}
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

export default GestionePostazioni;
