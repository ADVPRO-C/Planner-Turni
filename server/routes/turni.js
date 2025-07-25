const express = require("express");
const Joi = require("joi");
const db = require("../config/database");

const router = express.Router();

// Schema di validazione per i turni
const turnoSchema = Joi.object({
  postazione_id: Joi.number().integer().positive().required(),
  slot_orario_id: Joi.number().integer().positive().required(),
  data_turno: Joi.date().iso().required(),
  stato: Joi.string()
    .valid("assegnato", "completato", "cancellato")
    .default("assegnato"),
  note: Joi.string().max(500),
});

// GET /api/turni - Ottieni tutti i turni
router.get("/", async (req, res) => {
  try {
    const { postazione_id, data_inizio, data_fine, stato, volontario_id } =
      req.query;

    let query = `
      SELECT t.*, p.luogo, p.indirizzo,
             so.orario_inizio, so.orario_fine,
             COUNT(av.volontario_id) as num_volontari,
             STRING_AGG(CONCAT(v.nome, ' ', v.cognome), ', ') as volontari_nomi
      FROM assegnazioni t
      JOIN postazioni p ON t.postazione_id = p.id
      JOIN slot_orari so ON t.slot_orario_id = so.id
      LEFT JOIN assegnazioni_volontari av ON t.id = av.assegnazione_id
      LEFT JOIN volontari v ON av.volontario_id = v.id
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (postazione_id) {
      conditions.push(`t.postazione_id = $${paramIndex++}`);
      params.push(postazione_id);
    }

    if (data_inizio) {
      conditions.push(`t.data_turno >= $${paramIndex++}`);
      params.push(data_inizio);
    }

    if (data_fine) {
      conditions.push(`t.data_turno <= $${paramIndex++}`);
      params.push(data_fine);
    }

    if (stato) {
      conditions.push(`t.stato = $${paramIndex++}`);
      params.push(stato);
    }

    if (volontario_id) {
      conditions.push(`av.volontario_id = $${paramIndex++}`);
      params.push(volontario_id);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query +=
      " GROUP BY t.id, p.luogo, p.indirizzo, so.orario_inizio, so.orario_fine ORDER BY t.data_turno";

    const turni = await db.any(query, params);

    res.json(turni);
  } catch (error) {
    console.error("Errore nel recupero dei turni:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/turni/:id - Ottieni un turno specifico
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await db.oneOrNone(
      `SELECT t.*, p.luogo, p.indirizzo, so.orario_inizio, so.orario_fine
       FROM assegnazioni t
       JOIN postazioni p ON t.postazione_id = p.id
       JOIN slot_orari so ON t.slot_orario_id = so.id
       WHERE t.id = $1`,
      [id]
    );

    if (!turno) {
      return res.status(404).json({ message: "Turno non trovato" });
    }

    // Ottieni i volontari assegnati
    const volontari = await db.any(
      `SELECT v.*, av.ruolo_turno
       FROM volontari v
       JOIN assegnazioni_volontari av ON v.id = av.volontario_id
       WHERE av.assegnazione_id = $1`,
      [id]
    );

    turno.volontari = volontari;

    res.json(turno);
  } catch (error) {
    console.error("Errore nel recupero del turno:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/turni - Crea un nuovo turno
router.post("/", async (req, res) => {
  try {
    const { error, value } = turnoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { postazione_id, slot_orario_id, data_turno, stato, note } = value;

    // Verifica se esiste già un turno per la stessa postazione, data e slot orario
    const existingTurno = await db.oneOrNone(
      "SELECT id FROM assegnazioni WHERE postazione_id = $1 AND data_turno = $2 AND slot_orario_id = $3",
      [postazione_id, data_turno, slot_orario_id]
    );

    if (existingTurno) {
      return res.status(400).json({
        message: "Turno già esistente per questa postazione, data e orario",
      });
    }

    const newTurno = await db.one(
      `INSERT INTO assegnazioni (postazione_id, slot_orario_id, data_turno, stato, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [postazione_id, slot_orario_id, data_turno, stato, note]
    );

    res.status(201).json(newTurno);
  } catch (error) {
    console.error("Errore nella creazione del turno:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// PUT /api/turni/:id - Aggiorna un turno
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = turnoSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { postazione_id, slot_orario_id, data_turno, stato, note } = value;

    // Verifica se esiste già un turno per la stessa postazione, data e slot orario (escludendo quello corrente)
    const existingTurno = await db.oneOrNone(
      "SELECT id FROM assegnazioni WHERE postazione_id = $1 AND data_turno = $2 AND slot_orario_id = $3 AND id != $4",
      [postazione_id, data_turno, slot_orario_id, id]
    );

    if (existingTurno) {
      return res.status(400).json({
        message: "Turno già esistente per questa postazione, data e orario",
      });
    }

    const updatedTurno = await db.oneOrNone(
      `UPDATE assegnazioni 
       SET postazione_id = $1, slot_orario_id = $2, data_turno = $3, stato = $4, note = $5
       WHERE id = $6
       RETURNING *`,
      [postazione_id, slot_orario_id, data_turno, stato, note, id]
    );

    if (!updatedTurno) {
      return res.status(404).json({ message: "Turno non trovato" });
    }

    res.json(updatedTurno);
  } catch (error) {
    console.error("Errore nell'aggiornamento del turno:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// DELETE /api/turni/:id - Elimina un turno
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Elimina prima le assegnazioni volontari
    await db.none(
      "DELETE FROM assegnazioni_volontari WHERE assegnazione_id = $1",
      [id]
    );

    // Poi elimina il turno
    const result = await db.result("DELETE FROM assegnazioni WHERE id = $1", [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Turno non trovato" });
    }

    res.json({ message: "Turno eliminato con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione del turno:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/turni/:id/assegna - Assegna volontari a un turno
router.post("/:id/assegna", async (req, res) => {
  try {
    const { id } = req.params;
    const { volontari } = req.body;

    if (!Array.isArray(volontari) || volontari.length === 0) {
      return res
        .status(400)
        .json({ message: "Deve essere fornita almeno una lista di volontari" });
    }

    // Verifica che il turno esista
    const turno = await db.oneOrNone(
      "SELECT * FROM assegnazioni WHERE id = $1",
      [id]
    );
    if (!turno) {
      return res.status(404).json({ message: "Turno non trovato" });
    }

    // Elimina le assegnazioni esistenti
    await db.none(
      "DELETE FROM assegnazioni_volontari WHERE assegnazione_id = $1",
      [id]
    );

    // Inserisci le nuove assegnazioni
    for (const volontarioId of volontari) {
      await db.none(
        "INSERT INTO assegnazioni_volontari (assegnazione_id, volontario_id) VALUES ($1, $2)",
        [id, volontarioId]
      );
    }

    res.json({ message: "Volontari assegnati con successo" });
  } catch (error) {
    console.error("Errore nell'assegnazione dei volontari:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/turni/assegna - Assegna un volontario a un turno
router.post("/assegna", async (req, res) => {
  try {
    const { data_turno, slot_orario_id, postazione_id, volontario_id } =
      req.body;

    // Validazione input
    if (!data_turno || !slot_orario_id || !postazione_id || !volontario_id) {
      return res
        .status(400)
        .json({ message: "Tutti i campi sono obbligatori" });
    }

    // Prima ottieni i dettagli dello slot orario
    const slotOrario = await db.oneOrNone(
      `SELECT orario_inizio, orario_fine FROM slot_orari WHERE id = $1`,
      [slot_orario_id]
    );

    if (!slotOrario) {
      return res.status(400).json({ message: "Slot orario non trovato" });
    }

    // Verifica che il volontario sia disponibile per quella data e slot orario
    const disponibilita = await db.oneOrNone(
      `SELECT d.* FROM disponibilita d
       JOIN slot_orari so ON d.slot_orario_id = so.id
       WHERE d.volontario_id = $1 
         AND d.data = $2 
         AND d.slot_orario_id = $3
         AND d.stato = 'disponibile'`,
      [volontario_id, data_turno, slot_orario_id]
    );

    if (!disponibilita) {
      return res.status(400).json({
        message: "Il volontario non è disponibile per questo turno",
      });
    }

    // Verifica se esiste già un'assegnazione per questo slot
    let assegnazione = await db.oneOrNone(
      `SELECT * FROM assegnazioni 
       WHERE data_turno = $1 
         AND slot_orario_id = $2 
         AND postazione_id = $3`,
      [data_turno, slot_orario_id, postazione_id]
    );

    // Se non esiste, crea una nuova assegnazione
    if (!assegnazione) {
      assegnazione = await db.one(
        `INSERT INTO assegnazioni (data_turno, slot_orario_id, postazione_id, stato)
         VALUES ($1, $2, $3, 'assegnato')
         RETURNING *`,
        [data_turno, slot_orario_id, postazione_id]
      );
    }

    // Verifica se il volontario è già assegnato a questo turno
    const existingAssignment = await db.oneOrNone(
      `SELECT * FROM assegnazioni_volontari 
       WHERE assegnazione_id = $1 AND volontario_id = $2`,
      [assegnazione.id, volontario_id]
    );

    if (existingAssignment) {
      return res.status(400).json({
        message: "Il volontario è già assegnato a questo turno",
      });
    }

    // Assegna il volontario al turno
    await db.none(
      `INSERT INTO assegnazioni_volontari (assegnazione_id, volontario_id)
       VALUES ($1, $2)`,
      [assegnazione.id, volontario_id]
    );

    // Aggiorna l'ultima assegnazione del volontario
    await db.none(
      `UPDATE volontari 
       SET ultima_assegnazione = $1 
       WHERE id = $2`,
      [data_turno, volontario_id]
    );

    res.json({
      message: "Volontario assegnato con successo",
      assegnazione_id: assegnazione.id,
    });
  } catch (error) {
    console.error("Errore nell'assegnazione del volontario:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// DELETE /api/turni/assegnazione/:assegnazione_id/volontario/:volontario_id - Rimuovi un volontario da un'assegnazione
router.delete(
  "/assegnazione/:assegnazione_id/volontario/:volontario_id",
  async (req, res) => {
    try {
      const { assegnazione_id, volontario_id } = req.params;

      // Verifica che l'assegnazione esista
      const assegnazione = await db.oneOrNone(
        "SELECT * FROM assegnazioni WHERE id = $1",
        [assegnazione_id]
      );

      if (!assegnazione) {
        return res.status(404).json({ message: "Assegnazione non trovata" });
      }

      // Rimuovi il volontario dall'assegnazione
      const result = await db.result(
        "DELETE FROM assegnazioni_volontari WHERE assegnazione_id = $1 AND volontario_id = $2",
        [assegnazione_id, volontario_id]
      );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Volontario non trovato in questa assegnazione" });
      }

      // Se non ci sono più volontari assegnati, elimina l'assegnazione
      const remainingVolunteers = await db.one(
        "SELECT COUNT(*) as count FROM assegnazioni_volontari WHERE assegnazione_id = $1",
        [assegnazione_id]
      );

      if (parseInt(remainingVolunteers.count) === 0) {
        await db.none("DELETE FROM assegnazioni WHERE id = $1", [
          assegnazione_id,
        ]);
      }

      res.json({ message: "Volontario rimosso con successo" });
    } catch (error) {
      console.error("Errore nella rimozione del volontario:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
);

// DELETE /api/turni/assegnazione/:id - Rimuove un'assegnazione
router.delete("/assegnazione/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica che l'assegnazione esista
    const assegnazione = await db.oneOrNone(
      `SELECT * FROM assegnazioni WHERE id = $1`,
      [id]
    );

    if (!assegnazione) {
      return res.status(404).json({ message: "Assegnazione non trovata" });
    }

    // Rimuovi tutte le assegnazioni volontari per questo turno
    await db.none(
      `DELETE FROM assegnazioni_volontari WHERE assegnazione_id = $1`,
      [id]
    );

    // Rimuovi l'assegnazione
    await db.none(`DELETE FROM assegnazioni WHERE id = $1`, [id]);

    res.json({ message: "Assegnazione rimossa con successo" });
  } catch (error) {
    console.error("Errore nella rimozione dell'assegnazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/turni/autocompilazione - Esegue l'autocompilazione automatica (opzionalmente per postazione specifica)
router.post("/autocompilazione", async (req, res) => {
  try {
    const { data_inizio, data_fine, postazione_id } = req.body;

    // Verifica che il range non superi i 3 mesi
    const dataInizio = new Date(data_inizio);
    const dataFine = new Date(data_fine);
    const oggi = new Date();

    // Calcola la data massima (3 mesi da oggi)
    const dataMassima = new Date(oggi);
    dataMassima.setMonth(dataMassima.getMonth() + 3);

    // Verifica che la data fine non superi i 3 mesi
    if (dataFine > dataMassima) {
      return res.status(400).json({
        message:
          "Il range di date non può superare i 3 mesi in avanti dalla data odierna",
      });
    }

    // Ottieni tutti gli slot orari disponibili nel range di date
    let slotQuery;
    let slotParams = [];

    if (postazione_id) {
      // Autocompilazione specifica per postazione
      slotQuery = `
        SELECT 
          so.id as slot_orario_id,
          so.postazione_id,
          so.orario_inizio,
          so.orario_fine,
          so.max_volontari,
          p.luogo
        FROM slot_orari so
        JOIN postazioni p ON so.postazione_id = p.id
        WHERE so.stato = 'attivo' AND p.stato = 'attiva' AND p.id = $1
        ORDER BY so.orario_inizio
      `;
      slotParams = [postazione_id];
    } else {
      // Autocompilazione per tutte le postazioni
      slotQuery = `
        SELECT 
          so.id as slot_orario_id,
          so.postazione_id,
          so.orario_inizio,
          so.orario_fine,
          so.max_volontari,
          p.luogo
        FROM slot_orari so
        JOIN postazioni p ON so.postazione_id = p.id
        WHERE so.stato = 'attivo' AND p.stato = 'attiva'
        ORDER BY so.postazione_id, so.orario_inizio
      `;
    }

    const slots = await db.any(slotQuery, slotParams);
    let assegnazioniCreate = 0;

    // Per ogni data nel range
    const dateRange = await db.any(
      `SELECT generate_series($1::date, $2::date, '1 day'::interval)::date as data`,
      [data_inizio, data_fine]
    );

    for (const dateRow of dateRange) {
      const data = dateRow.data;

      for (const slot of slots) {
        // Verifica se esiste già un'assegnazione per questo slot in questa data
        const existingAssignment = await db.oneOrNone(
          `SELECT * FROM assegnazioni 
           WHERE data_turno = $1 
             AND slot_orario_id = $2 
             AND postazione_id = $3`,
          [data, slot.slot_orario_id, slot.postazione_id]
        );

        if (existingAssignment) {
          continue; // Salta se già assegnato
        }

        // Trova i volontari disponibili per questo slot
        const availableVolunteers = await db.any(
          `SELECT 
             d.volontario_id,
             v.nome,
             v.cognome,
             v.sesso,
             v.ultima_assegnazione
           FROM disponibilita d
           JOIN volontari v ON d.volontario_id = v.id
           WHERE d.data = $1
             AND d.slot_orario_id = $2
             AND d.stato = 'disponibile'
             AND v.stato = 'attivo'
           ORDER BY v.ultima_assegnazione ASC NULLS FIRST`,
          [data, slot.slot_orario_id]
        );

        // Filtra e seleziona i volontari garantendo almeno un uomo
        let selectedVolunteers = [];
        const uomini = availableVolunteers.filter((v) => v.sesso === "M");
        const donne = availableVolunteers.filter((v) => v.sesso === "F");

        // Se non ci sono uomini disponibili, non assegnare nessuno
        if (uomini.length === 0) {
          console.log(
            `⚠️ Nessun uomo disponibile per ${slot.luogo} il ${data}`
          );
          continue;
        }

        // Seleziona sempre almeno un uomo (quello con ultima assegnazione più lontana)
        selectedVolunteers.push(uomini[0]);

        // Rimuovi l'uomo selezionato dalle liste
        const remainingUomini = uomini.slice(1);
        const allRemaining = [...remainingUomini, ...donne];

        // Ordina i rimanenti per ultima assegnazione
        allRemaining.sort((a, b) => {
          if (!a.ultima_assegnazione && !b.ultima_assegnazione) return 0;
          if (!a.ultima_assegnazione) return -1;
          if (!b.ultima_assegnazione) return 1;
          return (
            new Date(a.ultima_assegnazione) - new Date(b.ultima_assegnazione)
          );
        });

        // Aggiungi i volontari rimanenti fino al limite massimo
        const maxAdditional = slot.max_volontari - 1; // -1 perché abbiamo già aggiunto un uomo
        selectedVolunteers.push(...allRemaining.slice(0, maxAdditional));

        if (selectedVolunteers.length > 0) {
          console.log(
            `✅ Assegnazione per ${slot.luogo} il ${data}:`,
            selectedVolunteers.map((v) => `${v.nome} ${v.cognome} (${v.sesso})`)
          );

          // Crea l'assegnazione
          const newAssignment = await db.one(
            `INSERT INTO assegnazioni (data_turno, slot_orario_id, postazione_id, stato)
             VALUES ($1, $2, $3, 'assegnato')
             RETURNING *`,
            [data, slot.slot_orario_id, slot.postazione_id]
          );

          // Assegna i volontari selezionati
          for (const volunteer of selectedVolunteers) {
            await db.none(
              `INSERT INTO assegnazioni_volontari (assegnazione_id, volontario_id)
               VALUES ($1, $2)`,
              [newAssignment.id, volunteer.volontario_id]
            );

            // Aggiorna l'ultima assegnazione del volontario
            await db.none(
              `UPDATE volontari 
               SET ultima_assegnazione = $1 
               WHERE id = $2`,
              [data, volunteer.volontario_id]
            );
          }

          assegnazioniCreate++;
        }
      }
    }

    res.json({
      message: postazione_id
        ? "Autocompilazione completata con successo per la postazione specifica"
        : "Autocompilazione completata con successo",
      assegnazioni_create: assegnazioniCreate,
    });
  } catch (error) {
    console.error("Errore nell'autocompilazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/turni/reset - Elimina tutte le assegnazioni in un range di date (opzionalmente per postazione specifica)
router.post("/reset", async (req, res) => {
  try {
    const { data_inizio, data_fine, postazione_id } = req.body;

    // Verifica che il range non superi i 3 mesi
    const dataInizio = new Date(data_inizio);
    const dataFine = new Date(data_fine);
    const oggi = new Date();

    // Calcola la data massima (3 mesi da oggi)
    const dataMassima = new Date(oggi);
    dataMassima.setMonth(dataMassima.getMonth() + 3);

    // Verifica che la data fine non superi i 3 mesi
    if (dataFine > dataMassima) {
      return res.status(400).json({
        message:
          "Il range di date non può superare i 3 mesi in avanti dalla data odierna",
      });
    }

    // Costruisci la query in base alla presenza di postazione_id
    let query;
    let params;

    if (postazione_id) {
      // Reset specifico per postazione
      query = `DELETE FROM assegnazioni 
               WHERE data_turno >= $1 AND data_turno <= $2 AND postazione_id = $3`;
      params = [data_inizio, data_fine, postazione_id];
    } else {
      // Reset per tutte le postazioni
      query = `DELETE FROM assegnazioni 
               WHERE data_turno >= $1 AND data_turno <= $2`;
      params = [data_inizio, data_fine];
    }

    // Elimina le assegnazioni
    const result = await db.result(query, params);

    res.json({
      message: postazione_id
        ? "Reset completato con successo per la postazione specifica"
        : "Reset completato con successo",
      assegnazioni_eliminate: result.rowCount,
    });
  } catch (error) {
    console.error("Errore nel reset:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/turni/gestione/:data_inizio/:data_fine - Ottieni dati strutturati per gestione turni
router.get("/gestione/:data_inizio/:data_fine", async (req, res) => {
  try {
    const { data_inizio, data_fine } = req.params;

    // 1. Ottieni tutte le postazioni attive con i loro slot orari
    const postazioniQuery = `
      SELECT 
        p.id as postazione_id,
        p.luogo,
        p.indirizzo,
        p.stato as postazione_stato,
        p.max_proclamatori,
        p.giorni_settimana,
        so.id as slot_orario_id,
        so.orario_inizio,
        so.orario_fine,
        so.max_volontari,
        so.stato as slot_stato
      FROM postazioni p
      JOIN slot_orari so ON p.id = so.postazione_id
      WHERE p.stato = 'attiva' 
        AND so.stato = 'attivo'
      ORDER BY p.luogo, so.orario_inizio
    `;

    const postazioni = await db.any(postazioniQuery);

    // 2. Ottieni tutte le disponibilità nel range di date che corrispondono agli slot orari delle postazioni
    const disponibilitaQuery = `
      SELECT 
        d.volontario_id,
        TO_CHAR(d.data, 'YYYY-MM-DD') as data,
        so.orario_inizio,
        so.orario_fine,
        d.stato as disponibilita_stato,
        so.id as slot_orario_id,
        so.postazione_id,
        v.nome,
        v.cognome,
        v.sesso,
        v.stato as volontario_stato
      FROM disponibilita d
      JOIN volontari v ON d.volontario_id = v.id
      JOIN slot_orari so ON d.slot_orario_id = so.id
      JOIN postazioni p ON so.postazione_id = p.id
      WHERE d.data BETWEEN $1 AND $2
        AND v.stato = 'attivo'
        AND d.stato = 'disponibile'
        AND p.stato = 'attiva'
        AND so.stato = 'attivo'
        AND CASE 
          WHEN EXTRACT(DOW FROM d.data) = 0 THEN 1  -- Domenica
          WHEN EXTRACT(DOW FROM d.data) = 1 THEN 2  -- Lunedì
          WHEN EXTRACT(DOW FROM d.data) = 2 THEN 3  -- Martedì
          WHEN EXTRACT(DOW FROM d.data) = 3 THEN 4  -- Mercoledì
          WHEN EXTRACT(DOW FROM d.data) = 4 THEN 5  -- Giovedì
          WHEN EXTRACT(DOW FROM d.data) = 5 THEN 6  -- Venerdì
          WHEN EXTRACT(DOW FROM d.data) = 6 THEN 7  -- Sabato
        END = ANY(p.giorni_settimana)
      ORDER BY d.data, so.orario_inizio
    `;

    const disponibilita = await db.any(disponibilitaQuery, [
      data_inizio,
      data_fine,
    ]);

    // 3. Ottieni tutte le assegnazioni esistenti nel range di date
    const assegnazioniQuery = `
      SELECT 
        a.id as assegnazione_id,
        a.postazione_id,
        a.slot_orario_id,
        TO_CHAR(a.data_turno, 'YYYY-MM-DD') as data_turno,
        a.stato as assegnazione_stato,
        av.volontario_id,
        v.nome,
        v.cognome,
        v.sesso
      FROM assegnazioni a
      LEFT JOIN assegnazioni_volontari av ON a.id = av.assegnazione_id
      LEFT JOIN volontari v ON av.volontario_id = v.id
      WHERE a.data_turno BETWEEN $1 AND $2
      ORDER BY a.data_turno, a.slot_orario_id
    `;

    const assegnazioni = await db.any(assegnazioniQuery, [
      data_inizio,
      data_fine,
    ]);

    // 4. Genera solo le date nel range che hanno postazioni attive con slot orari configurati
    const dateRangeQuery = `
      SELECT DISTINCT TO_CHAR(d, 'YYYY-MM-DD') as data
      FROM generate_series($1::date, $2::date, '1 day'::interval) d
      WHERE EXISTS (
        SELECT 1 FROM postazioni p 
        JOIN slot_orari so ON p.id = so.postazione_id
        WHERE p.stato = 'attiva' 
        AND so.stato = 'attivo'
        AND CASE 
          WHEN EXTRACT(DOW FROM d) = 0 THEN 1  -- Domenica
          WHEN EXTRACT(DOW FROM d) = 1 THEN 2  -- Lunedì
          WHEN EXTRACT(DOW FROM d) = 2 THEN 3  -- Martedì
          WHEN EXTRACT(DOW FROM d) = 3 THEN 4  -- Mercoledì
          WHEN EXTRACT(DOW FROM d) = 4 THEN 5  -- Giovedì
          WHEN EXTRACT(DOW FROM d) = 5 THEN 6  -- Venerdì
          WHEN EXTRACT(DOW FROM d) = 6 THEN 7  -- Sabato
        END = ANY(p.giorni_settimana)
      )
      ORDER BY data
    `;

    const dateRange = await db.any(dateRangeQuery, [data_inizio, data_fine]);

    // 5. Struttura i dati per il frontend
    const result = {
      dateRange: dateRange.map((d) => d.data),
      postazioni: [],
      disponibilita: disponibilita,
      assegnazioni: assegnazioni,
    };

    // Raggruppa le postazioni e i loro slot
    const postazioniMap = new Map();

    postazioni.forEach((p) => {
      if (!postazioniMap.has(p.postazione_id)) {
        postazioniMap.set(p.postazione_id, {
          id: p.postazione_id,
          luogo: p.luogo,
          indirizzo: p.indirizzo,
          stato: p.postazione_stato,
          max_proclamatori: p.max_proclamatori || 3,
          giorni_settimana: p.giorni_settimana,
          slot_orari: [],
        });
      }

      postazioniMap.get(p.postazione_id).slot_orari.push({
        id: p.slot_orario_id,
        orario_inizio: p.orario_inizio,
        orario_fine: p.orario_fine,
        max_volontari: p.max_volontari,
        stato: p.slot_stato,
      });
    });

    result.postazioni = Array.from(postazioniMap.values());

    res.json(result);
  } catch (error) {
    console.error("Errore nel recupero dei dati per gestione turni:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

module.exports = router;
