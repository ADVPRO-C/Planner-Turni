const pgp = require("pg-promise")();

// Configurazione
const LOCAL_DB_URL = process.env.LOCAL_DATABASE_URL || 
  "postgresql://zy0n:2vQ-i60MqwHG@localhost:5432/planner_db";
const RAILWAY_URL = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;

if (!RAILWAY_URL) {
  console.error("❌ RAILWAY_DATABASE_URL o DATABASE_URL non configurata");
  process.exit(1);
}

// Connessioni
const localDb = pgp(LOCAL_DB_URL);
const railwayDb = pgp(RAILWAY_URL);

// Ordine tabelle per foreign keys
const tableOrder = [
  "congregazioni",
  "volontari",
  "postazioni",
  "slot_orari",
  "disponibilita",
  "assegnazioni",
  "assegnazioni_volontari",
  "notifiche",
  "notifications",
];

// Funzione per ottenere lista tabelle
async function getTableNames(db) {
  const tables = await db.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  return tables.map((t) => t.tablename);
}

// Funzione per contare righe
async function getTableRowCount(db, tableName) {
  try {
    const result = await db.one(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.count, 10);
  } catch (error) {
    return 0;
  }
}

// Funzione per copiare una tabella
async function copyTable(sourceDb, targetDb, tableName) {
  console.log(`\n📋 Tabella: ${tableName}`);
  console.log("=".repeat(60));

  try {
    // Conta righe sorgente
    const sourceCount = await getTableRowCount(sourceDb, tableName);
    console.log(`   📊 Record in locale: ${sourceCount}`);

    if (sourceCount === 0) {
      console.log(`   ⏭️  Tabella vuota, skip...`);
      return { success: true, rows: 0 };
    }

    // Leggi tutti i dati dalla sorgente
    console.log(`   📥 Lettura dati da database locale...`);
    const data = await sourceDb.any(`SELECT * FROM ${tableName} ORDER BY id`);

    if (!data || data.length === 0) {
      console.log(`   ⏭️  Nessun dato da copiare`);
      return { success: true, rows: 0 };
    }

    console.log(`   ✅ Letti ${data.length} record`);

    // Prendi le colonne dal primo record
    const columns = Object.keys(data[0]);
    const columnsStr = columns.map((c) => `"${c}"`).join(", ");
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

    // Verifica se la tabella ha un campo id per ON CONFLICT
    const hasId = columns.includes("id");
    const conflictClause = hasId
      ? "ON CONFLICT (id) DO NOTHING"
      : "";

    const insertQuery = `
      INSERT INTO ${tableName} (${columnsStr})
      VALUES (${placeholders})
      ${conflictClause};
    `;

    console.log(`   📝 Inserimento in Railway...`);

    // Disabilita foreign keys temporaneamente per inserimenti più veloci
    await targetDb.none("SET session_replication_role = 'replica';");

    let inserted = 0;
    const batchSize = 100;

    try {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        for (const row of batch) {
          const values = columns.map((col) => row[col]);
          try {
            await targetDb.none(insertQuery, values);
            inserted++;
          } catch (error) {
            // Ignora duplicati
            if (error.code !== "23505") {
              console.error(`   ⚠️  Errore inserimento record:`, error.message);
              // Mostra il record che causa errore
              console.error(`   Record problematico:`, JSON.stringify(row, null, 2));
            }
          }
        }

        if (i + batchSize < data.length) {
          process.stdout.write(`   ⏳ Inseriti ${inserted}/${data.length}...\r`);
        }
      }

      // Riabilita foreign keys
      await targetDb.none("SET session_replication_role = 'origin';");

      // Verifica conteggio finale
      const targetCount = await getTableRowCount(targetDb, tableName);
      console.log(`   ✅ Inseriti ${inserted}/${data.length} record (${targetCount} totali in Railway)`);

      return { success: true, rows: inserted };
    } catch (error) {
      await targetDb.none("SET session_replication_role = 'origin';");
      throw error;
    }
  } catch (error) {
    console.error(`   ❌ Errore nella copia:`, error.message);
    return { success: false, rows: 0, error: error.message };
  }
}

// Migrazione principale
async function migrateFromLocalhost() {
  console.log("🚀 Migrazione Database Locale → Railway");
  console.log("=".repeat(60));
  console.log(`\n📡 Database Locale: ${LOCAL_DB_URL.split("@")[1] || "localhost"}`);
  console.log(`📡 Railway Database: ${RAILWAY_URL.split("@")[1] || "configurato"}\n`);

  try {
    // Test connessioni
    console.log("🔌 Test connessioni...");
    await localDb.connect();
    console.log("✅ Connesso a database locale");
    
    await railwayDb.connect();
    console.log("✅ Connesso a Railway PostgreSQL\n");

    // Ottieni lista tabelle
    console.log("📋 Elenco tabelle...");
    const localTables = await getTableNames(localDb);
    const railwayTables = await getTableNames(railwayDb);
    
    console.log(`   Locale: ${localTables.length} tabelle`);
    console.log(`   Railway: ${railwayTables.length} tabelle`);

    // Mostra statistiche database locale
    console.log("\n📊 Statistiche Database Locale:");
    for (const table of tableOrder) {
      if (localTables.includes(table)) {
        const count = await getTableRowCount(localDb, table);
        console.log(`   - ${table}: ${count} record`);
      }
    }

    // Verifica che le tabelle esistano in entrambi i database
    const tablesToMigrate = tableOrder.filter(
      (table) => localTables.includes(table) && railwayTables.includes(table)
    );

    // Aggiungi tabelle non nell'ordine specificato
    const otherTables = localTables.filter(
      (table) => !tableOrder.includes(table) && railwayTables.includes(table)
    );
    tablesToMigrate.push(...otherTables);

    console.log(`\n📦 Tabelle da migrare: ${tablesToMigrate.length}`);
    tablesToMigrate.forEach((table) => console.log(`   - ${table}`));

    // Statistiche finali
    const stats = {
      total: tablesToMigrate.length,
      success: 0,
      failed: 0,
      totalRows: 0,
      details: [],
    };

    // Copia ogni tabella
    for (const table of tablesToMigrate) {
      const result = await copyTable(localDb, railwayDb, table);
      
      stats.details.push({
        table,
        success: result.success,
        rows: result.rows,
        error: result.error,
      });

      if (result.success) {
        stats.success++;
        stats.totalRows += result.rows;
      } else {
        stats.failed++;
      }
    }

    // Riepilogo
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 Riepilogo Migrazione:");
    console.log(`   ✅ Tabelle migrate con successo: ${stats.success}`);
    console.log(`   ❌ Tabelle fallite: ${stats.failed}`);
    console.log(`   📝 Totale record copiati: ${stats.totalRows}`);
    console.log("\n📋 Dettagli:");
    stats.details.forEach((detail) => {
      if (detail.success) {
        console.log(`   ✅ ${detail.table}: ${detail.rows} record`);
      } else {
        console.log(`   ❌ ${detail.table}: ${detail.error || "errore"}`);
      }
    });

    console.log("\n✅ Migrazione completata!");

    // Chiudi connessioni
    await localDb.$pool.end();
    await railwayDb.$pool.end();
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Errore durante la migrazione:", error);
    await localDb.$pool.end();
    await railwayDb.$pool.end();
    process.exit(1);
  }
}

// Esegui migrazione
migrateFromLocalhost();

