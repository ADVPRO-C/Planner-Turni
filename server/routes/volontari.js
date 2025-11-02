const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { resolveCongregazioneId, enforceSameCongregazione } = require("../utils/congregazioni");

const router = express.Router();

router.use(authenticateToken);

const VOLONTARIO_FIELDS = `
  v.id,
  v.nome,
  v.cognome,
  v.email,
  v.telefono,
  v.sesso,
  v.stato,
  v.ruolo,
  v.congregazione_id,
  v.created_at,
  v.updated_at
`;

// Versione senza prefisso per RETURNING in UPDATE
const VOLONTARIO_FIELDS_NO_PREFIX = `
  id,
  nome,
  cognome,
  email,
  telefono,
  sesso,
  stato,
  ruolo,
  congregazione_id,
  created_at,
  updated_at
`;

const sanitizePhone = (value = '') => value.replace(/\D/g, '');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' ||
        file.mimetype === 'text/csv' ||
        file.originalname.endsWith('.csv') ||
        file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Formato file non supportato. Utilizzare JSON o CSV.'));
    }
  }
});

// Schema di validazione per i volontari
const volontarioSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  cognome: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional().allow("", null),
  telefono: Joi.string().max(20).optional().allow("", null),
  password: Joi.string().min(6).optional().allow("", null),
  sesso: Joi.string().valid("M", "F").required(),
  stato: Joi.string().valid("attivo", "non_attivo").default("attivo"),
  ruolo: Joi.string().valid("volontario", "admin", "super_admin").default("volontario"),
  congregazione_id: Joi.number().integer().positive().optional(),
});

// GET /api/volontari - Ottieni tutti i volontari
router.get("/", async (req, res) => {
  try {
    const { stato, sesso, search } = req.query;

    const pageNumber = parseInt(req.query.page, 10) || 1;
    const limitNumber = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const searchTerm = search ? search.trim() : "";

    const targetCongregazioneId = await resolveCongregazioneId(req);

    let query = `
      SELECT ${VOLONTARIO_FIELDS},
             c.codice AS congregazione_codice,
             c.nome AS congregazione_nome,
             COUNT(DISTINCT a.id) AS turni_completati,
             MAX(a.data_turno) AS ultima_assegnazione
      FROM volontari v
      JOIN congregazioni c ON v.congregazione_id = c.id
      LEFT JOIN assegnazioni_volontari av ON v.id = av.volontario_id
      LEFT JOIN assegnazioni a ON av.assegnazione_id = a.id AND a.stato = 'completato'
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (targetCongregazioneId) {
      conditions.push(`v.congregazione_id = $${paramIndex++}`);
      params.push(targetCongregazioneId);
    }

    if (stato) {
      conditions.push(`v.stato = $${paramIndex++}`);
      params.push(stato);
    }

    if (sesso) {
      conditions.push(`v.sesso = $${paramIndex++}`);
      params.push(sesso);
    }

    if (searchTerm) {
      conditions.push(
        `(v.nome ILIKE $${paramIndex++} OR v.cognome ILIKE $${paramIndex++})`
      );
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY v.id, c.codice, c.nome ORDER BY c.codice, v.cognome, v.nome";

    const offset = (pageNumber - 1) * limitNumber;
    const filterParams = [...params];

    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limitNumber, offset);

    const volontari = await db.any(query, params);

    let countQuery = "SELECT COUNT(*) FROM volontari v";
    if (conditions.length > 0) {
      countQuery += " WHERE " + conditions.join(" AND ");
    }

    const totalCount = await db.one(countQuery, filterParams);

    const totalItems = parseInt(totalCount.count, 10);

    res.json({
      volontari,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalItems,
        pages: Math.ceil(totalItems / limitNumber),
      },
    });
  } catch (error) {
    console.error("Errore nel recupero dei volontari:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/volontari/:id - Ottieni un volontario specifico
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const volontario = await db.oneOrNone(
      `SELECT ${VOLONTARIO_FIELDS},
              c.codice AS congregazione_codice,
              c.nome AS congregazione_nome
       FROM volontari v
       JOIN congregazioni c ON v.congregazione_id = c.id
       WHERE v.id = $1`,
      [id]
    );

    if (!volontario) {
      return res.status(404).json({ message: "Volontario non trovato" });
    }

    try {
      enforceSameCongregazione(req, volontario.congregazione_id);
    } catch (authError) {
      return res
        .status(authError.statusCode || 403)
        .json({ message: authError.message });
    }


    res.json(volontario);
  } catch (error) {
    console.error("Errore nel recupero del volontario:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/volontari - Crea un nuovo volontario
router.post("/", authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const { error, value } = volontarioSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { nome, cognome, email, telefono, password, sesso, stato, ruolo } = value;

    if (ruolo === "super_admin" && req.user.ruolo !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Solo il SuperAdmin può creare un altro SuperAdmin" });
    }

    const headerCongregazioneId = req.headers["x-congregazione-id"]
      ? parseInt(req.headers["x-congregazione-id"], 10)
      : null;

    const targetCongregazioneId =
      req.user.ruolo === "super_admin"
        ? value.congregazione_id || headerCongregazioneId
        : req.user.congregazione_id;

    if (!targetCongregazioneId) {
      return res.status(400).json({ message: "Congregazione non specificata" });
    }

    const congregazione = await db.oneOrNone(
      "SELECT id, codice, nome FROM congregazioni WHERE id = $1",
      [targetCongregazioneId]
    );

    if (!congregazione) {
      return res.status(400).json({ message: "Congregazione non valida" });
    }

    if (email) {
      const existingEmail = await db.oneOrNone(
        "SELECT id FROM volontari WHERE LOWER(email) = LOWER($1)",
        [email]
      );

      if (existingEmail) {
        return res.status(400).json({ message: "Email già registrata" });
      }
    }

    if (telefono) {
      const existingPhone = await db.oneOrNone(
        `SELECT id FROM volontari
         WHERE regexp_replace(telefono, '\D', '', 'g') = $1`,
        [sanitizePhone(telefono)]
      );

      if (existingPhone) {
        return res.status(400).json({ message: "Telefono già registrato" });
      }
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const newVolontario = await db.one(
      `INSERT INTO volontari (congregazione_id, nome, cognome, email, telefono, password_hash, sesso, stato, ruolo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${VOLONTARIO_FIELDS}`,
      [
        congregazione.id,
        nome,
        cognome,
        email || null,
        telefono || null,
        passwordHash,
        sesso,
        stato,
        ruolo,
      ]
    );

    res.status(201).json({
      ...newVolontario,
      congregazione_codice: congregazione.codice,
      congregazione_nome: congregazione.nome,
    });
  } catch (error) {
    console.error("Errore nella creazione del volontario:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});
// PUT /api/volontari/:id - Aggiorna un volontario
router.put("/:id", authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Schema per l'update: password è opzionale e può essere vuota (per non cambiarla)
    const updateVolontarioSchema = Joi.object({
      nome: Joi.string().min(2).max(100).required(),
      cognome: Joi.string().min(2).max(100).required(),
      email: Joi.string().optional().allow("", null).custom((value, helpers) => {
        // Se l'email è fornita e non vuota, deve essere un'email valida
        if (value && value.trim() !== "") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return helpers.error("string.email");
          }
        }
        return value;
      }),
      telefono: Joi.string().max(20).optional().allow("", null),
      password: Joi.string().optional().allow("", null).custom((value, helpers) => {
        // Se la password è fornita e non vuota, deve essere almeno 6 caratteri
        if (value && value.trim() !== "" && value.length < 6) {
          return helpers.error("string.min");
        }
        return value;
      }),
      sesso: Joi.string().valid("M", "F").required(),
      stato: Joi.string().valid("attivo", "non_attivo").default("attivo"),
      ruolo: Joi.string().valid("volontario", "admin", "super_admin").default("volontario"),
      congregazione_id: Joi.number().integer().positive().optional(),
    }).messages({
      "string.min": "La password deve essere di almeno 6 caratteri",
      "string.email": "L'email non è valida"
    });
    
    console.log("📥 Richiesta update volontario:", {
      id,
      body: req.body,
      user: req.user?.id,
      ruolo: req.user?.ruolo
    });
    
    const { error, value } = updateVolontarioSchema.validate(req.body);

    if (error) {
      console.error("❌ Errore validazione update volontario:", error.details);
      console.error("Body ricevuto:", JSON.stringify(req.body, null, 2));
      return res.status(400).json({ message: error.details[0].message });
    }

    console.log("✅ Validazione passata:", value);

    const { nome, cognome, email, telefono, password, sesso, stato, ruolo } = value;

    const existingVolontario = await db.oneOrNone(
      "SELECT id, congregazione_id, ruolo FROM volontari WHERE id = $1",
      [id]
    );

    if (!existingVolontario) {
      return res.status(404).json({ message: "Volontario non trovato" });
    }

    try {
      enforceSameCongregazione(req, existingVolontario.congregazione_id);
    } catch (authError) {
      return res
        .status(authError.statusCode || 403)
        .json({ message: authError.message });
    }

    if (existingVolontario.ruolo === "super_admin" && req.user.ruolo !== "super_admin") {
      return res.status(403).json({ message: "Non è possibile modificare questo utente" });
    }

    if (ruolo === "super_admin" && req.user.ruolo !== "super_admin") {
      return res.status(403).json({ message: "Non puoi assegnare il ruolo SuperAdmin" });
    }

    if (email) {
      const existingEmail = await db.oneOrNone(
        "SELECT id FROM volontari WHERE LOWER(email) = LOWER($1) AND id != $2",
        [email, id]
      );

      if (existingEmail) {
        return res.status(400).json({ message: "Email già in uso" });
      }
    }

    if (telefono) {
      const existingPhone = await db.oneOrNone(
        `SELECT id FROM volontari
         WHERE regexp_replace(telefono, '\D', '', 'g') = $1 AND id != $2`,
        [sanitizePhone(telefono), id]
      );

      if (existingPhone) {
        return res.status(400).json({ message: "Telefono già in uso" });
      }
    }

    let passwordHash = null;
    // Solo se la password è fornita E non è vuota, la hashiamo
    if (password && password.trim() !== "") {
      console.log("🔐 Hash password in corso...");
      passwordHash = await bcrypt.hash(password, 10);
      console.log("✅ Password hashata con successo");
    } else {
      console.log("ℹ️ Password non fornita o vuota, mantengo quella esistente");
    }

    const headerCongregazioneId = req.headers["x-congregazione-id"]
      ? parseInt(req.headers["x-congregazione-id"], 10)
      : null;

    const targetCongregazioneId = req.user.ruolo === "super_admin"
      ? value.congregazione_id || headerCongregazioneId || existingVolontario.congregazione_id
      : existingVolontario.congregazione_id;

    console.log("🏢 Congregazione target:", {
      fromBody: value.congregazione_id,
      fromHeader: headerCongregazioneId,
      existing: existingVolontario.congregazione_id,
      target: targetCongregazioneId
    });

    const updates = [
      { column: "congregazione_id", value: targetCongregazioneId },
      { column: "nome", value: nome },
      { column: "cognome", value: cognome },
      { column: "email", value: email || null },
      { column: "telefono", value: telefono || null },
      { column: "sesso", value: sesso },
      { column: "stato", value: stato },
      { column: "ruolo", value: ruolo },
    ];

    if (passwordHash) {
      updates.push({ column: "password_hash", value: passwordHash });
    }

    const setClauses = updates.map((entry, index) => `${entry.column} = $${index + 1}`);
    const params = updates.map((entry) => entry.value);

    params.push(id);

    console.log("📝 Query SQL da eseguire:", {
      setClauses: setClauses.join(", "),
      paramsCount: params.length,
      idParam: id
    });

    const updatedVolontario = await db.oneOrNone(
      `UPDATE volontari
       SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${params.length}
       RETURNING ${VOLONTARIO_FIELDS_NO_PREFIX}`,
      params
    );

    console.log("✅ Update completato:", updatedVolontario ? "Volontario trovato" : "Volontario non trovato");

    if (!updatedVolontario) {
      return res.status(404).json({ message: "Volontario non trovato" });
    }

    const congregazione = await db.one(
      "SELECT codice, nome FROM congregazioni WHERE id = $1",
      [targetCongregazioneId]
    );

    res.json({
      ...updatedVolontario,
      congregazione_codice: congregazione.codice,
      congregazione_nome: congregazione.nome,
    });
  } catch (error) {
    console.error("Errore nell'aggiornamento del volontario:", error);
    console.error("Stack trace:", error.stack);
    console.error("Dettagli richiesta:", {
      id: req.params.id,
      body: req.body,
      user: req.user?.id,
    });
    res.status(500).json({ 
      message: "Errore interno del server",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});
// DELETE /api/volontari/:id - Elimina un volontario
router.delete("/:id", authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const volontario = await db.oneOrNone(
      "SELECT id, ruolo, congregazione_id FROM volontari WHERE id = $1",
      [id]
    );

    if (!volontario) {
      return res.status(404).json({ message: "Volontario non trovato" });
    }

    try {
      enforceSameCongregazione(req, volontario.congregazione_id);
    } catch (authError) {
      return res
        .status(authError.statusCode || 403)
        .json({ message: authError.message });
    }

    if (volontario.ruolo === "super_admin") {
      return res.status(403).json({ message: "Non è possibile eliminare il SuperAdmin" });
    }

    if (volontario.ruolo === "admin" && req.user.ruolo !== "super_admin") {
      return res.status(403).json({ message: "Solo il SuperAdmin può eliminare un admin" });
    }

    await db.none("DELETE FROM volontari WHERE id = $1", [id]);

    res.json({ message: "Volontario eliminato con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione del volontario:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/volontari/export/:format - Esporta tutti i volontari
router.get("/export/:format", authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const { format } = req.params;

    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ message: "Formato non supportato. Utilizzare 'json' o 'csv'." });
    }

    const targetCongregazioneId = await resolveCongregazioneId(req, { allowNullForSuperAdmin: true });

    if (!targetCongregazioneId && req.user.ruolo !== 'super_admin') {
      return res.status(403).json({ message: "Accesso negato." });
    }

    const conditions = [];
    const params = [];
    if (targetCongregazioneId) {
      conditions.push('v.congregazione_id = $1');
      params.push(targetCongregazioneId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const volontari = await db.any(
      `SELECT ${VOLONTARIO_FIELDS}, c.codice AS congregazione_codice, c.nome AS congregazione_nome
       FROM volontari v
       JOIN congregazioni c ON v.congregazione_id = c.id
       ${whereClause}
       ORDER BY c.codice, v.cognome, v.nome`,
      params
    );

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="volontari.json"');
      res.json(volontari);
      return;
    }

    const headers = ['id', 'nome', 'cognome', 'email', 'telefono', 'sesso', 'stato', 'ruolo', 'congregazione_codice', 'congregazione_nome', 'created_at', 'updated_at'];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="volontari.csv"');

    let csvContent = headers.join(',') + '\n';

    volontari.forEach((volontario) => {
      const row = headers.map((header) => {
        const value = volontario[header] || '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      });
      csvContent += row.join(',') + '\n';
    });

    res.send(csvContent);
  } catch (error) {
    console.error("Errore nell'esportazione dei volontari:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});
// POST /api/volontari/import - Importa volontari da file JSON o CSV
router.post("/import", authorizeRoles("admin", "super_admin"), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nessun file caricato" });
    }

    const fallbackCongregazioneId = req.user.ruolo === 'super_admin'
      ? await resolveCongregazioneId(req, { allowNullForSuperAdmin: true })
      : req.user.congregazione_id;

    const fileContent = req.file.buffer.toString('utf8');
    let volontariData = [];

    const isJson = req.file.originalname.endsWith('.json') || req.file.mimetype === 'application/json';
    const isCsv = req.file.originalname.endsWith('.csv') || req.file.mimetype === 'text/csv';

    if (isJson) {
      try {
        volontariData = JSON.parse(fileContent);
        if (!Array.isArray(volontariData)) {
          return res.status(400).json({ message: "Il file JSON deve contenere un array di volontari" });
        }
      } catch (parseError) {
        return res.status(400).json({ message: "Formato JSON non valido" });
      }
    } else if (isCsv) {
      const results = [];
      const stream = Readable.from([fileContent]);

      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      volontariData = results;
    } else {
      return res.status(400).json({ message: "Formato file non supportato" });
    }

    const importResults = {
      success: 0,
      errors: [],
      skipped: 0,
    };

    for (let i = 0; i < volontariData.length; i++) {
      const volontarioData = volontariData[i];

      try {
        const targetCongregazioneId = (() => {
          if (req.user.ruolo !== 'super_admin') {
            return req.user.congregazione_id;
          }

          if (volontarioData.congregazione_id) {
            const parsed = parseInt(volontarioData.congregazione_id, 10);
            if (!Number.isNaN(parsed)) {
              return parsed;
            }
          }

          if (volontarioData.congregazione_codice) {
            return null; // gestito più avanti con lookup
          }

          return fallbackCongregazioneId || null;
        })();

        let resolvedCongregazioneId = targetCongregazioneId;

        if (!resolvedCongregazioneId && volontarioData.congregazione_codice) {
          const row = await db.oneOrNone(
            "SELECT id FROM congregazioni WHERE codice = $1",
            [volontarioData.congregazione_codice.toString().padStart(3, '0')]
          );
          resolvedCongregazioneId = row ? row.id : null;
        }

        if (!resolvedCongregazioneId) {
          importResults.skipped++;
          importResults.errors.push({
            row: i + 1,
            data: volontarioData,
            error: "Congregazione non specificata",
          });
          continue;
        }

        const { error, value } = volontarioSchema.validate({
          nome: volontarioData.nome,
          cognome: volontarioData.cognome,
          email: volontarioData.email || null,
          telefono: volontarioData.telefono || null,
          sesso: volontarioData.sesso,
          stato: volontarioData.stato || 'attivo',
          ruolo: volontarioData.ruolo || 'volontario',
          congregazione_id: resolvedCongregazioneId,
        });

        if (error) {
          importResults.errors.push({
            row: i + 1,
            data: volontarioData,
            error: error.details[0].message,
          });
          continue;
        }

        const { nome, cognome, email, telefono, sesso, stato, ruolo, congregazione_id } = value;

        if (email) {
          const existingVolontario = await db.oneOrNone(
            "SELECT id FROM volontari WHERE LOWER(email) = LOWER($1)",
            [email]
          );

          if (existingVolontario) {
            importResults.skipped++;
            importResults.errors.push({
              row: i + 1,
              data: volontarioData,
              error: "Email già esistente - volontario saltato",
            });
            continue;
          }
        }

        if (telefono) {
          const existingPhone = await db.oneOrNone(
            `SELECT id FROM volontari
             WHERE regexp_replace(telefono, '\D', '', 'g') = $1`,
            [sanitizePhone(telefono)]
          );

          if (existingPhone) {
            importResults.skipped++;
            importResults.errors.push({
              row: i + 1,
              data: volontarioData,
              error: "Telefono già esistente - volontario saltato",
            });
            continue;
          }
        }

        await db.one(
          `INSERT INTO volontari (congregazione_id, nome, cognome, email, telefono, sesso, stato, ruolo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            congregazione_id,
            nome,
            cognome,
            email || null,
            telefono || null,
            sesso,
            stato,
            ruolo,
          ]
        );

        importResults.success++;
      } catch (dbError) {
        importResults.errors.push({
          row: i + 1,
          data: volontarioData,
          error: "Errore database: " + dbError.message,
        });
      }
    }

    res.json({
      message: `Importazione completata. ${importResults.success} volontari importati, ${importResults.skipped} saltati, ${importResults.errors.length} errori.`,
      results: importResults,
    });
  } catch (error) {
    console.error("Errore nell'importazione dei volontari:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});


module.exports = router;
