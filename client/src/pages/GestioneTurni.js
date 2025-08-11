import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
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

  // Stati per gestione draft locale
  const [pendingAssignments, setPendingAssignments] = useState(new Map()); // Modifiche in sospeso
  const [pendingRemovals, setPendingRemovals] = useState(new Map()); // Rimozioni in sospeso

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

  useEffect(() => {
    loadGestioneData();
    loadContatoriMensili();
  }, [selectedDateRange]); // Ricarica i dati quando cambia il range di date

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

    // Converti in formato nostro sistema (1 = Domenica, 2 = Lunedì, ..., 7 = Sabato)
    const nostroGiorno = dayOfWeek === 0 ? 1 : dayOfWeek + 1;

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
      assegnazioni_totali: 0
    };

    // Calcola le assegnazioni in sospeso per questo volontario nel mese corrente
    let assegnazioniInSospeso = 0;
    
    pendingAssignments.forEach((assignments, _key) => {
      assignments.forEach((assignment) => {
        if (assignment.volontario_id === parseInt(volontarioId)) {
          // Verifica che l'assegnazione sia nel range di date corrente
          const assignmentDate = assignment.data_turno;
          if (assignmentDate >= selectedDateRange.inizio && assignmentDate <= selectedDateRange.fine) {
            assegnazioniInSospeso++;
          }
        }
      });
    });

    // Calcola le rimozioni in sospeso per questo volontario nel mese corrente
    let rimozioniInSospeso = 0;
    
    pendingRemovals.forEach((volontarioIdRemoved, assegnazioneId) => {
      if (volontarioIdRemoved === parseInt(volontarioId)) {
        // Trova l'assegnazione corrispondente per verificare la data
        const assegnazione = data?.assegnazioni?.find(a => a.assegnazione_id === assegnazioneId);
        if (assegnazione) {
          let assegnazioneDate;
          if (typeof assegnazione.data_turno === "string") {
            assegnazioneDate = assegnazione.data_turno.split("T")[0];
          } else {
            assegnazioneDate = assegnazione.data_turno.toISOString().split("T")[0];
          }
          
          if (assegnazioneDate >= selectedDateRange.inizio && assegnazioneDate <= selectedDateRange.fine) {
            rimozioniInSospeso++;
          }
        }
      }
    });

    return {
      disponibilita_totali: contatori.disponibilita_totali,
      assegnazioni_totali: contatori.assegnazioni_totali + assegnazioniInSospeso - rimozioniInSospeso
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
      const isRemoved =
        pendingRemovals.has(a.assegnazione_id) &&
        pendingRemovals.get(a.assegnazione_id) === a.volontario_id;
      return !isRemoved;
    });

    return assignments;
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
      toast.error("Il volontario non è disponibile per questo turno");
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
      toast.error("Il volontario è già assegnato a questo turno nel database");
      return;
    }

    // Verifica anche nelle assegnazioni in sospeso
    const key = `${date}-${slotOrarioId}-${postazioneId}`;
    const currentPendingAssignments = pendingAssignments.get(key) || [];
    const isAlreadyPending = currentPendingAssignments.some(
      (a) => a.volontario_id === parseInt(volontarioId)
    );

    if (isAlreadyPending) {
      toast.error("Il volontario è già nelle assegnazioni in sospeso");
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

    toast.success("Volontario aggiunto (modifiche in sospeso)");
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
      toast.success("Volontario rimosso (modifiche in sospeso)");
    } else {
      // Se è un'assegnazione esistente, aggiungila alle rimozioni in sospeso
      const newPendingRemovals = new Map(pendingRemovals);
      newPendingRemovals.set(assegnazioneId, volontarioId);
      setPendingRemovals(newPendingRemovals);
      console.log(
        "✅ Aggiunta rimozione in sospeso per assegnazione:",
        assegnazioneId
      );
      toast.success("Volontario rimosso (modifiche in sospeso)");
    }
  };

  // Salva tutte le modifiche in sospeso al database
  const savePendingChanges = async () => {
    try {
      console.log("💾 Salvando modifiche in sospeso...");
      console.log("📝 Assegnazioni in sospeso:", pendingAssignments);
      console.log("🗑️ Rimozioni in sospeso:", pendingRemovals);

      // Prima rimuovi le rimozioni in sospeso
      for (const [assegnazioneId, volontarioId] of pendingRemovals) {
        console.log(
          `🗑️ Rimuovendo volontario ${volontarioId} da assegnazione ${assegnazioneId}`
        );

        const response = await fetch(
          `/api/turni/assegnazione/${assegnazioneId}/volontario/${volontarioId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ Errore rimozione:", response.status, errorData);
          // Non bloccare il processo se una rimozione fallisce
          console.warn(
            `⚠️ Rimozione fallita per ${assegnazioneId}/${volontarioId}, continuando...`
          );
        } else {
          console.log(`✅ Volontario ${volontarioId} rimosso con successo`);
        }
      }

      // Poi aggiungi le nuove assegnazioni
      for (const [key, assignments] of pendingAssignments) {
        console.log(`📝 Processando assegnazioni per ${key}:`, assignments);

        for (const assignment of assignments) {
          // Verifica se il volontario è già assegnato nel database
          const existingAssignments = getExistingAssignments(
            assignment.data_turno,
            assignment.slot_orario_id,
            assignment.postazione_id
          );

          const isAlreadyAssigned = existingAssignments.some(
            (a) => a.volontario_id === parseInt(assignment.volontario_id)
          );

          if (isAlreadyAssigned) {
            console.warn(
              `⚠️ Volontario ${assignment.volontario_id} già assegnato, saltando...`
            );
            continue; // Salta questa assegnazione
          }

          const requestBody = {
            data_turno: assignment.data_turno,
            slot_orario_id: parseInt(assignment.slot_orario_id),
            postazione_id: parseInt(assignment.postazione_id),
            volontario_id: parseInt(assignment.volontario_id),
          };

          console.log("📤 Invio richiesta assegnazione:", requestBody);
          console.log("🔍 Dati assegnazione:", {
            data_turno: assignment.data_turno,
            slot_orario_id: assignment.slot_orario_id,
            postazione_id: assignment.postazione_id,
            volontario_id: assignment.volontario_id,
          });

          const response = await fetch("/api/turni/assegna", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("❌ Errore risposta:", response.status, errorData);
            throw new Error(
              `Errore nell'assegnazione del volontario: ${
                errorData.message || response.statusText
              }`
            );
          } else {
            console.log(
              `✅ Volontario ${assignment.volontario_id} assegnato con successo`
            );
          }
        }
      }

      // Pulisci le modifiche in sospeso
      setPendingAssignments(new Map());
      setPendingRemovals(new Map());

      // Ricarica i dati per aggiornare la visualizzazione
      await loadGestioneData();
      await loadContatoriMensili();

      toast.success("Modifiche salvate con successo");
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      toast.error("Errore nel salvataggio delle modifiche");
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

      // Prima pulisci le assegnazioni in sospeso esistenti
      setPendingAssignments(new Map());
      setPendingRemovals(new Map());

      // Simula l'autocompilazione creando assegnazioni in sospeso
      const newPendingAssignments = new Map();
      let totalAssignments = 0;
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
              const maxProclamatori = postazione.max_proclamatori || 3;
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
                  maxProclamatori,
                  availableVolunteers: availableVolunteers.length,
                  volunteers: availableVolunteers.map(
                    (v) => `${v.nome} ${v.cognome} (${v.sesso})`
                  ),
                }
              );

              // Se il turno non è completo, cerca di assegnare volontari
              if (existingAssignments.length < maxProclamatori) {
                const volunteersNeeded =
                  maxProclamatori - existingAssignments.length;
                const assignedVolunteers = new Set(
                  existingAssignments.map((a) => a.volontario_id)
                );

                // Filtra volontari già assegnati e disponibili
                const availableForAssignment = availableVolunteers.filter(
                  (v) => !assignedVolunteers.has(v.volontario_id)
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
                  const key = `${date}-${slot.id}-${postazione.id}`;
                  const assignments = volunteersToAssign.map((volunteer) => ({
                    volontario_id: parseInt(volunteer.volontario_id),
                    data_turno: date,
                    slot_orario_id: slot.id,
                    postazione_id: postazione.id,
                  }));

                  console.log(
                    `✅ Assegnazioni create:`,
                    assignments.map((a) => a.volontario_id)
                  );
                  newPendingAssignments.set(key, assignments);
                  totalAssignments += assignments.length;
                }
              }
            } catch (error) {
              const errorMsg = `Errore nell'elaborazione di ${date} ${slot.orario_inizio}-${slot.orario_fine}: ${error.message}`;
              console.error(errorMsg);
              errors.push(errorMsg);
            }
          });
        });
      });

      // Aggiorna le assegnazioni in sospeso
      setPendingAssignments(newPendingAssignments);

      const successMessage = isSpecificAutocompilazione
        ? `Autocompilazione completata per "${postazioneNome}" nel mese ${getMonthName(
            selectedMonth.year,
            selectedMonth.month
          )}: ${totalAssignments} assegnazioni in sospeso`
        : `Autocompilazione completata per ${getMonthName(
            selectedMonth.year,
            selectedMonth.month
          )}: ${totalAssignments} assegnazioni in sospeso`;

      toast.success(successMessage);

      if (errors.length > 0) {
        console.warn(
          "⚠️ Autocompilazione: slot senza uomini disponibili:",
          errors
        );

        toast.error(
          `Autocompilazione completata con ${errors.length} avvisi.\n` +
            `Ci sono ancora ${errors.length} turni per cui non è disponibile un uomo.\n` +
            `Suggerimenti: apri "Turni Incompleti" per vedere i dettagli, ` +
            `aggiungi disponibilità maschili per quelle date/slot oppure completa manualmente e poi premi "Salva Modifiche".`,
          { duration: 7000 }
        );
      }

      if (totalAssignments > 0) {
        toast("Clicca 'Salva Modifiche' per confermare le assegnazioni", {
          icon: "💾",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("❌ Errore nell'autocompilazione:", error);
      toast.error(`Errore nell'autocompilazione: ${error.message}`);
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
      const response = await fetch("/api/turni/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          data_inizio: selectedDateRange.inizio,
          data_fine: selectedDateRange.fine,
          postazione_id: postazioneId, // Aggiunto parametro per postazione specifica
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const successMessage = isSpecificReset
          ? `Reset completato per "${postazioneNome}" nel mese ${getMonthName(
              selectedMonth.year,
              selectedMonth.month
            )}: ${result.assegnazioni_eliminate} assegnazioni eliminate`
          : `Reset completato per ${getMonthName(
              selectedMonth.year,
              selectedMonth.month
            )}: ${result.assegnazioni_eliminate} assegnazioni eliminate`;

        toast.success(successMessage);
        loadGestioneData(); // Ricarica i dati
      } else {
        const error = await response.json();
        toast.error(error.message || "Errore nel reset");
      }
    } catch (error) {
      console.error("Errore:", error);
      toast.error("Errore di connessione");
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
      toast.success(`PDF esportato: ${filename}`);
    } catch (error) {
      console.error("Errore export PDF:", error);
      toast.error("Errore durante l'export PDF");
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

      toast.success(`Excel esportato: ${filename}`);
    } catch (error) {
      console.error("Errore export Excel:", error);
      toast.error("Errore durante l'export Excel");
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

    const maxProclamatori = postazione.max_proclamatori || 3;
    const totalAssignments =
      existingAssignments.length + pendingAssignmentsForSlot.length;
    const isAssigned = totalAssignments > 0;
    const hasAvailableVolunteers = availableVolunteers.length > 0;
    const isFullyAssigned = totalAssignments >= maxProclamatori;

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
      return (
        <div className="text-center p-2 bg-green-100 border border-green-300 rounded">
          <div className="text-xs text-green-700 font-medium mb-1">
            {totalAssignments}/{maxProclamatori} assegnati
          </div>

          {/* Mostra assegnazioni esistenti */}
          {existingAssignments.map((assignment, index) => (
            <div
              key={`existing-${index}`}
              className="flex items-center justify-between text-xs mb-1 text-green-700"
            >
              <div className="flex items-center flex-1 min-w-0">
                <span className="font-medium truncate">
                  {assignment.nome} {assignment.cognome}
                </span>
                <span className="text-xs bg-green-200 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                  {(() => {
                    const contatori = getContatoriDinamici(assignment.volontario_id);
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
          {pendingAssignmentsForSlot.map((pending, index) => {
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
                  <span className="font-medium truncate">
                    {volunteerData
                      ? `${volunteerData.nome} ${volunteerData.cognome}`
                      : `Volontario ${pending.volontario_id}`}
                  </span>
                  <span className="text-xs ml-2 bg-orange-200 px-1 py-0.5 rounded flex-shrink-0">(in sospeso)</span>
                  {volunteerData && (
                    <span className="text-xs bg-orange-300 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      {(() => {
                        const contatori = getContatoriDinamici(pending.volontario_id);
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
                    toast.success(
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
      return (
        <div className="text-center p-2 bg-yellow-100 border border-yellow-300 rounded">
          <div className="text-xs text-yellow-700 font-medium mb-1">
            {totalAssignments}/{maxProclamatori} assegnati
          </div>

          {/* Mostra assegnazioni esistenti */}
          {existingAssignments.map((assignment, index) => (
            <div
              key={`existing-${index}`}
              className="flex items-center justify-between text-xs mb-1 text-yellow-700"
            >
              <div className="flex items-center flex-1 min-w-0">
                <span className="font-medium truncate">
                  {assignment.nome} {assignment.cognome}
                </span>
                <span className="text-xs bg-yellow-200 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                  {(() => {
                    const contatori = getContatoriDinamici(assignment.volontario_id);
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
          {pendingAssignmentsForSlot.map((pending, index) => {
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
                  <span className="font-medium truncate">
                    {volunteerData
                      ? `${volunteerData.nome} ${volunteerData.cognome}`
                      : `Volontario ${pending.volontario_id}`}
                  </span>
                  <span className="text-xs ml-2 bg-orange-200 px-1 py-0.5 rounded flex-shrink-0">(in sospeso)</span>
                  {volunteerData && (
                    <span className="text-xs bg-orange-300 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      {(() => {
                        const contatori = getContatoriDinamici(pending.volontario_id);
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
                    toast.success(
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
                  !pendingAssignmentsForSlot.some(
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
                    {volunteer.nome} {volunteer.cognome} • [{contatori.assegnazioni_totali} - {contatori.disponibilita_totali}]
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
                !pendingAssignmentsForSlot.some(
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
                  {volunteer.nome} {volunteer.cognome} • [{contatori.assegnazioni_totali} - {contatori.disponibilita_totali}]
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
                • <strong>Primo numero</strong>: Assegnazioni totali del volontario nel mese selezionato
              </p>
              <p className="ml-4">
                • <strong>Secondo numero</strong>: Disponibilità totali del volontario nel mese selezionato
              </p>
              <p className="ml-4">
                • <strong>Formato</strong>: (assegnazioni totali - disponibilità totali)
              </p>
              <p className="ml-4 text-blue-600">
                • <strong>Esempio</strong>: Mario Rossi (8 - 32) = 8 assegnazioni totali, 32 disponibilità totali
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
            disabled={exporting}
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
        {data?.postazioni?.map((postazione) => (
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
                    disabled={compiling}
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
                    onClick={() => handleReset(postazione.id, postazione.luogo)}
                    disabled={compiling}
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
                    disabled={exporting}
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
                      onClick={() => savePendingChanges()}
                      className="btn-primary flex items-center"
                      title="Salva tutte le modifiche in sospeso"
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Salva Modifiche
                    </button>
                  )}
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
                          className={`px-3 py-2 text-center text-xs font-medium uppercase tracking-wider ${
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
                        // Verifica se questa postazione è attiva per questa data
                        const isPostazioneAttiva = isPostazioneActiveForDate(
                          postazione,
                          date
                        );

                        if (!isPostazioneAttiva) {
                          return (
                            <td
                              key={`${slot.id}-${date}`}
                              className="px-3 py-2 bg-gray-50"
                            ></td>
                          );
                        }

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
        ))}
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
                disabled={exporting}
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
                disabled={exporting}
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
