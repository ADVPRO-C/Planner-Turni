const express = require("express");
const Joi = require("joi");
const db = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { normalizeCode } = require("../utils/congregazioni");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("super_admin"));

const createSchema = Joi.object({
  nome: Joi.string().min(3).max(255).required(),
});

const updateSchema = Joi.object({
  nome: Joi.string().min(3).max(255).required(),
});

const getNextCode = async () => {
  const row = await db.one(
    `SELECT LPAD((COALESCE(MAX(codice)::int, 0) + 1)::text, 3, '0') AS next_code FROM congregazioni`
  );
  return normalizeCode(row.next_code);
};

router.get("/", async (req, res) => {
  try {
    const congregazioni = await db.any(
      `SELECT id, codice, nome, created_at, updated_at FROM congregazioni ORDER BY codice`
    );
    res.json(congregazioni);
  } catch (error) {
    console.error("Errore nel recupero delle congregazioni:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const codice = await getNextCode();

    const congregazione = await db.one(
      `INSERT INTO congregazioni (codice, nome)
       VALUES ($1, $2)
       RETURNING id, codice, nome, created_at, updated_at`,
      [codice, value.nome.trim()]
    );

    res.status(201).json(congregazione);
  } catch (error) {
    console.error("Errore nella creazione della congregazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const congregazioneId = parseInt(req.params.id, 10);
    if (Number.isNaN(congregazioneId)) {
      return res.status(400).json({ message: "ID non valido" });
    }

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updated = await db.oneOrNone(
      `UPDATE congregazioni
       SET nome = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, codice, nome, created_at, updated_at`,
      [value.nome.trim(), congregazioneId]
    );

    if (!updated) {
      return res.status(404).json({ message: "Congregazione non trovata" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Errore nell'aggiornamento della congregazione:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const congregazioneId = parseInt(req.params.id, 10);
    if (Number.isNaN(congregazioneId)) {
      return res.status(400).json({ message: "ID non valido" });
    }

    // Verifica che la congregazione esista
    const congregazione = await db.oneOrNone(
      "SELECT id, codice, nome FROM congregazioni WHERE id = $1",
      [congregazioneId]
    );

    if (!congregazione) {
      return res.status(404).json({ message: "Congregazione non trovata" });
    }

    // Elimina la congregazione e tutti i dati associati (CASCADE)
    // Le foreign key constraints dovrebbero gestire la cancellazione a cascata
    await db.none("DELETE FROM congregazioni WHERE id = $1", [congregazioneId]);

    res.json({ 
      message: "Congregazione eliminata con successo",
      deleted: congregazione
    });
  } catch (error) {
    console.error("Errore nell'eliminazione della congregazione:", error);
    
    // Se c'è una foreign key constraint violation
    if (error.code === "23503") {
      return res.status(400).json({ 
        message: "Impossibile eliminare: esistono ancora dati associati a questa congregazione" 
      });
    }
    
    res.status(500).json({ message: "Errore interno del server" });
  }
});

module.exports = router;
