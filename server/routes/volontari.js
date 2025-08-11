const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");

const router = express.Router();

// Middleware per verificare il token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token di accesso richiesto" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Token non valido" });
      }
      req.user = user;
      next();
    }
  );
};

// Configurazione multer per l'upload dei file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
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
  ruolo: Joi.string().valid("volontario", "admin").default("volontario"),
});

// GET /api/volontari - Ottieni tutti i volontari
router.get("/", async (req, res) => {
  try {
    const { stato, sesso, search, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT v.*, 
             COUNT(DISTINCT a.id) as turni_completati,
             MAX(a.data_turno) as ultima_assegnazione
      FROM volontari v
      LEFT JOIN assegnazioni_volontari av ON v.id = av.volontario_id
      LEFT JOIN assegnazioni a ON av.assegnazione_id = a.id AND a.stato = 'completato'
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (stato) {
      conditions.push(`v.stato = $${paramIndex++}`);
      params.push(stato);
    }

    if (sesso) {
      conditions.push(`v.sesso = $${paramIndex++}`);
      params.push(sesso);
    }

    if (search) {
      conditions.push(
        `(v.nome ILIKE $${paramIndex++} OR v.cognome ILIKE $${paramIndex++})`
      );
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY v.id ORDER BY v.cognome, v.nome";

    // Aggiungi paginazione
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), offset);

    const volontari = await db.any(query, params);

    // Conta totale per paginazione
    let countQuery = "SELECT COUNT(*) FROM volontari v";
    if (conditions.length > 0) {
      countQuery += " WHERE " + conditions.join(" AND ");
    }
    const totalCount = await db.one(countQuery, params.slice(0, -2));

    res.json({
      volontari,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalCount.count),
        pages: Math.ceil(totalCount.count / limit),
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
      "SELECT * FROM volontari WHERE id = $1",
      [id]
    );

    if (!volontario) {
      return res.status(404).json({ message: "Volontario non trovato" });
    }

    res.json(volontario);
  } catch (error) {
    console.error("Errore nel recupero del volontario:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/volontari - Crea un nuovo volontario
router.post("/", async (req, res) => {
  try {
    const { error, value } = volontarioSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { nome, cognome, email, telefono, password, sesso, stato, ruolo } =
      value;

    // Verifica se l'email esiste già
    const existingVolontario = await db.oneOrNone(
      "SELECT id FROM volontari WHERE email = $1",
      [email]
    );

    if (existingVolontario) {
      return res.status(400).json({ message: "Email già registrata" });
    }

    // Hash della password se fornita
    let passwordHash = null;
    if (password) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }

    const newVolontario = await db.one(
      `INSERT INTO volontari (nome, cognome, email, telefono, password_hash, sesso, stato, ruolo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, nome, cognome, email, telefono, sesso, stato, ruolo, created_at`,
      [nome, cognome, email, telefono, passwordHash, sesso, stato, ruolo]
    );

    res.status(201).json(newVolontario);
  } catch (error) {
    console.error("Errore nella creazione del volontario:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// PUT /api/volontari/:id - Aggiorna un volontario
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = volontarioSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { nome, cognome, email, telefono, password, sesso, stato, ruolo } =
      value;

    // Verifica se l'email esiste già (escludendo il volontario corrente)
    const existingVolontario = await db.oneOrNone(
      "SELECT id FROM volontari WHERE email = $1 AND id != $2",
      [email, id]
    );

    if (existingVolontario) {
      return res.status(400).json({ message: "Email già in uso" });
    }

    // Hash della password se fornita
    let passwordHash = null;
    if (password) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }

    let query = `
      UPDATE volontari 
      SET nome = $1, cognome = $2, email = $3, telefono = $4, sesso = $5, stato = $6, ruolo = $7, updated_at = CURRENT_TIMESTAMP
    `;
    let params = [nome, cognome, email, telefono, sesso, stato, ruolo];

    if (passwordHash) {
      query = query.replace(
        "updated_at = CURRENT_TIMESTAMP",
        "password_hash = $8, updated_at = CURRENT_TIMESTAMP"
      );
      params.push(passwordHash);
    }

    query +=
      " WHERE id = $" +
      (params.length + 1) +
      " RETURNING id, nome, cognome, email, telefono, sesso, stato, ruolo";
    params.push(id);

    const updatedVolontario = await db.oneOrNone(query, params);

    if (!updatedVolontario) {
      return res.status(404).json({ message: "Volontario non trovato" });
    }

    res.json(updatedVolontario);
  } catch (error) {
    console.error("Errore nell'aggiornamento del volontario:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// DELETE /api/volontari/:id - Elimina un volontario
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se il volontario esiste e se è un admin
    const volontario = await db.oneOrNone(
      "SELECT id, ruolo FROM volontari WHERE id = $1",
      [id]
    );

    if (!volontario) {
      return res.status(404).json({ message: "Volontario non trovato" });
    }

    // Impedisci l'eliminazione di admin (opzionale, per sicurezza)
    if (volontario.ruolo === "admin") {
      return res
        .status(403)
        .json({ message: "Non è possibile eliminare un amministratore" });
    }

    const result = await db.result("DELETE FROM volontari WHERE id = $1", [id]);

    res.json({ message: "Volontario eliminato con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione del volontario:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/volontari/export/:format - Esporta tutti i volontari
router.get("/export/:format", authenticateToken, async (req, res) => {
  try {
    // Verifica che l'utente sia un amministratore
    if (req.user.ruolo !== 'admin') {
      return res.status(403).json({ message: "Accesso negato. Solo gli amministratori possono esportare i volontari." });
    }

    const { format } = req.params;
    
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ message: "Formato non supportato. Utilizzare 'json' o 'csv'." });
    }

    // Recupera tutti i volontari (senza password)
    const volontari = await db.any(`
      SELECT id, nome, cognome, email, telefono, sesso, stato, ruolo, 
             created_at, updated_at
      FROM volontari 
      ORDER BY cognome, nome
    `);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="volontari.json"');
      res.json(volontari);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="volontari.csv"');
      
      // Intestazioni CSV
      const headers = ['id', 'nome', 'cognome', 'email', 'telefono', 'sesso', 'stato', 'ruolo', 'created_at', 'updated_at'];
      let csvContent = headers.join(',') + '\n';
      
      // Dati CSV
      volontari.forEach(volontario => {
        const row = headers.map(header => {
          const value = volontario[header] || '';
          // Escape delle virgolette e wrapping in virgolette se necessario
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return '"' + value.replace(/"/g, '""') + '"';
          }
          return value;
        });
        csvContent += row.join(',') + '\n';
      });
      
      res.send(csvContent);
    }
  } catch (error) {
    console.error("Errore nell'esportazione dei volontari:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/volontari/import - Importa volontari da file JSON o CSV
router.post("/import", authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Verifica che l'utente sia un amministratore
    if (req.user.ruolo !== 'admin') {
      return res.status(403).json({ message: "Accesso negato. Solo gli amministratori possono importare i volontari." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Nessun file caricato" });
    }

    const fileContent = req.file.buffer.toString('utf8');
    let volontariData = [];
    
    // Determina il formato del file
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
      // Parse CSV
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
      skipped: 0
    };

    // Processa ogni volontario
    for (let i = 0; i < volontariData.length; i++) {
      const volontarioData = volontariData[i];
      
      try {
        // Validazione dei dati
        const { error, value } = volontarioSchema.validate({
          nome: volontarioData.nome,
          cognome: volontarioData.cognome,
          email: volontarioData.email || null,
          telefono: volontarioData.telefono || null,
          sesso: volontarioData.sesso,
          stato: volontarioData.stato || 'attivo',
          ruolo: volontarioData.ruolo || 'volontario'
        });

        if (error) {
          importResults.errors.push({
            row: i + 1,
            data: volontarioData,
            error: error.details[0].message
          });
          continue;
        }

        const { nome, cognome, email, telefono, sesso, stato, ruolo } = value;

        // Verifica se l'email esiste già
        if (email) {
          const existingVolontario = await db.oneOrNone(
            "SELECT id FROM volontari WHERE email = $1",
            [email]
          );

          if (existingVolontario) {
            importResults.skipped++;
            importResults.errors.push({
              row: i + 1,
              data: volontarioData,
              error: "Email già esistente - volontario saltato"
            });
            continue;
          }
        }

        // Inserisci il volontario
        await db.one(
          `INSERT INTO volontari (nome, cognome, email, telefono, sesso, stato, ruolo)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [nome, cognome, email, telefono, sesso, stato, ruolo]
        );

        importResults.success++;
      } catch (dbError) {
        importResults.errors.push({
          row: i + 1,
          data: volontarioData,
          error: "Errore database: " + dbError.message
        });
      }
    }

    res.json({
      message: `Importazione completata. ${importResults.success} volontari importati, ${importResults.skipped} saltati, ${importResults.errors.length} errori.`,
      results: importResults
    });

  } catch (error) {
    console.error("Errore nell'importazione dei volontari:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

module.exports = router;
