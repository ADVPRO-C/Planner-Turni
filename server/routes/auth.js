const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const db = require("../config/database");

const router = express.Router();

// Schema di validazione per il login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Schema di validazione per la registrazione
const registerSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  cognome: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  telefono: Joi.string().max(20).optional().allow(""),
  password: Joi.string().min(6).required(),
  sesso: Joi.string().valid("M", "F").required(),
  ruolo: Joi.string().valid("volontario", "admin").default("volontario"),
});

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

// Route per il login
router.post("/login", async (req, res) => {
  try {
    // Validazione input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = value;

    // Cerca l'utente nel database
    const user = await db.oneOrNone(
      "SELECT * FROM volontari WHERE email = $1",
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    // Verifica la password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    // Verifica che l'utente sia attivo
    if (user.stato !== "attivo") {
      return res.status(401).json({ message: "Account non attivo" });
    }

    // Genera il token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        ruolo: user.ruolo,
        nome: user.nome,
        cognome: user.cognome,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Rimuovi la password dalla risposta
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Errore durante il login:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// Route per la registrazione
router.post("/register", async (req, res) => {
  try {
    // Validazione input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { nome, cognome, email, telefono, password, sesso, ruolo } = value;

    // Verifica se l'email esiste già
    const existingUser = await db.oneOrNone(
      "SELECT id FROM volontari WHERE email = $1",
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ message: "Email già registrata" });
    }

    // Hash della password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Inserisci il nuovo utente
    const newUser = await db.one(
      `INSERT INTO volontari (nome, cognome, email, telefono, password_hash, sesso, ruolo, stato)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'attivo')
       RETURNING id, nome, cognome, email, telefono, sesso, ruolo, stato, created_at`,
      [nome, cognome, email, telefono, passwordHash, sesso, ruolo]
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

// Route per verificare il token
router.get("/verify", authenticateToken, async (req, res) => {
  try {
    // Cerca l'utente nel database
    const user = await db.oneOrNone(
      "SELECT id, nome, cognome, email, sesso, ruolo, stato FROM volontari WHERE id = $1",
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    if (user.stato !== "attivo") {
      return res.status(401).json({ message: "Account non attivo" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Errore durante la verifica del token:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// Route per aggiornare il profilo
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { nome, cognome, email } = req.body;

    // Validazione input
    if (!nome || !cognome || !email) {
      return res
        .status(400)
        .json({ message: "Tutti i campi sono obbligatori" });
    }

    // Verifica se l'email esiste già (escludendo l'utente corrente)
    const existingUser = await db.oneOrNone(
      "SELECT id FROM volontari WHERE email = $1 AND id != $2",
      [email, req.user.id]
    );

    if (existingUser) {
      return res.status(400).json({ message: "Email già in uso" });
    }

    // Aggiorna il profilo
    const updatedUser = await db.one(
      `UPDATE volontari 
       SET nome = $1, cognome = $2, email = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, nome, cognome, email, sesso, ruolo, stato`,
      [nome, cognome, email, req.user.id]
    );

    res.json({
      message: "Profilo aggiornato con successo",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento del profilo:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// Route per cambiare password
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

    // Ottieni l'utente corrente
    const user = await db.oneOrNone(
      "SELECT password_hash FROM volontari WHERE id = $1",
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Verifica la password corrente
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );
    if (!isValidPassword) {
      return res
        .status(400)
        .json({ message: "Password corrente non corretta" });
    }

    // Hash della nuova password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Aggiorna la password
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
