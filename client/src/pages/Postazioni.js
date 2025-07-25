import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Postazioni = () => {
  const { user } = useAuth();
  const [postazioni, setPostazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPostazione, setEditingPostazione] = useState(null);
  const [formData, setFormData] = useState({
    luogo: "",
    indirizzo: "",
    slotOrari: [{ orario_inizio: "", orario_fine: "" }],
    giorni_settimana: [],
  });

  useEffect(() => {
    const loadPostazioni = async () => {
      try {
        const params = new URLSearchParams();
        // Per i proclamatori, mostra solo postazioni attive
        if (user.ruolo === "volontario") {
          params.append("stato", "attiva");
        }

        const response = await fetch(`/api/postazioni?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Assicuriamoci che ogni postazione abbia un array slot_orari
          const postazioniProcessate = data.map((postazione) => ({
            ...postazione,
            slot_orari: postazione.slot_orari || [],
          }));
          setPostazioni(postazioniProcessate);
        } else if (response.status === 401) {
          toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
        } else {
          toast.error("Errore nel caricamento delle postazioni");
        }
      } catch (error) {
        console.error("Errore:", error);
        toast.error("Errore di connessione. Riprova.");
      } finally {
        setLoading(false);
      }
    };

    loadPostazioni();
  }, [user.ruolo]);

  // Popola il form quando si seleziona una postazione per la modifica
  useEffect(() => {
    if (editingPostazione) {
      setFormData({
        luogo: editingPostazione.luogo,
        indirizzo: editingPostazione.indirizzo,
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
      const response = await fetch(`/api/postazioni/${postazioneId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setPostazioni((prev) => prev.filter((p) => p.id !== postazioneId));
        toast.success("Postazione eliminata con successo!");
      } else if (response.status === 401) {
        toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.message || "Errore nell'eliminazione della postazione"
        );
      }
    } catch (error) {
      console.error("Errore:", error);
      toast.error("Errore di connessione. Riprova.");
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
      const postazioneData = {
        luogo: formData.luogo.trim(),
        indirizzo: formData.indirizzo.trim(),
        giorni_settimana: formData.giorni_settimana,
        stato: "attiva",
        slot_orari: formData.slotOrari.map((slot) => ({
          orario_inizio: slot.orario_inizio,
          orario_fine: slot.orario_fine,
          max_volontari: slot.max_volontari || 3,
        })),
      };

      const isEditing = editingPostazione !== null;
      const url = isEditing
        ? `/api/postazioni/${editingPostazione.id}`
        : "/api/postazioni";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(postazioneData),
      });

      if (response.ok) {
        const updatedPostazione = await response.json();

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
      } else if (response.status === 401) {
        toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.message ||
            `Errore nella ${
              isEditing ? "modifica" : "creazione"
            } della postazione`
        );
      }
    } catch (error) {
      console.error("Errore:", error);
      toast.error("Errore di connessione. Riprova.");
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
          <h1 className="text-2xl font-bold text-gray-900">Postazioni</h1>
          <p className="text-gray-600 mt-1">
            Gestione delle postazioni e degli orari dei turni
          </p>
        </div>
        {user?.ruolo === "admin" && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuova Postazione
          </button>
        )}
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Stato</label>
            <select className="form-input">
              <option value="">Tutti</option>
              <option value="attiva">Attiva</option>
              <option value="inattiva">Inattiva</option>
            </select>
          </div>
          <div>
            <label className="form-label">Giorno</label>
            <select className="form-input">
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
            <input
              type="text"
              placeholder="Cerca per luogo..."
              className="form-input"
            />
          </div>
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
                        className="text-primary-600 hover:text-primary-900"
                        title="Visualizza dettagli"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {user?.ruolo === "admin" && (
                        <>
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
                        </>
                      )}
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

export default Postazioni;
