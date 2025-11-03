const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Joi = require("joi");
const db = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  resolveCongregazioneId,
  enforceSameCongregazione,
} = require("../utils/congregazioni");

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(authenticateToken);

// Configurazione multer per upload PDF
// Usa memoryStorage per Railway (filesystem temporaneo) o diskStorage per locale
const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;
const storage = isProduction
  ? multer.memoryStorage() // Su Railway, salva in memoria e poi nel database
  : multer.diskStorage({
      // In locale, salva sul filesystem
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../uploads/documenti");

        // Crea la directory se non esiste
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // Genera nome file unico con timestamp e congregazione
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
        cb(null, `${name}-${uniqueSuffix}${ext}`);
      },
    });

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB massimo per PDF
  },
  fileFilter: (req, file, cb) => {
    // Solo PDF
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Solo file PDF sono consentiti"), false);
    }
  },
});

// Schema di validazione per la descrizione
const documentoSchema = Joi.object({
  descrizione: Joi.string().max(500).allow("", null).optional(),
});

// GET /api/documenti - Ottiene tutti i documenti della congregazione corrente
router.get("/", async (req, res) => {
  try {
    const congregazioneId = await resolveCongregazioneId(req, {
      allowNullForSuperAdmin: false,
    });

    if (!congregazioneId) {
      return res.status(400).json({
        message: "Congregazione non specificata",
      });
    }

    const documenti = await db.any(
      `SELECT 
        d.id,
        d.nome_originale,
        d.descrizione,
        d.dimensione_file,
        d.mime_type,
        d.created_at,
        d.created_by,
        v.nome || ' ' || v.cognome AS creato_da
      FROM documenti_autorizzazioni d
      LEFT JOIN volontari v ON d.created_by = v.id
      WHERE d.congregazione_id = $1
      ORDER BY d.created_at DESC`,
      [congregazioneId]
    );

    res.json({ documenti });
  } catch (error) {
    console.error("Errore nel recupero dei documenti:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET /api/documenti/:id/download - Scarica un documento
router.get("/:id/download", async (req, res) => {
  try {
    const documentoId = parseInt(req.params.id, 10);
    if (Number.isNaN(documentoId)) {
      return res.status(400).json({ message: "ID documento non valido" });
    }

    const congregazioneId = await resolveCongregazioneId(req, {
      allowNullForSuperAdmin: false,
    });

    if (!congregazioneId) {
      return res.status(400).json({
        message: "Congregazione non specificata",
      });
    }

    // Recupera il documento
    const documento = await db.oneOrNone(
      `SELECT 
        d.id,
        d.nome_file,
        d.nome_originale,
        d.path_file,
        d.congregazione_id,
        d.file_data
      FROM documenti_autorizzazioni d
      WHERE d.id = $1`,
      [documentoId]
    );

    if (!documento) {
      return res.status(404).json({ message: "Documento non trovato" });
    }

    // Verifica che il documento appartenga alla congregazione dell'utente
    if (req.user.ruolo !== "super_admin") {
      enforceSameCongregazione(req, documento.congregazione_id);
    }

    // In produzione, recupera dal database (BYTEA)
    // In locale, recupera dal filesystem
    if (isProduction && documento.file_data) {
      // File salvato nel database
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(documento.nome_originale)}"`
      );
      res.send(Buffer.from(documento.file_data, 'binary'));
    } else {
      // File salvato sul filesystem (locale)
      const filePath = path.join(__dirname, "../uploads/documenti", documento.nome_file);

      // Verifica che il file esista
      if (!fs.existsSync(filePath)) {
        console.error(`File non trovato: ${filePath}`);
        return res.status(404).json({ message: "File non trovato sul server" });
      }

      // Invia il file
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(documento.nome_originale)}"`
      );
      res.sendFile(path.resolve(filePath));
    }
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Errore nel download del documento:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST /api/documenti - Carica un nuovo documento (solo admin/super_admin)
router.post(
  "/",
  authorizeRoles("admin", "super_admin"),
  upload.single("documento"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nessun file fornito" });
      }

      const { error, value } = documentoSchema.validate(req.body || {});
      if (error) {
        // Elimina il file caricato se la validazione fallisce (solo in locale)
        if (!isProduction && req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: error.details[0].message });
      }

      const congregazioneId = await resolveCongregazioneId(req, {
        allowNullForSuperAdmin: false,
      });

      if (!congregazioneId) {
        // Elimina il file caricato (solo in locale)
        if (!isProduction && req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          message: "Congregazione non specificata",
        });
      }

      const { descrizione } = value || {};

      // Genera nome file unico
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(req.file.originalname);
      const name = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
      const filename = `${name}-${uniqueSuffix}${ext}`;
      const filepath = isProduction 
        ? `database/${filename}` // Path virtuale per produzione
        : req.file.path; // Path reale per locale

      // In produzione, salva il file nel database (BYTEA)
      // In locale, salva sul filesystem
      const fileData = isProduction ? req.file.buffer : null;

      // Inserisci il documento nel database
      const nuovoDocumento = await db.one(
        `INSERT INTO documenti_autorizzazioni 
        (congregazione_id, nome_file, nome_originale, descrizione, path_file, dimensione_file, mime_type, created_by, file_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, nome_originale, descrizione, dimensione_file, created_at`,
        [
          congregazioneId,
          filename,
          req.file.originalname,
          descrizione || null,
          filepath,
          req.file.size,
          req.file.mimetype,
          req.user.id,
          fileData, // NULL in locale, buffer in produzione
        ]
      );

      res.status(201).json({
        message: "Documento caricato con successo",
        documento: nuovoDocumento,
      });
    } catch (error) {
      // Elimina il file caricato in caso di errore (solo in locale)
      if (!isProduction && req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Errore nel caricamento del documento:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
);

// DELETE /api/documenti/:id - Elimina un documento (solo admin/super_admin)
router.delete(
  "/:id",
  authorizeRoles("admin", "super_admin"),
  async (req, res) => {
    try {
      const documentoId = parseInt(req.params.id, 10);
      if (Number.isNaN(documentoId)) {
        return res.status(400).json({ message: "ID documento non valido" });
      }

      const congregazioneId = await resolveCongregazioneId(req, {
        allowNullForSuperAdmin: false,
      });

      if (!congregazioneId) {
        return res.status(400).json({
          message: "Congregazione non specificata",
        });
      }

      // Recupera il documento
      const documento = await db.oneOrNone(
        `SELECT 
          d.id,
          d.nome_file,
          d.path_file,
          d.congregazione_id
        FROM documenti_autorizzazioni d
        WHERE d.id = $1`,
        [documentoId]
      );

      if (!documento) {
        return res.status(404).json({ message: "Documento non trovato" });
      }

      // Verifica che il documento appartenga alla congregazione dell'utente
      if (req.user.ruolo !== "super_admin") {
        enforceSameCongregazione(req, documento.congregazione_id);
      }

      // Elimina il file dal filesystem (solo in locale, in produzione è nel database)
      if (!isProduction) {
        const filePath = path.join(__dirname, "../uploads/documenti", documento.nome_file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Elimina il record dal database (in produzione elimina anche file_data BYTEA)
      await db.none("DELETE FROM documenti_autorizzazioni WHERE id = $1", [
        documentoId,
      ]);

      res.json({ message: "Documento eliminato con successo" });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error("Errore nell'eliminazione del documento:", error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  }
);

module.exports = router;

