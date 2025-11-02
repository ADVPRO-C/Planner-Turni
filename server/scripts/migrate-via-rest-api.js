const { createClient } = require("@supabase/supabase-js");
const pgp = require("pg-promise")();

// Configurazione
const SUPABASE_URL = process.env.SUPABASE_URL || "https://wwcgryzbgvxfviwcjnkg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3Y2dyeXpiZ3Z4ZnZpd2NqbmtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIyMzE3OSwiZXhwIjoyMDY4Nzk5MTc5fQ.1zswlKLQHWN9MdMirMCwp80cLp3Qv7-hywX0lkCTdYM";
const RAILWAY_URL = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;

if (!SUPABASE_URL) {
  console.error("❌ SUPABASE_URL non configurata");
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌ SUPABASE_SERVICE_KEY non configurata");
  process.exit(1);
}

if (!RAILWAY_URL) {
  console.error("❌ RAILWAY_DATABASE_URL o DATABASE_URL non configurata");
  process.exit(1);
}

// Inizializza Supabase client (usa service role per accesso completo)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Connessione Railway
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

// Funzione per leggere tutti i dati da una tabella Supabase (con paginazione)
async function fetchAllFromSupabase(tableName) {
  console.log(`📥 Lettura dati da Supabase: ${tableName}...`);
  
  const allData = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    try {
      // Usa l'approccio diretto con API REST
      // Con service_role key, possiamo bypassare RLS
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .range(offset, offset + pageSize - 1);

      if (error) {
        // Se la tabella non è esposta via PostgREST, prova con query SQL tramite RPC
        if (
          error.code === "PGRST116" ||
          error.message.includes("Could not find the table") ||
          error.message.includes("schema cache")
        ) {
          console.log(`   ⚠️  Tabella ${tableName} non esposta via PostgREST, provo query SQL diretta...`);
          
          // Prova con query SQL diretta tramite RPC (se disponibile)
          try {
            const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
              query: `SELECT * FROM ${tableName} LIMIT ${pageSize} OFFSET ${offset}`
            });
            
            if (sqlError) {
              console.log(`   ⚠️  Query SQL non disponibile: ${sqlError.message}`);
              return [];
            }
            
            if (sqlData && sqlData.length > 0) {
              allData.push(...sqlData);
              console.log(`   ✅ Letti ${allData.length} record via SQL (continuo...)`);
              offset += pageSize;
              if (sqlData.length < pageSize) {
                hasMore = false;
              }
            } else {
              hasMore = false;
            }
            continue;
          } catch (rpcError) {
            console.log(`   ⚠️  Impossibile accedere alla tabella ${tableName}: potrebbe non essere esposta via API`);
            return [];
          }
        }
        
        if (
          error.code === "42P01" || 
          error.message.includes("does not exist") ||
          error.message.includes("relation")
        ) {
          console.log(`   ⚠️  Tabella ${tableName} non esiste: ${error.message}`);
          return [];
        }
        throw error;
      }

      if (data && data.length > 0) {
        allData.push(...data);
        console.log(`   ✅ Letti ${allData.length} record (continuo...)`);
        
        // Se abbiamo meno di pageSize record, abbiamo finito
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          offset += pageSize;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      if (
        error.code === "42P01" || 
        error.message.includes("does not exist") ||
        error.message.includes("relation") ||
        error.code === "PGRST116"
      ) {
        console.log(`   ⚠️  Tabella ${tableName} non accessibile: ${error.message}`);
        return [];
      }
      console.error(`   ❌ Errore nella lettura:`, error.message);
      throw error;
    }
  }

  console.log(`   ✅ Totale record letti: ${allData.length}`);
  return allData;
}

// Funzione per inserire dati in Railway
async function insertIntoRailway(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`   ⏭️  Nessun dato da inserire per ${tableName}`);
    return { success: true, rows: 0 };
  }

  console.log(`📝 Inserimento in Railway: ${tableName} (${data.length} record)...`);

  // Prendi le colonne dal primo record
  const columns = Object.keys(data[0]);
  const columnsStr = columns.map((c) => `"${c}"`).join(", ");
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

  const insertQuery = `
    INSERT INTO ${tableName} (${columnsStr})
    VALUES (${placeholders})
    ON CONFLICT (id) DO NOTHING;
  `;

  let inserted = 0;
  const batchSize = 100;

  // Disabilita foreign keys temporaneamente
  await railwayDb.none("SET session_replication_role = 'replica';");

  try {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      for (const row of batch) {
        const values = columns.map((col) => row[col]);
        try {
          await railwayDb.none(insertQuery, values);
          inserted++;
        } catch (error) {
          // Ignora duplicati
          if (error.code !== "23505") {
            console.error(`   ⚠️  Errore inserimento record:`, error.message);
          }
        }
      }

      if (i + batchSize < data.length) {
        process.stdout.write(`   ⏳ Inseriti ${inserted}/${data.length}...\r`);
      }
    }

    console.log(`   ✅ Inseriti ${inserted}/${data.length} record`);
  } catch (error) {
    console.error(`   ❌ Errore nell'inserimento:`, error.message);
    throw error;
  } finally {
    // Riabilita foreign keys
    await railwayDb.none("SET session_replication_role = 'origin';");
  }

  return { success: true, rows: inserted };
}

// Migrazione principale
async function migrateViaRestAPI() {
  console.log("🚀 Migrazione Supabase → Railway via REST API");
  console.log("=".repeat(60));
  console.log(`\n📡 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📡 Railway Database: ${RAILWAY_URL.split("@")[1] || "configurato"}\n`);

  try {
    // Test connessione Railway
    console.log("🔌 Test connessione Railway...");
    await railwayDb.connect();
    console.log("✅ Connesso a Railway PostgreSQL\n");

    // Ottieni lista tabelle da Railway
    const railwayTables = await railwayDb.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    const railwayTableNames = railwayTables.map((t) => t.tablename);
    console.log(`📋 Tabelle disponibili in Railway: ${railwayTableNames.length}`);
    railwayTableNames.forEach((t) => console.log(`   - ${t}`));
    console.log();

    // Filtra solo tabelle che esistono in Railway
    const tablesToMigrate = tableOrder.filter((table) =>
      railwayTableNames.includes(table)
    );

    // Aggiungi altre tabelle trovate
    const otherTables = railwayTableNames.filter(
      (table) => !tableOrder.includes(table)
    );
    tablesToMigrate.push(...otherTables);

    console.log(`📦 Tabelle da migrare: ${tablesToMigrate.length}\n`);

    const stats = {
      total: tablesToMigrate.length,
      success: 0,
      failed: 0,
      totalRows: 0,
      details: [],
    };

    // Migra ogni tabella
    for (const table of tablesToMigrate) {
      try {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`📋 Tabella: ${table}`);
        console.log("=".repeat(60));

        // Leggi da Supabase
        const data = await fetchAllFromSupabase(table);

        if (data.length === 0) {
          console.log(`   ⏭️  Tabella vuota, skip...`);
          stats.details.push({ table, success: true, rows: 0 });
          stats.success++;
          continue;
        }

        // Inserisci in Railway
        const result = await insertIntoRailway(table, data);

        stats.details.push({
          table,
          success: result.success,
          rows: result.rows,
        });

        if (result.success) {
          stats.success++;
          stats.totalRows += result.rows;
        } else {
          stats.failed++;
        }
      } catch (error) {
        console.error(`\n❌ Errore nella migrazione di ${table}:`, error.message);
        stats.failed++;
        stats.details.push({
          table,
          success: false,
          rows: 0,
          error: error.message,
        });
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

    await railwayDb.$pool.end();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Errore durante la migrazione:", error);
    await railwayDb.$pool.end();
    process.exit(1);
  }
}

// Esegui migrazione
migrateViaRestAPI();

