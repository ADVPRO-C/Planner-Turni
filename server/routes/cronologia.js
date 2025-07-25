const express = require("express");
const router = express.Router();

// GET /api/cronologia - Ottieni la cronologia dei turni
router.get("/", async (req, res) => {
  try {
    // Per ora restituisci sempre un array vuoto dato che la cronologia non è ancora implementata
    res.json({
      cronologia: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    });
  } catch (error) {
    console.error("Errore nel recupero della cronologia:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

module.exports = router;
