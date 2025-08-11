const express = require("express");
const Joi = require("joi");
const db = require("../config/database");

const router = express.Router();

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
    const { id } = req.params;
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
        p.luogo as postazione_luogo,
        p.id as postazione_id
      FROM disponibilita d
      JOIN volontari v ON d.volontario_id = v.id
      JOIN slot_orari so ON d.slot_orario_id = so.id
      JOIN postazioni p ON so.postazione_id = p.id
      WHERE d.volontario_id = $1
        AND p.stato = 'attiva'
    `;
    const params = [id];
    let paramIndex = 2;

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
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/disponibilita/volontario - Salva le disponibilità di un volontario
router.post("/volontario", async (req, res) => {
  try {
    console.log("🔍 Debug - Richiesta ricevuta:", {
      body: req.body,
      headers: req.headers,
    });

    const { error, value } = disponibilitaSchema.validate(req.body);
    if (error) {
      console.error("❌ Errore di validazione:", error.details);
      return res.status(400).json({ message: error.details[0].message });
    }

    console.log("✅ Validazione superata, dati:", value);

    const { volontario_id, disponibilita } = value;

    // Verifica che il volontario esista
    const volontario = await db.oneOrNone(
      "SELECT id FROM volontari WHERE id = $1",
      [volontario_id]
    );

    if (!volontario) {
      return res.status(404).json({ message: "Volontario non trovato" });
    }

    // Inizia una transazione
    await db.tx(async (t) => {
      // Elimina le disponibilità esistenti per le date specificate
      const dateToUpdate = [...new Set(disponibilita.map((d) => d.data))];
      if (dateToUpdate.length > 0) {
        // Usa un approccio più sicuro per il cast delle date
        const datePlaceholders = dateToUpdate
          .map((_, index) => `$${index + 2}::date`)
          .join(",");
        await t.none(
          `DELETE FROM disponibilita 
           WHERE volontario_id = $1 AND data IN (${datePlaceholders})`,
          [volontario_id, ...dateToUpdate]
        );
      }

      // Inserisci le nuove disponibilità
      for (const disp of disponibilita) {
        await t.none(
          `INSERT INTO disponibilita (volontario_id, data, slot_orario_id, stato, note)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            volontario_id,
            disp.data,
            disp.slot_orario_id,
            disp.stato,
            disp.note || null,
          ]
        );
      }
    });

    res.json({ message: "Disponibilità salvate con successo" });
  } catch (error) {
    console.error("Errore nel salvataggio delle disponibilità:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/disponibilita/postazione/:id - Ottieni le disponibilità per una postazione specifica
router.get("/postazione/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data_inizio, data_fine } = req.query;

    // Ottieni la postazione con i suoi slot orari
    const postazione = await db.oneOrNone(
      `SELECT p.*, 
              json_agg(
                json_build_object(
                  'id', so.id,
                  'orario_inizio', so.orario_inizio,
                  'orario_fine', so.orario_fine,
                  'max_volontari', so.max_volontari
                ) ORDER BY so.orario_inizio
              ) FILTER (WHERE so.id IS NOT NULL) as slot_orari
       FROM postazioni p
       LEFT JOIN slot_orari so ON p.id = so.postazione_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );

    if (!postazione) {
      return res.status(404).json({ message: "Postazione non trovata" });
    }

    // Ottieni le disponibilità per i giorni della postazione
    let query = `
      SELECT d.*, v.nome, v.cognome, v.sesso, so.orario_inizio, so.orario_fine
      FROM disponibilita d
      JOIN volontari v ON d.volontario_id = v.id
      JOIN slot_orari so ON d.slot_orario_id = so.id
      WHERE v.stato = 'attivo'
        AND d.stato = 'disponibile'
        AND EXTRACT(DOW FROM d.data) = ANY($1)
    `;
    const params = [postazione.giorni_settimana];
    let paramIndex = 2;

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

    let query = `
      SELECT 
        d.data,
        so.orario_inizio,
        so.orario_fine,
        p.luogo as postazione,
        p.id as postazione_id,
        COUNT(d.volontario_id) as totale_disponibili,
        COUNT(CASE WHEN v.sesso = 'M' THEN 1 END) as uomini,
        COUNT(CASE WHEN v.sesso = 'F' THEN 1 END) as donne,
        so.max_volontari,
        CASE WHEN a.id IS NOT NULL THEN true ELSE false END as assegnato
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

    if (data_inizio) {
      query += ` AND d.data >= $${paramIndex++}`;
      params.push(data_inizio);
    }

    if (data_fine) {
      query += ` AND d.data <= $${paramIndex++}`;
      params.push(data_fine);
    }

    query += `
      GROUP BY d.data, so.orario_inizio, so.orario_fine, p.luogo, p.id, so.max_volontari, a.id
      ORDER BY d.data, so.orario_inizio, p.luogo
    `;

    const riepilogo = await db.any(query, params);

    // Aggiungi flag di attenzione per postazioni senza uomini
    const riepilogoConFlag = riepilogo.map((item) => ({
      ...item,
      attenzione: item.uomini === 0,
      sufficiente: item.uomini >= 1,
    }));

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

    const contatori = await db.any(query, [data_inizio, data_fine]);

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
    const { id } = req.params;
    const { data_inizio, data_fine } = req.query;

    let query = "DELETE FROM disponibilita WHERE volontario_id = $1";
    const params = [id];
    let paramIndex = 2;

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
