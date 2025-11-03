#!/usr/bin/env node

/**
 * Script di manutenzione per rimuovere le disponibilità più vecchie di N giorni.
 * Uso:
 *   node server/scripts/cleanup-disponibilita.js            # default 120 giorni
 *   node server/scripts/cleanup-disponibilita.js 180        # 180 giorni
 */

require("dotenv").config();
const db = require("../config/database");

const args = process.argv.slice(2);

let mode = "days";
let days = 120;

args.forEach((arg) => {
  if (arg === "--before-current-month") {
    mode = "before-current-month";
  } else if (/^--days=/.test(arg)) {
    const value = parseInt(arg.split("=")[1], 10);
    if (!Number.isNaN(value) && value >= 0) {
      days = value;
    }
  } else if (!Number.isNaN(Number(arg))) {
    days = Math.max(0, parseInt(arg, 10));
  }
});

const run = async () => {
  try {
    let cutoffDate;
    if (mode === "before-current-month") {
      const now = new Date();
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
    }

    cutoffDate.setHours(0, 0, 0, 0);
    const cutoffString = cutoffDate.toISOString().split("T")[0];

    console.log(
      mode === "before-current-month"
        ? `🧹 Cleanup disponibilità: rimuovo tutte le voci con data precedente al ${cutoffString} (mesi antecedenti a quello corrente).`
        : `🧹 Cleanup disponibilità: rimuovo record anteriori a ${cutoffString} (> ${days} giorni).`
    );

    // Prima contiamo quanti record verranno eliminati (per logging)
    const countResult = await db.one(
      `SELECT COUNT(*)::int AS count
       FROM disponibilita
       WHERE data < $1`,
      [cutoffString]
    );

    console.log(`📊 Record da eliminare: ${countResult.count}`);

    if (countResult.count === 0) {
      console.log("✅ Nessun record da eliminare. Database già pulito.");
      await db.$pool?.end();
      process.exit(0);
    }

    // Eseguiamo la cancellazione
    const result = await db.result(
      `DELETE FROM disponibilita
       WHERE data < $1`,
      [cutoffString]
    );

    console.log(`✅ Completato: ${result.rowCount} record eliminati.`);
    
    // Chiudiamo la connessione al database
    await db.$pool?.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Errore durante il cleanup delle disponibilità:", error);
    // Assicuriamoci di chiudere la connessione anche in caso di errore
    try {
      await db.$pool?.end();
    } catch (closeError) {
      // Ignora errori di chiusura
    }
    process.exit(1);
  }
};

run();
