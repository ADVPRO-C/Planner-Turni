const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Joi = require("joi");

const router = express.Router();

// Configurazione multer per upload allegati
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/assistenza");

    // Crea la directory se non esiste
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Genera nome file unico con timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB massimo (PDF)
    files: 3, // Massimo 3 file per sicurezza
  },
  fileFilter: (req, file, cb) => {
    // Tipi MIME consentiti con limiti specifici
    const allowedTypes = {
      "application/pdf": 5 * 1024 * 1024, // 5MB per PDF
      "image/jpeg": 1.5 * 1024 * 1024, // 1.5MB per immagini
      "image/jpg": 1.5 * 1024 * 1024,
      "image/png": 1.5 * 1024 * 1024,
    };

    // Estensioni pericolose da bloccare
    const dangerousExtensions = [
      ".exe",
      ".bat",
      ".cmd",
      ".com",
      ".pif",
      ".scr",
      ".vbs",
      ".js",
      ".jar",
      ".app",
      ".deb",
      ".pkg",
      ".dmg",
      ".rpm",
      ".msi",
      ".run",
      ".bin",
      ".sh",
      ".ps1",
      ".php",
      ".asp",
      ".jsp",
      ".py",
      ".rb",
      ".pl",
    ];

    const fileName = file.originalname.toLowerCase();

    // 1. Controllo estensioni pericolose
    if (dangerousExtensions.some((ext) => fileName.endsWith(ext))) {
      return cb(
        new Error(
          `File ${file.originalname} bloccato: tipo potenzialmente pericoloso`
        ),
        false
      );
    }

    // 2. Controllo tipo MIME
    if (!allowedTypes[file.mimetype]) {
      return cb(
        new Error(
          `Tipo file non supportato: ${file.originalname}. Solo PDF, JPEG, JPG, PNG`
        ),
        false
      );
    }

    // 3. Controllo caratteri pericolosi nel nome
    if (/[<>:"/\\|?*\x00-\x1f]/.test(fileName)) {
      return cb(
        new Error(
          `Nome file contiene caratteri non validi: ${file.originalname}`
        ),
        false
      );
    }

    // 4. Controllo dimensione specifica per tipo (sarà verificata anche in multer limits)
    const maxSize = allowedTypes[file.mimetype];
    if (file.size && file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return cb(
        new Error(
          `File troppo grande: ${file.originalname} (max ${maxSizeMB}MB)`
        ),
        false
      );
    }

    cb(null, true);
  },
});

// Schema di validazione
const assistenzaSchema = Joi.object({
  argomento: Joi.string()
    .valid("problema-tecnico", "domanda", "nuova-funzionalita")
    .required(),
  titolo: Joi.string().min(5).max(200).required(),
  priorita: Joi.string().valid("normale", "urgente").required(),
  email: Joi.string().email().required(),
  telefono: Joi.string().allow("").optional(),
  descrizione: Joi.string().min(10).max(2000).required(),
  nomeUtente: Joi.string().required(),
  ruoloUtente: Joi.string().required(),
});

// Funzione per inviare email (simulata per ora)
const inviaEmail = async (datiRichiesta, allegati = []) => {
  try {
    // Qui implementeresti l'invio email reale con nodemailer o servizio simile
    console.log("📧 Invio email di assistenza:");
    console.log("Destinatario: advprocomunicazione@gmail.com");
    console.log(
      "Oggetto:",
      `[${datiRichiesta.priorita.toUpperCase()}] ${datiRichiesta.argomento} - ${
        datiRichiesta.titolo
      } (da ${datiRichiesta.nomeUtente})`
    );
    console.log("Dati:", datiRichiesta);
    console.log(
      "Allegati:",
      allegati.map((f) => f.filename)
    );

    // Simula invio email
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return { success: true, messageId: `msg_${Date.now()}` };
  } catch (error) {
    console.error("Errore invio email:", error);
    throw error;
  }
};

// POST /api/assistenza/invia - Invia richiesta di assistenza
router.post("/invia", upload.array("allegato", 3), async (req, res) => {
  try {
    console.log("📝 Nuova richiesta di assistenza ricevuta");

    // Estrai i dati dal form
    const formData = { ...req.body };

    // Rimuovi i campi degli allegati dal body per la validazione
    Object.keys(formData).forEach((key) => {
      if (key.startsWith("allegato_")) {
        delete formData[key];
      }
    });

    // Validazione dati
    const { error, value } = assistenzaSchema.validate(formData);
    if (error) {
      console.error("❌ Errore validazione:", error.details);
      return res.status(400).json({
        message: "Dati non validi",
        details: error.details[0].message,
      });
    }

    // Prepara i dati per l'email
    const datiRichiesta = {
      ...value,
      dataInvio: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
    };

    // Informazioni sugli allegati
    const allegati = req.files || [];

    console.log(`📎 Allegati ricevuti: ${allegati.length}`);
    allegati.forEach((file) => {
      console.log(`  - ${file.originalname} (${file.size} bytes)`);
    });

    // Invia l'email
    const risultatoInvio = await inviaEmail(datiRichiesta, allegati);

    if (risultatoInvio.success) {
      console.log("✅ Email inviata con successo");

      // Log della richiesta per tracking
      const logEntry = {
        timestamp: new Date().toISOString(),
        utente: datiRichiesta.nomeUtente,
        email: datiRichiesta.email,
        argomento: datiRichiesta.argomento,
        priorita: datiRichiesta.priorita,
        titolo: datiRichiesta.titolo,
        allegati: allegati.length,
        messageId: risultatoInvio.messageId,
      };

      // Salva log su file (opzionale)
      const logDir = path.join(__dirname, "../logs");
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, "assistenza.log");
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");

      res.json({
        message: "Richiesta di assistenza inviata con successo",
        ticketId: risultatoInvio.messageId,
      });
    } else {
      throw new Error("Errore nell'invio dell'email");
    }
  } catch (error) {
    console.error("❌ Errore nell'invio della richiesta:", error);

    // Pulisci i file caricati in caso di errore
    if (req.files) {
      req.files.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error("Errore nella rimozione file:", unlinkError);
        }
      });
    }

    res.status(500).json({
      message: "Errore interno del server durante l'invio della richiesta",
    });
  }
});

// GET /api/assistenza/status - Verifica stato del servizio
router.get("/status", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

module.exports = router;
