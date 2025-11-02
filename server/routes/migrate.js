const express = require("express");
const router = express.Router();
const pgp = require("pg-promise")();

// Endpoint temporaneo per migrare dati da Supabase a Railway
// ⚠️ ATTENZIONE: Rimuovere o disabilitare dopo la migrazione!

router.post("/supabase-to-railway", async (req, res) => {
  try {
    // Prendi connection string Supabase (deve essere configurata come variabile)
    const SUPABASE_URL = process.env.SUPABASE_DATABASE_URL;

    if (!SUPABASE_URL) {
      return res.status(400).json({
        error: "SUPABASE_DATABASE_URL non configurata",
        message:
          "Aggiungi la variabile SUPABASE_DATABASE_URL su Railway con la connection string di Supabase",
      });
    }

    // RAILWAY_URL è il database corrente (quello configurato in DATABASE_URL)
    const RAILWAY_URL = process.env.DATABASE_URL;

    if (!RAILWAY_URL) {
      return res.status(400).json({
        error: "DATABASE_URL non configurata",
        message: "Il database Railway non è configurato",
      });
    }

    console.log("🚀 Avvio migrazione da Supabase a Railway...");

    // Configurazione con SSL per Supabase + forzatura IPv4
    const dns = require("dns");

    // Forza IPv4 per Railway (non supporta IPv6 esterni)
    const supabaseConfig = {
      connectionString: SUPABASE_URL,
      ssl: { rejectUnauthorized: false },
      // Forza risoluzione DNS IPv4
      lookup: (hostname, options, callback) => {
        dns.lookup(
          hostname,
          { family: 4, hints: dns.ADDRCONFIG },
          (err4, address4, family4) => {
            if (!err4) {
              callback(null, address4, family4);
            } else {
              // Fallback IPv6 solo se IPv4 fallisce
              dns.lookup(
                hostname,
                { family: 6, hints: dns.ADDRCONFIG },
                (err6, address6, family6) => {
                  if (!err6) {
                    console.warn(
                      `⚠️ Usando IPv6 per ${hostname} (IPv4 non disponibile)`
                    );
                    callback(null, address6, family6);
                  } else {
                    callback(err4, null, null);
                  }
                }
              );
            }
          }
        );
      },
    };

    const supabaseDb = pgp(supabaseConfig);
    const railwayDb = pgp(RAILWAY_URL);

    // Test connessioni
    await supabaseDb.connect();
    console.log("✅ Connesso a Supabase");
    await railwayDb.connect();
    console.log("✅ Connesso a Railway");

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

    // Ottieni liste tabelle
    const getTableNames = async (db) => {
      const tables = await db.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `);
      return tables.map((t) => t.tablename);
    };

    const getTableRowCount = async (db, tableName) => {
      try {
        const result = await db.one(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        return parseInt(result.count, 10);
      } catch (error) {
        return 0;
      }
    };

    const copyTable = async (sourceDb, targetDb, tableName) => {
      try {
        const sourceCount = await getTableRowCount(sourceDb, tableName);

        if (sourceCount === 0) {
          return { success: true, rows: 0 };
        }

        // Verifica esistenza tabella
        const tableExists = await targetDb.oneOrNone(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `,
          [tableName]
        );

        if (!tableExists.exists) {
          return { success: false, rows: 0, error: "Table does not exist" };
        }

        // Disabilita foreign keys temporaneamente
        await targetDb.none("SET session_replication_role = 'replica';");

        // Leggi dati
        const data = await sourceDb.any(`SELECT * FROM ${tableName}`);

        if (data.length === 0) {
          await targetDb.none("SET session_replication_role = 'origin';");
          return { success: true, rows: 0 };
        }

        // Prendi colonne
        const columns = Object.keys(data[0]);
        const columnsStr = columns.map((c) => `"${c}"`).join(", ");
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

        const insertQuery = `
          INSERT INTO ${tableName} (${columnsStr})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING;
        `;

        // Inserisci dati
        let inserted = 0;
        const batchSize = 100;

        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);

          for (const row of batch) {
            const values = columns.map((col) => row[col]);
            try {
              await targetDb.none(insertQuery, values);
              inserted++;
            } catch (error) {
              if (error.code !== "23505") {
                console.error(`Errore inserimento:`, error.message);
              }
            }
          }
        }

        // Riabilita foreign keys
        await targetDb.none("SET session_replication_role = 'origin';");

        return { success: true, rows: inserted };
      } catch (error) {
        console.error(`Errore copia ${tableName}:`, error.message);
        return { success: false, rows: 0, error: error.message };
      }
    };

    // Esegui migrazione
    const supabaseTables = await getTableNames(supabaseDb);
    const railwayTables = await getTableNames(railwayDb);

    const tablesToMigrate = tableOrder.filter(
      (table) => supabaseTables.includes(table) && railwayTables.includes(table)
    );

    const otherTables = supabaseTables.filter(
      (table) => !tableOrder.includes(table) && railwayTables.includes(table)
    );
    tablesToMigrate.push(...otherTables);

    const stats = {
      total: tablesToMigrate.length,
      success: 0,
      failed: 0,
      totalRows: 0,
      details: [],
    };

    for (const table of tablesToMigrate) {
      const result = await copyTable(supabaseDb, railwayDb, table);
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

    // Chiudi connessioni
    await supabaseDb.$pool.end();
    await railwayDb.$pool.end();

    console.log("✅ Migrazione completata!");
    console.log(`   Tabelle migrate: ${stats.success}/${stats.total}`);
    console.log(`   Record copiati: ${stats.totalRows}`);

    res.json({
      success: true,
      message: "Migrazione completata",
      stats,
    });
  } catch (error) {
    console.error("❌ Errore durante la migrazione:", error);
    res.status(500).json({
      success: false,
      error: "Errore durante la migrazione",
      message: error.message,
    });
  }
});

module.exports = router;
