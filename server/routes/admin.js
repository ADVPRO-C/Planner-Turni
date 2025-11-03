const express = require("express");
const db = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// Tutte le route richiedono autenticazione e ruolo super_admin
router.use(authenticateToken);
router.use(authorizeRoles("super_admin"));

/**
 * GET /api/admin/cleanup-disponibilita/stats
 * Ottiene il conteggio delle disponibilità vecchie (prima del mese corrente)
 */
router.get("/cleanup-disponibilita/stats", async (req, res) => {
  try {
    // Calcola la data di cutoff (primo giorno del mese corrente)
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
    cutoffDate.setHours(0, 0, 0, 0);
    const cutoffString = cutoffDate.toISOString().split("T")[0];

    // Conta le disponibilità vecchie
    const countResult = await db.one(
      `SELECT COUNT(*)::int AS count
       FROM disponibilita
       WHERE data < $1`,
      [cutoffString]
    );

    res.json({
      success: true,
      oldDisponibilitaCount: countResult.count,
      cutoffDate: cutoffString,
    });
  } catch (error) {
    console.error("❌ Errore nel recupero delle statistiche cleanup:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero delle statistiche",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/admin/cleanup-disponibilita
 * Esegue il cleanup delle disponibilità vecchie
 * Query params:
 *   - days: numero di giorni (default: usa before-current-month)
 *   - beforeCurrentMonth: true/false (default: true)
 */
router.post("/cleanup-disponibilita", async (req, res) => {
  try {
    const { days, beforeCurrentMonth } = req.query;

    let cutoffDate;
    const mode = beforeCurrentMonth === "false" ? "days" : "before-current-month";
    const daysValue = days ? parseInt(days, 10) : 120;

    if (mode === "before-current-month") {
      const now = new Date();
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysValue);
    }

    cutoffDate.setHours(0, 0, 0, 0);
    const cutoffString = cutoffDate.toISOString().split("T")[0];

    // Conta quanti record verranno eliminati
    const countResult = await db.one(
      `SELECT COUNT(*)::int AS count
       FROM disponibilita
       WHERE data < $1`,
      [cutoffString]
    );

    if (countResult.count === 0) {
      return res.json({
        success: true,
        message: "Nessun record da eliminare. Database già pulito.",
        deletedCount: 0,
        cutoffDate: cutoffString,
      });
    }

    // Esegue la cancellazione
    const result = await db.result(
      `DELETE FROM disponibilita
       WHERE data < $1`,
      [cutoffString]
    );

    res.json({
      success: true,
      message: `Cleanup completato: ${result.rowCount} record eliminati.`,
      deletedCount: result.rowCount,
      cutoffDate: cutoffString,
      mode: mode,
    });
  } catch (error) {
    console.error("❌ Errore durante il cleanup delle disponibilità:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante il cleanup delle disponibilità",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;

