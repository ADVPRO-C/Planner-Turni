import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import {
  PlayIcon,
  ClockIcon,
  MapPinIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const Autocompilazione = () => {
  const { user: _user } = useAuth();

  // Funzione per calcolare il range mensile
  const getMonthRange = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
      inizio: firstDay.toISOString().split("T")[0],
      fine: lastDay.toISOString().split("T")[0],
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
    const hasMale = existingAssignments.some((a) => a.sesso === "M");
    return !hasMale;
  };

  const getAvailableVolunteers = (
    date,
    orarioInizio,
    orarioFine,
    slotOrarioId,
    postazioneId
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

    // Se è necessario un uomo, filtra solo gli uomini
    if (needsMaleVolunteer(date, slotOrarioId, postazioneId)) {
      const uomini = filtered.filter((v) => v.sesso === "M");
      console.log(
        "👨 Filtro solo uomini disponibili:",
        uomini.length,
        "per",
        date,
        "slot",
        slotOrarioId
      );
      if (uomini.length === 0) {
        console.log(
          "⚠️ Nessun uomo disponibile - non è possibile assegnare volontari"
        );
      }
      return uomini;
    }

    return filtered;
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

    // Aggiungi le nuove assegnazioni in sospeso
    const key = `${date}-${slotOrarioId}-${postazioneId}`;
    if (pendingAssignments.has(key)) {
      const pendingAssigns = pendingAssignments.get(key);
      for (const pending of pendingAssigns) {
        // Trova i dati del volontario dalle disponibilità
        const disponibilita = data.disponibilita?.find(
          (d) => d.volontario_id === parseInt(pending.volontario_id)
        );
        if (disponibilita) {
          assignments.push({
            assegnazione_id: `pending-${
              pending.volontario_id
            }-${Date.now()}-${Math.random()}`,
            volontario_id: parseInt(pending.volontario_id),
            nome: disponibilita.nome,
            cognome: disponibilita.cognome,
            sesso: disponibilita.sesso,
            isPending: true,
          });
        } else {
          console.warn(
            "Volontario non trovato nelle disponibilità:",
            pending.volontario_id
          );
        }
      }
    }

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

    // Verifica che il volontario non sia già assegnato
    const existingAssignments = getExistingAssignments(
      date,
      slotOrarioId,
      postazioneId
    );
    const isAlreadyAssigned = existingAssignments.some(
      (a) => a.volontario_id === parseInt(volontarioId)
    );

    if (isAlreadyAssigned) {
      toast.error("Il volontario è già assegnato a questo turno");
      return;
    }

    const key = `${date}-${slotOrarioId}-${postazioneId}`;
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

    // Verifica che il volontario non sia già nelle assegnazioni in sospeso
    const isAlreadyPending = assignments.some(
      (a) => a.volontario_id === parseInt(volontarioId)
    );

    if (isAlreadyPending) {
      toast.error("Il volontario è già nelle assegnazioni in sospeso");
      return;
    }

    assignments.push({
      volontario_id: parseInt(volontarioId),
      data_turno: date,
      slot_orario_id: slotOrarioId,
      postazione_id: postazioneId,
    });
    newPendingAssignments.set(key, assignments);

    console.log("📝 Nuove assegnazioni in sospeso:", newPendingAssignments);
    setPendingAssignments(newPendingAssignments);

    // Forza un re-render immediato per mostrare il feedback visivo
    setTimeout(() => {
      setPendingAssignments(new Map(newPendingAssignments));
    }, 0);

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

      toast.success("Modifiche salvate con successo");
      loadGestioneData(); // Ricarica i dati
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      toast.error("Errore nel salvataggio delle modifiche");
    }
  };

  // Esegue l'autocompilazione automatica per postazione specifica
  const executeAutocompilazione = async (
    postazioneId = null,
    postazioneNome = null
  ) => {
    const isSpecificAutocompilazione = postazioneId !== null;

    setCompiling(true);
    try {
      const response = await fetch("/api/turni/autocompilazione", {
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
        const successMessage = isSpecificAutocompilazione
          ? `Autocompilazione completata per "${postazioneNome}" nel mese ${getMonthName(
              selectedMonth.year,
              selectedMonth.month
            )}: ${result.assegnazioni_create} assegnazioni create`
          : `Autocompilazione completata per ${getMonthName(
              selectedMonth.year,
              selectedMonth.month
            )}: ${result.assegnazioni_create} assegnazioni create`;

        toast.success(successMessage);
        loadGestioneData(); // Ricarica i dati
      } else {
        const error = await response.json();
        toast.error(error.message || "Errore nell'autocompilazione");
      }
    } catch (error) {
      console.error("Errore:", error);
      toast.error("Errore di connessione");
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
      slot.id,
      postazione.id
    );

    const existingAssignments = getExistingAssignments(
      date,
      slot.id,
      postazione.id
    );

    const maxProclamatori = postazione.max_proclamatori || 3;
    const isAssigned = existingAssignments.length > 0;
    const hasAvailableVolunteers = availableVolunteers.length > 0;
    const isFullyAssigned = existingAssignments.length >= maxProclamatori;

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
            {existingAssignments.length}/{maxProclamatori} assegnati
          </div>
          {existingAssignments.map((assignment, index) => (
            <div
              key={index}
              className={`flex items-center justify-between text-xs mb-1 ${
                assignment.isPending
                  ? "text-orange-700 bg-orange-50 px-1 rounded"
                  : "text-green-700"
              }`}
            >
              <span>
                {assignment.nome} {assignment.cognome}
                {assignment.isPending && (
                  <span className="text-xs ml-1">(in sospeso)</span>
                )}
              </span>
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
        </div>
      );
    }

    // Se è parzialmente assegnato
    if (isAssigned) {
      return (
        <div className="text-center p-2 bg-yellow-100 border border-yellow-300 rounded">
          <div className="text-xs text-yellow-700 font-medium mb-1">
            {existingAssignments.length}/{maxProclamatori} assegnati
          </div>
          {existingAssignments.map((assignment, index) => (
            <div
              key={index}
              className={`flex items-center justify-between text-xs mb-1 ${
                assignment.isPending
                  ? "text-orange-700 bg-orange-50 px-1 rounded"
                  : "text-yellow-700"
              }`}
            >
              <span>
                {assignment.nome} {assignment.cognome}
                {assignment.isPending && (
                  <span className="text-xs ml-1">(in sospeso)</span>
                )}
              </span>
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
                  )
              )
              .map((volunteer) => (
                <option
                  key={volunteer.volontario_id}
                  value={volunteer.volontario_id}
                >
                  {volunteer.nome} {volunteer.cognome}
                </option>
              ))}
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
          {availableVolunteers.map((volunteer) => (
            <option
              key={volunteer.volontario_id}
              value={volunteer.volontario_id}
            >
              {volunteer.nome} {volunteer.cognome}
            </option>
          ))}
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
                            className="px-3 py-2 min-w-[150px]"
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
    </div>
  );
};

export default Autocompilazione;
