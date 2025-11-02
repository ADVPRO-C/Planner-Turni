const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Joi = require("joi");
const nodemailer = require("nodemailer");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Tutte le route di assistenza richiedono autenticazione
router.use(authenticateToken);

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

// Configurazione transporter email
// TODO: Quando implementerai Resend API, sostituisci questa configurazione
// con quella di Resend (vedi documentazione: https://resend.com/docs/node/introduction)
const createTransporter = () => {
  // Se sono presenti variabili d'ambiente per SMTP, usale
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465, // true per 465, false per altri
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: se non ci sono credenziali SMTP, usa Gmail (richiede app password)
  // Nota: Per Gmail devi generare una "App Password" dalle impostazioni account
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  // Se non ci sono credenziali, restituisci null (verrà gestito in inviaEmail)
  return null;
};

// Funzione per inviare email
const inviaEmail = async (datiRichiesta, allegati = []) => {
  try {
    const EMAIL_DESTINATARIO = process.env.ASSISTENZA_EMAIL || "advprocomunicazione@gmail.com";
    
    console.log("📧 Preparazione email di assistenza:");
    console.log("Destinatario:", EMAIL_DESTINATARIO);
    
    const oggetto = `[${datiRichiesta.priorita.toUpperCase()}] ${datiRichiesta.argomento} - ${
      datiRichiesta.titolo
    } (da ${datiRichiesta.nomeUtente})`;

    console.log("Oggetto:", oggetto);
    console.log("Allegati:", allegati.length);

    // Crea il transporter
    const transporter = createTransporter();

    if (!transporter) {
      console.warn("⚠️ Nessuna configurazione email trovata. L'email non verrà inviata.");
      console.warn("⚠️ Configura SMTP_HOST, SMTP_USER, SMTP_PASS o GMAIL_USER, GMAIL_APP_PASSWORD");
      
      // In modalità sviluppo, restituisci successo simulato
      if (process.env.NODE_ENV === "development") {
        console.log("⚠️ Modalità sviluppo: email simulata");
        return { success: true, messageId: `dev_msg_${Date.now()}`, simulated: true };
      }
      
      throw new Error("Configurazione email non trovata");
    }

    // Prepara il corpo dell'email HTML
    const argomentoLabels = {
      "problema-tecnico": "Problema Tecnico",
      "domanda": "Domanda",
      "nuova-funzionalita": "Aggiunta Nuova Funzionalità"
    };

    const prioritaBadge = datiRichiesta.priorita === "urgente" 
      ? '<span style="background-color: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">URGENTE</span>'
      : '<span style="background-color: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px;">Normale</span>';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Nuova Richiesta di Assistenza
        </h2>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Priorità:</strong> ${prioritaBadge}</p>
          <p><strong>Argomento:</strong> ${argomentoLabels[datiRichiesta.argomento] || datiRichiesta.argomento}</p>
          <p><strong>Titolo:</strong> ${datiRichiesta.titolo}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #374151;">Informazioni Richiedente</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Nome:</strong> ${datiRichiesta.nomeUtente}</li>
            <li><strong>Ruolo:</strong> ${datiRichiesta.ruoloUtente}</li>
            <li><strong>Email:</strong> <a href="mailto:${datiRichiesta.email}">${datiRichiesta.email}</a></li>
            ${datiRichiesta.telefono ? `<li><strong>Telefono:</strong> ${datiRichiesta.telefono}</li>` : ""}
          </ul>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #374151;">Descrizione</h3>
          <div style="background-color: #ffffff; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0;">
            ${datiRichiesta.descrizione.replace(/\n/g, "<br>")}
          </div>
        </div>

        ${allegati.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #374151;">Allegati (${allegati.length})</h3>
            <ul>
              ${allegati.map(file => `<li>${file.originalname} (${(file.size / 1024).toFixed(2)} KB)</li>`).join("")}
            </ul>
          </div>
        ` : ""}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p>Data invio: ${new Date(datiRichiesta.dataInvio).toLocaleString("it-IT")}</p>
          <p>IP richiedente: ${datiRichiesta.ip}</p>
        </div>
      </div>
    `;

    // Prepara gli allegati per nodemailer
    const attachments = allegati.map(file => ({
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype,
    }));

    // Invia l'email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Sistema Planner" <${process.env.GMAIL_USER || "noreply@planner.com"}>`,
      to: EMAIL_DESTINATARIO,
      subject: oggetto,
      html: htmlBody,
      text: `
Nuova Richiesta di Assistenza

Priorità: ${datiRichiesta.priorita.toUpperCase()}
Argomento: ${argomentoLabels[datiRichiesta.argomento] || datiRichiesta.argomento}
Titolo: ${datiRichiesta.titolo}

Richiedente:
- Nome: ${datiRichiesta.nomeUtente}
- Ruolo: ${datiRichiesta.ruoloUtente}
- Email: ${datiRichiesta.email}
${datiRichiesta.telefono ? `- Telefono: ${datiRichiesta.telefono}` : ""}

Descrizione:
${datiRichiesta.descrizione}

${allegati.length > 0 ? `Allegati: ${allegati.map(f => f.originalname).join(", ")}` : ""}

Data invio: ${new Date(datiRichiesta.dataInvio).toLocaleString("it-IT")}
IP: ${datiRichiesta.ip}
      `,
      attachments: attachments,
    });

    console.log("✅ Email inviata con successo!");
    console.log("Message ID:", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Errore invio email:", error);
    throw error;
  }
};

// POST /api/assistenza/invia - Invia richiesta di assistenza
router.post("/invia", upload.array("allegato", 3), async (req, res) => {
  try {
    console.log("📝 Nuova richiesta di assistenza ricevuta");

    // Estrai i dati dal form
    const formData = { ...req.body };

    // Rimuovi eventuali campi non validi dal body per la validazione
    // Gli allegati vengono gestiti da multer e sono in req.files

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
