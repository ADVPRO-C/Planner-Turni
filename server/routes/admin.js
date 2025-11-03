const express = require("express");
const db = require("../config/database");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// Tutte le route richiedono autenticazione e ruolo admin/super_admin
router.use(authenticateToken);
router.use(authorizeRoles("admin", "super_admin"));

/**
 * POST /api/admin/cleanup-disponibilita
 * Esegue il cleanup delle disponibilità vecchie
 * Query params:
 *   - days: numero di giorni (default: 120)
 *   - beforeCurrentMonth: true/false (default: false)
 */
router.post("/cleanup-disponibilita", async (req, res) => {
  try {
    const { days, beforeCurrentMonth } = req.query;

    let cutoffDate;
    const mode = beforeCurrentMonth === "true" ? "before-current-month" : "days";
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

