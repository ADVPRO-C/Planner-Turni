const express = require("express");
const Joi = require("joi");
const db = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  resolveCongregazioneId,
  enforceSameCongregazione,
  ensureEntityAccess,
} = require("../utils/congregazioni");

const router = express.Router();

router.use(authenticateToken);

const postazioneSchema = Joi.object({
  luogo: Joi.string().min(2).max(255).required(),
  indirizzo: Joi.string().max(500).allow(null, ""),
  giorni_settimana: Joi.array().items(Joi.number().min(1).max(7)).min(1).required(),
  stato: Joi.string().valid("attiva", "inattiva").default("attiva"),
  max_proclamatori: Joi.number().min(1).max(10).default(3),
  slot_orari: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().positive().optional(),
        orario_inizio: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
        orario_fine: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
        max_volontari: Joi.number().min(1).max(10).default(3),
        stato: Joi.string().valid("attivo", "inattivo").default("attivo"),
      })
    )
    .min(1)
    .required(),
  congregazione_id: Joi.number().integer().positive().optional(),
});

const formatPostazione = (row) => ({
  ...row,
  slot_orari: row.slot_orari || [],
  giorni_settimana: row.giorni_settimana || [],
  turni_assegnati: Number(row.turni_assegnati || 0),
});

const fetchPostazioneById = async (id) => {
  return db.oneOrNone(
    `
    SELECT p.*,
           COALESCE(turni.turni_assegnati, 0) AS turni_assegnati,
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
           ) AS slot_orari
    FROM postazioni p
    LEFT JOIN slot_orari so ON p.id = so.postazione_id
    LEFT JOIN (
      SELECT so.postazione_id, COUNT(DISTINCT a.id) AS turni_assegnati
      FROM slot_orari so
      LEFT JOIN assegnazioni a ON a.slot_orario_id = so.id
      GROUP BY so.postazione_id
    ) AS turni ON turni.postazione_id = p.id
    WHERE p.id = $1
    GROUP BY p.id, turni.turni_assegnati
  `,
    [id]
  );
};

router.get("/", async (req, res) => {
  try {
    const { stato, giorno, search } = req.query;
    const targetCongregazioneId = await resolveCongregazioneId(req);

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (targetCongregazioneId) {
      conditions.push(`p.congregazione_id = $${paramIndex++}`);
      params.push(targetCongregazioneId);
    } else if (req.user.ruolo !== "super_admin") {
      conditions.push(`p.congregazione_id = $${paramIndex++}`);
      params.push(req.user.congregazione_id);
    }

    if (stato) {
      conditions.push(`p.stato = $${paramIndex++}`);
      params.push(stato);
    }

    if (giorno) {
      conditions.push(`$${paramIndex++} = ANY(p.giorni_settimana)`);
      params.push(parseInt(giorno, 10));
    }

    if (search) {
      conditions.push(`(p.luogo ILIKE $${paramIndex} OR p.indirizzo ILIKE $${paramIndex + 1})`);
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    let query = `
      SELECT p.*,
             COALESCE(turni.turni_assegnati, 0) AS turni_assegnati,
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
             ) AS slot_orari
      FROM postazioni p
      LEFT JOIN slot_orari so ON p.id = so.postazione_id
      LEFT JOIN (
        SELECT so.postazione_id, COUNT(DISTINCT a.id) AS turni_assegnati
        FROM slot_orari so
        LEFT JOIN assegnazioni a ON a.slot_orario_id = so.id
        GROUP BY so.postazione_id
      ) AS turni ON turni.postazione_id = p.id
    `;

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY p.id, turni.turni_assegnati ORDER BY p.luogo";

    const rows = await db.any(query, params);
    res.json(rows.map(formatPostazione));
  } catch (error) {
    console.error("Errore nel recupero delle postazioni:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const postazione = await fetchPostazioneById(id);

    if (!postazione) {
      return res.status(404).json({ message: "Postazione non trovata" });
    }

    try {
      enforceSameCongregazione(req, postazione.congregazione_id);
    } catch (authError) {
      return res
        .status(authError.statusCode || 403)
        .json({ message: authError.message });
    }

    res.json(formatPostazione(postazione));
  } catch (error) {
    console.error("Errore nel recupero della postazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.post("/", authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const { error, value } = postazioneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const headerCongregazioneId = req.headers["x-congregazione-id"]
      ? parseInt(req.headers["x-congregazione-id"], 10)
      : null;

    const targetCongregazioneId =
      req.user.ruolo === "super_admin"
        ? value.congregazione_id || headerCongregazioneId
        : req.user.congregazione_id;

    if (!targetCongregazioneId) {
      return res
        .status(400)
        .json({ message: "Congregazione non specificata per la postazione" });
    }

    const { luogo, indirizzo, giorni_settimana, stato, max_proclamatori, slot_orari } = value;

    const result = await db.tx(async (t) => {
      const newPostazione = await t.one(
        `INSERT INTO postazioni (congregazione_id, luogo, indirizzo, giorni_settimana, stato, max_proclamatori)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [targetCongregazioneId, luogo, indirizzo || null, giorni_settimana, stato, max_proclamatori]
      );

      for (const slot of slot_orari) {
        await t.none(
          `INSERT INTO slot_orari (postazione_id, congregazione_id, orario_inizio, orario_fine, max_volontari, stato)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            newPostazione.id,
            targetCongregazioneId,
            slot.orario_inizio,
            slot.orario_fine,
            slot.max_volontari,
            slot.stato || "attivo",
          ]
        );
      }

      return newPostazione.id;
    });

    const created = await fetchPostazioneById(result);
    res.status(201).json(formatPostazione(created));
  } catch (error) {
    console.error("Errore nella creazione della postazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.put("/:id", authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = postazioneSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const currentCongregazioneId = await ensureEntityAccess(req, 'postazioni', id);
    if (!currentCongregazioneId) {
      return res.status(404).json({ message: "Postazione non trovata" });
    }

    const headerCongregazioneId = req.headers["x-congregazione-id"]
      ? parseInt(req.headers["x-congregazione-id"], 10)
      : null;

    const targetCongregazioneId =
      req.user.ruolo === "super_admin"
        ? value.congregazione_id || headerCongregazioneId || currentCongregazioneId
        : currentCongregazioneId;

    const { luogo, indirizzo, giorni_settimana, stato, max_proclamatori, slot_orari } = value;

    await db.tx(async (t) => {
      const updated = await t.oneOrNone(
        `UPDATE postazioni
         SET congregazione_id = $1, luogo = $2, indirizzo = $3, giorni_settimana = $4, stato = $5, max_proclamatori = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING id`,
        [targetCongregazioneId, luogo, indirizzo || null, giorni_settimana, stato, max_proclamatori, id]
      );

      if (!updated) {
        throw new Error("NOT_FOUND");
      }

      await t.none("DELETE FROM slot_orari WHERE postazione_id = $1", [id]);

      for (const slot of slot_orari) {
        await t.none(
          `INSERT INTO slot_orari (postazione_id, congregazione_id, orario_inizio, orario_fine, max_volontari, stato)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            id,
            targetCongregazioneId,
            slot.orario_inizio,
            slot.orario_fine,
            slot.max_volontari,
            slot.stato || "attivo",
          ]
        );
      }

      await t.none(
        `DELETE FROM disponibilita
         WHERE slot_orario_id IN (
           SELECT id FROM slot_orari
           WHERE postazione_id = $1
         )
         AND congregazione_id != $2`,
        [id, targetCongregazioneId]
      );
    });

    const updatedPostazione = await fetchPostazioneById(id);
    res.json(formatPostazione(updatedPostazione));
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Postazione non trovata" });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Errore nell'aggiornamento della postazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.patch("/:id/toggle-stato", authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { stato } = req.body;

    if (!stato || !["attiva", "inattiva"].includes(stato)) {
      return res.status(400).json({ message: "Stato non valido" });
    }

    await ensureEntityAccess(req, 'postazioni', id);

    const updated = await db.oneOrNone(
      `UPDATE postazioni
       SET stato = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id`,
      [stato, id]
    );

    if (!updated) {
      return res.status(404).json({ message: "Postazione non trovata" });
    }

    const postazione = await fetchPostazioneById(id);
    res.json(formatPostazione(postazione));
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Errore nel cambio di stato della postazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.delete("/:id", authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const { id } = req.params;
    await ensureEntityAccess(req, 'postazioni', id);

    const result = await db.result("DELETE FROM postazioni WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Postazione non trovata" });
    }

    res.json({ message: "Postazione eliminata con successo" });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Errore nell'eliminazione della postazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.post("/sync-disponibilita", authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const targetCongregazioneId = await resolveCongregazioneId(req, { allowNullForSuperAdmin: false });

    const result = await db.tx(async (t) => {
      const params = [targetCongregazioneId];

      const deleted = await t.result(
        `DELETE FROM disponibilita
         WHERE congregazione_id = $1
           AND id IN (
             SELECT d.id
             FROM disponibilita d
             JOIN slot_orari so ON d.slot_orario_id = so.id
             JOIN postazioni p ON so.postazione_id = p.id
             WHERE p.stato = 'attiva'
               AND CASE
                 WHEN EXTRACT(DOW FROM d.data) = 0 THEN 1
                 WHEN EXTRACT(DOW FROM d.data) = 1 THEN 2
                 WHEN EXTRACT(DOW FROM d.data) = 2 THEN 3
                 WHEN EXTRACT(DOW FROM d.data) = 3 THEN 4
                 WHEN EXTRACT(DOW FROM d.data) = 4 THEN 5
                 WHEN EXTRACT(DOW FROM d.data) = 5 THEN 6
                 WHEN EXTRACT(DOW FROM d.data) = 6 THEN 7
               END != ALL(p.giorni_settimana)
           )`,
        params
      );

      const stats = await t.any(
        `SELECT
           p.luogo,
           p.giorni_settimana,
           COUNT(d.id) AS disponibilita_rimanenti,
           MIN(d.data) AS data_inizio,
           MAX(d.data) AS data_fine
         FROM postazioni p
         LEFT JOIN slot_orari so ON p.id = so.postazione_id
         LEFT JOIN disponibilita d ON so.id = d.slot_orario_id
         WHERE p.congregazione_id = $1
         GROUP BY p.id, p.luogo, p.giorni_settimana
         ORDER BY p.luogo`,
        params
      );

      return { deleted: deleted.rowCount, stats };
    });

    res.json({
      message: "Sincronizzazione completata con successo",
      deletedCount: result.deleted,
      stats: result.stats,
    });
  } catch (error) {
    console.error("Errore nella sincronizzazione delle disponibilità:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

module.exports = router;
