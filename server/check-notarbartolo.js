const db = require("./config/database");

async function checkNotarbartolo() {
  try {
    console.log("🔍 VERIFICA STAZIONE NOTARBARTOLO");
    console.log("=".repeat(40));

    // 1. Cerca tutte le postazioni per vedere cosa c'è
    console.log("📍 Tutte le postazioni nel database:");
    const tuttePostazioni = await db.any("SELECT id, luogo, stato FROM postazioni ORDER BY luogo");
    tuttePostazioni.forEach(p => {
      console.log(`   ID: ${p.id} - ${p.luogo} (${p.stato})`);
    });

    // 2. Cerca specificamente Notarbartolo
    const notarbartolo = await db.oneOrNone(
      "SELECT * FROM postazioni WHERE luogo ILIKE '%notarbartolo%'"
    );

    if (!notarbartolo) {
      console.log("\n❌ Stazione Notarbartolo NON TROVATA");
      return;
    }

    console.log("\n✅ Stazione Notarbartolo TROVATA:");
    console.log(`   ID: ${notarbartolo.id}`);
    console.log(`   Luogo: ${notarbartolo.luogo}`);
    console.log(`   Stato: ${notarbartolo.stato}`);
    console.log(`   Giorni settimana: ${JSON.stringify(notarbartolo.giorni_settimana)}`);

    // 3. Verifica slot orari
    console.log("\n📅 Slot orari per Notarbartolo:");
    const slots = await db.any(
      "SELECT * FROM slot_orari WHERE postazione_id = $1 ORDER BY orario_inizio",
      [notarbartolo.id]
    );

    if (slots.length === 0) {
      console.log("   ❌ Nessun slot orario configurato!");
    } else {
      slots.forEach(slot => {
        console.log(`   ${slot.orario_inizio} - ${slot.orario_fine} (max: ${slot.max_volontari}, stato: ${slot.stato})`);
      });
    }

    // 4. Verifica disponibilità agosto 2025
    console.log("\n👥 Disponibilità agosto 2025:");
    const disponibilita = await db.any(`
      SELECT COUNT(*) as count
      FROM disponibilita d
      JOIN slot_orari so ON d.slot_orario_id = so.id
      WHERE so.postazione_id = $1
        AND d.data BETWEEN '2025-08-01' AND '2025-08-31'
        AND d.stato = 'disponibile'
    `, [notarbartolo.id]);

    console.log(`   Disponibilità trovate: ${disponibilita[0].count}`);

    // 5. Verifica volontari attivi
    const volontariAttivi = await db.one("SELECT COUNT(*) as count FROM volontari WHERE stato = 'attivo'");
    console.log(`\n👤 Volontari attivi nel sistema: ${volontariAttivi.count}`);

  } catch (error) {
    console.error("❌ Errore:", error.message);
  } finally {
    process.exit(0);
  }
}

checkNotarbartolo();