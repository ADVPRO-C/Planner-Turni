import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import {
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const Disponibilita = () => {
  const { user } = useAuth();
  const [postazioni, setPostazioni] = useState([]);
  const [disponibilita, setDisponibilita] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Calcola il mese corrente
  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now.getMonth() + 1);
    setCurrentYear(now.getFullYear());
  }, []);

  // Carica le postazioni e le disponibilità esistenti
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carica le postazioni
        const postazioniResponse = await api.get("/postazioni");
        setPostazioni(postazioniResponse.data);

        // Carica le disponibilità esistenti del volontario
        const disponibilitaResponse = await api.get(
          `/disponibilita/volontario/${user.id}`
        );
        const disponibilitaData = disponibilitaResponse.data;
        const disponibilitaMap = {};
        disponibilitaData.forEach((disp) => {
          const key = `${disp.data}_${disp.slot_orario_id}`;
          disponibilitaMap[key] = disp.stato === "disponibile";
        });
        setDisponibilita(disponibilitaMap);
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
        if (error.response?.status !== 401) {
          toast.error("Errore nel caricamento dei dati");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user.id]);

  // Genera le date del mese
  const generateMonthDates = (month, year) => {
    const dates = [];
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Ultimo giorno del mese

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(new Date(d));
    }

    return dates;
  };

  // Ottieni il nome del mese
  const getMonthName = (month) => {
    const months = [
      "Gennaio",
      "Febbraio",
      "Marzo",
      "Aprile",
      "Maggio",
      "Giugno",
      "Luglio",
      "Agosto",
      "Settembre",
      "Ottobre",
      "Novembre",
      "Dicembre",
    ];
    return months[month - 1];
  };

  // Ottieni il nome del giorno
  const getDayName = (date) => {
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

  // Ottieni il numero del giorno della settimana (1-7)
  const getDayNumber = (date) => {
    const day = date.getDay();
    return day === 0 ? 7 : day; // Domenica = 7, Lunedì = 1
  };

  // Filtra le postazioni per giorno e stato attivo
  const getPostazioniForDay = (dayNumber) => {
    return postazioni.filter(
      (postazione) =>
        postazione.giorni_settimana.includes(dayNumber) &&
        postazione.stato === "attiva"
    );
  };

  // Gestisce il cambio di disponibilità
  const handleDisponibilitaChange = (data, slotOrarioId, disponibile) => {
    const key = `${data}_${slotOrarioId}`;
    setDisponibilita((prev) => ({
      ...prev,
      [key]: disponibile,
    }));
  };

  // Salva le disponibilità
  const handleSaveDisponibilita = async () => {
    setSaving(true);
    try {
      const disponibilitaArray = Object.entries(disponibilita).map(
        ([key, disponibile]) => {
          const [data, slotOrarioId] = key.split("_");
          return {
            data,
            slot_orario_id: parseInt(slotOrarioId),
            stato: disponibile ? "disponibile" : "non_disponibile",
          };
        }
      );

      await api.post("/disponibilita/volontario", {
        volontario_id: user.id,
        disponibilita: disponibilitaArray,
      });

      toast.success("Disponibilità salvate con successo!");
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      if (error.response?.status !== 401) {
        toast.error("Errore di connessione");
      }
    } finally {
      setSaving(false);
    }
  };

  // Cambia trimestre
  const changeMonth = (direction) => {
    if (direction === "next") {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  // Limita la navigazione a 3 mesi avanti dal mese corrente
  const getMaxAllowedMonth = () => {
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const maxDate = new Date(currentDate);
    maxDate.setMonth(maxDate.getMonth() + 3);
    return { month: maxDate.getMonth() + 1, year: maxDate.getFullYear() };
  };

  const maxAllowed = getMaxAllowedMonth();
  const isNextDisabled =
    currentMonth === maxAllowed.month && currentYear === maxAllowed.year;
  const isPrevDisabled =
    currentMonth === 1 && currentYear === new Date().getFullYear();

  const monthDates = generateMonthDates(currentMonth, currentYear);

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
            Gestione Disponibilità
          </h1>
          <p className="text-gray-600 mt-1">
            Seleziona le tue disponibilità per il mese
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isNextDisabled && (
              <span className="text-xs text-gray-500 mr-2">
                (Limite 3 mesi avanti)
              </span>
            )}
            <button
              onClick={() => changeMonth("prev")}
              disabled={isPrevDisabled}
              className={`p-2 rounded-md ${
                isPrevDisabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <XMarkIcon className="h-5 w-5 rotate-45" />
            </button>
            <div className="text-lg font-medium min-w-[120px] text-center">
              {getMonthName(currentMonth)} {currentYear}
            </div>
            <button
              onClick={() => changeMonth("next")}
              disabled={isNextDisabled}
              className={`p-2 rounded-md ${
                isNextDisabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <XMarkIcon className="h-5 w-5 -rotate-45" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Postazioni e Orari
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthDates
                .filter((date) => {
                  const dayNumber = getDayNumber(date);
                  const postazioniForDay = getPostazioniForDay(dayNumber);
                  const isPast = date < new Date().setHours(0, 0, 0, 0);

                  // Mostra solo i giorni futuri che hanno postazioni disponibili
                  return !isPast && postazioniForDay.length > 0;
                })
                .map((date) => {
                  const dayNumber = getDayNumber(date);
                  const postazioniForDay = getPostazioniForDay(dayNumber);
                  const isToday =
                    date.toDateString() === new Date().toDateString();

                  return (
                    <tr
                      key={date.toISOString()}
                      className={isToday ? "bg-blue-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getDayName(date)} {date.getDate()}/
                              {date.getMonth() + 1}
                            </div>
                            <div className="text-sm text-gray-500">
                              {date.getFullYear()}
                            </div>
                          </div>
                          {isToday && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Oggi
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          {postazioniForDay.map((postazione) => (
                            <div
                              key={postazione.id}
                              className="border border-gray-200 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {postazione.luogo}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  Max {postazione.max_proclamatori} proclamatori
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                {postazione.indirizzo}
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {postazione.slot_orari?.map(
                                  (slot, slotIndex) => {
                                    const key = `${
                                      date.toISOString().split("T")[0]
                                    }_${slot.id}`;
                                    const isChecked =
                                      disponibilita[key] || false;

                                    return (
                                      <label
                                        key={slotIndex}
                                        className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${
                                          isChecked
                                            ? "bg-green-50 border-green-200"
                                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                          checked={isChecked}
                                          onChange={(e) =>
                                            handleDisponibilitaChange(
                                              date.toISOString().split("T")[0],
                                              slot.id,
                                              e.target.checked
                                            )
                                          }
                                        />
                                        <div className="ml-3 flex-1">
                                          <div className="text-sm font-medium text-gray-900">
                                            {slot.orario_inizio} -{" "}
                                            {slot.orario_fine}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            Max {slot.max_volontari} volontari
                                            per slot
                                          </div>
                                        </div>
                                        {isChecked && (
                                          <CheckIcon className="h-4 w-4 text-green-600" />
                                        )}
                                      </label>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informazioni */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">
              Informazioni importanti
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Seleziona le caselle per indicare le tue disponibilità</li>
                <li>
                  Vengono mostrati solo i giorni futuri con postazioni
                  disponibili
                </li>
                <li>
                  Puoi inserire disponibilità fino a 3 mesi avanti dal mese
                  corrente
                </li>
                <li>Ogni postazione richiede almeno 1 uomo per turno</li>
                <li>
                  Clicca su "Conferma Disponibilità" per salvare le tue scelte
                </li>
                <li>
                  Le tue disponibilità saranno visibili all'amministratore per
                  la compilazione automatica
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Pulsante Conferma Disponibilità */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSaveDisponibilita}
          disabled={saving}
          className="btn-primary flex items-center px-8 py-3 text-lg"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
          ) : (
            <CheckIcon className="h-6 w-6 mr-3" />
          )}
          {saving ? "Salvando..." : "Conferma Disponibilità"}
        </button>
      </div>
    </div>
  );
};

export default Disponibilita;
