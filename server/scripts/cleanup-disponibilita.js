#!/usr/bin/env node

/**
 * Script di manutenzione per rimuovere le disponibilità più vecchie di N giorni.
 * Uso:
 *   node server/scripts/cleanup-disponibilita.js            # default 120 giorni
 *   node server/scripts/cleanup-disponibilita.js 180        # 180 giorni
 */

require("dotenv").config();
const db = require("../config/database");

const daysArg = process.argv[2];
const days =
  !daysArg || Number.isNaN(Number(daysArg)) ? 120 : Math.max(0, parseInt(daysArg, 10));

const run = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffString = cutoffDate.toISOString().split("T")[0];

    console.log(`🧹 Cleanup disponibilità: rimuovo record anteriori a ${cutoffString} (>${days} giorni).`);

    const result = await db.result(
      `DELETE FROM disponibilita
       WHERE data < $1`,
      [cutoffString]
    );

    console.log(`✅ Completato: ${result.rowCount} record eliminati.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Errore durante il cleanup delle disponibilità:", error);
    process.exit(1);
  }
};

run();
