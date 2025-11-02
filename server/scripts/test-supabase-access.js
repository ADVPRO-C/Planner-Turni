const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://wwcgryzbgvxfviwcjnkg.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3Y2dyeXpiZ3Z4ZnZpd2NqbmtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIyMzE3OSwiZXhwIjoyMDY4Nzk5MTc5fQ.1zswlKLQHWN9MdMirMCwp80cLp3Qv7-hywX0lkCTdYM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testTables() {
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

  console.log("🔍 Test accesso tabelle Supabase via REST API\n");
  console.log("=".repeat(60));

  for (const table of tables) {
    try {
      // Prova con select semplice
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: false })
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        if (error.code) {
          console.log(`   Codice errore: ${error.code}`);
        }
      } else {
        // Ottieni il conteggio totale
        const { count: totalCount } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        
        console.log(`✅ ${table}: accessibile (${totalCount || 0} record)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n💡 Soluzione alternativa:");
  console.log("Se le tabelle non sono accessibili, prova:");
  console.log("1. Vai su Supabase Dashboard → Database → API");
  console.log("2. Verifica che le tabelle siano esposte via PostgREST");
  console.log("3. Oppure usa pg_dump via SSH tunnel o backup SQL");
}

testTables().then(() => process.exit(0)).catch(console.error);

