const pgp = require("pg-promise")();
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const db = pgp({
  user: process.env.DB_USER || "zy0n",
  password: process.env.DB_PASSWORD || "",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "planner_db",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  try {
    console.log("🚀 Esecuzione migrazione: crea tabella esperienze");
    await db.connect();
    console.log("✅ Connessione database riuscita");

    // Verifica se la tabella esiste già
    const tableExists = await db.oneOrNone(
      `SELECT 1 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
         AND table_name = 'esperienze'`
    );

    if (tableExists) {
      console.log("ℹ️  La tabella esperienze esiste già. Nessuna migrazione necessaria.");
      return;
    }

    console.log("📝 Creazione tabella esperienze...");
    
    // Leggi il file SQL
    const migrationPath = path.join(__dirname, "../database/migrations/create_esperienze.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Esegui la migrazione
    await db.none(migrationSQL);

    console.log("✅ Migrazione completata con successo!");
    console.log("   ✅ Tabella esperienze creata");
    console.log("   ✅ Sequence esperienze_id_seq creata");
    console.log("   ✅ Indici creati");
    console.log("   ✅ Trigger per updated_at creato");

  } catch (error) {
    console.error("❌ Errore durante la migrazione:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  } finally {
    pgp.end();
  }
}

runMigration();

