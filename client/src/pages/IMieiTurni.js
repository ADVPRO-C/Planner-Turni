import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  UserGroupIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

const IMieiTurni = () => {
  const { user } = useAuth();
  const [turni, setTurni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState(new Set());

  useEffect(() => {
    if (!user?.id) return;

    const loadTurni = async () => {
      setLoading(true);
      try {
        const response = await api.get("/turni/miei-turni");
        setTurni(response.data);
      } catch (error) {
        console.error("Errore nel caricamento turni:", error);
        if (error.response?.status === 401) {
          toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
        } else {
          toast.error(error.response?.data?.message || "Errore nel caricamento dei turni");
        }
      } finally {
        setLoading(false);
      }
    };

    loadTurni();
  }, [user?.id]);

  const toggleCard = (turnoId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(turnoId)) {
      newExpanded.delete(turnoId);
    } else {
      newExpanded.add(turnoId);
    }
    setExpandedCards(newExpanded);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = [
      "Domenica",
      "Lunedì",
      "Martedì",
      "Mercoledì",
      "Giovedì",
      "Venerdì",
      "Sabato",
    ];
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
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    // Rimuovi i secondi se presenti (formato HH:MM:SS -> HH:MM)
    return timeString.substring(0, 5);
  };

  const formatPhone = (phone) => {
    if (!phone) return "Non disponibile";
    // Formatta il numero italiano se possibile
    if (phone.length === 10 && phone.startsWith("3")) {
      return `${phone.substring(0, 3)} ${phone.substring(3, 6)} ${phone.substring(6, 8)} ${phone.substring(8)}`;
    }
    return phone;
  };

  // Raggruppa i turni per data
  const turniPerData = turni.reduce((acc, turno) => {
    const data = turno.data_turno.split("T")[0];
    if (!acc[data]) {
      acc[data] = [];
    }
    acc[data].push(turno);
    return acc;
  }, {});

  // Ordina le date
  const dateKeys = Object.keys(turniPerData).sort();

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
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          I Miei Turni
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Visualizza i tuoi turni assegnati e i compagni di squadra
        </p>
      </div>

      {/* Lista Turni */}
      {dateKeys.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            Nessun turno futuro assegnato
          </p>
          <p className="text-gray-500 text-sm mt-2">
            I tuoi turni assegnati appariranno qui non appena disponibili
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateKeys.map((data) => (
            <div key={data}>
              {/* Header Data */}
              <div className="mb-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-primary-600 mr-2" />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {formatDate(data)}
                  </h2>
                  <span className="ml-3 text-sm text-gray-500">
                    ({turniPerData[data].length} turno{turniPerData[data].length > 1 ? "i" : ""})
                  </span>
                </div>
              </div>

              {/* Cards Turni */}
              <div className="space-y-4">
                {turniPerData[data].map((turno) => {
                  const isExpanded = expandedCards.has(turno.id);
                  
                  return (
                    <div
                      key={turno.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      {/* Card Header - sempre visibile */}
                      <div
                        className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleCard(turno.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {/* Postazione */}
                            <div className="flex items-start mb-3">
                              <MapPinIcon className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                  {turno.postazione.luogo}
                                </h3>
                                {turno.postazione.indirizzo && (
                                  <p className="text-sm text-gray-600 truncate mt-1">
                                    {turno.postazione.indirizzo}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Data e Orario */}
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              <div className="flex items-center text-sm text-gray-700">
                                <ClockIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                                <span className="font-medium">
                                  {formatTime(turno.orario.inizio)} - {formatTime(turno.orario.fine)}
                                </span>
                              </div>

                              {/* Compagni count */}
                              <div className="flex items-center text-sm text-gray-700">
                                <UserGroupIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                                <span>
                                  {turno.compagni.length > 0
                                    ? `${turno.compagni.length} ${turno.compagni.length === 1 ? "compagno" : "compagni"}`
                                    : "Nessun compagno"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Icona espandi/chiudi */}
                          <button className="ml-4 flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                            {isExpanded ? (
                              <ChevronUpIcon className="h-5 w-5" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Card Body - espandibile */}
                      {isExpanded && turno.compagni.length > 0 && (
                        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-2" />
                            Compagni di Turno
                          </h4>
                          <div className="space-y-3">
                            {turno.compagni.map((compagno) => (
                              <div
                                key={compagno.id}
                                className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                                      {compagno.nome_completo}
                                    </p>
                                    {compagno.sesso && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {compagno.sesso === "M" ? "Uomo" : "Donna"}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-3 space-y-2">
                                  {compagno.telefono && (
                                    <a
                                      href={`tel:${compagno.telefono.replace(/\s/g, "")}`}
                                      className="flex items-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
                                    >
                                      <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                      <span className="break-all">{formatPhone(compagno.telefono)}</span>
                                    </a>
                                  )}
                                  {compagno.email && (
                                    <a
                                      href={`mailto:${compagno.email}`}
                                      className="flex items-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
                                    >
                                      <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                      <span className="break-all truncate">{compagno.email}</span>
                                    </a>
                                  )}
                                  {!compagno.telefono && !compagno.email && (
                                    <p className="text-xs text-gray-500">
                                      Contatti non disponibili
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Suggerimento:</strong> Clicca su un turno per vedere i dettagli dei tuoi compagni e i loro contatti.
        </p>
      </div>
    </div>
  );
};

export default IMieiTurni;
