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

const turnoSchema = Joi.object({
  postazione_id: Joi.number().integer().positive().required(),
  slot_orario_id: Joi.number().integer().positive().required(),
  data_turno: Joi.date().iso().required(),
  stato: Joi.string()
    .valid("assegnato", "completato", "cancellato")
    .default("assegnato"),
  note: Joi.string().allow(null, "").max(500),
  congregazione_id: Joi.number().integer().positive().optional(),
});

const assignSchema = Joi.object({
  data_turno: Joi.date().iso().required(),
  slot_orario_id: Joi.number().integer().positive().required(),
  postazione_id: Joi.number().integer().positive().required(),
  volontario_id: Joi.number().integer().positive().required(),
});

const autoCompileSchema = Joi.object({
  data_inizio: Joi.date().iso().required(),
  data_fine: Joi.date().iso().required(),
  postazione_id: Joi.number().integer().positive().optional(),
  congregazione_id: Joi.number().integer().positive().optional(),
});

const resetSchema = Joi.object({
  data_inizio: Joi.date().iso().required(),
  data_fine: Joi.date().iso().required(),
  postazione_id: Joi.number().integer().positive().optional(),
  congregazione_id: Joi.number().integer().positive().optional(),
});

const getCongregazioneForAssignment = async (assegnazioneId) => {
  const row = await db.oneOrNone(
    "SELECT congregazione_id FROM assegnazioni WHERE id = $1",
    [assegnazioneId]
  );
  return row ? row.congregazione_id : null;
};

router.get("/", async (req, res) => {
  try {
    const {
      postazione_id,
      data_inizio,
      data_fine,
      stato,
      volontario_id,
      congregazione_id,
    } = req.query;

    const requestedCongId = congregazione_id
      ? parseInt(congregazione_id, 10)
      : await resolveCongregazioneId(req, { allowNullForSuperAdmin: true });

    const effectiveCongId =
      requestedCongId ??
      (req.user.ruolo === "super_admin" ? null : req.user.congregazione_id);

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    let query = `
      SELECT
        t.*, p.luogo, p.indirizzo,
        so.orario_inizio, so.orario_fine,
        COUNT(av.volontario_id) AS num_volontari,
        STRING_AGG(CONCAT(v.nome, ' ', v.cognome), ', ' ORDER BY v.cognome, v.nome) AS volontari_nomi
      FROM assegnazioni t
      JOIN postazioni p ON t.postazione_id = p.id
      JOIN slot_orari so ON t.slot_orario_id = so.id
      LEFT JOIN assegnazioni_volontari av ON t.id = av.assegnazione_id
      LEFT JOIN volontari v ON av.volontario_id = v.id
    `;

    if (effectiveCongId) {
      conditions.push(`t.congregazione_id = $${paramIndex++}`);
      params.push(effectiveCongId);
    }

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
      " GROUP BY t.id, t.postazione_id, t.slot_orario_id, t.data_turno, t.stato, t.note, t.created_at, t.updated_at, t.congregazione_id, p.luogo, p.indirizzo, so.orario_inizio, so.orario_fine ORDER BY t.data_turno";

    const turni = await db.any(query, params);
    res.json(turni);
  } catch (error) {
    console.error("Errore nel recupero dei turni:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/turni/miei-turni - Ottieni i prossimi turni dell'utente corrente
// IMPORTANTE: lasciare questa route PRIMA di "/:id" per evitare conflitti
router.get("/miei-turni", async (req, res) => {
  try {
    const userId = req.user.id;
    const { data_inizio, data_fine } = req.query;

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const dataInizio = data_inizio || oggi.toISOString().split("T")[0];
    const dataFine = data_fine || new Date(oggi.getTime() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const requestedCongregazione = await resolveCongregazioneId(req, {
      allowNullForSuperAdmin: true,
    });

    const effectiveCongregazioneId =
      requestedCongregazione ??
      (req.user.ruolo === "super_admin" ? null : req.user.congregazione_id);

    if (!effectiveCongregazioneId && req.user.ruolo !== "super_admin") {
      return res.status(400).json({
        message: "Congregazione non specificata. Seleziona una congregazione attiva.",
      });
    }

    // Query per ottenere i turni dell'utente con dettagli postazione e compagni
    // Filtra solo i turni nei giorni validi per la postazione
    const query = `
      WITH turni_utente AS (
        SELECT DISTINCT a.id AS assegnazione_id
        FROM assegnazioni a
        JOIN assegnazioni_volontari av ON a.id = av.assegnazione_id
        JOIN postazioni p ON a.postazione_id = p.id
        WHERE a.stato IN ('assegnato', 'completato')
          AND a.data_turno >= $1::date
          AND a.data_turno <= $2::date
          AND av.volontario_id = $3
          ${effectiveCongregazioneId ? 'AND a.congregazione_id = $4' : ''}
          AND p.stato = 'attiva'
          AND CASE 
            WHEN EXTRACT(DOW FROM a.data_turno) = 0 THEN 7
            WHEN EXTRACT(DOW FROM a.data_turno) = 1 THEN 1
            WHEN EXTRACT(DOW FROM a.data_turno) = 2 THEN 2
            WHEN EXTRACT(DOW FROM a.data_turno) = 3 THEN 3
            WHEN EXTRACT(DOW FROM a.data_turno) = 4 THEN 4
            WHEN EXTRACT(DOW FROM a.data_turno) = 5 THEN 5
            WHEN EXTRACT(DOW FROM a.data_turno) = 6 THEN 6
          END = ANY(p.giorni_settimana)
      )
      SELECT
        a.id AS assegnazione_id,
        a.data_turno,
        a.stato,
        p.luogo AS postazione_luogo,
        p.indirizzo AS postazione_indirizzo,
        so.orario_inizio,
        so.orario_fine,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', v.id,
                'nome', v.nome,
                'cognome', v.cognome,
                'telefono', v.telefono,
                'email', v.email,
                'sesso', v.sesso
              ) ORDER BY v.cognome, v.nome
            )
            FROM assegnazioni_volontari av
            JOIN volontari v ON av.volontario_id = v.id
            WHERE av.assegnazione_id = a.id
              AND v.id != $3
          ),
          '[]'::json
        ) AS compagni
      FROM assegnazioni a
      JOIN turni_utente tu ON a.id = tu.assegnazione_id
      JOIN postazioni p ON a.postazione_id = p.id
      JOIN slot_orari so ON a.slot_orario_id = so.id
      ORDER BY a.data_turno ASC, so.orario_inizio ASC
    `;

    const params = [dataInizio, dataFine, userId];
    if (effectiveCongregazioneId) {
      params.push(effectiveCongregazioneId);
    }

    const turni = await db.any(query, params);

    const turniFormattati = turni.map((turno) => {
      const compagni = Array.isArray(turno.compagni) ? turno.compagni : [];

      return {
        id: turno.assegnazione_id,
        data_turno: turno.data_turno,
        stato: turno.stato,
        postazione: {
          luogo: turno.postazione_luogo,
          indirizzo: turno.postazione_indirizzo,
        },
        orario: {
          inizio: turno.orario_inizio,
          fine: turno.orario_fine,
        },
        compagni: compagni.map((c) => ({
          id: c.id,
          nome: c.nome,
          cognome: c.cognome,
          nome_completo: `${c.nome} ${c.cognome}`,
          telefono: c.telefono,
          email: c.email,
          sesso: c.sesso,
        })),
      };
    });

    res.json(turniFormattati);
  } catch (error) {
    console.error("Errore nel recupero dei turni dell'utente:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const turnoId = parseInt(req.params.id, 10);
    if (Number.isNaN(turnoId)) {
      return res.status(400).json({ message: "ID turno non valido" });
    }

    const turno = await db.oneOrNone(
      `SELECT t.*, p.luogo, p.indirizzo, so.orario_inizio, so.orario_fine
       FROM assegnazioni t
       JOIN postazioni p ON t.postazione_id = p.id
       JOIN slot_orari so ON t.slot_orario_id = so.id
       WHERE t.id = $1`,
      [turnoId]
    );

    if (!turno) {
      return res.status(404).json({ message: "Turno non trovato" });
    }

    try {
      enforceSameCongregazione(req, turno.congregazione_id);
    } catch (authError) {
      return res
        .status(authError.statusCode || 403)
        .json({ message: authError.message });
    }

    const volontari = await db.any(
      `SELECT v.id, v.nome, v.cognome, v.sesso, av.ruolo_turno
       FROM volontari v
       JOIN assegnazioni_volontari av ON v.id = av.volontario_id
       WHERE av.assegnazione_id = $1`,
      [turnoId]
    );

    turno.volontari = volontari;
    res.json(turno);
  } catch (error) {
    console.error("Errore nel recupero del turno:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.post(
  "/",
  authorizeRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const { error, value } = turnoSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { postazione_id, slot_orario_id, data_turno, stato, note } = value;

      const postazioneCongId = await ensureEntityAccess(
        req,
        "postazioni",
        postazione_id
      );
      if (!postazioneCongId) {
        return res.status(404).json({ message: "Postazione non trovata" });
      }

      const slotCongId = await ensureEntityAccess(
        req,
        "slot_orari",
        slot_orario_id
      );
      if (!slotCongId) {
        return res.status(404).json({ message: "Slot orario non trovato" });
      }

      if (slotCongId !== postazioneCongId) {
        return res
          .status(400)
          .json({ message: "Lo slot orario non appartiene alla postazione" });
      }

      const existingTurno = await db.oneOrNone(
        `SELECT id FROM assegnazioni
         WHERE postazione_id = $1 AND slot_orario_id = $2 AND data_turno = $3
           AND congregazione_id = $4`,
        [postazione_id, slot_orario_id, data_turno, postazioneCongId]
      );

      if (existingTurno) {
        return res.status(400).json({
          message: "Turno già esistente per questa postazione, data e orario",
        });
      }

      const newTurno = await db.one(
        `INSERT INTO assegnazioni (postazione_id, slot_orario_id, congregazione_id, data_turno, stato, note)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [postazione_id, slot_orario_id, postazioneCongId, data_turno, stato, note]
      );

      res.status(201).json(newTurno);
    } catch (error) {
      console.error("Errore nella creazione del turno:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
);

router.put(
  "/:id",
  authorizeRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const turnoId = parseInt(req.params.id, 10);
      if (Number.isNaN(turnoId)) {
        return res.status(400).json({ message: "ID turno non valido" });
      }

      const { error, value } = turnoSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const turnoCongregazioneId = await ensureEntityAccess(
        req,
        "assegnazioni",
        turnoId
      );
      if (!turnoCongregazioneId) {
        return res.status(404).json({ message: "Turno non trovato" });
      }

      const { postazione_id, slot_orario_id, data_turno, stato, note } = value;

      const postazioneCongId = await ensureEntityAccess(
        req,
        "postazioni",
        postazione_id
      );
      if (!postazioneCongId) {
        return res.status(404).json({ message: "Postazione non trovata" });
      }

      const slotCongId = await ensureEntityAccess(
        req,
        "slot_orari",
        slot_orario_id
      );
      if (!slotCongId) {
        return res.status(404).json({ message: "Slot orario non trovato" });
      }

      if (postazioneCongId !== slotCongId || postazioneCongId !== turnoCongregazioneId) {
        return res
          .status(403)
          .json({ message: "Le risorse selezionate non appartengono alla stessa congregazione" });
      }

      const duplicate = await db.oneOrNone(
        `SELECT id FROM assegnazioni
         WHERE postazione_id = $1 AND slot_orario_id = $2 AND data_turno = $3
           AND id != $4 AND congregazione_id = $5`,
        [postazione_id, slot_orario_id, data_turno, turnoId, turnoCongregazioneId]
      );

      if (duplicate) {
        return res.status(400).json({
          message: "Turno già esistente per questa postazione, data e orario",
        });
      }

      const updated = await db.oneOrNone(
        `UPDATE assegnazioni
         SET postazione_id = $1,
             slot_orario_id = $2,
             data_turno = $3,
             stato = $4,
             note = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [postazione_id, slot_orario_id, data_turno, stato, note, turnoId]
      );

      res.json(updated);
    } catch (error) {
      console.error("Errore nell'aggiornamento del turno:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
);

router.delete(
  "/:id",
  authorizeRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const turnoId = parseInt(req.params.id, 10);
      if (Number.isNaN(turnoId)) {
        return res.status(400).json({ message: "ID turno non valido" });
      }

      const turnoCongId = await ensureEntityAccess(req, "assegnazioni", turnoId);
      if (!turnoCongId) {
        return res.status(404).json({ message: "Turno non trovato" });
      }

      await db.tx(async (t) => {
        await t.none("DELETE FROM assegnazioni_volontari WHERE assegnazione_id = $1", [turnoId]);
        await t.none("DELETE FROM assegnazioni WHERE id = $1", [turnoId]);
      });

      res.json({ message: "Turno eliminato con successo" });
    } catch (error) {
      console.error("Errore nell'eliminazione del turno:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
);

router.post(
  "/:id/assegna",
  authorizeRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const turnoId = parseInt(req.params.id, 10);
      if (Number.isNaN(turnoId)) {
        return res.status(400).json({ message: "ID turno non valido" });
      }

      const turnoCongId = await ensureEntityAccess(req, "assegnazioni", turnoId);
      if (!turnoCongId) {
        return res.status(404).json({ message: "Turno non trovato" });
      }

      const { volontari } = req.body;
      if (!Array.isArray(volontari) || volontari.length === 0) {
        return res.status(400).json({ message: "Fornisci una lista di volontari" });
      }

      const volontariRows = await db.any(
        `SELECT id, congregazione_id, ruolo FROM volontari WHERE id = ANY($1::int[])`,
        [volontari]
      );

      if (volontariRows.length !== volontari.length) {
        return res.status(400).json({ message: "Uno o più volontari non esistono" });
      }

      const invalidCongregazione = volontariRows.find((v) => v.congregazione_id !== turnoCongId);
      if (invalidCongregazione) {
        return res
          .status(403)
          .json({ message: "Volontario non appartiene alla congregazione del turno" });
      }

      const superAdmin = volontariRows.find((v) => v.ruolo === 'super_admin');
      if (superAdmin) {
        return res
          .status(403)
          .json({ message: "Non è possibile assegnare un super admin a un turno" });
      }

      // Verifica che tutti i volontari siano attivi
      const inattivi = volontariRows.filter((v) => v.stato === 'non_attivo');
      if (inattivi.length > 0) {
        return res
          .status(403)
          .json({ message: "Non è possibile assegnare volontari inattivi a un turno" });
      }

      await db.tx(async (t) => {
        await t.none(
          "DELETE FROM assegnazioni_volontari WHERE assegnazione_id = $1",
          [turnoId]
        );

        for (const volontarioId of volontari) {
          await t.none(
            `INSERT INTO assegnazioni_volontari (assegnazione_id, volontario_id, congregazione_id)
             VALUES ($1, $2, $3)`,
            [turnoId, volontarioId, turnoCongId]
          );
        }
      });

      res.json({ message: "Volontari assegnati con successo" });
    } catch (error) {
      console.error("Errore nell'assegnazione dei volontari:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
);

router.post(
  "/assegna",
  authorizeRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const { error, value } = assignSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { data_turno, slot_orario_id, postazione_id, volontario_id } = value;

      const volontarioRow = await db.oneOrNone(
        `SELECT id, congregazione_id, ruolo, stato FROM volontari WHERE id = $1`,
        [volontario_id]
      );
      
      if (!volontarioRow) {
        return res.status(404).json({ message: "Volontario non trovato" });
      }

      if (volontarioRow.ruolo === 'super_admin') {
        return res.status(403).json({ message: "Non è possibile assegnare un super admin a un turno" });
      }

      if (volontarioRow.stato === 'non_attivo') {
        return res.status(403).json({ message: "Non è possibile assegnare un volontario inattivo a un turno" });
      }

      const volontarioCongId = volontarioRow.congregazione_id;

      const postazioneCongId = await ensureEntityAccess(
        req,
        "postazioni",
        postazione_id
      );
      if (!postazioneCongId) {
        return res.status(404).json({ message: "Postazione non trovata" });
      }

      const slotCongId = await ensureEntityAccess(
        req,
        "slot_orari",
        slot_orario_id
      );
      if (!slotCongId) {
        return res.status(404).json({ message: "Slot orario non trovato" });
      }

      if (
        postazioneCongId !== slotCongId ||
        postazioneCongId !== volontarioCongId
      ) {
        return res.status(403).json({
          message: "Le risorse selezionate devono appartenere alla stessa congregazione",
        });
      }

      const disponibilita = await db.oneOrNone(
        `SELECT d.id FROM disponibilita d
         WHERE d.volontario_id = $1
           AND d.data = $2
           AND d.slot_orario_id = $3
           AND d.congregazione_id = $4
           AND d.stato = 'disponibile'`,
        [volontario_id, data_turno, slot_orario_id, volontarioCongId]
      );

      if (!disponibilita) {
        return res.status(400).json({
          message: "Il volontario non è disponibile per questo turno",
        });
      }

      let assegnazione = await db.oneOrNone(
        `SELECT * FROM assegnazioni
         WHERE data_turno = $1
           AND slot_orario_id = $2
           AND postazione_id = $3
           AND congregazione_id = $4`,
        [data_turno, slot_orario_id, postazione_id, volontarioCongId]
      );

      if (!assegnazione) {
        assegnazione = await db.one(
          `INSERT INTO assegnazioni (data_turno, slot_orario_id, postazione_id, congregazione_id, stato)
           VALUES ($1, $2, $3, $4, 'assegnato')
           RETURNING *`,
          [data_turno, slot_orario_id, postazione_id, volontarioCongId]
        );
      }

      const existing = await db.oneOrNone(
        `SELECT 1 FROM assegnazioni_volontari
         WHERE assegnazione_id = $1 AND volontario_id = $2`,
        [assegnazione.id, volontario_id]
      );

      if (existing) {
        return res
          .status(400)
          .json({ message: "Il volontario è già assegnato a questo turno" });
      }

      await db.tx(async (t) => {
        await t.none(
          `INSERT INTO assegnazioni_volontari (assegnazione_id, volontario_id, congregazione_id)
           VALUES ($1, $2, $3)`,
          [assegnazione.id, volontario_id, volontarioCongId]
        );

        await t.none(
          `UPDATE volontari
           SET ultima_assegnazione = $1
           WHERE id = $2`,
          [data_turno, volontario_id]
        );
      });

      res.json({
        message: "Volontario assegnato con successo",
        assegnazione_id: assegnazione.id,
      });
    } catch (error) {
      console.error("Errore nell'assegnazione del volontario:", error);
      console.error("Stack trace:", error.stack);
      console.error("Dettagli richiesta:", {
        data_turno: req.body.data_turno,
        slot_orario_id: req.body.slot_orario_id,
        postazione_id: req.body.postazione_id,
        volontario_id: req.body.volontario_id,
      });
      res.status(500).json({ 
        message: "Errore interno del server",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  }
);

router.delete(
  "/assegnazione/:assegnazione_id/volontario/:volontario_id",
  authorizeRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const assegnazioneId = parseInt(req.params.assegnazione_id, 10);
      const volontarioId = parseInt(req.params.volontario_id, 10);

      if (Number.isNaN(assegnazioneId) || Number.isNaN(volontarioId)) {
        return res.status(400).json({ message: "Parametri non validi" });
      }

      const assegnazioneCongId = await ensureEntityAccess(
        req,
        "assegnazioni",
        assegnazioneId
      );
      if (!assegnazioneCongId) {
        return res.status(404).json({ message: "Assegnazione non trovata" });
      }

      await db.tx(async (t) => {
        const result = await t.result(
          `DELETE FROM assegnazioni_volontari
           WHERE assegnazione_id = $1 AND volontario_id = $2`,
          [assegnazioneId, volontarioId]
        );

        if (result.rowCount === 0) {
          throw Object.assign(new Error("NOT_FOUND"), { statusCode: 404 });
        }

        const remaining = await t.one(
          `SELECT COUNT(*) AS count
           FROM assegnazioni_volontari
           WHERE assegnazione_id = $1`,
          [assegnazioneId]
        );

        if (parseInt(remaining.count, 10) === 0) {
          await t.none("DELETE FROM assegnazioni WHERE id = $1", [assegnazioneId]);
        }
      });

      res.json({ message: "Volontario rimosso con successo" });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message === "NOT_FOUND" ? "Volontario non trovato" : error.message });
      }
      console.error("Errore nella rimozione del volontario:", error);
      console.error("Stack trace:", error.stack);
      console.error("Dettagli richiesta:", {
        assegnazione_id: req.params.assegnazione_id,
        volontario_id: req.params.volontario_id,
      });
      res.status(500).json({ 
        message: "Errore interno del server",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  }
);

router.delete(
  "/assegnazione/:id",
  authorizeRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const assegnazioneId = parseInt(req.params.id, 10);
      if (Number.isNaN(assegnazioneId)) {
        return res.status(400).json({ message: "ID assegnazione non valido" });
      }

      const assegnazioneCong = await ensureEntityAccess(
        req,
        "assegnazioni",
        assegnazioneId
      );
      if (!assegnazioneCong) {
        return res.status(404).json({ message: "Assegnazione non trovata" });
      }

      await db.tx(async (t) => {
        await t.none(
          `DELETE FROM assegnazioni_volontari WHERE assegnazione_id = $1`,
          [assegnazioneId]
        );
        await t.none("DELETE FROM assegnazioni WHERE id = $1", [assegnazioneId]);
      });

      res.json({ message: "Assegnazione rimossa con successo" });
    } catch (error) {
      console.error("Errore nella rimozione dell'assegnazione:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
);

router.post(
  "/autocompilazione",
  authorizeRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const { error, value } = autoCompileSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { data_inizio, data_fine } = value;
      let { postazione_id, congregazione_id } = value;

      const requestedCongregazione = congregazione_id
        ? congregazione_id
        : await resolveCongregazioneId(req, { allowNullForSuperAdmin: false });

      if (!requestedCongregazione) {
        return res
          .status(400)
          .json({ message: "Congregazione non specificata" });
      }

      let targetCongregazioneId = requestedCongregazione;

      if (postazione_id) {
        const postazioneCong = await ensureEntityAccess(
          req,
          "postazioni",
          postazione_id
        );
        if (!postazioneCong) {
          return res.status(404).json({ message: "Postazione non trovata" });
        }
        targetCongregazioneId = postazioneCong;
      }

      const dataInizio = new Date(data_inizio);
      const dataFine = new Date(data_fine);
      const oggi = new Date();
      const dataMassima = new Date(oggi);
      dataMassima.setMonth(dataMassima.getMonth() + 3);

      if (dataFine > dataMassima) {
        return res.status(400).json({
          message:
            "Il range di date non può superare i 3 mesi in avanti dalla data odierna",
        });
      }

      let slotQuery;
      let slotParams;

      if (postazione_id) {
        slotQuery = `
          SELECT so.id AS slot_orario_id,
                 so.postazione_id,
                 so.orario_inizio,
                 so.orario_fine,
                 so.max_volontari,
                 p.luogo
          FROM slot_orari so
          JOIN postazioni p ON so.postazione_id = p.id
          WHERE so.stato = 'attivo'
            AND p.stato = 'attiva'
            AND p.id = $1
            AND so.congregazione_id = $2
        `;
        slotParams = [postazione_id, targetCongregazioneId];
      } else {
        slotQuery = `
          SELECT so.id AS slot_orario_id,
                 so.postazione_id,
                 so.orario_inizio,
                 so.orario_fine,
                 so.max_volontari,
                 p.luogo
          FROM slot_orari so
          JOIN postazioni p ON so.postazione_id = p.id
          WHERE so.stato = 'attivo'
            AND p.stato = 'attiva'
            AND so.congregazione_id = $1
        `;
        slotParams = [targetCongregazioneId];
      }

      const slots = await db.any(slotQuery, slotParams);

      const dateRange = await db.any(
        `SELECT generate_series($1::date, $2::date, '1 day'::interval)::date AS data`,
        [data_inizio, data_fine]
      );

      // Le assegnazioni esistenti vengono conteggiate nella query per ogni slot
      // per assicurare che i volontari siano ordinati in base al numero di assegnazioni

      let assegnazioniCreate = 0;
      let assegnazioniAggiornate = 0;

      await db.tx(async (t) => {
        for (const dateRow of dateRange) {
          const data = dateRow.data;

          for (const slot of slots) {
            // Controlla se esiste già un'assegnazione per questo slot
            const existingAssignment = await t.oneOrNone(
              `SELECT 
                a.id,
                COUNT(av.volontario_id) as num_volontari_assegnati
              FROM assegnazioni a
              LEFT JOIN assegnazioni_volontari av ON a.id = av.assegnazione_id
              WHERE a.data_turno = $1 
                AND a.slot_orario_id = $2 
                AND a.postazione_id = $3 
                AND a.congregazione_id = $4
              GROUP BY a.id`,
              [data, slot.slot_orario_id, slot.postazione_id, targetCongregazioneId]
            );

            // Se lo slot è già completo, salta
            if (existingAssignment && parseInt(existingAssignment.num_volontari_assegnati, 10) >= slot.max_volontari) {
              continue;
            }

            // Ottieni volontari disponibili per questo slot
            // Prepara la query con i parametri corretti
            const queryParams = existingAssignment 
              ? [data, slot.slot_orario_id, targetCongregazioneId, existingAssignment.id, data_inizio, data_fine, targetCongregazioneId]
              : [data, slot.slot_orario_id, targetCongregazioneId, data_inizio, data_fine, targetCongregazioneId];
            
            const availableVolunteersQuery = existingAssignment
              ? `SELECT 
                  d.volontario_id, 
                  v.nome, 
                  v.cognome, 
                  v.sesso,
                  v.stato,
                  v.ultima_assegnazione,
                  COALESCE((
                    SELECT COUNT(*) FROM assegnazioni_volontari av 
                    JOIN assegnazioni a ON av.assegnazione_id = a.id 
                    WHERE av.volontario_id = v.id 
                      AND a.data_turno BETWEEN $5 AND $6 
                      AND a.congregazione_id = $7 
                      AND a.stato = 'assegnato'
                  ), 0) as assegnazioni_esistenti
                FROM disponibilita d
                JOIN volontari v ON d.volontario_id = v.id
                WHERE d.data = $1
                  AND d.slot_orario_id = $2
                  AND d.stato = 'disponibile'
                  AND d.congregazione_id = $3
                  AND v.stato = 'attivo'
                  AND v.ruolo != 'super_admin'
                  AND NOT EXISTS (
                    SELECT 1 FROM assegnazioni_volontari av2 
                    WHERE av2.assegnazione_id = $4 
                      AND av2.volontario_id = v.id
                  )
                ORDER BY 
                  CASE WHEN v.sesso = 'M' THEN 0 ELSE 1 END,
                  COALESCE((
                    SELECT COUNT(*) FROM assegnazioni_volontari av 
                    JOIN assegnazioni a ON av.assegnazione_id = a.id 
                    WHERE av.volontario_id = v.id 
                      AND a.data_turno BETWEEN $5 AND $6 
                      AND a.congregazione_id = $7 
                      AND a.stato = 'assegnato'
                  ), 0) ASC,
                  v.ultima_assegnazione ASC NULLS FIRST`
              : `SELECT 
                  d.volontario_id, 
                  v.nome, 
                  v.cognome, 
                  v.sesso,
                  v.stato,
                  v.ultima_assegnazione,
                  COALESCE((
                    SELECT COUNT(*) FROM assegnazioni_volontari av 
                    JOIN assegnazioni a ON av.assegnazione_id = a.id 
                    WHERE av.volontario_id = v.id 
                      AND a.data_turno BETWEEN $4 AND $5 
                      AND a.congregazione_id = $6 
                      AND a.stato = 'assegnato'
                  ), 0) as assegnazioni_esistenti
                FROM disponibilita d
                JOIN volontari v ON d.volontario_id = v.id
                WHERE d.data = $1
                  AND d.slot_orario_id = $2
                  AND d.stato = 'disponibile'
                  AND d.congregazione_id = $3
                  AND v.stato = 'attivo'
                  AND v.ruolo != 'super_admin'
                ORDER BY 
                  CASE WHEN v.sesso = 'M' THEN 0 ELSE 1 END,
                  COALESCE((
                    SELECT COUNT(*) FROM assegnazioni_volontari av 
                    JOIN assegnazioni a ON av.assegnazione_id = a.id 
                    WHERE av.volontario_id = v.id 
                      AND a.data_turno BETWEEN $4 AND $5 
                      AND a.congregazione_id = $6 
                      AND a.stato = 'assegnato'
                  ), 0) ASC,
                  v.ultima_assegnazione ASC NULLS FIRST`;

            const availableVolunteers = await t.any(availableVolunteersQuery, queryParams);

            // Se non ci sono volontari disponibili, salta questo slot
            if (availableVolunteers.length === 0) {
              continue;
            }

            // Calcola quanti volontari servono (slot vuoto o incompleto)
            const volontariNecessari = existingAssignment
              ? Math.max(0, slot.max_volontari - parseInt(existingAssignment.num_volontari_assegnati, 10))
              : slot.max_volontari;

            if (volontariNecessari <= 0) {
              continue;
            }

            // Seleziona volontari in modo bilanciato:
            // 1. Preferenza per almeno un uomo (se disponibile)
            // 2. Priorità ai volontari con meno assegnazioni
            const selectedVolunteers = [];
            const uomini = availableVolunteers.filter((v) => v.sesso === "M");
            const donne = availableVolunteers.filter((v) => v.sesso === "F");
            
            // Se ci sono uomini disponibili, prova ad assegnare almeno uno
            if (uomini.length > 0) {
              // Ordina uomini per numero di assegnazioni (meno assegnazioni = priorità)
              const uominiOrdinati = uomini.sort((a, b) => {
                const assegnazioniA = parseInt(a.assegnazioni_esistenti || 0, 10);
                const assegnazioniB = parseInt(b.assegnazioni_esistenti || 0, 10);
                if (assegnazioniA !== assegnazioniB) {
                  return assegnazioniA - assegnazioniB;
                }
                // In caso di parità, usa ultima_assegnazione
                if (!a.ultima_assegnazione && !b.ultima_assegnazione) return 0;
                if (!a.ultima_assegnazione) return -1;
                if (!b.ultima_assegnazione) return 1;
                return new Date(a.ultima_assegnazione) - new Date(b.ultima_assegnazione);
              });

              // Aggiungi almeno un uomo
              selectedVolunteers.push(uominiOrdinati[0]);
            }

            // Aggiungi altri volontari (uomini rimanenti e donne) sempre bilanciando per assegnazioni
            const uominiRimanenti = uomini.length > 0 ? uomini.slice(1) : [];
            const remaining = [...uominiRimanenti, ...donne].sort((a, b) => {
              const assegnazioniA = parseInt(a.assegnazioni_esistenti || 0, 10);
              const assegnazioniB = parseInt(b.assegnazioni_esistenti || 0, 10);
              if (assegnazioniA !== assegnazioniB) {
                return assegnazioniA - assegnazioniB;
              }
              if (!a.ultima_assegnazione && !b.ultima_assegnazione) return 0;
              if (!a.ultima_assegnazione) return -1;
              if (!b.ultima_assegnazione) return 1;
              return new Date(a.ultima_assegnazione) - new Date(b.ultima_assegnazione);
            });

            const slotsRimanenti = Math.max(0, volontariNecessari - selectedVolunteers.length);
            selectedVolunteers.push(
              ...remaining.slice(0, Math.min(slotsRimanenti, remaining.length))
            );

            if (selectedVolunteers.length === 0) {
              continue;
            }

            let assignmentId;
            
            if (existingAssignment) {
              // Slot già esistente ma incompleto - aggiungi volontari
              assignmentId = existingAssignment.id;
              assegnazioniAggiornate += 1;
            } else {
              // Slot vuoto - crea nuova assegnazione
              const newAssignment = await t.one(
                `INSERT INTO assegnazioni (data_turno, slot_orario_id, postazione_id, congregazione_id, stato)
                 VALUES ($1, $2, $3, $4, 'assegnato')
                 RETURNING id`,
                [data, slot.slot_orario_id, slot.postazione_id, targetCongregazioneId]
              );
              assignmentId = newAssignment.id;
              assegnazioniCreate += 1;
            }

            // Assegna i volontari selezionati
            for (const volunteer of selectedVolunteers) {
              await t.none(
                `INSERT INTO assegnazioni_volontari (assegnazione_id, volontario_id, congregazione_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT DO NOTHING`,
                [assignmentId, volunteer.volontario_id, targetCongregazioneId]
              );

              await t.none(
                `UPDATE volontari
                 SET ultima_assegnazione = $1
                 WHERE id = $2`,
                [data, volunteer.volontario_id]
              );
            }
          }
        }
      });

      res.json({
        message: postazione_id
          ? "Autocompilazione completata per la postazione"
          : "Autocompilazione completata",
        assegnazioni_create: assegnazioniCreate,
        assegnazioni_aggiornate: assegnazioniAggiornate,
      });
    } catch (error) {
      console.error("Errore nell'autocompilazione:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
);

router.post(
  "/reset",
  authorizeRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const { error, value } = resetSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { data_inizio, data_fine } = value;
      let { postazione_id, congregazione_id } = value;

      const requestedCongregazione = congregazione_id
        ? congregazione_id
        : await resolveCongregazioneId(req, { allowNullForSuperAdmin: false });

      if (!requestedCongregazione) {
        return res
          .status(400)
          .json({ message: "Congregazione non specificata" });
      }

      let targetCongregazioneId = requestedCongregazione;

      if (postazione_id) {
        const postazioneCong = await ensureEntityAccess(
          req,
          "postazioni",
          postazione_id
        );
        if (!postazioneCong) {
          return res.status(404).json({ message: "Postazione non trovata" });
        }
        targetCongregazioneId = postazioneCong;
      }

      const dataInizio = new Date(data_inizio);
      const dataFine = new Date(data_fine);
      const oggi = new Date();
      const dataMassima = new Date(oggi);
      dataMassima.setMonth(dataMassima.getMonth() + 3);

      if (dataFine > dataMassima) {
        return res.status(400).json({
          message:
            "Il range di date non può superare i 3 mesi in avanti dalla data odierna",
        });
      }

      let query;
      let params;

      if (postazione_id) {
        query = `DELETE FROM assegnazioni
                 WHERE data_turno BETWEEN $1 AND $2
                   AND postazione_id = $3
                   AND congregazione_id = $4`;
        params = [data_inizio, data_fine, postazione_id, targetCongregazioneId];
      } else {
        query = `DELETE FROM assegnazioni
                 WHERE data_turno BETWEEN $1 AND $2
                   AND congregazione_id = $3`;
        params = [data_inizio, data_fine, targetCongregazioneId];
      }

      const result = await db.result(query, params);

      res.json({
        message: postazione_id
          ? "Reset completato per la postazione"
          : "Reset completato",
        assegnazioni_eliminate: result.rowCount,
      });
    } catch (error) {
      console.error("Errore nel reset:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
);

router.get(
  "/gestione/:data_inizio/:data_fine",
  async (req, res) => {
    try {
      const { data_inizio, data_fine } = req.params;

      const targetCongregazioneId = await resolveCongregazioneId(req, {
        allowNullForSuperAdmin: true,
      });
      const effectiveCongregazioneId =
        targetCongregazioneId ??
        (req.user.ruolo === "super_admin" ? null : req.user.congregazione_id);

      const postazioniQuery = `
        SELECT 
          p.id AS postazione_id,
          p.luogo,
          p.indirizzo,
          p.stato AS postazione_stato,
          p.max_proclamatori,
          p.giorni_settimana,
          so.id AS slot_orario_id,
          so.orario_inizio,
          so.orario_fine,
          so.max_volontari,
          so.stato AS slot_stato
        FROM postazioni p
        JOIN slot_orari so ON p.id = so.postazione_id
        WHERE p.stato = 'attiva'
          AND so.stato = 'attivo'
          ${effectiveCongregazioneId ? "AND p.congregazione_id = $1" : ""}
        ORDER BY p.luogo, so.orario_inizio
      `;

      const postazioniParams = effectiveCongregazioneId
        ? [effectiveCongregazioneId]
        : [];
      const postazioni = await db.any(postazioniQuery, postazioniParams);

      const disponibilitaQuery = `
        SELECT 
          d.volontario_id,
          TO_CHAR(d.data, 'YYYY-MM-DD') AS data,
          so.orario_inizio,
          so.orario_fine,
          d.stato AS disponibilita_stato,
          so.id AS slot_orario_id,
          so.postazione_id,
          v.nome,
          v.cognome,
          v.sesso,
          v.stato AS volontario_stato
        FROM disponibilita d
        JOIN volontari v ON d.volontario_id = v.id
        JOIN slot_orari so ON d.slot_orario_id = so.id
        JOIN postazioni p ON so.postazione_id = p.id
        WHERE d.data BETWEEN $1 AND $2
          AND v.stato = 'attivo'
          AND v.ruolo != 'super_admin'
          AND d.stato = 'disponibile'
          AND p.stato = 'attiva'
          AND so.stato = 'attivo'
          AND d.congregazione_id = $3
          AND CASE 
            WHEN EXTRACT(DOW FROM d.data) = 0 THEN 7
            WHEN EXTRACT(DOW FROM d.data) = 1 THEN 1
            WHEN EXTRACT(DOW FROM d.data) = 2 THEN 2
            WHEN EXTRACT(DOW FROM d.data) = 3 THEN 3
            WHEN EXTRACT(DOW FROM d.data) = 4 THEN 4
            WHEN EXTRACT(DOW FROM d.data) = 5 THEN 5
            WHEN EXTRACT(DOW FROM d.data) = 6 THEN 6
          END = ANY(p.giorni_settimana)
      `;

      const assegnazioniQuery = `
        SELECT 
          a.id AS assegnazione_id,
          a.postazione_id,
          a.slot_orario_id,
          TO_CHAR(a.data_turno, 'YYYY-MM-DD') AS data_turno,
          a.stato AS assegnazione_stato,
          av.volontario_id,
          v.nome,
          v.cognome,
          v.sesso
        FROM assegnazioni a
        LEFT JOIN assegnazioni_volontari av ON a.id = av.assegnazione_id
        LEFT JOIN volontari v ON av.volontario_id = v.id
        WHERE a.data_turno BETWEEN $1 AND $2
          AND a.congregazione_id = $3
        ORDER BY a.data_turno, a.slot_orario_id
      `;

      const dateRangeQuery = `
        SELECT DISTINCT TO_CHAR(d, 'YYYY-MM-DD') AS data
        FROM generate_series($1::date, $2::date, '1 day'::interval) d
        WHERE EXISTS (
          SELECT 1 FROM postazioni p 
          JOIN slot_orari so ON p.id = so.postazione_id
          WHERE p.stato = 'attiva' 
            AND so.stato = 'attivo'
            AND p.congregazione_id = $3
            AND CASE 
              WHEN EXTRACT(DOW FROM d) = 0 THEN 7
              WHEN EXTRACT(DOW FROM d) = 1 THEN 1
              WHEN EXTRACT(DOW FROM d) = 2 THEN 2
              WHEN EXTRACT(DOW FROM d) = 3 THEN 3
              WHEN EXTRACT(DOW FROM d) = 4 THEN 4
              WHEN EXTRACT(DOW FROM d) = 5 THEN 5
              WHEN EXTRACT(DOW FROM d) = 6 THEN 6
            END = ANY(p.giorni_settimana)
        )
        ORDER BY data
      `;

      // Se il super admin non specifica congregazione restituiamo errore esplicito
      if (!effectiveCongregazioneId) {
        return res.status(400).json({
          message: "Specificare una congregazione per la consultazione",
        });
      }

      const disponibilita = await db.any(disponibilitaQuery, [
        data_inizio,
        data_fine,
        effectiveCongregazioneId,
      ]);

      const assegnazioni = await db.any(assegnazioniQuery, [
        data_inizio,
        data_fine,
        effectiveCongregazioneId,
      ]);

      const dateRange = await db.any(dateRangeQuery, [
        data_inizio,
        data_fine,
        effectiveCongregazioneId,
      ]);

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

      res.json({
        dateRange: dateRange.map((d) => d.data),
        postazioni: Array.from(postazioniMap.values()),
        disponibilita,
        assegnazioni,
      });
    } catch (error) {
      console.error("Errore nel recupero dei dati per gestione turni:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
);

module.exports = router;
