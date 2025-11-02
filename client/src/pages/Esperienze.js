import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  DocumentTextIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const Esperienze = () => {
  const { user } = useAuth();
  const [esperienze, setEsperienze] = useState([]);
  const [postazioni, setPostazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEsperienza, setEditingEsperienza] = useState(null);
  const [formData, setFormData] = useState({
    postazione_id: "",
    slot_orario_id: "",
    data: new Date().toISOString().split("T")[0],
    racconto: "",
  });
  const [slotOrariDisponibili, setSlotOrariDisponibili] = useState([]);

  const isAdmin = user?.ruolo === "admin" || user?.ruolo === "super_admin";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [esperienzeRes, postazioniRes] = await Promise.all([
        api.get("/esperienze"),
        api.get("/postazioni"),
      ]);
      setEsperienze(esperienzeRes.data);
      setPostazioni(postazioniRes.data || []);
    } catch (error) {
      console.error("Errore nel caricamento dati:", error);
      toast.error(error.response?.data?.message || "Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (esperienza = null) => {
    if (esperienza) {
      setEditingEsperienza(esperienza);
      const postazioneId = esperienza.postazione_id || "";
      setFormData({
        postazione_id: postazioneId,
        slot_orario_id: esperienza.slot_orario_id || "",
        data: esperienza.data.split("T")[0],
        racconto: esperienza.racconto || "",
      });
      // Carica gli slot orari della postazione selezionata
      if (postazioneId) {
        loadSlotOrariForPostazione(postazioneId);
      } else {
        setSlotOrariDisponibili([]);
      }
    } else {
      setEditingEsperienza(null);
      setFormData({
        postazione_id: "",
        slot_orario_id: "",
        data: new Date().toISOString().split("T")[0],
        racconto: "",
      });
      setSlotOrariDisponibili([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEsperienza(null);
    setFormData({
      postazione_id: "",
      slot_orario_id: "",
      data: new Date().toISOString().split("T")[0],
      racconto: "",
    });
    setSlotOrariDisponibili([]);
  };

  // Carica gli slot orari per una postazione selezionata
  const loadSlotOrariForPostazione = async (postazioneId) => {
    if (!postazioneId) {
      setSlotOrariDisponibili([]);
      return;
    }

    try {
      const postazione = postazioni.find((p) => p.id === parseInt(postazioneId));
      if (postazione && postazione.slot_orari) {
        // Filtra solo gli slot attivi
        const slotAttivi = postazione.slot_orari.filter(
          (slot) => slot.stato === "attivo"
        );
        setSlotOrariDisponibili(slotAttivi);
      } else {
        setSlotOrariDisponibili([]);
      }
    } catch (error) {
      console.error("Errore nel caricamento degli slot orari:", error);
      setSlotOrariDisponibili([]);
    }
  };

  // Gestisce il cambio di postazione nel form
  const handlePostazioneChange = (postazioneId) => {
    setFormData({
      ...formData,
      postazione_id: postazioneId,
      slot_orario_id: "", // Reset della fascia oraria quando si cambia postazione
    });
    loadSlotOrariForPostazione(postazioneId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.racconto.trim().length < 10) {
      toast.error("Il racconto deve contenere almeno 10 caratteri");
      return;
    }

    try {
      const payload = {
        postazione_id: formData.postazione_id || null,
        slot_orario_id: formData.slot_orario_id || null,
        data: formData.data,
        racconto: formData.racconto.trim(),
      };

      if (editingEsperienza) {
        await api.put(`/esperienze/${editingEsperienza.id}`, payload);
        toast.success("Esperienza aggiornata con successo");
      } else {
        await api.post("/esperienze", payload);
        toast.success("Esperienza creata con successo");
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      toast.error(error.response?.data?.message || "Errore nel salvataggio dell'esperienza");
    }
  };

  const handleDelete = async (esperienza) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa esperienza?")) {
      return;
    }

    try {
      await api.delete(`/esperienze/${esperienza.id}`);
      toast.success("Esperienza eliminata con successo");
      loadData();
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
      toast.error(error.response?.data?.message || "Errore nell'eliminazione dell'esperienza");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
    const months = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
    ];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Raggruppa le esperienze per data (più recenti prima)
  const esperienzeOrdinate = [...esperienze].sort((a, b) => {
    return new Date(b.data) - new Date(a.data);
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Esperienze
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {isAdmin
              ? "Visualizza e gestisci tutte le esperienze dei volontari"
              : "Visualizza e gestisci le tue esperienze"}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuova Esperienza
        </button>
      </div>

      {/* Lista Esperienze */}
      {esperienzeOrdinate.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            Nessuna esperienza registrata
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Clicca su "Nuova Esperienza" per aggiungerne una
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {esperienzeOrdinate.map((esperienza) => (
            <div
              key={esperienza.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Header con data e volontario (se admin) */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center text-sm text-gray-700">
                      <CalendarIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                      <span className="font-medium">{formatDate(esperienza.data)}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center text-sm text-gray-700">
                        <UserIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                        <span>
                          {esperienza.volontario_nome} {esperienza.volontario_cognome}
                        </span>
                      </div>
                    )}
                    {esperienza.postazione_luogo && (
                      <div className="flex items-center text-sm text-gray-700">
                        <MapPinIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                        <span>{esperienza.postazione_luogo}</span>
                      </div>
                    )}
                    {esperienza.orario_inizio && esperienza.orario_fine && (
                      <div className="flex items-center text-sm text-gray-700">
                        <ClockIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                        <span>
                          {esperienza.orario_inizio.substring(0, 5)} - {esperienza.orario_fine.substring(0, 5)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Racconto */}
                  <div className="mt-3">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {esperienza.racconto}
                    </p>
                  </div>

                  {/* Footer con data creazione */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Creata il {new Date(esperienza.created_at).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Azioni */}
                <div className="flex items-start gap-2 sm:flex-col">
                  {(!isAdmin || esperienza.volontario_id === user?.id) && (
                    <>
                      <button
                        onClick={() => handleOpenModal(esperienza)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Modifica"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(esperienza)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal per creare/modificare esperienza */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                {editingEsperienza ? "Modifica Esperienza" : "Nuova Esperienza"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                </div>

                {/* Postazione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postazione
                  </label>
                  <select
                    value={formData.postazione_id}
                    onChange={(e) => handlePostazioneChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  >
                    <option value="">Nessuna postazione specifica</option>
                    {postazioni.map((postazione) => (
                      <option key={postazione.id} value={postazione.id}>
                        {postazione.luogo}
                        {postazione.indirizzo ? ` - ${postazione.indirizzo}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fascia Oraria */}
                {formData.postazione_id && slotOrariDisponibili.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fascia Oraria
                    </label>
                    <select
                      value={formData.slot_orario_id}
                      onChange={(e) =>
                        setFormData({ ...formData, slot_orario_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                    >
                      <option value="">Nessuna fascia oraria specifica</option>
                      {slotOrariDisponibili.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.orario_inizio.substring(0, 5)} - {slot.orario_fine.substring(0, 5)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Seleziona la fascia oraria in cui è avvenuta l'esperienza
                    </p>
                  </div>
                )}

                {/* Racconto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Racconto dell'esperienza <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Includi: com'è avvenuto il contatto, argomento trattato, pubblicazioni
                    lasciate, dettagli significativi, accordi per un contatto successivo
                  </p>
                  <textarea
                    value={formData.racconto}
                    onChange={(e) =>
                      setFormData({ ...formData, racconto: e.target.value })
                    }
                    required
                    rows={8}
                    minLength={10}
                    maxLength={5000}
                    placeholder="Racconta la tua esperienza..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.racconto.length} / 5000 caratteri (minimo 10)
                  </p>
                </div>

                {/* Bottoni */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
                  >
                    {editingEsperienza ? "Aggiorna" : "Salva"} Esperienza
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                  >
                    Annulla
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

export default Esperienze;

