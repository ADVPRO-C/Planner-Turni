const pgp = require("pg-promise")();
const fs = require("fs");
const path = require("path");

// Connection strings
const SUPABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const RAILWAY_URL = process.env.RAILWAY_DATABASE_URL;

if (!SUPABASE_URL) {
  console.error("❌ SUPABASE_DATABASE_URL o DATABASE_URL non configurata");
  console.log("💡 Imposta SUPABASE_DATABASE_URL con la connection string di Supabase");
  process.exit(1);
}

if (!RAILWAY_URL) {
  console.error("❌ RAILWAY_DATABASE_URL non configurata");
  console.log("💡 Imposta RAILWAY_DATABASE_URL con la connection string di Railway");
  process.exit(1);
}

// Configurazione pg-promise con SSL per Supabase
const dns = require("dns");
const { promisify } = require("util");
const dnsLookup = promisify(dns.lookup);

// IP IPv6 di Supabase (risolto manualmente con comando 'host')
// Se il DNS di Node.js non funziona, usiamo direttamente l'IP
const SUPABASE_IPV6 = "2a05:d01c:30c:9d20:9e8b:bfe9:f009:3247";

// Funzione per risolvere hostname
async function resolveHostname(hostname) {
  try {
    // Prova prima IPv6
    const addr6 = await dnsLookup(hostname, { family: 6 });
    console.log(`✅ Risolto ${hostname} -> ${addr6} (IPv6)`);
    return addr6;
  } catch (err6) {
    // Se Node.js DNS fallisce, usa l'IP che abbiamo trovato manualmente
    if (hostname === "db.wwcgryzbgvxfviwcjnkg.supabase.co") {
      console.log(`⚠️ DNS Node.js fallito, uso IP IPv6 noto: ${SUPABASE_IPV6}`);
      return SUPABASE_IPV6;
    }
    try {
      // Fallback IPv4
      const addr4 = await dnsLookup(hostname, { family: 4 });
      console.log(`✅ Risolto ${hostname} -> ${addr4} (IPv4)`);
      return addr4;
    } catch (err4) {
      // Se anche IPv4 fallisce ma è Supabase, usa IP noto
      if (hostname === "db.wwcgryzbgvxfviwcjnkg.supabase.co") {
        console.log(`⚠️ DNS Node.js fallito, uso IP IPv6 noto: ${SUPABASE_IPV6}`);
        return SUPABASE_IPV6;
      }
      console.error(`❌ Impossibile risolvere ${hostname}`);
      throw err4;
    }
  }
}

// Estrai hostname dalla connection string
const urlMatch = SUPABASE_URL.match(/@([^:]+):(\d+)/);
const supabaseHostname = urlMatch ? urlMatch[1] : null;

// Risolvi hostname e costruisci config
async function getSupabaseConfig() {
  let resolvedIP = SUPABASE_IPV6; // Usa IP noto di default
  
  if (supabaseHostname) {
    try {
      const resolved = await resolveHostname(supabaseHostname);
      if (resolved) {
        resolvedIP = resolved;
      }
    } catch (error) {
      console.log(`⚠️ Usando IP IPv6 noto: ${SUPABASE_IPV6}`);
    }
  }

  // Costruisci configurazione con IP diretto (non connection string)
  // Parse della connection string originale per estrarre credenziali
  const url = new URL(SUPABASE_URL.replace('postgresql://', 'http://'));
  const port = url.port || '5432';
  const database = url.pathname.slice(1) || 'postgres';
  
  console.log(`📡 Configurazione Supabase con IP IPv6: ${resolvedIP}:${port}/${database}`);

  return {
    host: resolvedIP,
    port: parseInt(port, 10),
    database: database,
    user: url.username || 'postgres',
    password: url.password || '',
    ssl: { rejectUnauthorized: false },
    // Lookup che ritorna direttamente l'IP senza fare DNS
    lookup: (hostname, options, callback) => {
      // Se è l'hostname di Supabase, ritorna direttamente l'IP
      if (hostname === supabaseHostname || hostname.includes(supabaseHostname) || hostname.replace(/[\[\]]/g, '') === resolvedIP) {
        callback(null, resolvedIP, 6);
        return;
      }
      // Se è già un IP, ritornalo
      const cleanHostname = hostname.replace(/[\[\]]/g, '');
      if (cleanHostname === resolvedIP) {
        callback(null, resolvedIP, 6);
        return;
      }
      // Altrimenti lookup normale
      dns.lookup(hostname, { family: 0 }, callback);
    },
  };
}

// Creiamo le connessioni dopo aver risolto l'IP
const supabaseConfigPromise = getSupabaseConfig();
let supabaseDb, railwayDb;

// Ordine delle tabelle per rispettare le foreign keys
// Le tabelle senza dipendenze vengono copiate per prime
const tableOrder = [
  "congregazioni",             // Nessuna dipendenza - BASE
  "volontari",                 // Dipende da congregazioni
  "postazioni",                // Dipende da congregazioni
  "slot_orari",                // Dipende da postazioni, congregazioni
  "disponibilita",             // Dipende da volontari, slot_orari, congregazioni
  "assegnazioni",              // Dipende da postazioni, slot_orari, congregazioni
  "assegnazioni_volontari",    // Dipende da assegnazioni, volontari, congregazioni
  "notifiche",                 // Dipende da volontari (destinatario_id)
  "notifications",             // Tabella alternativa per notifiche (se esiste)
  // Aggiungi altre tabelle se esistono:
  // "esperienze",            // Se esiste: dipende da volontari, postazioni, slot_orari
  // "documenti",             // Se esiste: potrebbe dipendere da congregazioni
  // "cronologia",            // Se esiste
];

async function getTableNames(db) {
  const tables = await db.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  return tables.map((t) => t.tablename);
}

async function getTableRowCount(db, tableName) {
  try {
    const result = await db.one(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.count, 10);
  } catch (error) {
    console.warn(`⚠️  Impossibile contare righe in ${tableName}:`, error.message);
    return 0;
  }
}

async function copyTable(sourceDb, targetDb, tableName) {
  try {
    console.log(`\n📋 Copia tabella: ${tableName}`);
    
    // Conta righe sorgente
    const sourceCount = await getTableRowCount(sourceDb, tableName);
    console.log(`   📊 Righe sorgente: ${sourceCount}`);
    
    if (sourceCount === 0) {
      console.log(`   ⏭️  Tabella vuota, skip...`);
      return { success: true, rows: 0 };
    }

    // Verifica se la tabella esiste nella destinazione
    const tableExists = await targetDb.oneOrNone(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);

    if (!tableExists.exists) {
      console.log(`   ⚠️  Tabella ${tableName} non esiste nella destinazione, skip...`);
      return { success: false, rows: 0, error: "Table does not exist" };
    }

    // Disabilita temporaneamente foreign keys per evitare problemi
    await targetDb.none("SET session_replication_role = 'replica';");

    // Leggi tutti i dati dalla sorgente
    const data = await sourceDb.any(`SELECT * FROM ${tableName}`);
    console.log(`   📥 Letti ${data.length} record da Supabase`);

    if (data.length === 0) {
      await targetDb.none("SET session_replication_role = 'origin';");
      return { success: true, rows: 0 };
    }

    // Prendi i nomi delle colonne
    const columns = Object.keys(data[0]);
    const columnsStr = columns.map((c) => `"${c}"`).join(", ");
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

    // Query di inserimento
    const insertQuery = `
      INSERT INTO ${tableName} (${columnsStr})
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING;
    `;

    // Inserisci i dati in batch per performance
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      for (const row of batch) {
        const values = columns.map((col) => row[col]);
        try {
          await targetDb.none(insertQuery, values);
          inserted++;
        } catch (error) {
          // Ignora errori di duplicati
          if (error.code !== "23505") {
            console.error(`   ❌ Errore inserimento record:`, error.message);
          }
        }
      }
      
      if (i + batchSize < data.length) {
        process.stdout.write(`   ⏳ Inseriti ${inserted}/${data.length} record...\r`);
      }
    }

    // Riabilita foreign keys
    await targetDb.none("SET session_replication_role = 'origin';");

    // Verifica conteggio finale
    const targetCount = await getTableRowCount(targetDb, tableName);
    console.log(`   ✅ Copiati ${inserted} record (${targetCount} totali in Railway)`);

    return { success: true, rows: inserted };
  } catch (error) {
    console.error(`   ❌ Errore nella copia di ${tableName}:`, error.message);
    return { success: false, rows: 0, error: error.message };
  }
}

async function migrateDatabase() {
  console.log("🚀 Inizio migrazione da Supabase a Railway PostgreSQL\n");
  console.log("=" .repeat(60));

  try {
    // Risolvi configurazione Supabase e crea connessioni
    console.log("\n🔍 Risoluzione hostname Supabase...");
    const supabaseConfig = await supabaseConfigPromise;
    supabaseDb = pgp(supabaseConfig);
    railwayDb = pgp(RAILWAY_URL);

    // Test connessioni
    console.log("\n🔌 Test connessioni...");
    await supabaseDb.connect();
    console.log("✅ Connesso a Supabase");
    
    await railwayDb.connect();
    console.log("✅ Connesso a Railway PostgreSQL");

    // Ottieni lista tabelle
    console.log("\n📋 Elenco tabelle...");
    const supabaseTables = await getTableNames(supabaseDb);
    const railwayTables = await getTableNames(railwayDb);
    
    console.log(`   Supabase: ${supabaseTables.length} tabelle`);
    console.log(`   Railway: ${railwayTables.length} tabelle`);

    // Verifica che le tabelle esistano in entrambi i database
    const tablesToMigrate = tableOrder.filter(
      (table) => supabaseTables.includes(table) && railwayTables.includes(table)
    );

    // Aggiungi tabelle non nell'ordine specificato
    const otherTables = supabaseTables.filter(
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
    };

    // Copia ogni tabella
    for (const table of tablesToMigrate) {
      const result = await copyTable(supabaseDb, railwayDb, table);
      
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
    console.log("\n✅ Migrazione completata!");

    // Chiudi connessioni
    await supabaseDb.$pool.end();
    await railwayDb.$pool.end();
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Errore durante la migrazione:", error);
    await supabaseDb.$pool.end();
    await railwayDb.$pool.end();
    process.exit(1);
  }
}

// Esegui migrazione
migrateDatabase();

