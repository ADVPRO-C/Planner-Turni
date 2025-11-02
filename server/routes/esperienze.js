const express = require("express");
const Joi = require("joi");
const db = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  resolveCongregazioneId,
  ensureEntityAccess,
} = require("../utils/congregazioni");

const router = express.Router();

router.use(authenticateToken);

const esperienzaSchema = Joi.object({
  postazione_id: Joi.number().integer().positive().allow(null).optional(),
  slot_orario_id: Joi.number().integer().positive().allow(null).optional(),
  data: Joi.date().iso().required(),
  racconto: Joi.string().min(10).max(5000).required().messages({
    "string.min": "Il racconto deve contenere almeno 10 caratteri",
    "string.max": "Il racconto non può superare i 5000 caratteri",
    "any.required": "Il racconto è obbligatorio",
  }),
  congregazione_id: Joi.number().integer().positive().optional(),
});

// GET /api/esperienze - Ottieni tutte le esperienze (filtro per utente/admin)
router.get("/", async (req, res) => {
  try {
    const isAdmin = req.user.ruolo === "admin" || req.user.ruolo === "super_admin";
    
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

    let query = `
      SELECT 
        e.id,
        e.volontario_id,
        e.postazione_id,
        e.slot_orario_id,
        e.data,
        e.racconto,
        e.created_at,
        e.updated_at,
        v.nome as volontario_nome,
        v.cognome as volontario_cognome,
        p.luogo as postazione_luogo,
        p.indirizzo as postazione_indirizzo,
        so.orario_inizio,
        so.orario_fine
      FROM esperienze e
      JOIN volontari v ON e.volontario_id = v.id
      LEFT JOIN postazioni p ON e.postazione_id = p.id
      LEFT JOIN slot_orari so ON e.slot_orario_id = so.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filtro per congregazione: tutti devono vedere solo esperienze della propria congregazione
    if (effectiveCongregazioneId) {
      query += ` AND e.congregazione_id = $${paramIndex++}`;
      params.push(effectiveCongregazioneId);
    }

    // Se non è admin, mostra solo le proprie esperienze (oltre al filtro congregazione)
    if (!isAdmin) {
      query += ` AND e.volontario_id = $${paramIndex++}`;
      params.push(req.user.id);
    }
    // Se è admin, vede tutte le esperienze della sua congregazione (già filtrate sopra)

    query += ` ORDER BY e.data DESC, e.created_at DESC`;

    const esperienze = await db.any(query, params);

    res.json(esperienze);
  } catch (error) {
    console.error("Errore nel recupero delle esperienze:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/esperienze/:id - Ottieni un'esperienza specifica
router.get("/:id", async (req, res) => {
  try {
    const esperienzaId = parseInt(req.params.id, 10);
    if (Number.isNaN(esperienzaId)) {
      return res.status(400).json({ message: "ID esperienza non valido" });
    }

    const esperienza = await db.oneOrNone(
      `SELECT 
        e.id,
        e.volontario_id,
        e.postazione_id,
        e.slot_orario_id,
        e.data,
        e.racconto,
        e.created_at,
        e.updated_at,
        v.nome as volontario_nome,
        v.cognome as volontario_cognome,
        p.luogo as postazione_luogo,
        p.indirizzo as postazione_indirizzo,
        so.orario_inizio,
        so.orario_fine
      FROM esperienze e
      JOIN volontari v ON e.volontario_id = v.id
      LEFT JOIN postazioni p ON e.postazione_id = p.id
      LEFT JOIN slot_orari so ON e.slot_orario_id = so.id
      WHERE e.id = $1`,
      [esperienzaId]
    );

    if (!esperienza) {
      return res.status(404).json({ message: "Esperienza non trovata" });
    }

    // Verifica i permessi: l'utente può vedere solo le proprie esperienze (a meno che non sia admin)
    const isAdmin = req.user.ruolo === "admin" || req.user.ruolo === "super_admin";
    if (!isAdmin && esperienza.volontario_id !== req.user.id) {
      return res.status(403).json({ 
        message: "Non hai il permesso di visualizzare questa esperienza" 
      });
    }

    // Verifica accesso alla congregazione
    const congregazioneId = await ensureEntityAccess(req, "esperienze", esperienzaId);
    if (congregazioneId === null) {
      return res.status(403).json({ 
        message: "Non hai accesso a questa esperienza" 
      });
    }

    res.json(esperienza);
  } catch (error) {
    console.error("Errore nel recupero dell'esperienza:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/esperienze - Crea una nuova esperienza
router.post("/", async (req, res) => {
  try {
    const { error, value } = esperienzaSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { postazione_id, slot_orario_id, data, racconto } = value;

    // Determina la congregazione
    const requestedCongregazione = await resolveCongregazioneId(req, {
      allowNullForSuperAdmin: true,
    });

    const effectiveCongregazioneId =
      requestedCongregazione ??
      (req.user.ruolo === "super_admin" ? null : req.user.congregazione_id);

    if (!effectiveCongregazioneId) {
      return res.status(400).json({
        message: "Congregazione non specificata. Seleziona una congregazione attiva.",
      });
    }

    // Se è specificata una postazione, verifica che appartenga alla congregazione
    if (postazione_id) {
      const postazione = await db.oneOrNone(
        "SELECT congregazione_id FROM postazioni WHERE id = $1",
        [postazione_id]
      );

      if (!postazione) {
        return res.status(404).json({ message: "Postazione non trovata" });
      }

      if (postazione.congregazione_id !== effectiveCongregazioneId) {
        return res.status(403).json({ 
          message: "La postazione non appartiene alla tua congregazione" 
        });
      }
    }

    // Se è specificato uno slot_orario_id, verifica che appartenga alla postazione e alla congregazione
    if (slot_orario_id) {
      const slot = await db.oneOrNone(
        `SELECT so.postazione_id, p.congregazione_id 
         FROM slot_orari so
         JOIN postazioni p ON so.postazione_id = p.id
         WHERE so.id = $1`,
        [slot_orario_id]
      );

      if (!slot) {
        return res.status(404).json({ message: "Fascia oraria non trovata" });
      }

      if (slot.congregazione_id !== effectiveCongregazioneId) {
        return res.status(403).json({ 
          message: "La fascia oraria non appartiene alla tua congregazione" 
        });
      }

      // Se è specificata anche una postazione, verifica che lo slot appartenga a quella postazione
      if (postazione_id && slot.postazione_id !== parseInt(postazione_id)) {
        return res.status(400).json({ 
          message: "La fascia oraria selezionata non appartiene alla postazione selezionata" 
        });
      }
    }

    // Inserisci l'esperienza
    const newEsperienza = await db.one(
      `INSERT INTO esperienze (volontario_id, congregazione_id, postazione_id, slot_orario_id, data, racconto)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, volontario_id, postazione_id, slot_orario_id, data, racconto, created_at, updated_at`,
      [req.user.id, effectiveCongregazioneId, postazione_id || null, slot_orario_id || null, data, racconto]
    );

    // Recupera i dettagli completi
    const esperienzaCompleta = await db.one(
      `SELECT 
        e.id,
        e.volontario_id,
        e.postazione_id,
        e.slot_orario_id,
        e.data,
        e.racconto,
        e.created_at,
        e.updated_at,
        v.nome as volontario_nome,
        v.cognome as volontario_cognome,
        p.luogo as postazione_luogo,
        p.indirizzo as postazione_indirizzo,
        so.orario_inizio,
        so.orario_fine
      FROM esperienze e
      JOIN volontari v ON e.volontario_id = v.id
      LEFT JOIN postazioni p ON e.postazione_id = p.id
      LEFT JOIN slot_orari so ON e.slot_orario_id = so.id
      WHERE e.id = $1`,
      [newEsperienza.id]
    );

    res.status(201).json(esperienzaCompleta);
  } catch (error) {
    console.error("Errore nella creazione dell'esperienza:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// PUT /api/esperienze/:id - Aggiorna un'esperienza
router.put("/:id", async (req, res) => {
  try {
    const esperienzaId = parseInt(req.params.id, 10);
    if (Number.isNaN(esperienzaId)) {
      return res.status(400).json({ message: "ID esperienza non valido" });
    }

    const { error, value } = esperienzaSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Verifica che l'esperienza esista e appartenga all'utente
    const existingEsperienza = await db.oneOrNone(
      "SELECT volontario_id, congregazione_id FROM esperienze WHERE id = $1",
      [esperienzaId]
    );

    if (!existingEsperienza) {
      return res.status(404).json({ message: "Esperienza non trovata" });
    }

    // Solo il proprietario può modificare (admin può modificare tutte)
    const isAdmin = req.user.ruolo === "admin" || req.user.ruolo === "super_admin";
    if (!isAdmin && existingEsperienza.volontario_id !== req.user.id) {
      return res.status(403).json({ 
        message: "Non hai il permesso di modificare questa esperienza" 
      });
    }

    // Verifica accesso alla congregazione
    await ensureEntityAccess(req, "esperienze", esperienzaId);

    const { postazione_id, slot_orario_id, data, racconto } = value;

    // Se è specificata una postazione, verifica che appartenga alla congregazione
    if (postazione_id) {
      const postazione = await db.oneOrNone(
        "SELECT congregazione_id FROM postazioni WHERE id = $1",
        [postazione_id]
      );

      if (!postazione) {
        return res.status(404).json({ message: "Postazione non trovata" });
      }

      if (postazione.congregazione_id !== existingEsperienza.congregazione_id) {
        return res.status(403).json({ 
          message: "La postazione non appartiene alla congregazione dell'esperienza" 
        });
      }
    }

    // Se è specificato uno slot_orario_id, verifica che appartenga alla postazione e alla congregazione
    if (slot_orario_id) {
      const slot = await db.oneOrNone(
        `SELECT so.postazione_id, p.congregazione_id 
         FROM slot_orari so
         JOIN postazioni p ON so.postazione_id = p.id
         WHERE so.id = $1`,
        [slot_orario_id]
      );

      if (!slot) {
        return res.status(404).json({ message: "Fascia oraria non trovata" });
      }

      if (slot.congregazione_id !== existingEsperienza.congregazione_id) {
        return res.status(403).json({ 
          message: "La fascia oraria non appartiene alla congregazione dell'esperienza" 
        });
      }

      // Se è specificata anche una postazione, verifica che lo slot appartenga a quella postazione
      if (postazione_id && slot.postazione_id !== parseInt(postazione_id)) {
        return res.status(400).json({ 
          message: "La fascia oraria selezionata non appartiene alla postazione selezionata" 
        });
      }
    }

    // Aggiorna l'esperienza
    await db.none(
      `UPDATE esperienze 
       SET postazione_id = $1, slot_orario_id = $2, data = $3, racconto = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [postazione_id || null, slot_orario_id || null, data, racconto, esperienzaId]
    );

    // Recupera l'esperienza aggiornata
    const esperienzaAggiornata = await db.one(
      `SELECT 
        e.id,
        e.volontario_id,
        e.postazione_id,
        e.slot_orario_id,
        e.data,
        e.racconto,
        e.created_at,
        e.updated_at,
        v.nome as volontario_nome,
        v.cognome as volontario_cognome,
        p.luogo as postazione_luogo,
        p.indirizzo as postazione_indirizzo,
        so.orario_inizio,
        so.orario_fine
      FROM esperienze e
      JOIN volontari v ON e.volontario_id = v.id
      LEFT JOIN postazioni p ON e.postazione_id = p.id
      LEFT JOIN slot_orari so ON e.slot_orario_id = so.id
      WHERE e.id = $1`,
      [esperienzaId]
    );

    res.json(esperienzaAggiornata);
  } catch (error) {
    console.error("Errore nell'aggiornamento dell'esperienza:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// DELETE /api/esperienze/:id - Elimina un'esperienza
router.delete("/:id", async (req, res) => {
  try {
    const esperienzaId = parseInt(req.params.id, 10);
    if (Number.isNaN(esperienzaId)) {
      return res.status(400).json({ message: "ID esperienza non valido" });
    }

    // Verifica che l'esperienza esista e appartenga all'utente
    const existingEsperienza = await db.oneOrNone(
      "SELECT volontario_id FROM esperienze WHERE id = $1",
      [esperienzaId]
    );

    if (!existingEsperienza) {
      return res.status(404).json({ message: "Esperienza non trovata" });
    }

    // Solo il proprietario può eliminare (admin può eliminare tutte)
    const isAdmin = req.user.ruolo === "admin" || req.user.ruolo === "super_admin";
    if (!isAdmin && existingEsperienza.volontario_id !== req.user.id) {
      return res.status(403).json({ 
        message: "Non hai il permesso di eliminare questa esperienza" 
      });
    }

    // Verifica accesso alla congregazione
    await ensureEntityAccess(req, "esperienze", esperienzaId);

    await db.none("DELETE FROM esperienze WHERE id = $1", [esperienzaId]);

    res.json({ message: "Esperienza eliminata con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione dell'esperienza:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

module.exports = router;

