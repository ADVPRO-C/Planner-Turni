import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import {
  ClockIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const TurniIncompleti = () => {
  const { user: _user } = useAuth();

  // Funzione per calcolare il range mensile (stessa logica di GestioneTurni)
  const getMonthRange = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const formatDateToISO = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      inizio: formatDateToISO(firstDay),
      fine: formatDateToISO(lastDay),
    };
  };

  // Funzione per calcolare il mese corrente
  const getCurrentMonth = () => {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth(),
    };
  };

  // Stati principali
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Calcola il mese corrente per l'inizializzazione
  const currentMonth = getCurrentMonth();
  const currentMonthRange = getMonthRange(
    currentMonth.year,
    currentMonth.month
  );

  // Mese selezionato per la visualizzazione
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDateRange, setSelectedDateRange] = useState(currentMonthRange);

  // Carica i dati strutturati per la gestione turni (stessa logica di GestioneTurni)
  const loadGestioneData = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/turni/gestione/${selectedDateRange.inizio}/${selectedDateRange.fine}`
      );
      setData(response.data);
    } catch (error) {
      console.error("Errore:", error);
      if (error.response?.status !== 401) {
        toast.error("Errore di connessione");
      }
    } finally {
      setLoading(false);
    }
  };

  // Funzione per navigare al mese precedente
  const goToPreviousMonth = () => {
    setSelectedMonth((prev) => {
      const newMonth = prev.month === 0 ? 11 : prev.month - 1;
      const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
      const newMonthRange = getMonthRange(newYear, newMonth);
      setSelectedDateRange(newMonthRange);
      return { year: newYear, month: newMonth };
    });
  };

  // Funzione per navigare al mese successivo
  const goToNextMonth = () => {
    setSelectedMonth((prev) => {
      const newMonth = prev.month === 11 ? 0 : prev.month + 1;
      const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
      const newMonthRange = getMonthRange(newYear, newMonth);
      setSelectedDateRange(newMonthRange);
      return { year: newYear, month: newMonth };
    });
  };

  // Funzione per tornare al mese corrente
  const goToCurrentMonth = () => {
    const current = getCurrentMonth();
    const currentRange = getMonthRange(current.year, current.month);
    setSelectedMonth(current);
    setSelectedDateRange(currentRange);
  };

  // Verifica se il mese selezionato è il mese corrente
  const isCurrentMonth = () => {
    const current = getCurrentMonth();
    return (
      selectedMonth.year === current.year &&
      selectedMonth.month === current.month
    );
  };

  // Funzioni di utilità (stesse di GestioneTurni)
  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", { weekday: "long" });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  const getMonthName = (year, month) => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  };

  // Verifica se una postazione è attiva per una data specifica
  const isPostazioneActiveForDate = (postazione, dateString) => {
    if (postazione.stato !== "attiva") {
      return false;
    }

    if (
      !postazione.giorni_settimana ||
      postazione.giorni_settimana.length === 0
    ) {
      return false;
    }

    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato

    // Converti in formato nostro sistema (1 = Lunedì, 2 = Martedì, ..., 7 = Domenica)
    // JavaScript: 0=Domenica, 1=Lunedì, ..., 6=Sabato
    // Nostro sistema: 1=Lunedì, 2=Martedì, ..., 7=Domenica
    const nostroGiorno = dayOfWeek === 0 ? 7 : dayOfWeek;

    return postazione.giorni_settimana.includes(nostroGiorno);
  };

  // Ottiene le assegnazioni esistenti per una data, slot e postazione
  const getExistingAssignments = (date, slotOrarioId, postazioneId) => {
    if (!data?.assegnazioni) return [];

    return data.assegnazioni.filter((a) => {
      // Controllo di sicurezza per evitare errori con data undefined
      if (!a.data) {
        console.warn("Assegnazione senza data trovata:", a);
        return false;
      }

      let assegnazioneDate;
      if (typeof a.data === "string") {
        assegnazioneDate = a.data.split("T")[0];
      } else if (a.data instanceof Date) {
        assegnazioneDate = a.data.toISOString().split("T")[0];
      } else {
        console.warn("Formato data non riconosciuto:", a.data);
        return false;
      }

      return (
        assegnazioneDate === date &&
        a.slot_orario_id === slotOrarioId &&
        a.postazione_id === postazioneId
      );
    });
  };

  // Verifica se un turno è incompleto (non assegnato o parzialmente assegnato)
  const isTurnoIncompleto = (date, slot, postazione) => {
    const existingAssignments = getExistingAssignments(
      date,
      slot.id,
      postazione.id
    );
    const maxProclamatori = postazione.max_proclamatori || 3;

    // Turno incompleto se non ha assegnazioni o ha meno del massimo
    return (
      existingAssignments.length === 0 ||
      existingAssignments.length < maxProclamatori
    );
  };

  // Placeholder per la funzione di richiesta disponibilità via email
  const handleRichiediDisponibilita = (date, slot, postazione) => {
    toast.info(
      "Funzionalità di richiesta disponibilità via email in fase di sviluppo"
    );
    console.log("Richiesta disponibilità per:", {
      data: formatDate(date),
      orario: `${formatTime(slot.orario_inizio)} - ${formatTime(
        slot.orario_fine
      )}`,
      postazione: postazione.luogo,
      postazioneId: postazione.id,
      slotId: slot.id,
    });
  };

  // Renderizza la cella di un turno incompleto
  const renderTurnoIncompletoCell = (date, slot, postazione) => {
    const existingAssignments = getExistingAssignments(
      date,
      slot.id,
      postazione.id
    );
    const maxProclamatori = postazione.max_proclamatori || 3;
    const assegnati = existingAssignments.length;
    const mancanti = maxProclamatori - assegnati;

    return (
      <div className="text-center p-2 bg-red-50 border border-red-200 rounded">
        <div className="text-xs text-red-700 font-medium mb-1">
          {assegnati === 0
            ? "Nessun assegnato"
            : `${assegnati}/${maxProclamatori} assegnati`}
        </div>
        {assegnati > 0 && (
          <div className="text-xs text-red-600 mb-2">
            {existingAssignments.map((assignment, index) => (
              <div key={index} className="mb-1">
                {assignment.nome} {assignment.cognome}
              </div>
            ))}
          </div>
        )}
        <div className="text-xs text-red-800 font-semibold mb-2">
          Mancano {mancanti} volontari
        </div>
        <button
          onClick={() => handleRichiediDisponibilita(date, slot, postazione)}
          className="btn-secondary flex items-center justify-center w-full text-xs"
          title={`Richiedi disponibilità per ${formatDate(date)} ${formatTime(
            slot.orario_inizio
          )}-${formatTime(slot.orario_fine)}`}
        >
          <EnvelopeIcon className="h-3 w-3 mr-1" />
          Richiedi
        </button>
      </div>
    );
  };

  useEffect(() => {
    loadGestioneData();
  }, [selectedDateRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento turni incompleti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Turni Incompleti</h1>
          <p className="mt-2 text-gray-600">
            Panoramica dei turni non completamente assegnati
          </p>
        </div>

        {/* Controlli di navigazione */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousMonth}
                className="btn-secondary flex items-center"
                title="Vai al mese precedente"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {getMonthName(selectedMonth.year, selectedMonth.month)}
              </h2>
              <button
                onClick={goToNextMonth}
                className="btn-secondary flex items-center"
                title="Vai al mese successivo"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <button
                onClick={goToCurrentMonth}
                className="btn-primary flex items-center"
                title={
                  isCurrentMonth() ? "Mese corrente" : "Vai al mese corrente"
                }
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                {isCurrentMonth() ? "Mese corrente" : "Vai al mese corrente"}
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-2">
            <p>
              📅 Visualizzazione del mese:{" "}
              {formatDate(selectedDateRange.inizio)} -{" "}
              {formatDate(selectedDateRange.fine)}
            </p>
            <p>🔍 Mostrando solo i turni incompleti o non assegnati</p>
          </div>
        </div>

        {/* Contenuto Turni Incompleti */}
        <div className="space-y-6">
          {data?.postazioni?.map((postazione) => {
            // Filtra solo i turni incompleti per questa postazione
            const turniIncompleti = [];

            data?.dateRange?.forEach((date) => {
              if (!isPostazioneActiveForDate(postazione, date)) return;

              postazione.slot_orari?.forEach((slot) => {
                if (isTurnoIncompleto(date, slot, postazione)) {
                  turniIncompleti.push({ date, slot, postazione });
                }
              });
            });

            // Mostra la postazione solo se ha turni incompleti
            if (turniIncompleti.length === 0) return null;

            return (
              <div key={postazione.id} className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        <MapPinIcon className="h-5 w-5 inline mr-2 text-primary-600" />
                        {postazione.luogo}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {postazione.indirizzo}
                      </p>
                      <p className="text-sm text-red-600 font-medium mt-1">
                        {turniIncompleti.length} turni incompleti
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Orario
                        </th>
                        {data?.dateRange?.map((date) => {
                          const isPostazioneAttiva = isPostazioneActiveForDate(
                            postazione,
                            date
                          );
                          return (
                            <th
                              key={date}
                              className={`px-3 py-2 text-center text-xs font-medium uppercase tracking-wider min-w-[150px] ${
                                isPostazioneAttiva
                                  ? "text-gray-500"
                                  : "text-gray-300 bg-gray-50"
                              }`}
                            >
                              <div>{getDayName(date)}</div>
                              <div
                                className={`text-xs ${
                                  isPostazioneAttiva
                                    ? "text-gray-400"
                                    : "text-gray-200"
                                }`}
                              >
                                {formatDate(date)}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {postazione.slot_orari?.map((slot) => (
                        <tr key={slot.id}>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                            <ClockIcon className="h-4 w-4 inline mr-1 text-primary-600" />
                            {formatTime(slot.orario_inizio)} -{" "}
                            {formatTime(slot.orario_fine)}
                          </td>
                          {data?.dateRange?.map((date) => {
                            const isPostazioneAttiva =
                              isPostazioneActiveForDate(postazione, date);

                            if (!isPostazioneAttiva) {
                              return (
                                <td
                                  key={`${slot.id}-${date}`}
                                  className="px-3 py-2 bg-gray-50"
                                ></td>
                              );
                            }

                            // Mostra la cella solo se il turno è incompleto
                            if (!isTurnoIncompleto(date, slot, postazione)) {
                              return (
                                <td
                                  key={`${slot.id}-${date}`}
                                  className="px-3 py-2 bg-green-50"
                                >
                                  <div className="text-center text-xs text-green-600">
                                    ✓ Completo
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={`${slot.id}-${date}`}
                                className="px-3 py-2 min-w-[150px]"
                              >
                                {renderTurnoIncompletoCell(
                                  date,
                                  slot,
                                  postazione
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TurniIncompleti;
