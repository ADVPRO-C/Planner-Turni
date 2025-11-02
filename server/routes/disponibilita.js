const express = require("express");
const Joi = require("joi");
const db = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { resolveCongregazioneId, enforceSameCongregazione, ensureEntityAccess } = require("../utils/congregazioni");

const router = express.Router();

router.use(authenticateToken);

// Schema di validazione per le disponibilità
const disponibilitaSchema = Joi.object({
  volontario_id: Joi.number().integer().positive().required(),
  disponibilita: Joi.array()
    .items(
      Joi.object({
        data: Joi.string()
          .pattern(/^\d{4}-\d{2}-\d{2}$/)
          .required(),
        slot_orario_id: Joi.number().integer().positive().required(),
        stato: Joi.string().valid("disponibile", "non_disponibile").required(),
        note: Joi.string().optional().allow("", null),
      })
    )
    .required(),
});

// Schema per singola disponibilità
const singolaDisponibilitaSchema = Joi.object({
  data: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  slot_orario_id: Joi.number().integer().positive().required(),
  stato: Joi.string().valid("disponibile", "non_disponibile").required(),
  note: Joi.string().optional().allow("", null),
});

// GET /api/disponibilita/volontario/:id - Ottieni le disponibilità di un volontario
router.get("/volontario/:id", async (req, res) => {
  try {
    const volontarioId = parseInt(req.params.id, 10);
    if (Number.isNaN(volontarioId)) {
      return res.status(400).json({ message: "ID volontario non valido" });
    }

    const congregazioneId = await ensureEntityAccess(req, 'volontari', volontarioId);
    if (congregazioneId === null) {
      return res.status(404).json({ message: "Volontario non trovato" });
    }

    const { data_inizio, data_fine, stato } = req.query;

    let query = `
      SELECT 
        d.id,
        d.volontario_id,
        d.data,
        d.stato,
        d.note,
        d.created_at,
        d.slot_orario_id,
        v.nome,
        v.cognome,
        v.sesso,
        so.orario_inizio,
        so.orario_fine,
        p.luogo AS postazione_luogo,
        p.id AS postazione_id
      FROM disponibilita d
      JOIN volontari v ON d.volontario_id = v.id
      JOIN slot_orari so ON d.slot_orario_id = so.id
      JOIN postazioni p ON so.postazione_id = p.id
      WHERE d.volontario_id = $1
        AND d.congregazione_id = $2
        AND p.stato = 'attiva'
    `;

    const params = [volontarioId, congregazioneId];
    let paramIndex = 3;

    if (data_inizio) {
      query += ` AND d.data >= $${paramIndex++}`;
      params.push(data_inizio);
    }

    if (data_fine) {
      query += ` AND d.data <= $${paramIndex++}`;
      params.push(data_fine);
    }

    if (stato) {
      query += ` AND d.stato = $${paramIndex++}`;
      params.push(stato);
    }

    query += " ORDER BY d.data, so.orario_inizio";

    const disponibilita = await db.any(query, params);
    res.json(disponibilita);
  } catch (error) {
    console.error("Errore nel recupero delle disponibilità:", error);
    console.error("Stack trace:", error.stack);
    console.error("Dettagli richiesta:", {
      volontarioId: req.params.id,
      query: req.query,
      user: req.user?.id,
    });
    res.status(500).json({ 
      message: "Errore interno del server",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// POST /api/disponibilita/volontario - Salva le disponibilità di un volontario
router.post("/volontario", async (req, res) => {
  try {
    const { error, value } = disponibilitaSchema.validate(req.body);
    if (error) {
      console.error("Errore validazione disponibilità:", error.details);
      console.error("Body ricevuto:", JSON.stringify(req.body, null, 2));
      return res.status(400).json({ 
        message: error.details[0].message,
        details: process.env.NODE_ENV === "development" ? error.details : undefined
      });
    }

    const { volontario_id, disponibilita } = value;

    if (req.user.ruolo === 'volontario' && req.user.id !== volontario_id) {
      return res.status(403).json({ message: 'Non puoi modificare le disponibilità di altri volontari' });
    }

    const congregazioneId = await ensureEntityAccess(req, 'volontari', volontario_id);
    if (congregazioneId === null) {
      return res.status(404).json({ message: 'Volontario non trovato' });
    }

    const slotIds = [...new Set(disponibilita.map((d) => d.slot_orario_id))];

    if (slotIds.length === 0) {
      return res.status(400).json({ message: 'Nessuna disponibilità fornita' });
    }

    const slots = await db.any(
      `SELECT id, congregazione_id FROM slot_orari WHERE id = ANY($1::int[])`,
      [slotIds]
    );

    if (slots.length !== slotIds.length) {
      return res.status(400).json({ message: 'Uno o più slot orari non esistono' });
    }

    const invalidSlot = slots.find((slot) => slot.congregazione_id !== congregazioneId);
    if (invalidSlot) {
      return res
        .status(403)
        .json({ message: 'Slot orario non appartiene alla congregazione del volontario' });
    }

    await db.tx(async (t) => {
      const dateToUpdate = [...new Set(disponibilita.map((d) => d.data))];

      if (dateToUpdate.length > 0) {
        await t.none(
          `DELETE FROM disponibilita
           WHERE volontario_id = $1
             AND congregazione_id = $2
             AND data = ANY($3::date[])`,
          [volontario_id, congregazioneId, dateToUpdate]
        );
      }

      for (const disp of disponibilita) {
        await t.none(
          `INSERT INTO disponibilita (volontario_id, congregazione_id, data, slot_orario_id, stato, note)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            volontario_id,
            congregazioneId,
            disp.data,
            disp.slot_orario_id,
            disp.stato,
            disp.note || null,
          ]
        );
      }
    });

    res.json({ message: 'Disponibilità salvate con successo' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error('Errore nel salvataggio delle disponibilità:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

// GET /api/disponibilita/postazione/:id - Ottieni le disponibilità per una postazione specifica
router.get("/postazione/:id", async (req, res) => {
  try {
    const postazioneId = parseInt(req.params.id, 10);
    if (Number.isNaN(postazioneId)) {
      return res.status(400).json({ message: "ID postazione non valido" });
    }

    const postazione = await db.oneOrNone(
      `SELECT p.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', so.id,
                    'orario_inizio', so.orario_inizio,
                    'orario_fine', so.orario_fine,
                    'max_volontari', so.max_volontari
                  ) ORDER BY so.orario_inizio
                ) FILTER (WHERE so.id IS NOT NULL),
                '[]'::json
              ) AS slot_orari
       FROM postazioni p
       LEFT JOIN slot_orari so ON p.id = so.postazione_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [postazioneId]
    );

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

    const { data_inizio, data_fine } = req.query;

    let query = `
      SELECT d.*, v.nome, v.cognome, v.sesso, so.orario_inizio, so.orario_fine
      FROM disponibilita d
      JOIN volontari v ON d.volontario_id = v.id
      JOIN slot_orari so ON d.slot_orario_id = so.id
      WHERE v.stato = 'attivo'
        AND d.stato = 'disponibile'
        AND d.congregazione_id = $1
        AND so.postazione_id = $2
        AND CASE 
          WHEN EXTRACT(DOW FROM d.data) = 0 THEN 7
          WHEN EXTRACT(DOW FROM d.data) = 1 THEN 1
          WHEN EXTRACT(DOW FROM d.data) = 2 THEN 2
          WHEN EXTRACT(DOW FROM d.data) = 3 THEN 3
          WHEN EXTRACT(DOW FROM d.data) = 4 THEN 4
          WHEN EXTRACT(DOW FROM d.data) = 5 THEN 5
          WHEN EXTRACT(DOW FROM d.data) = 6 THEN 6
        END = ANY($3)
    `;
    const params = [postazione.congregazione_id, postazioneId, postazione.giorni_settimana];
    let paramIndex = 4;

    if (data_inizio) {
      query += ` AND d.data >= $${paramIndex++}`;
      params.push(data_inizio);
    }

    if (data_fine) {
      query += ` AND d.data <= $${paramIndex++}`;
      params.push(data_fine);
    }

    query += " ORDER BY d.data, so.orario_inizio";

    const disponibilita = await db.any(query, params);

    // Raggruppa le disponibilità per data e orario
    const disponibilitaRaggruppate = {};
    disponibilita.forEach((disp) => {
      const key = `${disp.data}_${disp.orario_inizio}_${disp.orario_fine}`;
      if (!disponibilitaRaggruppate[key]) {
        disponibilitaRaggruppate[key] = {
          data: disp.data,
          orario_inizio: disp.orario_inizio,
          orario_fine: disp.orario_fine,
          volontari: [],
          uomini: 0,
          donne: 0,
        };
      }
      disponibilitaRaggruppate[key].volontari.push({
        id: disp.volontario_id,
        nome: disp.nome,
        cognome: disp.cognome,
        sesso: disp.sesso,
      });
      if (disp.sesso === "M") {
        disponibilitaRaggruppate[key].uomini++;
      } else {
        disponibilitaRaggruppate[key].donne++;
      }
    });

    res.json({
      postazione,
      disponibilita: Object.values(disponibilitaRaggruppate),
    });
  } catch (error) {
    console.error(
      "Errore nel recupero delle disponibilità per postazione:",
      error
    );
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/disponibilita/riepilogo - Ottieni un riepilogo delle disponibilità
router.get("/riepilogo", async (req, res) => {
  try {
    const { data_inizio, data_fine } = req.query;
    const targetCongregazioneId = await resolveCongregazioneId(req, {
      allowNullForSuperAdmin: true,
    });
    const filterCongregazioneId =
      targetCongregazioneId ?? (req.user.ruolo === "super_admin" ? null : req.user.congregazione_id);

    let query = `
      SELECT 
        d.data,
        so.orario_inizio,
        so.orario_fine,
        p.luogo as postazione,
        p.id as postazione_id,
        COUNT(DISTINCT d.volontario_id) as totale_disponibili,
        COUNT(DISTINCT CASE WHEN v.sesso = 'M' THEN d.volontario_id END) as uomini,
        COUNT(DISTINCT CASE WHEN v.sesso = 'F' THEN d.volontario_id END) as donne,
        so.max_volontari,
        BOOL_OR(a.id IS NOT NULL) as assegnato
      FROM disponibilita d
      JOIN volontari v ON d.volontario_id = v.id
      JOIN slot_orari so ON d.slot_orario_id = so.id
      JOIN postazioni p ON so.postazione_id = p.id
      LEFT JOIN assegnazioni a ON so.id = a.slot_orario_id 
        AND d.data = a.data_turno
      WHERE d.stato = 'disponibile'
        AND v.stato = 'attivo'
        AND p.stato = 'attiva'
    `;
    const params = [];
    let paramIndex = 1;

    if (filterCongregazioneId) {
      query += ` AND d.congregazione_id = $${paramIndex++}`;
      params.push(filterCongregazioneId);
    }

    query += ` AND CASE
        WHEN EXTRACT(DOW FROM d.data) = 0 THEN 7
        WHEN EXTRACT(DOW FROM d.data) = 1 THEN 1
        WHEN EXTRACT(DOW FROM d.data) = 2 THEN 2
        WHEN EXTRACT(DOW FROM d.data) = 3 THEN 3
        WHEN EXTRACT(DOW FROM d.data) = 4 THEN 4
        WHEN EXTRACT(DOW FROM d.data) = 5 THEN 5
        WHEN EXTRACT(DOW FROM d.data) = 6 THEN 6
      END = ANY(p.giorni_settimana)`;

    if (data_inizio) {
      query += ` AND d.data >= $${paramIndex++}`;
      params.push(data_inizio);
    }

    if (data_fine) {
      query += ` AND d.data <= $${paramIndex++}`;
      params.push(data_fine);
    }

    query += `
      GROUP BY d.data, so.orario_inizio, so.orario_fine, p.luogo, p.id, so.max_volontari
      ORDER BY d.data, so.orario_inizio, p.luogo
    `;

    const riepilogo = await db.any(query, params);

    // Calcola lo stato dello slot basato su disponibilità e requisiti
    const riepilogoConFlag = riepilogo.map((item) => {
      const totaleDisponibili = parseInt(item.totale_disponibili) || 0;
      const uominiDisponibili = parseInt(item.uomini) || 0;
      const maxVolontari = parseInt(item.max_volontari) || 1;

      // Determina lo stato:
      // - "critico" (rosso): non ci sono abbastanza disponibili (totale < max)
      // - "attenzione" (giallo): abbastanza disponibili (totale >= max) ma senza uomini
      // - "sufficiente" (verde): abbastanza disponibili (totale >= max) E almeno 1 uomo
      
      let stato = "sufficiente"; // default verde
      let critico = false;
      let attenzione = false;

      if (totaleDisponibili < maxVolontari) {
        // Non ci sono abbastanza persone disponibili: CRITICO
        stato = "critico";
        critico = true;
      } else if (uominiDisponibili === 0) {
        // Ci sono abbastanza persone ma nessun uomo: ATTENZIONE
        stato = "attenzione";
        attenzione = true;
      }
      // Altrimenti: abbastanza persone E almeno 1 uomo = sufficiente (default)

      return {
        ...item,
        stato,
        critico,
        attenzione,
        sufficiente: !critico && !attenzione,
      };
    });

    res.json(riepilogoConFlag);
  } catch (error) {
    console.error("Errore nel recupero del riepilogo disponibilità:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/disponibilita/contatori-mensili - Ottieni i contatori mensili di disponibilità e assegnazioni per ogni volontario
router.get("/contatori-mensili", async (req, res) => {
  try {
    const { data_inizio, data_fine } = req.query;

    if (!data_inizio || !data_fine) {
      return res.status(400).json({ 
        message: "Parametri data_inizio e data_fine sono obbligatori" 
      });
    }

    // Query per ottenere i contatori di disponibilità e assegnazioni per ogni volontario
    const targetCongregazioneId = await resolveCongregazioneId(req, {
      allowNullForSuperAdmin: true,
    });
    const filterCongregazioneId =
      targetCongregazioneId ?? (req.user.ruolo === "super_admin" ? null : req.user.congregazione_id);

    const condizioniVolontari = [];
    const condizioniAssegnazioni = [];
    const params = [data_inizio, data_fine];
    let paramIndex = 3;

    if (filterCongregazioneId) {
      condizioniVolontari.push(`v.congregazione_id = $${paramIndex}`);
      condizioniAssegnazioni.push(`v.congregazione_id = $${paramIndex}`);
      params.push(filterCongregazioneId);
      paramIndex += 1;
    }

    const query = `
      WITH disponibilita_count AS (
        SELECT 
          v.id as volontario_id,
          v.nome,
          v.cognome,
          COUNT(d.id) as disponibilita_totali
        FROM volontari v
        LEFT JOIN disponibilita d ON v.id = d.volontario_id 
          AND d.data >= $1::date 
          AND d.data <= $2::date
          AND d.stato = 'disponibile'
        WHERE v.stato = 'attivo'
        ${condizioniVolontari.length ? `AND ${condizioniVolontari.join(" AND ")}` : ""}
        GROUP BY v.id, v.nome, v.cognome
      ),
      assegnazioni_count AS (
        SELECT 
          v.id as volontario_id,
          COUNT(DISTINCT a.id) as assegnazioni_totali
        FROM volontari v
        LEFT JOIN assegnazioni_volontari av ON v.id = av.volontario_id
        LEFT JOIN assegnazioni a ON av.assegnazione_id = a.id
          AND a.data_turno >= $1::date 
          AND a.data_turno <= $2::date
          AND a.stato IN ('attivo', 'assegnato')
        WHERE v.stato = 'attivo'
        ${condizioniAssegnazioni.length ? `AND ${condizioniAssegnazioni.join(" AND ")}` : ""}
        GROUP BY v.id
      )
      SELECT 
        dc.volontario_id,
        dc.nome,
        dc.cognome,
        COALESCE(dc.disponibilita_totali, 0) as disponibilita_totali,
        COALESCE(ac.assegnazioni_totali, 0) as assegnazioni_totali
      FROM disponibilita_count dc
      LEFT JOIN assegnazioni_count ac ON dc.volontario_id = ac.volontario_id
      ORDER BY dc.nome, dc.cognome
    `;

    const contatori = await db.any(query, params);

    // Trasforma i risultati in un oggetto per accesso rapido
    const contatoriMap = {};
    contatori.forEach(c => {
      contatoriMap[c.volontario_id] = {
        nome: c.nome,
        cognome: c.cognome,
        disponibilita_totali: parseInt(c.disponibilita_totali),
        assegnazioni_totali: parseInt(c.assegnazioni_totali)
      };
    });

    res.json(contatoriMap);
  } catch (error) {
    console.error("Errore nel recupero dei contatori mensili:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// DELETE /api/disponibilita/volontario/:id - Elimina le disponibilità di un volontario
router.delete("/volontario/:id", async (req, res) => {
  try {
    const volontarioId = parseInt(req.params.id, 10);
    if (Number.isNaN(volontarioId)) {
      return res.status(400).json({ message: "ID volontario non valido" });
    }

    if (req.user.ruolo === "volontario" && req.user.id !== volontarioId) {
      return res
        .status(403)
        .json({ message: "Non puoi eliminare disponibilità di altri volontari" });
    }

    const congregazioneId = await ensureEntityAccess(req, "volontari", volontarioId);
    if (congregazioneId === null) {
      return res.status(404).json({ message: "Volontario non trovato" });
    }

    const { data_inizio, data_fine } = req.query;

    let query = `
      DELETE FROM disponibilita 
      WHERE volontario_id = $1
        AND congregazione_id = $2
    `;
    const params = [volontarioId, congregazioneId];
    let paramIndex = 3;

    if (data_inizio) {
      query += ` AND data >= $${paramIndex++}`;
      params.push(data_inizio);
    }

    if (data_fine) {
      query += ` AND data <= $${paramIndex++}`;
      params.push(data_fine);
    }

    const result = await db.result(query, params);

    res.json({
      message: "Disponibilità eliminate con successo",
      count: result.rowCount,
    });
  } catch (error) {
    console.error("Errore nell'eliminazione delle disponibilità:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

module.exports = router;
