const fs = require("fs");
const path = require("path");
const db = require("../config/database");

// Script per inizializzare il database Railway con lo schema
async function initDatabase() {
  try {
    console.log("📦 Inizializzazione database Railway...");

    // Leggi il file schema.sql
    const schemaPath = path.join(__dirname, "../database/schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    // Rimuovi tutte le righe di commenti e metadati
    const cleanedSQL = schemaSQL
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        // Rimuovi righe vuote, commenti SQL (--), e metadati del dump
        return (
          trimmed.length > 0 &&
          !trimmed.startsWith("--") &&
          !trimmed.startsWith("-- Name:") &&
          !trimmed.startsWith("-- Type:") &&
          !trimmed.startsWith("-- Schema:") &&
          !trimmed.startsWith("-- Owner:") &&
          !trimmed.startsWith("-- Dumped") &&
          !trimmed.startsWith("-- PostgreSQL")
        );
      })
      .join("\n");

    // Dividi lo schema in singole query (separate da ;)
    const queries = cleanedSQL
      .split(";")
      .map((q) => q.trim())
      .filter((q) => q.length > 10 && !q.match(/^--/)); // Minimo 10 caratteri per essere una query valida

    console.log(`📝 Trovate ${queries.length} query da eseguire...`);

    // Esegui le query una per una
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query.length < 10) continue; // Salta query troppo brevi

      try {
        // Usa db.query per query che potrebbero restituire dati (SELECT, SET, etc.)
        // e db.none per query che non restituiscono dati (CREATE, INSERT, etc.)
        const queryUpper = query.trim().toUpperCase();
        
        if (
          queryUpper.startsWith("SELECT") ||
          queryUpper.startsWith("SET ") ||
          queryUpper.includes("SET ") ||
          queryUpper.includes("pg_catalog.set_config")
        ) {
          // Query che restituiscono dati
          await db.query(query);
        } else {
          // Query che non restituiscono dati
          await db.none(query);
        }
      } catch (error) {
        // Ignora errori di "already exists" per estensioni e tabelle
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("No return data was expected") ||
          error.code === "queryResultErrorCode.notEmpty"
        ) {
          // Se è un errore di "already exists" o tipo di query sbagliato, prova con db.query
          if (error.code === "queryResultErrorCode.notEmpty") {
            try {
              await db.query(query);
            } catch (err2) {
              if (!err2.message.includes("already exists") && !err2.message.includes("duplicate")) {
                console.log(`⚠️  Query ${i + 1} già eseguita o errore minore, skip...`);
              }
            }
          } else {
            console.log(`⚠️  Query ${i + 1} già eseguita, skip...`);
          }
        } else {
          console.error(`❌ Errore in query ${i + 1}:`, error.message);
          // Non interrompere per errori non critici
          if (!error.message.includes("does not exist")) {
            console.log(`⚠️  Continuo comunque...`);
          }
        }
      }
    }

    console.log("✅ Database inizializzato con successo!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Errore nell'inizializzazione del database:", error);
    process.exit(1);
  }
}

// Esegui lo script
initDatabase();

