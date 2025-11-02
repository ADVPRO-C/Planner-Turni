const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const db = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const congregationCodeSchema = Joi.string()
  .pattern(/^\d{3}$/)
  .message("ID congregazione non valido");

// Schema di validazione per il login multi-tenant
const loginSchema = Joi.object({
  congregazione_codice: congregationCodeSchema.optional(),
  congregazione_id: Joi.number().integer().positive().optional(),
  identificatore: Joi.string().trim().min(3).required(),
  password: Joi.string().min(6).required(),
}).custom((value, helpers) => {
  if (!value.congregazione_codice && !value.congregazione_id) {
    return helpers.message("ID congregazione obbligatorio");
  }
  return value;
});

// Schema di validazione per la registrazione di un volontario
const registerSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  cognome: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional().allow(""),
  telefono: Joi.string().max(20).optional().allow(""),
  password: Joi.string().min(6).required(),
  sesso: Joi.string().valid("M", "F").required(),
  ruolo: Joi.string()
    .valid("volontario", "admin", "super_admin")
    .default("volontario"),
  congregazione_id: Joi.number().integer().positive().required(),
});

const sanitizePhone = (input) => input.replace(/\D/g, "");

const buildUserResponse = (record) => ({
  id: record.id,
  nome: record.nome,
  cognome: record.cognome,
  email: record.email,
  telefono: record.telefono,
  sesso: record.sesso,
  ruolo: record.ruolo,
  stato: record.stato,
  congregazione_id: record.congregazione_id,
  congregazione_codice: record.congregazione_codice,
  congregazione_nome: record.congregazione_nome,
});

router.post("/login", async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      congregazione_codice,
      congregazione_id,
      identificatore,
      password,
    } = value;

    let congregazione;
    if (congregazione_id) {
      congregazione = await db.oneOrNone(
        "SELECT id, codice, nome FROM congregazioni WHERE id = $1",
        [congregazione_id]
      );
    } else {
      const codiceNormalizzato = congregazione_codice.padStart(3, "0");
      congregazione = await db.oneOrNone(
        "SELECT id, codice, nome FROM congregazioni WHERE codice = $1",
        [codiceNormalizzato]
      );
    }

    if (!congregazione) {
      return res.status(401).json({ message: "Congregazione non trovata" });
    }

    const credential = identificatore.trim();
    let user;

    if (credential.includes("@")) {
      user = await db.oneOrNone(
        `SELECT v.*, c.codice AS congregazione_codice, c.nome AS congregazione_nome
         FROM volontari v
         JOIN congregazioni c ON v.congregazione_id = c.id
         WHERE v.congregazione_id = $1 AND LOWER(v.email) = LOWER($2)`,
        [congregazione.id, credential]
      );
    } else {
      const digits = sanitizePhone(credential);
      user = await db.oneOrNone(
        `SELECT v.*, c.codice AS congregazione_codice, c.nome AS congregazione_nome
         FROM volontari v
         JOIN congregazioni c ON v.congregazione_id = c.id
         WHERE v.congregazione_id = $1
           AND v.telefono IS NOT NULL
           AND regexp_replace(v.telefono, '\\D', '', 'g') = $2`,
        [congregazione.id, digits]
      );
    }

    if (!user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    if (user.stato !== "attivo") {
      return res.status(401).json({ message: "Account non attivo" });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      ruolo: user.ruolo,
      nome: user.nome,
      cognome: user.cognome,
      congregazione_id: user.congregazione_id,
      congregazione_codice: user.congregazione_codice,
      congregazione_nome: user.congregazione_nome,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });

    const userResponse = buildUserResponse(user);

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Errore durante il login:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      message: "Errore interno del server",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

router.post("/register", authenticateToken, authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      nome,
      cognome,
      email,
      telefono,
      password,
      sesso,
      ruolo,
      congregazione_id,
    } = value;

    if (ruolo === "super_admin" && req.user.ruolo !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Solo il SuperAdmin può creare un altro SuperAdmin" });
    }

    const congregazione = await db.oneOrNone(
      "SELECT id FROM congregazioni WHERE id = $1",
      [congregazione_id]
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
         WHERE regexp_replace(telefono, '\\D', '', 'g') = $1`,
        [sanitizePhone(telefono)]
      );

      if (existingPhone) {
        return res.status(400).json({ message: "Telefono già registrato" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await db.one(
      `INSERT INTO volontari (
         congregazione_id, nome, cognome, email, telefono, password_hash, sesso, ruolo, stato
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'attivo')
       RETURNING id, nome, cognome, email, telefono, sesso, ruolo, stato, congregazione_id`,
      [
        congregazione_id,
        nome,
        cognome,
        email || null,
        telefono || null,
        passwordHash,
        sesso,
        ruolo,
      ]
    );

    res.status(201).json({
      message: "Utente registrato con successo",
      user: newUser,
    });
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.get("/verify", authenticateToken, async (req, res) => {
  try {
    const user = await db.oneOrNone(
      `SELECT v.id, v.nome, v.cognome, v.email, v.telefono, v.sesso, v.ruolo, v.stato,
              v.congregazione_id, c.codice AS congregazione_codice, c.nome AS congregazione_nome
       FROM volontari v
       JOIN congregazioni c ON v.congregazione_id = c.id
       WHERE v.id = $1`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    if (user.stato !== "attivo") {
      return res.status(401).json({ message: "Account non attivo" });
    }

    res.json({ user: buildUserResponse(user) });
  } catch (error) {
    console.error("Errore durante la verifica del token:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { nome, cognome, email, telefono } = req.body;

    if (!nome || !cognome) {
      return res
        .status(400)
        .json({ message: "Nome e cognome sono obbligatori" });
    }

    if (email) {
      const existingEmail = await db.oneOrNone(
        "SELECT id FROM volontari WHERE LOWER(email) = LOWER($1) AND id != $2",
        [email, req.user.id]
      );

      if (existingEmail) {
        return res.status(400).json({ message: "Email già in uso" });
      }
    }

    if (telefono) {
      const existingPhone = await db.oneOrNone(
        `SELECT id FROM volontari
         WHERE regexp_replace(telefono, '\\D', '', 'g') = $1 AND id != $2`,
        [sanitizePhone(telefono), req.user.id]
      );

      if (existingPhone) {
        return res.status(400).json({ message: "Telefono già in uso" });
      }
    }

    const updatedUser = await db.one(
      `UPDATE volontari
         SET nome = $1,
             cognome = $2,
             email = $3,
             telefono = $4,
             updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, nome, cognome, email, telefono, sesso, ruolo, stato, congregazione_id`,
      [nome, cognome, email || null, telefono || null, req.user.id]
    );

    // Recupera i dati congregazione
    const congregation = await db.one(
      "SELECT codice AS congregazione_codice, nome AS congregazione_nome FROM congregazioni WHERE id = $1",
      [updatedUser.congregazione_id]
    );

    res.json({
      message: "Profilo aggiornato con successo",
      user: buildUserResponse({ ...updatedUser, ...congregation }),
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento del profilo:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Tutti i campi sono obbligatori" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "La nuova password deve essere di almeno 6 caratteri",
      });
    }

    const user = await db.oneOrNone(
      "SELECT password_hash FROM volontari WHERE id = $1",
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isValidPassword) {
      return res
        .status(400)
        .json({ message: "Password corrente non corretta" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.none(
      "UPDATE volontari SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [newPasswordHash, req.user.id]
    );

    res.json({ message: "Password cambiata con successo" });
  } catch (error) {
    console.error("Errore durante il cambio password:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

module.exports = router;
