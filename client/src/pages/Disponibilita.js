import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import {
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";


const formatDateLocal = (date) => {
  if (!(date instanceof Date)) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const Disponibilita = () => {
  const { user } = useAuth();
  const [postazioni, setPostazioni] = useState([]);
  const [disponibilita, setDisponibilita] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [expandedPostazioni, setExpandedPostazioni] = useState(new Set()); // Set di ID postazioni espanse
  const [allExpanded, setAllExpanded] = useState(false); // Flag per espansione globale

  // Calcola il mese corrente
  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now.getMonth() + 1);
    setCurrentYear(now.getFullYear());
  }, []);

  // Carica le postazioni e le disponibilità esistenti
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || !currentMonth || !currentYear) {
        return;
      }

      try {
        setLoading(true);
        // Carica le postazioni
        const postazioniResponse = await api.get("/postazioni");
        setPostazioni(postazioniResponse.data);

        // Carica le disponibilità esistenti del volontario per il mese corrente
        const dataInizio = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
        const lastDay = new Date(currentYear, currentMonth, 0).getDate();
        const dataFine = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        
        const disponibilitaResponse = await api.get(
          `/disponibilita/volontario/${user.id}?data_inizio=${dataInizio}&data_fine=${dataFine}`
        );
        const disponibilitaData = disponibilitaResponse.data;
        const disponibilitaMap = {};
        
        console.log("📥 Disponibilità caricate dal backend (INIZIALE):", JSON.stringify(disponibilitaData, null, 2));
        console.log("📥 Primo record esempio:", disponibilitaData[0]);
        
        if (disponibilitaData.length === 0) {
          console.warn("⚠️ Nessuna disponibilità trovata nel backend per questo mese!");
        }
        
        disponibilitaData.forEach((disp, index) => {
          console.log(`\n📋 Processando disponibilità ${index + 1}/${disponibilitaData.length}:`, disp);
          
          // Normalizza il formato della data
          const dataNormalizzata = normalizeDate(disp.data);
          
          if (!dataNormalizzata) {
            console.error(`❌ Data non valida per disponibilità ${index + 1}:`, disp);
            return;
          }
          
          // Assicurati che slot_orario_id sia un numero
          const slotId = typeof disp.slot_orario_id === 'number' 
            ? disp.slot_orario_id 
            : parseInt(disp.slot_orario_id, 10);
          
          if (isNaN(slotId)) {
            console.error(`❌ Slot ID non valido per disponibilità ${index + 1}:`, disp);
            return;
          }
          
          const key = `${dataNormalizzata}_${slotId}`;
          disponibilitaMap[key] = disp.stato === "disponibile";
          
          console.log(`✅ Chiave creata: "${key}" (data: "${dataNormalizzata}", slot: ${slotId}, stato: "${disp.stato}")`);
        });
        
        console.log("\n🗺️ Mappa disponibilità finale:", disponibilitaMap);
        console.log("🗺️ Chiavi nella mappa:", Object.keys(disponibilitaMap));
        console.log("🗺️ Numero totale di disponibilità mappate:", Object.keys(disponibilitaMap).length);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, currentMonth, currentYear]);

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

  // Normalizza una data in formato YYYY-MM-DD (gestisce stringhe ISO, oggetti Date, o già in formato YYYY-MM-DD)
  const normalizeDate = (dateValue) => {
    if (!dateValue) {
      console.warn("⚠️ normalizeDate ricevuto valore null/undefined:", dateValue);
      return null;
    }
    
    // Log del tipo e valore ricevuto per debug
    console.log(`🔍 normalizeDate input:`, { type: typeof dateValue, value: dateValue, isDate: dateValue instanceof Date });
    
    // Se è già una stringa YYYY-MM-DD, restituiscila così
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      console.log(`✅ Data già in formato YYYY-MM-DD: ${dateValue}`);
      return dateValue;
    }
    
    // Se è una stringa ISO (con orario), estrai solo la data
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        const result = formatDateLocal(parsed);
        console.log(`✅ Estratto da ISO string: ${dateValue} -> ${result}`);
        return result;
      }
      const extracted = dateValue.split('T')[0];
      return extracted;
    }
    
    // Se è una stringa che contiene solo data (potrebbe avere spazi o altri caratteri)
    if (typeof dateValue === 'string') {
      // Prova a estrarre il pattern YYYY-MM-DD dalla stringa
      const match = dateValue.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) {
        console.log(`✅ Estratto pattern da stringa: ${dateValue} -> ${match[1]}`);
        return match[1];
      }
      
      // Prova a parsare come Date e convertire
      const parsed = new Date(dateValue.replace(/-/g, '/'));
      if (!isNaN(parsed.getTime())) {
        const result = formatDateLocal(parsed);
        console.log(`✅ Parsato da stringa: ${dateValue} -> ${result}`);
        return result;
      }
    }
    
    // Se è un oggetto Date, convertilo in stringa YYYY-MM-DD
    if (dateValue instanceof Date) {
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      const result = `${year}-${month}-${day}`;
      console.log(`✅ Convertito da Date object: ${dateValue} -> ${result}`);
      return result;
    }
    
    console.warn(`⚠️ Impossibile normalizzare la data:`, dateValue);
    return null;
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
    // Normalizza la data e lo slot ID per creare una chiave coerente
    const dataNormalizzata = normalizeDate(data) || data;
    const slotId = typeof slotOrarioId === 'number' ? slotOrarioId : parseInt(slotOrarioId, 10);
    const key = `${dataNormalizzata}_${slotId}`;
    
    console.log(`✏️ Modifica disponibilità: ${key} = ${disponibile}`);
    
    setDisponibilita((prev) => ({
      ...prev,
      [key]: disponibile,
    }));
  };

  // Salva le disponibilità
  const handleSaveDisponibilita = async () => {
    setSaving(true);
    try {
      // Genera tutte le date del mese corrente
      const monthDates = generateMonthDates(currentMonth, currentYear);
      const dataInizio = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const dataFine = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      // Raccogli tutte le disponibilità (incluse quelle deselezionate) per il mese corrente
      const disponibilitaArray = [];
      
      // Per ogni data del mese e ogni postazione/slot, crea un record
      monthDates.forEach((date) => {
        const dayNumber = getDayNumber(date);
        const postazioniForDay = getPostazioniForDay(dayNumber);
        const dateStr = formatDateLocal(date); // YYYY-MM-DD

        postazioniForDay.forEach((postazione) => {
          postazione.slot_orari?.forEach((slot) => {
            // Normalizza la data e lo slot ID per creare una chiave coerente
            const dataNormalizzata = normalizeDate(dateStr) || dateStr;
            const slotId = typeof slot.id === 'number' ? slot.id : parseInt(slot.id, 10);
            const key = `${dataNormalizzata}_${slotId}`;
            const isChecked = disponibilita[key] === true;
            
            console.log(`💾 Preparazione salvataggio: ${key} = ${isChecked}`);
            
            // Includi solo le disponibilità selezionate (disponibile)
            // Le altre verranno implicitamente rimosse dal backend che cancella per data
            if (isChecked) {
              disponibilitaArray.push({
                data: dataNormalizzata, // Usa la data normalizzata
                slot_orario_id: slotId,
                stato: "disponibile",
                note: null,
              });
            }
          });
        });
      });

      // Se non ci sono disponibilità selezionate, informa l'utente ma procedi comunque
      if (disponibilitaArray.length === 0) {
        const confirm = window.confirm(
          "Non hai selezionato nessuna disponibilità. Vuoi salvare comunque? (Questo rimuoverà tutte le disponibilità per questo mese)"
        );
        if (!confirm) {
          setSaving(false);
          return;
        }
      }

      await api.post("/disponibilita/volontario", {
        volontario_id: user.id,
        disponibilita: disponibilitaArray,
      });

      toast.success("Disponibilità salvate con successo!");
      
      // Fai un merge intelligente: mantieni le disponibilità locali e aggiorna con quelle del backend
      // Questo previene la perdita temporanea dei dati durante il refresh
      const currentDisponibilitaMap = { ...disponibilita };
      
      // Ricarica i dati dal backend per sincronizzare
      const disponibilitaResponse = await api.get(
        `/disponibilita/volontario/${user.id}?data_inizio=${dataInizio}&data_fine=${dataFine}`
      );
      const disponibilitaData = disponibilitaResponse.data;
      
      console.log("📥 Disponibilità ricaricate dopo salvataggio:", disponibilitaData);
      console.log("📋 Disponibilità locali attuali:", currentDisponibilitaMap);
      
      // Crea la nuova mappa partendo dalle disponibilità del backend
      const backendDisponibilitaMap = {};
      
      disponibilitaData.forEach((disp) => {
        // Normalizza il formato della data
        const dataNormalizzata = normalizeDate(disp.data);
        
        if (!dataNormalizzata) {
          console.warn("⚠️ Data non valida per disponibilità dopo salvataggio:", disp);
          return;
        }
        
        // Assicurati che slot_orario_id sia un numero
        const slotId = typeof disp.slot_orario_id === 'number' 
          ? disp.slot_orario_id 
          : parseInt(disp.slot_orario_id, 10);
        
        if (isNaN(slotId)) {
          console.warn("⚠️ Slot ID non valido per disponibilità dopo salvataggio:", disp);
          return;
        }
        
        const key = `${dataNormalizzata}_${slotId}`;
        backendDisponibilitaMap[key] = disp.stato === "disponibile";
        
        console.log(`🔑 Chiave creata dopo salvataggio: ${key} (data: ${dataNormalizzata}, slot: ${slotId}, stato: ${disp.stato})`);
      });
      
      // Merge: le disponibilità del backend hanno priorità, ma manteniamo quelle locali
      // per il mese corrente che potrebbero essere state appena modificate
      const mergedDisponibilitaMap = { ...currentDisponibilitaMap, ...backendDisponibilitaMap };
      
      // Rimuovi le chiavi che non corrispondono più a slot validi (pulizia)
      // Mantieni solo le disponibilità che corrispondono al mese corrente
      const cleanedDisponibilitaMap = {};
      monthDates.forEach((date) => {
        const dayNumber = getDayNumber(date);
        const postazioniForDay = getPostazioniForDay(dayNumber);
        const dateStr = formatDateLocal(date);
        const dataNormalizzata = normalizeDate(dateStr) || dateStr;

        postazioniForDay.forEach((postazione) => {
          postazione.slot_orari?.forEach((slot) => {
            const slotId = typeof slot.id === 'number' ? slot.id : parseInt(slot.id, 10);
            const key = `${dataNormalizzata}_${slotId}`;
            if (mergedDisponibilitaMap.hasOwnProperty(key)) {
              cleanedDisponibilitaMap[key] = mergedDisponibilitaMap[key];
            }
          });
        });
      });
      
      console.log("🗺️ Mappa disponibilità finale dopo salvataggio (merged):", cleanedDisponibilitaMap);
      setDisponibilita(cleanedDisponibilitaMap);
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      console.error("Dettagli errore:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (error.response?.status !== 401) {
        const errorMessage = error.response?.data?.message || "Errore nel salvataggio delle disponibilità";
        toast.error(errorMessage);
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

  // Raggruppa le postazioni con i loro giorni e orari
  const getPostazioniGrouped = () => {
    const postazioniMap = new Map();

    monthDates.forEach((date) => {
      const dayNumber = getDayNumber(date);
      const postazioniForDay = getPostazioniForDay(dayNumber);
      const isPast = date < new Date().setHours(0, 0, 0, 0);

      // Mostra solo i giorni futuri che hanno postazioni disponibili
      if (!isPast && postazioniForDay.length > 0) {
        const dateStr = formatDateLocal(date);

        postazioniForDay.forEach((postazione) => {
          if (!postazioniMap.has(postazione.id)) {
            postazioniMap.set(postazione.id, {
              ...postazione,
              giorni: [],
            });
          }

          const postazioneData = postazioniMap.get(postazione.id);
          postazioneData.giorni.push({
            date,
            dateStr,
            dayNumber,
          });
        });
      }
    });

    return Array.from(postazioniMap.values());
  };

  // Gestisce il toggle di espansione di una postazione (solo per ID postazione)
  const togglePostazione = (postazioneId) => {
    setExpandedPostazioni((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postazioneId)) {
        newSet.delete(postazioneId);
      } else {
        newSet.add(postazioneId);
      }
      return newSet;
    });
  };

  // Gestisce l'espansione/collasso di tutte le postazioni
  const toggleAllPostazioni = () => {
    if (allExpanded) {
      // Collassa tutto
      setExpandedPostazioni(new Set());
      setAllExpanded(false);
    } else {
      // Espandi tutto
      const postazioniGrouped = getPostazioniGrouped();
      const newExpanded = new Set(postazioniGrouped.map((p) => p.id));
      setExpandedPostazioni(newExpanded);
      setAllExpanded(true);
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

      {/* Pulsante Espandi/Collassa Tutto */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleAllPostazioni}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {allExpanded ? (
            <>
              <ChevronUpIcon className="h-4 w-4 inline mr-1" />
              Collassa Tutto
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-4 w-4 inline mr-1" />
              Espandi Tutto
            </>
          )}
        </button>
      </div>

      {/* Lista Postazioni Raggruppate */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="space-y-4 p-4">
          {getPostazioniGrouped().map((postazione) => {
            const isExpanded = expandedPostazioni.has(postazione.id);
            
            // Conta quante disponibilità sono già selezionate per questa postazione
            const totalCheckedSlots = postazione.giorni.reduce((count, giorno) => {
              return (
                count +
                (postazione.slot_orari?.filter((slot) => {
                  const dataNormalizzata = normalizeDate(giorno.dateStr) || giorno.dateStr;
                  const slotId = typeof slot.id === 'number' ? slot.id : parseInt(slot.id, 10);
                  const key = `${dataNormalizzata}_${slotId}`;
                  return disponibilita[key] === true;
                }).length || 0)
              );
            }, 0);

            return (
              <div
                key={postazione.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Header postazione - sempre visibile e cliccabile */}
                <button
                  onClick={() => togglePostazione(postazione.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center flex-1">
                    {isExpanded ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500 mr-3" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-3" />
                    )}
                    <div className="text-left">
                      <h4 className="text-base font-semibold text-gray-900">
                        {postazione.luogo}
                      </h4>
                      <div className="text-sm text-gray-600 mt-0.5">
                        {postazione.indirizzo}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {postazione.giorni.length} giorno{postazione.giorni.length !== 1 ? 'i' : ''} disponibili nel mese
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {totalCheckedSlots > 0 && (
                      <div className="flex items-center space-x-1">
                        <CheckIcon className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          {totalCheckedSlots} selezionati
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-gray-500">
                      Max {postazione.max_proclamatori} proclamatori
                    </span>
                  </div>
                </button>

                {/* Contenuto giorni e orari - visibile solo se espanso */}
                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="space-y-4">
                      {postazione.giorni.map((giorno) => {
                        const isToday =
                          giorno.date.toDateString() === new Date().toDateString();

                        return (
                          <div
                            key={giorno.dateStr}
                            className={`border rounded-lg p-3 ${
                              isToday
                                ? "bg-blue-50 border-blue-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            {/* Header giorno */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {getDayName(giorno.date)} {giorno.date.getDate()}/
                                    {giorno.date.getMonth() + 1}/{giorno.date.getFullYear()}
                                  </div>
                                </div>
                                {isToday && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Oggi
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Lista orari per questo giorno */}
                            <div className="grid grid-cols-1 gap-2">
                              {postazione.slot_orari?.map((slot, slotIndex) => {
                                // Normalizza la data e l'ID dello slot per creare una chiave coerente
                                const dataNormalizzata = normalizeDate(giorno.dateStr) || giorno.dateStr;
                                const slotId = typeof slot.id === 'number' ? slot.id : parseInt(slot.id, 10);
                                const key = `${dataNormalizzata}_${slotId}`;
                                const isChecked = disponibilita[key] === true;
                                
                                // Debug logging
                                if (process.env.NODE_ENV === 'development') {
                                  console.log(`🔍 Controllo disponibilità per chiave: ${key}, trovato: ${isChecked}, disponibilitaMap keys:`, Object.keys(disponibilita));
                                }

                                return (
                                  <label
                                    key={slotIndex}
                                    className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${
                                      isChecked
                                        ? "bg-green-50 border-green-300"
                                        : "bg-white border-gray-300 hover:bg-gray-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                      checked={isChecked}
                                      onChange={(e) =>
                                        handleDisponibilitaChange(
                                          giorno.dateStr,
                                          slot.id,
                                          e.target.checked
                                        )
                                      }
                                    />
                                    <div className="ml-3 flex-1">
                                      <div className="text-sm font-medium text-gray-900">
                                        {slot.orario_inizio} - {slot.orario_fine}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Max {slot.max_volontari} volontari per slot
                                      </div>
                                    </div>
                                    {isChecked && (
                                      <CheckIcon className="h-4 w-4 text-green-600" />
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
