const pgp = require("pg-promise")();
const fs = require("fs");
const path = require("path");

// Usa DATABASE_URL da environment (Railway) o fallback
const RAILWAY_URL =
  process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;

if (!RAILWAY_URL) {
  console.error("❌ RAILWAY_DATABASE_URL o DATABASE_URL non configurata");
  console.error(
    "Configura la variabile ambiente con la connection string di Railway"
  );
  process.exit(1);
}

// Connessione a Railway
const db = pgp(RAILWAY_URL);

async function runMigration() {
  try {
    console.log(
      "🚀 Esecuzione migrazione su Railway: crea tabella documenti_autorizzazioni"
    );
    console.log("=".repeat(60));

    await db.connect();
    console.log("✅ Connessione a Railway PostgreSQL riuscita");

    // Verifica se la tabella esiste già
    console.log("🔍 Verifica esistenza tabella...");
    const tableExists = await db.oneOrNone(
      `SELECT 1 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
         AND table_name = 'documenti_autorizzazioni'`
    );

    if (tableExists) {
      console.log(
        "ℹ️  La tabella documenti_autorizzazioni esiste già. Nessuna migrazione necessaria."
      );
      return;
    }

    console.log("📝 Creazione tabella documenti_autorizzazioni...");

    // Leggi il file SQL
    const migrationPath = path.join(
      __dirname,
      "../database/migrations/create_documenti_autorizzazioni.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`File di migrazione non trovato: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Esegui la migrazione
    await db.none(migrationSQL);

    console.log("✅ Migrazione completata con successo!");
    console.log("   ✅ Tabella documenti_autorizzazioni creata");
    console.log("   ✅ Indici creati");
    console.log("   ✅ Trigger per updated_at creato");

    // Verifica finale
    const verifyTable = await db.one(
      `SELECT COUNT(*) as count 
       FROM information_schema.columns 
       WHERE table_name = 'documenti_autorizzazioni'`
    );
    console.log(
      `   ✅ Tabella verificata: ${verifyTable.count} colonne trovate`
    );
  } catch (error) {
    console.error("\n❌ Errore durante la migrazione:");
    console.error("   Messaggio:", error.message);
    if (error.stack) {
      console.error("   Stack trace:", error.stack);
    }
    process.exit(1);
  } finally {
    await db.$pool.end();
  }
}

runMigration();
