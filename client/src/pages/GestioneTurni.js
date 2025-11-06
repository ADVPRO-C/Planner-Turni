import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toastSuccess, toastError, toastInfo } from "../utils/toast";
import { api } from "../utils/api";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  PlayIcon,
  ClockIcon,
  MapPinIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const Autocompilazione = () => {
  const { user: _user } = useAuth();

  // Funzione per calcolare il range mensile
  const getMonthRange = (year, month) => {
    // Calcola il primo giorno del mese
    const firstDay = new Date(year, month, 1);

    // Calcola l'ultimo giorno del mese usando il metodo corretto
    const lastDay = new Date(year, month + 1, 0);

    // Formatta le date in formato YYYY-MM-DD evitando problemi di timezone
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

  // Stati per autocompilazione
  const [compiling, setCompiling] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stati per gestione draft locale
  const [pendingAssignments, setPendingAssignments] = useState(new Map()); // Modifiche in sospeso
  const [pendingRemovals, setPendingRemovals] = useState(new Map()); // Rimozioni in sospeso
  const [manuallyEmptiedSlots, setManuallyEmptiedSlots] = useState(new Set()); // Slot lasciati vuoti manualmente dall'utente (formato: "date-slotId-postazioneId")

  // Stato per tooltip nomi troncati
  const [tooltip, setTooltip] = useState({ show: false, text: "", x: 0, y: 0 });

  // Carica gli slot lasciati vuoti manualmente dal localStorage
  const loadManuallyEmptiedSlots = (year, month) => {
    try {
      const stored = localStorage.getItem(
        `manuallyEmptiedSlots_${year}_${month}`
      );
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Errore nel caricamento degli slot lasciati vuoti:", error);
    }
    return new Set();
  };

  // Salva gli slot lasciati vuoti manualmente nel localStorage
  const saveManuallyEmptiedSlots = (slots, year, month) => {
    try {
      localStorage.setItem(
        `manuallyEmptiedSlots_${year}_${month}`,
        JSON.stringify(Array.from(slots))
      );
    } catch (error) {
      console.error("Errore nel salvataggio degli slot lasciati vuoti:", error);
    }
  };

  // Stati per export
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTarget, setExportTarget] = useState(null); // { postazioneId, postazioneNome } o null per tutte

  // Stato per i contatori mensili
  const [contatoriMensili, setContatoriMensili] = useState({});

  // Carica i contatori mensili di disponibilità e assegnazioni
  const loadContatoriMensili = async () => {
    try {
      const response = await api.get(
        `/disponibilita/contatori-mensili?data_inizio=${selectedDateRange.inizio}&data_fine=${selectedDateRange.fine}`
      );
      setContatoriMensili(response.data);
    } catch (error) {
      console.error("Errore nel caricamento dei contatori mensili:", error);
      // Non mostrare errore all'utente per non interrompere il flusso
      setContatoriMensili({});
    }
  };

  // Carica i dati strutturati per la gestione turni
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
        toastError("Errore di connessione");
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

  useEffect(() => {
    loadGestioneData();
    loadContatoriMensili();
    // Carica gli slot lasciati vuoti manualmente per il mese corrente
    const slotsForMonth = loadManuallyEmptiedSlots(
      selectedMonth.year,
      selectedMonth.month
    );
    setManuallyEmptiedSlots(slotsForMonth);
    // Ricarica i dati quando cambia il range di date
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateRange]);

  // Funzioni di utilità
  const getDayName = (dateString) => {
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
    return days[date.getDay()];
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

  // Funzione per ottenere il nome del mese
  const getMonthName = (year, month) => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  };

  // Verifica se una postazione è attiva per una data specifica
  const isPostazioneActiveForDate = (postazione, dateString) => {
    // Verifica se la postazione è attiva
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

  // Trova i volontari disponibili per una data e slot orario specifici
  // Verifica se è necessario un uomo in una postazione
  const needsMaleVolunteer = (date, slotOrarioId, postazioneId) => {
    const existingAssignments = getExistingAssignments(
      date,
      slotOrarioId,
      postazioneId
    );

    // Controlla anche le assegnazioni in sospeso
    const key = `${date}-${slotOrarioId}-${postazioneId}`;
    const pendingAssignmentsForSlot = pendingAssignments.get(key) || [];

    // Trova i dati dei volontari in sospeso dalle disponibilità
    const pendingVolunteers = pendingAssignmentsForSlot
      .map((pending) => {
        const volunteerData = data?.disponibilita?.find(
          (d) => d.volontario_id === parseInt(pending.volontario_id)
        );
        return volunteerData;
      })
      .filter(Boolean); // Rimuovi undefined

    // Combina assegnazioni esistenti e in sospeso
    const allAssignments = [...existingAssignments, ...pendingVolunteers];

    const hasMale = allAssignments.some((a) => a.sesso === "M");

    console.log("🔍 DEBUG - needsMaleVolunteer:", {
      date,
      slotOrarioId,
      postazioneId,
      existingAssignments: existingAssignments.map(
        (a) => `${a.nome} ${a.cognome} (${a.sesso})`
      ),
      pendingVolunteers: pendingVolunteers.map(
        (v) => `${v.nome} ${v.cognome} (${v.sesso})`
      ),
      allAssignments: allAssignments.map(
        (a) => `${a.nome} ${a.cognome} (${a.sesso})`
      ),
      hasMale,
      needsMale: !hasMale,
    });

    return !hasMale;
  };

  const getAvailableVolunteers = (
    date,
    orarioInizio,
    orarioFine,
    slotOrarioId
  ) => {
    if (!data?.disponibilita) return [];

    console.log("🔍 Cercando disponibilità per:", {
      date,
      orarioInizio,
      orarioFine,
      slotOrarioId,
      totalDisponibilita: data.disponibilita.length,
    });

    const filtered = data.disponibilita.filter((d) => {
      // Gestisci correttamente le date senza problemi di timezone
      let disponibilitaDate;
      if (typeof d.data === "string") {
        // Se è già una stringa, prendi solo la parte della data
        disponibilitaDate = d.data.split("T")[0];
      } else {
        // Se è un oggetto Date, converti in formato locale
        disponibilitaDate = d.data.toISOString().split("T")[0];
      }

      const matches =
        disponibilitaDate === date &&
        d.slot_orario_id === slotOrarioId &&
        d.disponibilita_stato === "disponibile" &&
        d.volontario_stato === "attivo";

      if (matches) {
        console.log("✅ Trovata disponibilità:", d.nome, d.cognome);
      }

      return matches;
    });

    console.log("📊 Risultati trovati:", filtered.length);

    // Rimuovo il filtro automatico per gli uomini - lasciamo che sia l'autocompilazione a gestire
    // la logica di "almeno un uomo per turno"
    console.log(
      "👥 Tutti i volontari disponibili (uomini e donne):",
      filtered.length,
      "per",
      date,
      "slot",
      slotOrarioId
    );

    return filtered;
  };

  // Calcola i contatori dinamici per un volontario specifico
  const getContatoriDinamici = (volontarioId) => {
    const contatori = contatoriMensili[volontarioId] || {
      disponibilita_totali: 0,
      assegnazioni_totali: 0,
    };

    // Calcola le assegnazioni in sospeso per questo volontario nel mese corrente
    let assegnazioniInSospeso = 0;

    pendingAssignments.forEach((assignments, _key) => {
      assignments.forEach((assignment) => {
        if (assignment.volontario_id === parseInt(volontarioId)) {
          // Verifica che l'assegnazione sia nel range di date corrente
          const assignmentDate = assignment.data_turno;
          if (
            assignmentDate >= selectedDateRange.inizio &&
            assignmentDate <= selectedDateRange.fine
          ) {
            assegnazioniInSospeso++;
          }
        }
      });
    });

    // Calcola le rimozioni in sospeso per questo volontario nel mese corrente
    let rimozioniInSospeso = 0;

    pendingRemovals.forEach((volontariSet, assegnazioneId) => {
      if (!volontariSet || volontariSet.size === 0) return;
      if (!volontariSet.has(parseInt(volontarioId))) return;

      const assegnazione = data?.assegnazioni?.find(
        (a) => a.assegnazione_id === parseInt(assegnazioneId, 10)
      );
      if (assegnazione) {
        let assegnazioneDate;
        if (typeof assegnazione.data_turno === "string") {
          assegnazioneDate = assegnazione.data_turno.split("T")[0];
        } else {
          assegnazioneDate = assegnazione.data_turno
            .toISOString()
            .split("T")[0];
        }

        if (
          assegnazioneDate >= selectedDateRange.inizio &&
          assegnazioneDate <= selectedDateRange.fine
        ) {
          rimozioniInSospeso++;
        }
      }
    });

    return {
      disponibilita_totali: contatori.disponibilita_totali,
      assegnazioni_totali:
        contatori.assegnazioni_totali +
        assegnazioniInSospeso -
        rimozioniInSospeso,
    };
  };

  // Trova le assegnazioni esistenti per una data, orario e postazione specifici
  // Trova le assegnazioni esistenti per una data e slot orario specifici (incluse modifiche in sospeso)
  const getExistingAssignments = (date, slotOrarioId, postazioneId) => {
    if (!data?.assegnazioni) return [];

    // Assegnazioni dal database
    let assignments = data.assegnazioni.filter((a) => {
      // Gestisci correttamente le date senza problemi di timezone
      let assegnazioneDate;
      if (typeof a.data_turno === "string") {
        assegnazioneDate = a.data_turno.split("T")[0];
      } else {
        assegnazioneDate = a.data_turno.toISOString().split("T")[0];
      }

      return (
        assegnazioneDate === date &&
        a.slot_orario_id === slotOrarioId &&
        a.postazione_id === postazioneId
      );
    });

    // Rimuovi le assegnazioni che sono state rimosse in sospeso
    assignments = assignments.filter((a) => {
      const removedSet = pendingRemovals.get(String(a.assegnazione_id));
      return !(removedSet && removedSet.has(a.volontario_id));
    });

    return assignments;
  };

  // Verifica se una postazione è completamente assegnata per il mese corrente
  const isPostazioneComplete = (postazione) => {
    if (!data?.dateRange || !postazione.slot_orari) {
      return false;
    }

    for (const date of data.dateRange) {
      // Verifica solo le date in cui la postazione è attiva
      if (!isPostazioneActiveForDate(postazione, date)) {
        continue;
      }

      for (const slot of postazione.slot_orari) {
        const existingAssignments = getExistingAssignments(
          date,
          slot.id,
          postazione.id
        );

        const key = `${date}-${slot.id}-${postazione.id}`;
        const pendingAssignmentsForSlot = pendingAssignments.get(key) || [];

        // Filtra le assegnazioni pending che sono state rimosse
        const validPendingAssignments = pendingAssignmentsForSlot.filter(
          (pending) => {
            for (const [assegnazioneId, volontariSet] of pendingRemovals) {
              if (!volontariSet || volontariSet.size === 0) continue;
              const matchingExisting = existingAssignments.find(
                (a) =>
                  a.assegnazione_id === parseInt(assegnazioneId, 10) &&
                  a.volontario_id === pending.volontario_id
              );
              if (matchingExisting && volontariSet.has(pending.volontario_id)) {
                return false;
              }
            }
            return true;
          }
        );

        // Conta le assegnazioni totali (esistenti + pending valide)
        const totalAssignments =
          existingAssignments.length + validPendingAssignments.length;

        const maxProclamatori = postazione.max_proclamatori || 3;

        // Se lo slot è lasciato vuoto manualmente, non conta come incompleto
        if (manuallyEmptiedSlots.has(key)) {
          continue;
        }

        // Se uno slot non è completamente assegnato, la postazione non è completa
        if (totalAssignments < maxProclamatori) {
          return false;
        }
      }
    }

    // Tutti gli slot sono completi
    return true;
  };

  // Verifica se c'è almeno un uomo nelle assegnazioni (esistenti + pending)
  const hasManInSlot = (date, slotOrarioId, postazioneId) => {
    // Controlla nelle assegnazioni esistenti
    const existingAssignments = getExistingAssignments(
      date,
      slotOrarioId,
      postazioneId
    );
    const hasManInExisting = existingAssignments.some((a) => a.sesso === "M");

    if (hasManInExisting) return true;

    // Controlla nelle assegnazioni pending
    const key = `${date}-${slotOrarioId}-${postazioneId}`;
    const pendingAssignmentsForSlot = pendingAssignments.get(key) || [];

    for (const pending of pendingAssignmentsForSlot) {
      // Cerca il sesso del volontario nelle disponibilità
      const volunteerData = data?.disponibilita?.find(
        (d) =>
          d.volontario_id === pending.volontario_id &&
          d.data === date &&
          d.slot_orario_id === slotOrarioId
      );
      if (volunteerData && volunteerData.sesso === "M") {
        return true;
      }
    }

    return false;
  };

  // Gestisce l'assegnazione manuale di un volontario (salva localmente)
  const handleManualAssignment = (
    date,
    slotOrarioId,
    postazioneId,
    volontarioId
  ) => {
    console.log("🎯 Aggiungendo volontario:", {
      date,
      slotOrarioId,
      postazioneId,
      volontarioId,
    });

    // Verifica che il volontario sia effettivamente disponibile
    console.log("🔍 Verificando disponibilità per volontario:", volontarioId);
    console.log("📅 Data:", date);
    console.log("⏰ Slot:", slotOrarioId);
    console.log("📊 Disponibilità totali:", data.disponibilita?.length);

    const matchingDisponibilita = data.disponibilita?.filter(
      (d) => d.volontario_id === parseInt(volontarioId)
    );
    console.log(
      "🎯 Disponibilità trovate per questo volontario:",
      matchingDisponibilita
    );

    const isAvailable = data.disponibilita?.some(
      (d) =>
        d.volontario_id === parseInt(volontarioId) &&
        d.data === date &&
        d.slot_orario_id === parseInt(slotOrarioId) &&
        d.disponibilita_stato === "disponibile"
    );

    console.log("✅ Volontario disponibile:", isAvailable);

    if (!isAvailable) {
      toastError("Il volontario non è disponibile per questo turno");
      return;
    }

    // Verifica che il volontario non sia già assegnato nel database
    const existingAssignments = getExistingAssignments(
      date,
      slotOrarioId,
      postazioneId
    );
    const isAlreadyAssigned = existingAssignments.some(
      (a) => a.volontario_id === parseInt(volontarioId)
    );

    if (isAlreadyAssigned) {
      toastError("Il volontario è già assegnato a questo turno nel database");
      return;
    }

    // Verifica anche nelle assegnazioni in sospeso
    const key = `${date}-${slotOrarioId}-${postazioneId}`;
    const currentPendingAssignments = pendingAssignments.get(key) || [];
    const isAlreadyPending = currentPendingAssignments.some(
      (a) => a.volontario_id === parseInt(volontarioId)
    );

    if (isAlreadyPending) {
      toastError("Il volontario è già nelle assegnazioni in sospeso");
      return;
    }

    console.log("🔑 Creata chiave:", key, "con parametri:", {
      date,
      slotOrarioId,
      postazioneId,
    });
    const newPendingAssignments = new Map(pendingAssignments);

    if (!newPendingAssignments.has(key)) {
      newPendingAssignments.set(key, []);
    }

    const assignments = newPendingAssignments.get(key);

    assignments.push({
      volontario_id: parseInt(volontarioId),
      data_turno: date,
      slot_orario_id: slotOrarioId,
      postazione_id: postazioneId,
    });
    newPendingAssignments.set(key, assignments);

    console.log("📝 DEBUG - Aggiunta assegnazione in sospeso:", {
      key,
      volontarioId,
      assignments: assignments.map((a) => a.volontario_id),
      allPendingAssignments: Array.from(newPendingAssignments.entries()),
    });

    setPendingAssignments(newPendingAssignments);

    // Se questo slot era stato marcato come "lasciato vuoto manualmente",
    // rimuovilo dal Set perché ora l'utente sta aggiungendo volontari
    if (manuallyEmptiedSlots.has(key)) {
      const newManuallyEmptiedSlots = new Set(manuallyEmptiedSlots);
      newManuallyEmptiedSlots.delete(key);
      setManuallyEmptiedSlots(newManuallyEmptiedSlots);
      saveManuallyEmptiedSlots(
        newManuallyEmptiedSlots,
        selectedMonth.year,
        selectedMonth.month
      ); // Salva nel localStorage
      console.log(
        `🗑️ Slot ${key} rimosso da manuallyEmptiedSlots (volontario aggiunto manualmente)`
      );
    }

    // Forza un re-render immediato per mostrare il feedback visivo
    setTimeout(() => {
      setPendingAssignments(new Map(newPendingAssignments));
    }, 0);

    // Reset del select
    const selectElement = document.querySelector(
      `select[data-slot="${slotOrarioId}"][data-postazione="${postazioneId}"][data-date="${date}"]`
    );
    if (selectElement) {
      selectElement.value = "";
    }

    toastSuccess("Volontario aggiunto (modifiche in sospeso)");
  };

  // Rimuove un singolo volontario da un'assegnazione (salva localmente)
  const handleRemoveVolunteer = (assegnazioneId, volontarioId) => {
    console.log("🗑️ Rimuovendo volontario:", { assegnazioneId, volontarioId });

    // Converti assegnazioneId in stringa per poter usare startsWith
    const assegnazioneIdStr = String(assegnazioneId);

    // Se è un'assegnazione in sospeso (inizia con "pending-"), rimuovila dalle assegnazioni in sospeso
    if (assegnazioneIdStr.startsWith("pending-")) {
      const newPendingAssignments = new Map(pendingAssignments);

      // Trova e rimuovi l'assegnazione in sospeso
      for (const [key, assignments] of newPendingAssignments) {
        const filteredAssignments = assignments.filter(
          (a) => a.volontario_id !== parseInt(volontarioId)
        );
        if (filteredAssignments.length !== assignments.length) {
          newPendingAssignments.set(key, filteredAssignments);
          console.log(
            "✅ Rimossa assegnazione in sospeso per volontario:",
            volontarioId
          );
        }
      }

      setPendingAssignments(newPendingAssignments);
      toastSuccess("Volontario rimosso (modifiche in sospeso)");
    } else {
      // Se è un'assegnazione esistente, aggiungila alle rimozioni in sospeso
      const newPendingRemovals = new Map(pendingRemovals);
      const currentSet =
        newPendingRemovals.get(String(assegnazioneId)) || new Set();
      const updatedSet = new Set(currentSet);
      updatedSet.add(parseInt(volontarioId, 10));
      newPendingRemovals.set(String(assegnazioneId), updatedSet);
      setPendingRemovals(newPendingRemovals);

      // Marca questo slot come "lasciato vuoto manualmente" per evitare che l'autocompilazione lo riempia
      // Trova la chiave dello slot basandosi sull'assegnazione
      const assignment = data?.assegnazioni?.find(
        (a) => a.id === parseInt(assegnazioneId)
      );
      if (assignment) {
        let assignmentDate;
        if (typeof assignment.data_turno === "string") {
          assignmentDate = assignment.data_turno.split("T")[0];
        } else {
          assignmentDate = assignment.data_turno.toISOString().split("T")[0];
        }
        const slotKey = `${assignmentDate}-${assignment.slot_orario_id}-${assignment.postazione_id}`;
        const newManuallyEmptiedSlots = new Set(manuallyEmptiedSlots);
        newManuallyEmptiedSlots.add(slotKey);
        setManuallyEmptiedSlots(newManuallyEmptiedSlots);
        saveManuallyEmptiedSlots(
          newManuallyEmptiedSlots,
          selectedMonth.year,
          selectedMonth.month
        ); // Salva nel localStorage
        console.log(
          `🏷️ Slot ${slotKey} marcato come lasciato vuoto manualmente`
        );
      }

      console.log(
        "✅ Aggiunta rimozione in sospeso per assegnazione:",
        assegnazioneId
      );
      toastSuccess("Volontario rimosso (modifiche in sospeso)");
    }
  };

  // Salva tutte le modifiche in sospeso al database
  const savePendingChanges = async () => {
    if (saving) {
      return;
    }

    if (pendingAssignments.size === 0 && pendingRemovals.size === 0) {
      toastInfo("Non ci sono modifiche da salvare");
      return;
    }

    setSaving(true);

    try {
      console.log("💾 Salvando modifiche in sospeso...");
      console.log("📝 Assegnazioni in sospeso:", pendingAssignments);
      console.log("🗑️ Rimozioni in sospeso:", pendingRemovals);

      // Prima rimuovi le rimozioni in sospeso in parallelo
      const removalOperations = [];
      pendingRemovals.forEach((volontariSet, assegnazioneId) => {
        if (!volontariSet || volontariSet.size === 0) {
          return;
        }

        const assegnazioneIdNum = parseInt(assegnazioneId, 10);
        if (Number.isNaN(assegnazioneIdNum)) {
          console.error(
            `❌ ID assegnazione non valido durante la rimozione: ${assegnazioneId}`
          );
          return;
        }

        volontariSet.forEach((volontarioId) => {
          const volontarioIdNum = parseInt(volontarioId, 10);
          if (Number.isNaN(volontarioIdNum)) {
            console.error(
              `❌ ID volontario non valido durante la rimozione: ${volontarioId}`
            );
            return;
          }

          removalOperations.push({
            assegnazioneId: assegnazioneIdNum,
            volontarioId: volontarioIdNum,
          });
        });
      });

      const removalResults = await Promise.allSettled(
        removalOperations.map(({ assegnazioneId, volontarioId }) =>
          api
            .delete(
              `/turni/assegnazione/${assegnazioneId}/volontario/${volontarioId}`
            )
            .then(() => ({ assegnazioneId, volontarioId }))
        )
      );

      removalResults.forEach((result, index) => {
        const info = removalOperations[index];
        if (!info) {
          return;
        }

        if (result.status === "rejected") {
          console.error("❌ Errore rimozione:", {
            assegnazioneId: info.assegnazioneId,
            volontarioId: info.volontarioId,
            error: result.reason?.message,
            response: result.reason?.response?.data,
            status: result.reason?.response?.status,
          });
        } else {
          console.log(
            `✅ Volontario ${info.volontarioId} rimosso da assegnazione ${info.assegnazioneId}`
          );
        }
      });

      const removalErrors = removalResults.filter(
        (result) => result.status === "rejected"
      );

      // Poi aggiungi le nuove assegnazioni (evitando duplicati) in modo concorrente
      const processedVolunteers = new Map(); // key -> Set(volontario_id)
      const assignmentPayloads = [];

      for (const [key, assignments] of pendingAssignments) {
        console.log(`📝 Processando assegnazioni per ${key}:`, assignments);

        if (!processedVolunteers.has(key)) {
          processedVolunteers.set(key, new Set());
        }
        const processedForSlot = processedVolunteers.get(key);

        for (const assignment of assignments) {
          const volontarioId = parseInt(assignment.volontario_id, 10);

          if (Number.isNaN(volontarioId)) {
            console.warn(
              `⚠️ Volontario con ID non valido per lo slot ${key}, salto`,
              assignment
            );
            continue;
          }

          if (processedForSlot.has(volontarioId)) {
            console.warn(
              `⚠️ Volontario ${volontarioId} già in coda per questo slot, salto`
            );
            continue;
          }

          const existingAssignments = getExistingAssignments(
            assignment.data_turno,
            assignment.slot_orario_id,
            assignment.postazione_id
          );

          const isAlreadyAssigned = existingAssignments.some(
            (a) => a.volontario_id === volontarioId
          );

          if (isAlreadyAssigned) {
            console.warn(
              `⚠️ Volontario ${volontarioId} già assegnato nel database, salto`
            );
            processedForSlot.add(volontarioId);
            continue;
          }

          let dataTurno = assignment.data_turno;
          if (dataTurno instanceof Date) {
            dataTurno = dataTurno.toISOString().split("T")[0];
          } else if (typeof dataTurno === "string" && dataTurno.includes("T")) {
            dataTurno = dataTurno.split("T")[0];
          }

          const slotOrarioId = parseInt(assignment.slot_orario_id, 10);
          const postazioneId = parseInt(assignment.postazione_id, 10);

          if (Number.isNaN(slotOrarioId) || Number.isNaN(postazioneId)) {
            console.warn(
              `⚠️ Slot o postazione non validi per lo slot ${key}, salto`,
              assignment
            );
            continue;
          }

          const payload = {
            data_turno: dataTurno,
            slot_orario_id: slotOrarioId,
            postazione_id: postazioneId,
            volontario_id: volontarioId,
          };

          processedForSlot.add(volontarioId);
          assignmentPayloads.push({
            payload,
            debug: {
              key,
              volontarioId,
              slotOrarioId,
              postazioneId,
              dataTurno,
            },
          });
        }
      }

      const assignmentResults = await Promise.allSettled(
        assignmentPayloads.map(({ payload }) => api.post("/turni/assegna", payload))
      );

      assignmentResults.forEach((result, index) => {
        const debug = assignmentPayloads[index]?.debug;

        if (result.status === "rejected") {
          console.error("❌ Errore assegnazione volontario:", {
            ...debug,
            error: result.reason?.message,
            response: result.reason?.response?.data,
            status: result.reason?.response?.status,
          });
        } else if (debug) {
          console.log(
            `✅ Volontario ${debug.volontarioId} assegnato a slot ${debug.slotOrarioId}/${debug.postazioneId} per il ${debug.dataTurno}`
          );
        }
      });

      const assignmentErrors = assignmentResults.filter(
        (result) => result.status === "rejected"
      );

      if (removalErrors.length > 0 || assignmentErrors.length > 0) {
        const combinedErrors = [...removalErrors, ...assignmentErrors].map(
          (result) =>
            result.reason?.response?.data?.message ||
            result.reason?.message ||
            "Operazione non riuscita"
        );

        throw new Error(
          combinedErrors.length === 1
            ? combinedErrors[0]
            : `${combinedErrors.length} operazioni non sono state completate`
        );
      }

      // Salva gli slot lasciati vuoti manualmente PRIMA di pulire pendingRemovals
      // così possiamo mantenerli dopo il salvataggio
      const slotsToKeepAsEmpty = new Set(manuallyEmptiedSlots);

      // Pulisci le modifiche in sospeso
      setPendingAssignments(new Map());
      setPendingRemovals(new Map());

      // Ricarica i dati per aggiornare la visualizzazione
      await loadGestioneData();
      await loadContatoriMensili();

      // Ripristina gli slot lasciati vuoti manualmente dopo il ricaricamento
      // così l'autocompilazione continuerà a rispettarli
      setManuallyEmptiedSlots(slotsToKeepAsEmpty);
      saveManuallyEmptiedSlots(
        slotsToKeepAsEmpty,
        selectedMonth.year,
        selectedMonth.month
      ); // Salva nel localStorage

      toastSuccess("Modifiche salvate con successo");
    } catch (error) {
      console.error("Errore nel salvataggio:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Errore nel salvataggio delle modifiche";
      toastError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Calcola la data dell'ultima assegnazione per ogni volontario
  const getLastAssignmentDate = (volontarioId) => {
    // Cerca nelle assegnazioni esistenti nel database
    const existingAssignments =
      data?.assegnazioni?.filter(
        (a) => a.volontario_id === parseInt(volontarioId)
      ) || [];

    // Cerca nelle assegnazioni in sospeso
    const pendingAssignmentsForVolunteer = [];
    pendingAssignments.forEach((assignments) => {
      const assignmentsForVolunteer = assignments.filter(
        (a) => a.volontario_id === parseInt(volontarioId)
      );
      pendingAssignmentsForVolunteer.push(...assignmentsForVolunteer);
    });

    // Combina tutte le assegnazioni
    const allAssignments = [
      ...existingAssignments,
      ...pendingAssignmentsForVolunteer,
    ];

    if (allAssignments.length === 0) {
      // Se non ha mai avuto assegnazioni, restituisce una data molto vecchia (priorità alta)
      return new Date("1900-01-01");
    }

    // Trova la data più recente
    const latestDate = allAssignments.reduce((latest, assignment) => {
      const assignmentDate = new Date(assignment.data_turno);
      return assignmentDate > latest ? assignmentDate : latest;
    }, new Date("1900-01-01"));

    return latestDate;
  };

  // Ordina i volontari per data dell'ultima assegnazione (più vecchia = priorità alta)
  const sortVolunteersByLastAssignment = (volunteers) => {
    return volunteers.sort((a, b) => {
      const lastAssignmentA = getLastAssignmentDate(a.volontario_id);
      const lastAssignmentB = getLastAssignmentDate(b.volontario_id);
      return lastAssignmentA - lastAssignmentB; // Ordine crescente (più vecchia prima)
    });
  };

  // Esegue l'autocompilazione automatica per postazione specifica
  const executeAutocompilazione = async (
    postazioneId = null,
    postazioneNome = null
  ) => {
    const isSpecificAutocompilazione = postazioneId !== null;

    setCompiling(true);
    try {
      console.log(
        "🚀 Inizio autocompilazione per:",
        postazioneNome || "tutte le postazioni"
      );

      // NON pulire le assegnazioni in sospeso esistenti - preserviamo quelle già fatte
      // Inizia con le assegnazioni in sospeso esistenti
      const newPendingAssignments = new Map(pendingAssignments);
      let totalNewAssignments = 0;
      let errors = [];

      data?.postazioni?.forEach((postazione) => {
        if (postazioneId && postazione.id !== postazioneId) return;

        console.log(`🔍 Autocompilazione per postazione: ${postazione.luogo}`);

        data?.dateRange?.forEach((date) => {
          if (!isPostazioneActiveForDate(postazione, date)) return;

          postazione.slot_orari?.forEach((slot) => {
            try {
              const existingAssignments = getExistingAssignments(
                date,
                slot.id,
                postazione.id
              );

              // Ottieni anche le assegnazioni in sospeso per questo slot
              const key = `${date}-${slot.id}-${postazione.id}`;
              const existingPendingForSlot =
                newPendingAssignments.get(key) || [];

              // IMPORTANTE: Verifica se questo slot è stato lasciato vuoto manualmente dall'utente
              const slotKey = `${date}-${slot.id}-${postazione.id}`;
              if (manuallyEmptiedSlots.has(slotKey)) {
                console.log(
                  `⏭️ Slot ${slotKey} è stato lasciato vuoto manualmente dall'utente, salto (non autocompilare)`
                );
                return;
              }

              // IMPORTANTE: Verifica se ci sono rimozioni in sospeso per questo slot
              // Se ci sono rimozioni, NON autocompilare questo slot (l'utente ha voluto lasciarlo libero)
              const hasPendingRemovals = Array.from(
                pendingRemovals.entries()
              ).some(([assegnazioneId, volontariSet]) => {
                if (!volontariSet || volontariSet.size === 0) {
                  return false;
                }

                const removedAssignment = existingAssignments.find(
                  (a) =>
                    a.assegnazione_id === parseInt(assegnazioneId, 10) &&
                    volontariSet.has(a.volontario_id)
                );
                if (removedAssignment) {
                  return true;
                }

                const assignmentForSlot = data?.assegnazioni?.find((a) => {
                  let assegnazioneDate;
                  if (typeof a.data_turno === "string") {
                    assegnazioneDate = a.data_turno.split("T")[0];
                  } else {
                    assegnazioneDate = a.data_turno.toISOString().split("T")[0];
                  }
                  return (
                    parseInt(a.id) === parseInt(assegnazioneId, 10) &&
                    assegnazioneDate === date &&
                    a.slot_orario_id === slot.id &&
                    a.postazione_id === postazione.id &&
                    Array.from(volontariSet).includes(a.volontario_id)
                  );
                });
                return assignmentForSlot !== undefined;
              });

              // Se ci sono rimozioni in sospeso per questo slot, NON autocompilare
              // L'utente ha voluto lasciare questo slot libero
              if (hasPendingRemovals) {
                // Marca anche questo slot come lasciato vuoto manualmente
                const newManuallyEmptiedSlots = new Set(manuallyEmptiedSlots);
                newManuallyEmptiedSlots.add(slotKey);
                setManuallyEmptiedSlots(newManuallyEmptiedSlots);
                saveManuallyEmptiedSlots(
                  newManuallyEmptiedSlots,
                  selectedMonth.year,
                  selectedMonth.month
                ); // Salva nel localStorage
                console.log(
                  `⏭️ Slot con rimozioni in sospeso per ${date} ${slot.orario_inizio}-${slot.orario_fine} - ${postazione.luogo}, salto (l'utente ha voluto lasciarlo libero)`
                );
                return;
              }

              // Combina assegnazioni esistenti e pending per calcolare il totale
              const allAssignedVolunteerIds = new Set([
                ...existingAssignments.map((a) => a.volontario_id),
                ...existingPendingForSlot.map((a) => parseInt(a.volontario_id)),
              ]);

              const maxProclamatori = postazione.max_proclamatori || 3;
              const totalAssigned = allAssignedVolunteerIds.size;

              // Se lo slot è già completo, salta (NON toccare le assegnazioni esistenti)
              if (totalAssigned >= maxProclamatori) {
                console.log(
                  `⏭️ Slot già completo (${totalAssigned}/${maxProclamatori}), salto`
                );
                return;
              }

              const availableVolunteers = getAvailableVolunteers(
                date,
                slot.orario_inizio,
                slot.orario_fine,
                slot.id
              );

              console.log(
                `📅 ${date} ${slot.orario_inizio}-${slot.orario_fine}:`,
                {
                  existingAssignments: existingAssignments.length,
                  existingPending: existingPendingForSlot.length,
                  totalAssigned,
                  maxProclamatori,
                  availableVolunteers: availableVolunteers.length,
                  volunteers: availableVolunteers.map(
                    (v) => `${v.nome} ${v.cognome} (${v.sesso})`
                  ),
                }
              );

              // Calcola quanti volontari servono ancora (considerando anche pending)
              const volunteersNeeded = maxProclamatori - totalAssigned;

              // Filtra volontari già assegnati (esistenti + pending) e disponibili
              const availableForAssignment = availableVolunteers.filter(
                (v) => !allAssignedVolunteerIds.has(v.volontario_id)
              );

              console.log(`🎯 Volontari da assegnare: ${volunteersNeeded}`, {
                availableForAssignment: availableForAssignment.map(
                  (v) => `${v.nome} ${v.cognome} (${v.sesso})`
                ),
              });

              // Logica corretta per rispettare "almeno un uomo per turno" con distribuzione intelligente
              const volunteersToAssign = [];

              // Controlla se serve un uomo
              const needsMale = needsMaleVolunteer(
                date,
                slot.id,
                postazione.id
              );
              console.log(`🔍 Serve un uomo? ${needsMale}`);

              if (needsMale) {
                // Prima cerca un uomo disponibile con l'ultima assegnazione più vecchia
                const availableMen = availableForAssignment.filter(
                  (v) => v.sesso === "M"
                );

                if (availableMen.length > 0) {
                  // Ordina gli uomini per data dell'ultima assegnazione
                  const sortedMen =
                    sortVolunteersByLastAssignment(availableMen);
                  const selectedMan = sortedMen[0];

                  volunteersToAssign.push(selectedMan);
                  console.log(
                    `👨 Assegnato uomo (ultima assegnazione: ${getLastAssignmentDate(
                      selectedMan.volontario_id
                    ).toLocaleDateString()}): ${selectedMan.nome} ${
                      selectedMan.cognome
                    }`
                  );

                  // Rimuovi l'uomo assegnato dalla lista disponibile
                  const remainingAvailable = availableForAssignment.filter(
                    (v) => v.volontario_id !== selectedMan.volontario_id
                  );

                  // Assegna gli altri volontari necessari con distribuzione intelligente
                  const additionalNeeded = volunteersNeeded - 1;
                  if (additionalNeeded > 0 && remainingAvailable.length > 0) {
                    // Ordina i rimanenti per data dell'ultima assegnazione
                    const sortedRemaining =
                      sortVolunteersByLastAssignment(remainingAvailable);
                    const additionalVolunteers = sortedRemaining.slice(
                      0,
                      additionalNeeded
                    );

                    volunteersToAssign.push(...additionalVolunteers);
                    console.log(
                      `👥 Assegnati altri (distribuzione intelligente): ${additionalVolunteers
                        .map(
                          (v) =>
                            `${v.nome} ${v.cognome} (${
                              v.sesso
                            }, ultima: ${getLastAssignmentDate(
                              v.volontario_id
                            ).toLocaleDateString()})`
                        )
                        .join(", ")}`
                    );
                  }
                } else {
                  const errorMsg = `⚠️ Nessun uomo disponibile per ${date} ${slot.orario_inizio}-${slot.orario_fine} - ${postazione.luogo}`;
                  console.log(errorMsg);
                  errors.push(errorMsg);
                }
              } else {
                // Non serve un uomo, assegna chi vuoi con distribuzione intelligente
                const sortedVolunteers = sortVolunteersByLastAssignment(
                  availableForAssignment
                );
                const selectedVolunteers = sortedVolunteers.slice(
                  0,
                  volunteersNeeded
                );

                volunteersToAssign.push(...selectedVolunteers);
                console.log(
                  `👥 Assegnati tutti (distribuzione intelligente): ${selectedVolunteers
                    .map(
                      (v) =>
                        `${v.nome} ${v.cognome} (${
                          v.sesso
                        }, ultima: ${getLastAssignmentDate(
                          v.volontario_id
                        ).toLocaleDateString()})`
                    )
                    .join(", ")}`
                );
              }

              if (volunteersToAssign.length > 0) {
                // Aggiungi le nuove assegnazioni a quelle già esistenti per questo slot
                const existingPendingForThisSlot =
                  newPendingAssignments.get(key) || [];
                const newAssignments = volunteersToAssign.map((volunteer) => ({
                  volontario_id: parseInt(volunteer.volontario_id),
                  data_turno: date,
                  slot_orario_id: slot.id,
                  postazione_id: postazione.id,
                }));

                // Combina le nuove assegnazioni con quelle già in sospeso per questo slot
                const combinedAssignments = [
                  ...existingPendingForThisSlot,
                  ...newAssignments,
                ];

                console.log(
                  `✅ Aggiunte ${newAssignments.length} nuove assegnazioni a slot (totale pending per questo slot: ${combinedAssignments.length}):`,
                  newAssignments.map((a) => a.volontario_id)
                );

                newPendingAssignments.set(key, combinedAssignments);
                totalNewAssignments += newAssignments.length;
              }
            } catch (error) {
              const errorMsg = `Errore nell'elaborazione di ${date} ${slot.orario_inizio}-${slot.orario_fine}: ${error.message}`;
              console.error(errorMsg);
              errors.push(errorMsg);
            }
          });
        });
      });

      // Aggiorna le assegnazioni in sospeso (mantenendo quelle esistenti)
      setPendingAssignments(newPendingAssignments);

      const successMessage = isSpecificAutocompilazione
        ? `Autocompilazione completata per "${postazioneNome}" nel mese ${getMonthName(
            selectedMonth.year,
            selectedMonth.month
          )}: ${totalNewAssignments} nuove assegnazioni aggiunte`
        : `Autocompilazione completata per ${getMonthName(
            selectedMonth.year,
            selectedMonth.month
          )}: ${totalNewAssignments} nuove assegnazioni aggiunte`;

      toastSuccess(successMessage);

      if (errors.length > 0) {
        console.warn(
          "⚠️ Autocompilazione: slot senza uomini disponibili:",
          errors
        );

        toastError(
          `Autocompilazione completata con ${errors.length} avvisi.\n` +
            `Ci sono ancora ${errors.length} turni per cui non è disponibile un uomo.\n` +
            `Suggerimenti: apri "Turni Incompleti" per vedere i dettagli, ` +
            `aggiungi disponibilità maschili per quelle date/slot oppure completa manualmente e poi premi "Salva Modifiche".`,
          { duration: 7000 }
        );
      }

      if (totalNewAssignments > 0) {
        toastInfo("Clicca 'Salva Modifiche' per confermare le assegnazioni", {
          icon: "💾",
          duration: 4000,
        });
      } else {
        toastInfo(
          "Nessuna nuova assegnazione necessaria. Tutti gli slot vuoti/incompleti sono stati completati.",
          {
            icon: "✅",
            duration: 3000,
          }
        );
      }
    } catch (error) {
      console.error("❌ Errore nell'autocompilazione:", error);
      toastError(`Errore nell'autocompilazione: ${error.message}`);
    } finally {
      setCompiling(false);
    }
  };

  // Reset delle assegnazioni per postazione specifica
  const handleReset = async (postazioneId = null, postazioneNome = null) => {
    const isSpecificReset = postazioneId !== null;
    const confirmMessage = isSpecificReset
      ? `Sei sicuro di voler eliminare tutte le assegnazioni di "${postazioneNome}" per il mese ${getMonthName(
          selectedMonth.year,
          selectedMonth.month
        )}? Questa azione non può essere annullata.`
      : `Sei sicuro di voler eliminare tutte le assegnazioni del mese ${getMonthName(
          selectedMonth.year,
          selectedMonth.month
        )}? Questa azione non può essere annullata.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setCompiling(true);
    try {
      const result = await api.post("/turni/reset", {
        data_inizio: selectedDateRange.inizio,
        data_fine: selectedDateRange.fine,
        postazione_id: postazioneId, // Aggiunto parametro per postazione specifica
      });

      const resultData = result?.data || result;
      const successMessage = isSpecificReset
        ? `Reset completato per "${postazioneNome}" nel mese ${getMonthName(
            selectedMonth.year,
            selectedMonth.month
          )}: ${resultData.assegnazioni_eliminate || 0} assegnazioni eliminate`
        : `Reset completato per ${getMonthName(
            selectedMonth.year,
            selectedMonth.month
          )}: ${resultData.assegnazioni_eliminate || 0} assegnazioni eliminate`;

      toastSuccess(successMessage);
      await loadGestioneData(); // Ricarica i dati
      // Pulisci anche le assegnazioni in sospeso e gli slot lasciati vuoti dopo il reset
      setPendingAssignments(new Map());
      setPendingRemovals(new Map());
      const emptySlots = new Set();
      setManuallyEmptiedSlots(emptySlots);
      saveManuallyEmptiedSlots(
        emptySlots,
        selectedMonth.year,
        selectedMonth.month
      ); // Salva nel localStorage
    } catch (error) {
      console.error("Errore:", error);
      toastError(
        error.response?.data?.message ||
          error.message ||
          "Errore di connessione"
      );
    } finally {
      setCompiling(false);
    }
  };

  // Funzioni per l'export delle tabelle mensili
  const checkIncompleteAssignments = (postazioneId = null) => {
    const incompleteSlots = [];

    data?.postazioni?.forEach((postazione) => {
      if (postazioneId && postazione.id !== postazioneId) return;

      data?.dateRange?.forEach((date) => {
        if (!isPostazioneActiveForDate(postazione, date)) return;

        postazione.slot_orari?.forEach((slot) => {
          const existingAssignments = getExistingAssignments(
            date,
            slot.id,
            postazione.id
          );
          const maxProclamatori = postazione.max_proclamatori || 3;

          if (
            existingAssignments.length > 0 &&
            existingAssignments.length < maxProclamatori
          ) {
            incompleteSlots.push({
              postazione: postazione.luogo,
              data: formatDate(date),
              orario: `${formatTime(slot.orario_inizio)} - ${formatTime(
                slot.orario_fine
              )}`,
              assegnati: existingAssignments.length,
              max: maxProclamatori,
            });
          }
        });
      });
    });

    return incompleteSlots;
  };

  const exportToPDF = async (postazioneId = null, postazioneNome = null) => {
    setExporting(true);

    try {
      const isSpecificExport = postazioneId !== null;
      const incompleteSlots = checkIncompleteAssignments(postazioneId);

      if (incompleteSlots.length > 0) {
        const confirmMessage = `Alcuni turni non sono completamente assegnati:\n\n${incompleteSlots
          .slice(0, 3)
          .map(
            (slot) =>
              `• ${slot.postazione} - ${slot.data} ${slot.orario} (${slot.assegnati}/${slot.max})`
          )
          .join("\n")}${
          incompleteSlots.length > 3
            ? `\n... e altri ${incompleteSlots.length - 3} turni`
            : ""
        }\n\nVuoi davvero esportare la tabella?`;

        if (!window.confirm(confirmMessage)) {
          setExporting(false);
          return;
        }
      }

      const doc = new jsPDF("landscape", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      // Titolo del documento
      const title = isSpecificExport
        ? `Turni Mensili - ${postazioneNome}`
        : `Turni Mensili - Tutte le Postazioni`;
      const subtitle = `${getMonthName(
        selectedMonth.year,
        selectedMonth.month
      )}`;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(title, pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(subtitle, pageWidth / 2, 30, { align: "center" });

      // Prepara i dati per la tabella
      const tableData = [];
      const headers = [
        "Postazione",
        "Data",
        "Giorno",
        "Orario",
        "Volontari Assegnati",
        "Max",
        "Stato",
      ];

      data?.postazioni?.forEach((postazione) => {
        if (postazioneId && postazione.id !== postazioneId) return;

        data?.dateRange?.forEach((date) => {
          if (!isPostazioneActiveForDate(postazione, date)) return;

          postazione.slot_orari?.forEach((slot) => {
            const existingAssignments = getExistingAssignments(
              date,
              slot.id,
              postazione.id
            );
            const maxProclamatori = postazione.max_proclamatori || 3;
            const isFullyAssigned =
              existingAssignments.length >= maxProclamatori;
            const isPartiallyAssigned = existingAssignments.length > 0;

            let stato = "Vuoto";
            if (isFullyAssigned) stato = "Completo";
            else if (isPartiallyAssigned) stato = "Parziale";

            const volontari =
              existingAssignments
                .map((a) => `${a.nome} ${a.cognome}`)
                .join(", ") || "Nessuno";

            tableData.push([
              postazione.luogo,
              formatDate(date),
              getDayName(date),
              `${formatTime(slot.orario_inizio)} - ${formatTime(
                slot.orario_fine
              )}`,
              volontari,
              maxProclamatori,
              stato,
            ]);
          });
        });
      });

      // Genera la tabella
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246], // Blue-500
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Gray-50
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Postazione
          1: { cellWidth: 20 }, // Data
          2: { cellWidth: 20 }, // Giorno
          3: { cellWidth: 25 }, // Orario
          4: { cellWidth: 50 }, // Volontari
          5: { cellWidth: 15 }, // Max
          6: { cellWidth: 20 }, // Stato
        },
        didDrawCell: function (data) {
          // Colora le celle in base allo stato
          if (data.column.index === 6) {
            // Colonna Stato
            if (data.cell.text[0] === "Completo") {
              data.cell.styles.fillColor = [34, 197, 94]; // Green-500
              data.cell.styles.textColor = 255;
            } else if (data.cell.text[0] === "Parziale") {
              data.cell.styles.fillColor = [251, 191, 36]; // Yellow-500
              data.cell.styles.textColor = 0;
            } else {
              data.cell.styles.fillColor = [156, 163, 175]; // Gray-400
              data.cell.styles.textColor = 255;
            }
          }
        },
      });

      // Footer con informazioni
      const finalY = doc.lastAutoTable.finalY || 40;
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Esportato il ${new Date().toLocaleDateString(
          "it-IT"
        )} alle ${new Date().toLocaleTimeString("it-IT")}`,
        pageWidth / 2,
        finalY + 10,
        { align: "center" }
      );

      // Salva il PDF
      const filename = isSpecificExport
        ? `turni_${postazioneNome.replace(/\s+/g, "_")}_${
            selectedMonth.year
          }_${String(selectedMonth.month + 1).padStart(2, "0")}.pdf`
        : `turni_tutte_postazioni_${selectedMonth.year}_${String(
            selectedMonth.month + 1
          ).padStart(2, "0")}.pdf`;

      doc.save(filename);
      toastSuccess(`PDF esportato: ${filename}`);
    } catch (error) {
      console.error("Errore export PDF:", error);
      toastError("Errore durante l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async (postazioneId = null, postazioneNome = null) => {
    setExporting(true);

    try {
      const isSpecificExport = postazioneId !== null;
      const incompleteSlots = checkIncompleteAssignments(postazioneId);

      if (incompleteSlots.length > 0) {
        const confirmMessage = `Alcuni turni non sono completamente assegnati:\n\n${incompleteSlots
          .slice(0, 3)
          .map(
            (slot) =>
              `• ${slot.postazione} - ${slot.data} ${slot.orario} (${slot.assegnati}/${slot.max})`
          )
          .join("\n")}${
          incompleteSlots.length > 3
            ? `\n... e altri ${incompleteSlots.length - 3} turni`
            : ""
        }\n\nVuoi davvero esportare la tabella?`;

        if (!window.confirm(confirmMessage)) {
          setExporting(false);
          return;
        }
      }

      // Prepara i dati per Excel
      const excelData = [];
      const headers = [
        "Postazione",
        "Indirizzo",
        "Data",
        "Giorno",
        "Orario",
        "Volontari Assegnati",
        "Max Proclamatori",
        "Stato",
        "Note",
      ];

      data?.postazioni?.forEach((postazione) => {
        if (postazioneId && postazione.id !== postazioneId) return;

        data?.dateRange?.forEach((date) => {
          if (!isPostazioneActiveForDate(postazione, date)) return;

          postazione.slot_orari?.forEach((slot) => {
            const existingAssignments = getExistingAssignments(
              date,
              slot.id,
              postazione.id
            );
            const maxProclamatori = postazione.max_proclamatori || 3;
            const isFullyAssigned =
              existingAssignments.length >= maxProclamatori;
            const isPartiallyAssigned = existingAssignments.length > 0;

            let stato = "Vuoto";
            if (isFullyAssigned) stato = "Completo";
            else if (isPartiallyAssigned) stato = "Parziale";

            const volontari =
              existingAssignments
                .map((a) => `${a.nome} ${a.cognome}`)
                .join(", ") || "Nessuno";

            let note = "";
            if (isPartiallyAssigned && !isFullyAssigned) {
              note = `Mancano ${
                maxProclamatori - existingAssignments.length
              } volontari`;
            }

            excelData.push([
              postazione.luogo,
              postazione.indirizzo,
              formatDate(date),
              getDayName(date),
              `${formatTime(slot.orario_inizio)} - ${formatTime(
                slot.orario_fine
              )}`,
              volontari,
              maxProclamatori,
              stato,
              note,
            ]);
          });
        });
      });

      // Crea il contenuto CSV
      const csvContent = [
        headers.join(","),
        ...excelData.map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell.replace(/"/g, '""')}"`
                : cell
            )
            .join(",")
        ),
      ].join("\n");

      // Crea e scarica il file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const filename = isSpecificExport
        ? `turni_${postazioneNome.replace(/\s+/g, "_")}_${
            selectedMonth.year
          }_${String(selectedMonth.month + 1).padStart(2, "0")}.csv`
        : `turni_tutte_postazioni_${selectedMonth.year}_${String(
            selectedMonth.month + 1
          ).padStart(2, "0")}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastSuccess(`Excel esportato: ${filename}`);
    } catch (error) {
      console.error("Errore export Excel:", error);
      toastError("Errore durante l'export Excel");
    } finally {
      setExporting(false);
    }
  };

  // Funzioni per l'export unificato
  const openExportModal = (postazioneId = null, postazioneNome = null) => {
    setExportTarget(postazioneId ? { postazioneId, postazioneNome } : null);
    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportTarget(null);
  };

  const handleExport = async (format) => {
    if (!exportTarget) {
      // Export per tutte le postazioni
      if (format === "pdf") {
        await exportToPDF();
      } else {
        await exportToExcel();
      }
    } else {
      // Export per postazione specifica
      if (format === "pdf") {
        await exportToPDF(
          exportTarget.postazioneId,
          exportTarget.postazioneNome
        );
      } else {
        await exportToExcel(
          exportTarget.postazioneId,
          exportTarget.postazioneNome
        );
      }
    }
    closeExportModal();
  };

  // Gestisce il tooltip al hover
  const handleMouseEnter = (e, fullName) => {
    setTooltip({
      show: true,
      text: fullName,
      x: e.clientX,
      y: e.clientY - 10, // Mostra sopra il cursore
    });
  };

  const handleMouseMove = (e) => {
    if (tooltip.show) {
      setTooltip((prev) => ({
        ...prev,
        x: e.clientX,
        y: e.clientY - 10,
      }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, text: "", x: 0, y: 0 });
  };

  // Renderizza la cella di un turno
  const renderTurnoCell = (date, slot, postazione) => {
    console.log("🎯 Rendering cella per:", {
      date,
      slotId: slot.id,
      orarioInizio: slot.orario_inizio,
      orarioFine: slot.orario_fine,
      postazione: postazione.luogo,
    });

    const availableVolunteers = getAvailableVolunteers(
      date,
      slot.orario_inizio,
      slot.orario_fine,
      slot.id
    );

    const existingAssignments = getExistingAssignments(
      date,
      slot.id,
      postazione.id
    );
    const key = `${date}-${slot.id}-${postazione.id}`;
    const pendingAssignmentsForSlot = pendingAssignments.get(key) || [];

    // Filtra le assegnazioni pending che sono state rimosse
    // (non dovrebbe essere necessario ma è una doppia verifica)
    const validPendingAssignments = pendingAssignmentsForSlot.filter(
      (pending) => {
        for (const [assegnazioneId, volontariSet] of pendingRemovals) {
          if (!volontariSet || volontariSet.size === 0) continue;
          const matchingExisting = existingAssignments.find(
            (a) =>
              a.assegnazione_id === parseInt(assegnazioneId, 10) &&
              a.volontario_id === pending.volontario_id
          );
          if (matchingExisting && volontariSet.has(pending.volontario_id)) {
            return false;
          }
        }
        return true;
      }
    );

    const maxProclamatori = postazione.max_proclamatori || 3;
    // Usa validPendingAssignments invece di pendingAssignmentsForSlot per escludere quelle rimosse
    const totalAssignments =
      existingAssignments.length + validPendingAssignments.length;
    const isAssigned = totalAssignments > 0;
    const hasAvailableVolunteers = availableVolunteers.length > 0;
    const isFullyAssigned = totalAssignments >= maxProclamatori;
    const hasMan = hasManInSlot(date, slot.id, postazione.id);

    // Se non ci sono volontari disponibili
    if (!hasAvailableVolunteers) {
      return (
        <div className="text-center p-2 bg-gray-100 text-gray-500 text-xs">
          Nessuna disponibilità
        </div>
      );
    }

    // Se è già completamente assegnato
    if (isFullyAssigned) {
      // Determina il colore: verde se c'è almeno un uomo, arancione se no
      const bgColor = hasMan ? "bg-green-100" : "bg-orange-100";
      const borderColor = hasMan ? "border-green-300" : "border-orange-300";
      const textColor = hasMan ? "text-green-700" : "text-orange-700";

      return (
        <div
          className={`text-center p-2 ${bgColor} border ${borderColor} rounded`}
        >
          <div className="flex items-center justify-center mb-1">
            <div className={`text-xs ${textColor} font-medium`}>
              {totalAssignments}/{maxProclamatori} assegnati
            </div>
            {!hasMan && (
              <ExclamationTriangleIcon
                className="h-4 w-4 ml-1 text-orange-600"
                title="Manca almeno un uomo nel gruppo"
              />
            )}
          </div>

          {/* Mostra assegnazioni esistenti */}
          {existingAssignments.map((assignment, index) => (
            <div
              key={`existing-${index}`}
              className={`flex items-center justify-between text-xs mb-1 ${textColor}`}
            >
              <div className="flex items-center flex-1 min-w-0">
                <span
                  className="font-medium truncate cursor-help"
                  onMouseEnter={(e) =>
                    handleMouseEnter(
                      e,
                      `${assignment.nome} ${assignment.cognome}`
                    )
                  }
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {assignment.nome} {assignment.cognome}
                </span>
                <span
                  className={`text-xs ${
                    hasMan ? "bg-green-200" : "bg-orange-200"
                  } px-2 py-1 rounded-full ml-2 flex-shrink-0 ${
                    hasMan ? "text-green-800" : "text-orange-800"
                  }`}
                >
                  {(() => {
                    const contatori = getContatoriDinamici(
                      assignment.volontario_id
                    );
                    return `${contatori.assegnazioni_totali} - ${contatori.disponibilita_totali}`;
                  })()}
                </span>
              </div>
              <button
                onClick={() =>
                  handleRemoveVolunteer(
                    assignment.assegnazione_id,
                    assignment.volontario_id
                  )
                }
                className="text-red-600 hover:text-red-800 ml-1"
                title="Rimuovi volontario"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Mostra assegnazioni in sospeso */}
          {validPendingAssignments.map((pending, index) => {
            const volunteerData = data?.disponibilita?.find(
              (d) =>
                d.volontario_id === pending.volontario_id &&
                d.data === date &&
                d.slot_orario_id === slot.id
            );

            return (
              <div
                key={`pending-${index}`}
                className="flex items-center justify-between text-xs mb-1 text-orange-700 bg-orange-50 px-1 rounded"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span
                    className="font-medium truncate cursor-help"
                    onMouseEnter={(e) =>
                      handleMouseEnter(
                        e,
                        volunteerData
                          ? `${volunteerData.nome} ${volunteerData.cognome}`
                          : `Volontario ${pending.volontario_id}`
                      )
                    }
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    {volunteerData
                      ? `${volunteerData.nome} ${volunteerData.cognome}`
                      : `Volontario ${pending.volontario_id}`}
                  </span>
                  <span className="text-xs ml-2 bg-orange-200 px-1 py-0.5 rounded flex-shrink-0">
                    (in sospeso)
                  </span>
                  {volunteerData && (
                    <span className="text-xs bg-orange-300 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      {(() => {
                        const contatori = getContatoriDinamici(
                          pending.volontario_id
                        );
                        return `${contatori.assegnazioni_totali} - ${contatori.disponibilita_totali}`;
                      })()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    const currentPending = pendingAssignments.get(key) || [];
                    const updatedPending = currentPending.filter(
                      (p) => p.volontario_id !== pending.volontario_id
                    );

                    const newPendingAssignments = new Map(pendingAssignments);
                    if (updatedPending.length > 0) {
                      newPendingAssignments.set(key, updatedPending);
                    } else {
                      newPendingAssignments.delete(key);
                    }
                    setPendingAssignments(newPendingAssignments);
                    toastSuccess(
                      "Volontario rimosso dalle assegnazioni in sospeso"
                    );
                  }}
                  className="text-red-600 hover:text-red-800 ml-1"
                  title="Rimuovi dalle assegnazioni in sospeso"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      );
    }

    // Se è parzialmente assegnato
    if (isAssigned) {
      // Per slot parziali: giallo se ha uomo o nessuno ancora, arancione-giallo se senza uomo
      const bgColor = hasMan ? "bg-yellow-100" : "bg-orange-50";
      const borderColor = hasMan ? "border-yellow-300" : "border-orange-300";
      const textColor = hasMan ? "text-yellow-700" : "text-orange-700";

      return (
        <div
          className={`text-center p-2 ${bgColor} border ${borderColor} rounded`}
        >
          <div className="flex items-center justify-center mb-1">
            <div className={`text-xs ${textColor} font-medium`}>
              {totalAssignments}/{maxProclamatori} assegnati
            </div>
            {!hasMan && (
              <ExclamationTriangleIcon
                className="h-4 w-4 ml-1 text-orange-600"
                title="Manca almeno un uomo nel gruppo"
              />
            )}
          </div>

          {/* Mostra assegnazioni esistenti */}
          {existingAssignments.map((assignment, index) => (
            <div
              key={`existing-${index}`}
              className={`flex items-center justify-between text-xs mb-1 ${textColor}`}
            >
              <div className="flex items-center flex-1 min-w-0">
                <span
                  className="font-medium truncate cursor-help"
                  onMouseEnter={(e) =>
                    handleMouseEnter(
                      e,
                      `${assignment.nome} ${assignment.cognome}`
                    )
                  }
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {assignment.nome} {assignment.cognome}
                </span>
                <span
                  className={`text-xs ${
                    hasMan ? "bg-yellow-200" : "bg-orange-200"
                  } px-2 py-1 rounded-full ml-2 flex-shrink-0 ${
                    hasMan ? "text-yellow-800" : "text-orange-800"
                  }`}
                >
                  {(() => {
                    const contatori = getContatoriDinamici(
                      assignment.volontario_id
                    );
                    return `${contatori.assegnazioni_totali} - ${contatori.disponibilita_totali}`;
                  })()}
                </span>
              </div>
              <button
                onClick={() =>
                  handleRemoveVolunteer(
                    assignment.assegnazione_id,
                    assignment.volontario_id
                  )
                }
                className="text-red-600 hover:text-red-800 ml-1"
                title="Rimuovi volontario"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Mostra assegnazioni in sospeso */}
          {validPendingAssignments.map((pending, index) => {
            const volunteerData = data?.disponibilita?.find(
              (d) =>
                d.volontario_id === pending.volontario_id &&
                d.data === date &&
                d.slot_orario_id === slot.id
            );

            return (
              <div
                key={`pending-${index}`}
                className="flex items-center justify-between text-xs mb-1 text-orange-700 bg-orange-50 px-1 rounded"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span
                    className="font-medium truncate cursor-help"
                    onMouseEnter={(e) =>
                      handleMouseEnter(
                        e,
                        volunteerData
                          ? `${volunteerData.nome} ${volunteerData.cognome}`
                          : `Volontario ${pending.volontario_id}`
                      )
                    }
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    {volunteerData
                      ? `${volunteerData.nome} ${volunteerData.cognome}`
                      : `Volontario ${pending.volontario_id}`}
                  </span>
                  <span className="text-xs ml-2 bg-orange-200 px-1 py-0.5 rounded flex-shrink-0">
                    (in sospeso)
                  </span>
                  {volunteerData && (
                    <span className="text-xs bg-orange-300 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      {(() => {
                        const contatori = getContatoriDinamici(
                          pending.volontario_id
                        );
                        return `${contatori.assegnazioni_totali} - ${contatori.disponibilita_totali}`;
                      })()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    const currentPending = pendingAssignments.get(key) || [];
                    const updatedPending = currentPending.filter(
                      (p) => p.volontario_id !== pending.volontario_id
                    );

                    const newPendingAssignments = new Map(pendingAssignments);
                    if (updatedPending.length > 0) {
                      newPendingAssignments.set(key, updatedPending);
                    } else {
                      newPendingAssignments.delete(key);
                    }
                    setPendingAssignments(newPendingAssignments);
                    toastSuccess(
                      "Volontario rimosso dalle assegnazioni in sospeso"
                    );
                  }}
                  className="text-red-600 hover:text-red-800 ml-1"
                  title="Rimuovi dalle assegnazioni in sospeso"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            );
          })}
          <select
            className="text-xs w-full p-1 border rounded mt-1"
            onChange={(e) => {
              if (e.target.value) {
                handleManualAssignment(
                  date,
                  slot.id,
                  postazione.id,
                  e.target.value
                );
              }
            }}
            value=""
          >
            <option value="">Aggiungi...</option>
            {availableVolunteers
              .filter(
                (v) =>
                  !existingAssignments.some(
                    (a) => a.volontario_id === v.volontario_id
                  ) &&
                  !validPendingAssignments.some(
                    (p) => p.volontario_id === v.volontario_id
                  )
              )
              .map((volunteer) => {
                const contatori = getContatoriDinamici(volunteer.volontario_id);
                return (
                  <option
                    key={volunteer.volontario_id}
                    value={volunteer.volontario_id}
                  >
                    {volunteer.nome} {volunteer.cognome} • [
                    {contatori.assegnazioni_totali} -{" "}
                    {contatori.disponibilita_totali}]
                  </option>
                );
              })}
          </select>
        </div>
      );
    }

    // Se non è assegnato ma ci sono volontari disponibili
    return (
      <div className="text-center p-2 bg-blue-100 border border-blue-300 rounded">
        <div className="text-xs text-blue-700 font-medium mb-1">
          0/{maxProclamatori} assegnati
        </div>
        <select
          className="text-xs w-full p-1 border rounded"
          data-slot={slot.id}
          data-postazione={postazione.id}
          data-date={date}
          onChange={(e) => {
            if (e.target.value) {
              handleManualAssignment(
                date,
                slot.id,
                postazione.id,
                e.target.value
              );
            }
          }}
          value=""
        >
          <option value="">Seleziona proclamatore...</option>
          {availableVolunteers
            .filter(
              (v) =>
                !existingAssignments.some(
                  (a) => a.volontario_id === v.volontario_id
                ) &&
                !validPendingAssignments.some(
                  (p) => p.volontario_id === v.volontario_id
                )
            )
            .map((volunteer) => {
              const contatori = getContatoriDinamici(volunteer.volontario_id);
              return (
                <option
                  key={volunteer.volontario_id}
                  value={volunteer.volontario_id}
                >
                  {volunteer.nome} {volunteer.cognome} • [
                  {contatori.assegnazioni_totali} -{" "}
                  {contatori.disponibilita_totali}]
                </option>
              );
            })}
        </select>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Tooltip per i nomi troncati */}
      {tooltip.show && (
        <div
          className="fixed z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.text}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"
            style={{ marginTop: "-1px" }}
          />
        </div>
      )}

      {saving && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg px-6 py-4 shadow-lg flex items-center space-x-3">
            <span className="h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">
              Salvataggio delle modifiche in corso...
            </span>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Gestione Turni - Vista Mensile
        </h1>
        <p className="text-gray-600">
          Gestisci le assegnazioni dei turni per tutte le postazioni. Naviga tra
          i mesi e usa l'autocompilazione per assegnare automaticamente i
          volontari disponibili per il mese selezionato.
        </p>
      </div>
      {/* Informazioni */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">
              Gestione Turni - Vista Mensile
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>
                • Usa il pulsante "Autocompilazione [Postazione]" per assegnare
                automaticamente i volontari disponibili per quella postazione
                specifica nel mese selezionato
              </p>
              <p>
                • Usa il pulsante "Reset [Postazione]" per eliminare tutte le
                assegnazioni di quella postazione specifica nel mese selezionato
              </p>
              <p>
                • Naviga tra i mesi usando le frecce o il pulsante "Vai al mese
                corrente"
              </p>
              <p>
                • Puoi modificare manualmente le assegnazioni dopo
                l'autocompilazione
              </p>
              <p>• Clicca "Salva Modifiche" per confermare le assegnazioni</p>
              <p className="font-medium mt-2 mb-1">
                📊 Legenda numeri tra parentesi accanto ai nomi:
              </p>
              <p className="ml-4">
                • <strong>Primo numero</strong>: Assegnazioni totali del
                volontario nel mese selezionato
              </p>
              <p className="ml-4">
                • <strong>Secondo numero</strong>: Disponibilità totali del
                volontario nel mese selezionato
              </p>
              <p className="ml-4">
                • <strong>Formato</strong>: (assegnazioni totali - disponibilità
                totali)
              </p>
              <p className="ml-4 text-blue-600">
                • <strong>Esempio</strong>: Mario Rossi (8 - 32) = 8
                assegnazioni totali, 32 disponibilità totali
              </p>
              <p className="font-medium mt-2 mb-1">
                🎨 Legenda colori degli slot:
              </p>
              <p className="ml-4">
                •{" "}
                <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></span>{" "}
                <strong>Blu</strong>: Slot vuoto (nessun volontario assegnato)
              </p>
              <p className="ml-4">
                •{" "}
                <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-1"></span>{" "}
                <strong>Giallo</strong>: Assegnazione parziale (non tutti i
                posti coperti)
              </p>
              <p className="ml-4">
                •{" "}
                <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></span>{" "}
                <strong>Verde</strong>: Assegnazione completa con almeno un uomo
              </p>
              <p className="ml-4">
                •{" "}
                <span className="inline-block w-3 h-3 bg-orange-100 border border-orange-300 rounded mr-1"></span>{" "}
                <strong>Arancione</strong>: Assegnazione completa ma manca
                almeno un uomo <span className="text-orange-600">⚠️</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Filtri */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {getMonthName(selectedMonth.year, selectedMonth.month)}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="btn-secondary flex items-center"
              title="Vai al mese precedente"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={goToCurrentMonth}
              className={`btn-primary flex items-center ${
                isCurrentMonth() ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title={
                isCurrentMonth() ? "Mese corrente" : "Vai al mese corrente"
              }
              disabled={isCurrentMonth()}
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {isCurrentMonth() ? "Mese corrente" : "Vai al mese corrente"}
            </button>
            <button
              onClick={goToNextMonth}
              className="btn-secondary flex items-center"
              title="Vai al mese successivo"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <p>
            📅 Visualizzazione del mese: {formatDate(selectedDateRange.inizio)}{" "}
            - {formatDate(selectedDateRange.fine)}
          </p>
          <p>
            🔄 L'autocompilazione e il reset si applicheranno solo alla
            postazione specifica in questo mese
          </p>
        </div>

        {/* Pulsante Export Globale Unificato */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => openExportModal()}
            disabled={exporting || saving}
            className="btn-primary flex items-center"
            title={`Esporta tabella per tutte le postazioni nel mese ${getMonthName(
              selectedMonth.year,
              selectedMonth.month
            )}`}
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            {exporting ? "Esportando..." : "Export Tutte Postazioni"}
          </button>
        </div>
      </div>
      {/* Contenuto Gestione Turni */}
      <div className="space-y-6">
        {data?.postazioni?.map((postazione) => {
          // Crea un dateRange specifico per questa postazione: solo giorni validi
          const postazioneDateRange = (data?.dateRange || []).filter((date) =>
            isPostazioneActiveForDate(postazione, date)
          );

          return (
            <div key={postazione.id} className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        <MapPinIcon className="h-5 w-5 inline mr-2 text-primary-600" />
                        {postazione.luogo}
                      </h3>
                      {isPostazioneComplete(postazione) ? (
                        <CheckCircleIcon
                          className="h-6 w-6 text-green-500"
                          title="Postazione completa per questo mese"
                        />
                      ) : (
                        <ClockIcon
                          className="h-6 w-6 text-orange-500"
                          title="Postazione non ancora completa per questo mese"
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {postazione.indirizzo}
                    </p>
                    <p className="text-sm text-primary-600 font-medium mt-1">
                      Max proclamatori per turno:{" "}
                      {postazione.max_proclamatori || 3}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    {/* Pulsante Autocompilazione */}
                    <button
                      onClick={() =>
                        executeAutocompilazione(postazione.id, postazione.luogo)
                      }
                      disabled={compiling || saving}
                      className="btn-secondary flex items-center"
                      title={`Esegui autocompilazione automatica per "${
                        postazione.luogo
                      }" nel mese ${getMonthName(
                        selectedMonth.year,
                        selectedMonth.month
                      )}`}
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      {compiling
                        ? "Autocompilazione..."
                        : `Autocompilazione ${postazione.luogo}`}
                    </button>

                    {/* Pulsante Reset */}
                    <button
                      onClick={() =>
                        handleReset(postazione.id, postazione.luogo)
                      }
                      disabled={compiling || saving}
                      className="btn-danger flex items-center"
                      title={`Elimina tutte le assegnazioni di "${
                        postazione.luogo
                      }" per il mese ${getMonthName(
                        selectedMonth.year,
                        selectedMonth.month
                      )}`}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Reset {postazione.luogo}
                    </button>

                    {/* Pulsante Export Unificato */}
                    <button
                      onClick={() =>
                        openExportModal(postazione.id, postazione.luogo)
                      }
                      disabled={exporting || saving}
                      className="btn-secondary flex items-center"
                      title={`Esporta tabella per "${
                        postazione.luogo
                      }" nel mese ${getMonthName(
                        selectedMonth.year,
                        selectedMonth.month
                      )}`}
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      {exporting ? "Esportando..." : "Export"}
                    </button>

                    {/* Pulsante Salva modifiche */}
                    {(pendingAssignments.size > 0 ||
                      pendingRemovals.size > 0) && (
                      <button
                        onClick={savePendingChanges}
                        disabled={saving || compiling}
                        className="btn-primary flex items-center"
                        title="Salva tutte le modifiche in sospeso"
                      >
                        {saving ? (
                          <>
                            <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Salvataggio...
                          </>
                        ) : (
                          <>
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Salva Modifiche
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{
                          borderRight: "1px solid #d1d5db",
                          boxShadow: "1px 0 0 0 #d1d5db",
                        }}
                      >
                        Orario
                      </th>
                      {postazioneDateRange.map((date) => {
                        return (
                          <th
                            key={date}
                            className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            <div>{getDayName(date)}</div>
                            <div className="text-xs text-gray-400">
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
                        <td
                          className="sticky left-0 z-10 bg-white px-2 py-2 text-center"
                          style={{
                            borderRight: "1px solid #d1d5db",
                            boxShadow: "1px 0 0 0 #d1d5db",
                          }}
                        >
                          <div className="flex flex-col items-center justify-center space-y-0.5">
                            <ClockIcon className="h-4 w-4 text-primary-600" />
                            <span className="text-xs font-medium text-gray-900 leading-tight">
                              {formatTime(slot.orario_inizio)}
                            </span>
                            <span className="text-xs font-medium text-gray-900 leading-tight">
                              {formatTime(slot.orario_fine)}
                            </span>
                          </div>
                        </td>
                        {postazioneDateRange.map((date) => {
                          return (
                            <td
                              key={`${slot.id}-${date}`}
                              className="px-3 py-2"
                            >
                              {renderTurnoCell(date, slot, postazione)}
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

      {/* Modal di selezione formato export */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Seleziona formato di export
              </h3>
              <button
                onClick={closeExportModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {exportTarget
                  ? `Esporta tabella per "${
                      exportTarget.postazioneNome
                    }" nel mese ${getMonthName(
                      selectedMonth.year,
                      selectedMonth.month
                    )}`
                  : `Esporta tabella per tutte le postazioni nel mese ${getMonthName(
                      selectedMonth.year,
                      selectedMonth.month
                    )}`}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleExport("pdf")}
                disabled={exporting || saving}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0 1 1 0 102 0zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {exporting ? "Esportando PDF..." : "Esporta come PDF"}
              </button>

              <button
                onClick={() => handleExport("excel")}
                disabled={exporting || saving}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                    clipRule="evenodd"
                  />
                </svg>
                {exporting ? "Esportando Excel..." : "Esporta come Excel (CSV)"}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={closeExportModal}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Autocompilazione;
