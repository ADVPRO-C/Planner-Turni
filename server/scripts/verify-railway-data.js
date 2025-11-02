const pgp = require("pg-promise")();

const RAILWAY_URL = process.env.RAILWAY_DATABASE_URL || 
  "postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway";

const LOCAL_URL = process.env.LOCAL_DATABASE_URL || 
  "postgresql://zy0n:2vQ-i60MqwHG@localhost:5432/planner_db";

const railwayDb = pgp(RAILWAY_URL);
const localDb = pgp(LOCAL_URL);

const tables = [
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

async function getCount(db, tableName) {
  try {
    const result = await db.one(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.count, 10);
  } catch (error) {
    return -1; // -1 significa errore
  }
}

async function verifyMigration() {
  console.log("🔍 Verifica Migrazione Database Locale → Railway\n");
  console.log("=".repeat(70));
  console.log("Tabella".padEnd(25) + "Locale".padEnd(15) + "Railway".padEnd(15) + "Status");
  console.log("=".repeat(70));

  try {
    await railwayDb.connect();
    await localDb.connect();

    let allMatch = true;
    const results = [];

    for (const table of tables) {
      const localCount = await getCount(localDb, table);
      const railwayCount = await getCount(railwayDb, table);

      let status = "";
      if (localCount === -1 && railwayCount === -1) {
        status = "⚠️  Tabella non trovata in entrambi";
      } else if (localCount === -1) {
        status = "⚠️  Non in locale";
      } else if (railwayCount === -1) {
        status = "❌ Non in Railway";
        allMatch = false;
      } else if (localCount === railwayCount) {
        status = "✅ Match";
      } else {
        status = `❌ Differenza (${railwayCount - localCount})`;
        allMatch = false;
      }

      results.push({
        table,
        local: localCount,
        railway: railwayCount,
        status,
      });

      console.log(
        table.padEnd(25) +
        (localCount === -1 ? "N/A" : localCount.toString()).padEnd(15) +
        (railwayCount === -1 ? "N/A" : railwayCount.toString()).padEnd(15) +
        status
      );
    }

    console.log("=".repeat(70));

    // Riepilogo
    console.log("\n📊 Riepilogo:");
    const totalLocal = results.reduce((sum, r) => sum + (r.local === -1 ? 0 : r.local), 0);
    const totalRailway = results.reduce((sum, r) => sum + (r.railway === -1 ? 0 : r.railway), 0);

    console.log(`   Totale record locale: ${totalLocal}`);
    console.log(`   Totale record Railway: ${totalRailway}`);

    if (allMatch && totalLocal === totalRailway) {
      console.log("\n✅ Migrazione completata con successo! Tutti i dati corrispondono.");
    } else {
      console.log("\n⚠️  Attenzione: ci sono differenze tra locale e Railway.");
      console.log("\n📋 Dettagli:");
      results.forEach((r) => {
        if (r.local !== r.railway && r.local !== -1 && r.railway !== -1) {
          console.log(`   - ${r.table}: Locale=${r.local}, Railway=${r.railway}`);
        }
      });
    }

    // Verifica alcuni dati specifici
    console.log("\n🔍 Verifica dati specifici:");
    
    try {
      const localCongregazioni = await localDb.any("SELECT id, nome FROM congregazioni ORDER BY id");
      const railwayCongregazioni = await railwayDb.any("SELECT id, nome FROM congregazioni ORDER BY id");
      
      console.log("\n   Congregazioni:");
      console.log(`   Locale: ${localCongregazioni.map(c => `${c.nome} (ID: ${c.id})`).join(", ")}`);
      console.log(`   Railway: ${railwayCongregazioni.map(c => `${c.nome} (ID: ${c.id})`).join(", ")}`);
      
      if (localCongregazioni.length === railwayCongregazioni.length) {
        console.log("   ✅ Congregazioni corrispondono");
      } else {
        console.log("   ❌ Le congregazioni non corrispondono");
      }
    } catch (error) {
      console.log(`   ⚠️  Errore nella verifica congregazioni: ${error.message}`);
    }

    await railwayDb.$pool.end();
    await localDb.$pool.end();

    process.exit(allMatch && totalLocal === totalRailway ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Errore durante la verifica:", error);
    await railwayDb.$pool.end();
    await localDb.$pool.end();
    process.exit(1);
  }
}

verifyMigration();

