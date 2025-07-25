const express = require("express");
const Joi = require("joi");
const db = require("../config/database");

const router = express.Router();

// Schema di validazione per le postazioni
const postazioneSchema = Joi.object({
  luogo: Joi.string().min(2).max(255).required(),
  indirizzo: Joi.string().max(500),
  giorni_settimana: Joi.array()
    .items(Joi.number().min(1).max(7))
    .min(1)
    .required(),
  stato: Joi.string().valid("attiva", "inattiva").default("attiva"),
  max_proclamatori: Joi.number().min(1).max(10).default(3),
  slot_orari: Joi.array()
    .items(
      Joi.object({
        orario_inizio: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
        orario_fine: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
        max_volontari: Joi.number().min(1).max(10).default(3),
      })
    )
    .min(1)
    .required(),
});

// GET /api/postazioni - Ottieni tutte le postazioni con i loro slot orari
router.get("/", async (req, res) => {
  try {
    const { stato, giorno, search } = req.query;

    let query = `
      SELECT p.*, 
             json_agg(
               json_build_object(
                 'id', so.id,
                 'orario_inizio', so.orario_inizio,
                 'orario_fine', so.orario_fine,
                 'max_volontari', so.max_volontari,
                 'stato', so.stato
               ) ORDER BY so.orario_inizio
             ) FILTER (WHERE so.id IS NOT NULL) as slot_orari
      FROM postazioni p
      LEFT JOIN slot_orari so ON p.id = so.postazione_id
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (stato) {
      conditions.push(`p.stato = $${paramIndex++}`);
      params.push(stato);
    }

    if (giorno) {
      conditions.push(`$${paramIndex++} = ANY(p.giorni_settimana)`);
      params.push(parseInt(giorno));
    }

    if (search) {
      conditions.push(
        `(p.luogo ILIKE $${paramIndex++} OR p.indirizzo ILIKE $${paramIndex++})`
      );
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY p.id ORDER BY p.luogo";

    const postazioni = await db.any(query, params);

    // Carica i conteggi dei turni per ogni postazione
    for (let postazione of postazioni) {
      try {
        const turniCount = await db.one(
          `SELECT COUNT(DISTINCT a.id) as count 
           FROM slot_orari so 
           LEFT JOIN assegnazioni a ON so.id = a.slot_orario_id 
           WHERE so.postazione_id = $1`,
          [postazione.id]
        );
        postazione.turni_assegnati = parseInt(turniCount.count);
      } catch (error) {
        console.error(
          `Errore nel conteggio turni per postazione ${postazione.id}:`,
          error
        );
        postazione.turni_assegnati = 0;
      }
    }

    // Converti slot_orari da array PostgreSQL a array JavaScript
    const postazioniFormattate = postazioni.map((postazione) => ({
      ...postazione,
      slot_orari: postazione.slot_orari || [],
    }));

    res.json(postazioniFormattate);
  } catch (error) {
    console.error("Errore nel recupero delle postazioni:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/postazioni/:id - Ottieni una postazione specifica con i suoi slot
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const postazione = await db.oneOrNone(
      `
      SELECT p.*, 
             json_agg(
               json_build_object(
                 'id', so.id,
                 'orario_inizio', so.orario_inizio,
                 'orario_fine', so.orario_fine,
                 'max_volontari', so.max_volontari,
                 'stato', so.stato
               ) ORDER BY so.orario_inizio
             ) FILTER (WHERE so.id IS NOT NULL) as slot_orari
      FROM postazioni p
      LEFT JOIN slot_orari so ON p.id = so.postazione_id
      WHERE p.id = $1
      GROUP BY p.id
    `,
      [id]
    );

    if (!postazione) {
      return res.status(404).json({ message: "Postazione non trovata" });
    }

    postazione.slot_orari = postazione.slot_orari || [];
    res.json(postazione);
  } catch (error) {
    console.error("Errore nel recupero della postazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/postazioni - Crea una nuova postazione con i suoi slot orari
router.post("/", async (req, res) => {
  try {
    const { error, value } = postazioneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      luogo,
      indirizzo,
      giorni_settimana,
      stato,
      max_proclamatori,
      slot_orari,
    } = value;

    // Inizia una transazione
    const result = await db.tx(async (t) => {
      // Crea la postazione
      const newPostazione = await t.one(
        `INSERT INTO postazioni (luogo, indirizzo, giorni_settimana, stato, max_proclamatori)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [luogo, indirizzo, giorni_settimana, stato, max_proclamatori]
      );

      // Crea gli slot orari
      for (const slot of slot_orari) {
        await t.none(
          `INSERT INTO slot_orari (postazione_id, orario_inizio, orario_fine, max_volontari)
           VALUES ($1, $2, $3, $4)`,
          [
            newPostazione.id,
            slot.orario_inizio,
            slot.orario_fine,
            slot.max_volontari,
          ]
        );
      }

      // Recupera la postazione completa con gli slot
      const postazioneCompleta = await t.one(
        `
        SELECT p.*, 
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', so.id,
                     'orario_inizio', so.orario_inizio,
                     'orario_fine', so.orario_fine,
                     'max_volontari', so.max_volontari,
                     'stato', so.stato
                   ) ORDER BY so.orario_inizio
                 ) FILTER (WHERE so.id IS NOT NULL),
                 '[]'::json
               ) as slot_orari
        FROM postazioni p
        LEFT JOIN slot_orari so ON p.id = so.postazione_id
        WHERE p.id = $1
        GROUP BY p.id
      `,
        [newPostazione.id]
      );

      return postazioneCompleta;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Errore nella creazione della postazione:", error);
    res
      .status(500)
      .json({ message: "Errore interno del server", error: error.message });
  }
});

// PUT /api/postazioni/:id - Aggiorna una postazione e i suoi slot
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = postazioneSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      luogo,
      indirizzo,
      giorni_settimana,
      stato,
      max_proclamatori,
      slot_orari,
    } = value;

    // Inizia una transazione
    const updatedPostazione = await db.tx(async (t) => {
      // Aggiorna la postazione
      const postazione = await t.oneOrNone(
        `UPDATE postazioni 
         SET luogo = $1, indirizzo = $2, giorni_settimana = $3, stato = $4, max_proclamatori = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [luogo, indirizzo, giorni_settimana, stato, max_proclamatori, id]
      );

      if (!postazione) {
        throw new Error("Postazione non trovata");
      }

      // Ottieni gli slot orari esistenti prima di eliminarli
      const existingSlots = await t.any(
        "SELECT id, orario_inizio, orario_fine FROM slot_orari WHERE postazione_id = $1",
        [id]
      );

      // Elimina tutti gli slot esistenti
      await t.none("DELETE FROM slot_orari WHERE postazione_id = $1", [id]);

      // Crea i nuovi slot
      for (const slot of slot_orari) {
        await t.none(
          `INSERT INTO slot_orari (postazione_id, orario_inizio, orario_fine, max_volontari)
           VALUES ($1, $2, $3, $4)`,
          [id, slot.orario_inizio, slot.orario_fine, slot.max_volontari]
        );
      }

      // Rimuovi le disponibilità per slot orari che non esistono più
      if (existingSlots.length > 0) {
        // Ottieni gli ID degli slot esistenti
        const existingSlotIds = existingSlots.map((slot) => slot.id);

        // Ottieni gli ID dei nuovi slot (se hanno ID) o crea temporanei
        const newSlotIds = slot_orari.map((slot) => slot.id).filter((id) => id);

        // Trova gli slot orari rimossi (quelli che esistevano ma non ci sono più)
        const removedSlotIds = existingSlotIds.filter(
          (oldId) => !newSlotIds.includes(oldId)
        );

        if (removedSlotIds.length > 0) {
          // Elimina le disponibilità per gli slot rimossi
          await t.none(
            `DELETE FROM disponibilita 
             WHERE slot_orario_id = ANY($1)`,
            [removedSlotIds]
          );
        }
      }

      // Recupera la postazione completa con i nuovi slot
      const postazioneCompleta = await t.one(
        `
        SELECT p.*, 
               json_agg(
                 json_build_object(
                   'id', so.id,
                   'orario_inizio', so.orario_inizio,
                   'orario_fine', so.orario_fine,
                   'max_volontari', so.max_volontari,
                   'stato', so.stato
                 ) ORDER BY so.orario_inizio
               ) FILTER (WHERE so.id IS NOT NULL) as slot_orari
        FROM postazioni p
        LEFT JOIN slot_orari so ON p.id = so.postazione_id
        WHERE p.id = $1
        GROUP BY p.id
      `,
        [id]
      );

      postazioneCompleta.slot_orari = postazioneCompleta.slot_orari || [];
      return postazioneCompleta;
    });

    res.json(updatedPostazione);
  } catch (error) {
    console.error("Errore nell'aggiornamento della postazione:", error);
    if (error.message === "Postazione non trovata") {
      res.status(404).json({ message: "Postazione non trovata" });
    } else {
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
});

// PATCH /api/postazioni/:id/toggle-stato - Cambia lo stato di una postazione
router.patch("/:id/toggle-stato", async (req, res) => {
  try {
    const { id } = req.params;
    const { stato } = req.body;

    if (!stato || !["attiva", "inattiva"].includes(stato)) {
      return res.status(400).json({ message: "Stato non valido" });
    }

    const postazione = await db.oneOrNone(
      `UPDATE postazioni 
       SET stato = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [stato, id]
    );

    if (!postazione) {
      return res.status(404).json({ message: "Postazione non trovata" });
    }

    // Recupera la postazione completa con gli slot
    const postazioneCompleta = await db.one(
      `
      SELECT p.*, 
             json_agg(
               json_build_object(
                 'id', so.id,
                 'orario_inizio', so.orario_inizio,
                 'orario_fine', so.orario_fine,
                 'max_volontari', so.max_volontari,
                 'stato', so.stato
               ) ORDER BY so.orario_inizio
             ) FILTER (WHERE so.id IS NOT NULL) as slot_orari
      FROM postazioni p
      LEFT JOIN slot_orari so ON p.id = so.postazione_id
      WHERE p.id = $1
      GROUP BY p.id
    `,
      [id]
    );

    postazioneCompleta.slot_orari = postazioneCompleta.slot_orari || [];
    res.json(postazioneCompleta);
  } catch (error) {
    console.error("Errore nel cambio di stato della postazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// DELETE /api/postazioni/:id - Elimina una postazione e tutti i suoi slot
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.result("DELETE FROM postazioni WHERE id = $1", [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Postazione non trovata" });
    }

    res.json({ message: "Postazione eliminata con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione della postazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/postazioni/sync-disponibilita - Sincronizza disponibilità con configurazioni postazioni
router.post("/sync-disponibilita", async (req, res) => {
  try {
    // Verifica che l'utente sia admin (opzionale)
    // if (!req.user || req.user.ruolo !== 'admin') {
    //   return res.status(403).json({ message: "Accesso negato" });
    // }

    const result = await db.tx(async (t) => {
      // Elimina le disponibilità per giorni in cui le postazioni non sono più attive
      const deletedCount = await t.result(`
        DELETE FROM disponibilita 
        WHERE id IN (
          SELECT d.id
          FROM disponibilita d
          JOIN slot_orari so ON d.slot_orario_id = so.id
          JOIN postazioni p ON so.postazione_id = p.id
          WHERE p.stato = 'attiva'
          AND CASE 
            WHEN EXTRACT(DOW FROM d.data) = 0 THEN 1  -- Domenica
            WHEN EXTRACT(DOW FROM d.data) = 1 THEN 2  -- Lunedì
            WHEN EXTRACT(DOW FROM d.data) = 2 THEN 3  -- Martedì
            WHEN EXTRACT(DOW FROM d.data) = 3 THEN 4  -- Mercoledì
            WHEN EXTRACT(DOW FROM d.data) = 4 THEN 5  -- Giovedì
            WHEN EXTRACT(DOW FROM d.data) = 5 THEN 6  -- Venerdì
            WHEN EXTRACT(DOW FROM d.data) = 6 THEN 7  -- Sabato
          END != ALL(p.giorni_settimana)
        )
      `);

      // Ottieni statistiche delle disponibilità rimanenti
      const stats = await t.any(`
        SELECT 
          p.luogo,
          p.giorni_settimana,
          COUNT(d.id) as disponibilita_rimanenti,
          MIN(d.data) as data_inizio,
          MAX(d.data) as data_fine
        FROM postazioni p
        LEFT JOIN slot_orari so ON p.id = so.postazione_id
        LEFT JOIN disponibilita d ON so.id = d.slot_orario_id
        WHERE p.stato = 'attiva'
        GROUP BY p.id, p.luogo, p.giorni_settimana
        ORDER BY p.id
      `);

      return {
        deletedCount: deletedCount.rowCount,
        stats: stats,
      };
    });

    res.json({
      message: "Sincronizzazione completata con successo",
      deletedCount: result.deletedCount,
      stats: result.stats,
    });
  } catch (error) {
    console.error("Errore nella sincronizzazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/postazioni/sync-disponibilita - Sincronizza disponibilità con configurazioni postazioni
router.post("/sync-disponibilita", async (req, res) => {
  try {
    // Esegui la sincronizzazione
    const result = await db.tx(async (t) => {
      // Elimina le disponibilità per giorni in cui le postazioni non sono più attive
      const deletedCount = await t.result(`
        DELETE FROM disponibilita 
        WHERE id IN (
          SELECT d.id
          FROM disponibilita d
          JOIN slot_orari so ON d.slot_orario_id = so.id
          JOIN postazioni p ON so.postazione_id = p.id
          WHERE p.stato = 'attiva'
          AND CASE 
            WHEN EXTRACT(DOW FROM d.data) = 0 THEN 1  -- Domenica
            WHEN EXTRACT(DOW FROM d.data) = 1 THEN 2  -- Lunedì
            WHEN EXTRACT(DOW FROM d.data) = 2 THEN 3  -- Martedì
            WHEN EXTRACT(DOW FROM d.data) = 3 THEN 4  -- Mercoledì
            WHEN EXTRACT(DOW FROM d.data) = 4 THEN 5  -- Giovedì
            WHEN EXTRACT(DOW FROM d.data) = 5 THEN 6  -- Venerdì
            WHEN EXTRACT(DOW FROM d.data) = 6 THEN 7  -- Sabato
          END != ALL(p.giorni_settimana)
        )
      `);

      // Ottieni statistiche post-sincronizzazione
      const stats = await t.any(`
        SELECT 
          p.luogo,
          p.giorni_settimana,
          COUNT(d.id) as disponibilita_rimanenti,
          MIN(d.data) as data_inizio,
          MAX(d.data) as data_fine
        FROM postazioni p
        LEFT JOIN slot_orari so ON p.id = so.postazione_id
        LEFT JOIN disponibilita d ON so.id = d.slot_orario_id
        WHERE p.stato = 'attiva'
        GROUP BY p.id, p.luogo, p.giorni_settimana
        ORDER BY p.id
      `);

      return {
        deletedCount: deletedCount.rowCount,
        stats: stats,
      };
    });

    res.json({
      message: "Sincronizzazione completata con successo",
      deletedCount: result.deletedCount,
      stats: result.stats,
    });
  } catch (error) {
    console.error("Errore nella sincronizzazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

module.exports = router;
