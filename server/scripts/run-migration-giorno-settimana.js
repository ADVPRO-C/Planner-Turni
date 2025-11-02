const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "planner_turni",
  password: process.env.DB_PASSWORD || "",
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log("🔄 Eseguendo migrazione: correzione mapping giorni_settimana...");

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, "../database/migrations/fix_giorno_settimana_mapping.sql"),
      "utf8"
    );

    await client.query("BEGIN");
    await client.query(migrationSQL);
    await client.query("COMMIT");

    console.log("✅ Migrazione completata con successo!");
    console.log(
      "📝 La funzione get_giorno_settimana è stata aggiornata con il mapping corretto:"
    );
    console.log("   1 = Lunedì, 2 = Martedì, ..., 7 = Domenica");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Errore durante la migrazione:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log("✨ Processo completato");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Errore fatale:", error);
    process.exit(1);
  });

