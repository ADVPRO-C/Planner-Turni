const db = require("./config/database");

async function debugNotarbartolo() {
  try {
    console.log("🔍 DEBUG STAZIONE NOTARBARTOLO");
    console.log("=".repeat(50));

    // 1. Verifica se la postazione esiste
    const postazione = await db.oneOrNone(
      "SELECT * FROM postazioni WHERE luogo ILIKE '%notarbartolo%'"
    );
    
    if (!postazione) {
      console.log("❌ PROBLEMA: Stazione Notarbartolo non trovata nel database!");
      
      // Mostra tutte le postazioni disponibili
      const tuttePostazioni = await db.any("SELECT id, luogo FROM postazioni ORDER BY luogo");
      console.log("\n📍 Postazioni disponibili nel database:");
      tuttePostazioni.forEach(p => {
        console.log(`   ID: ${p.id} - ${p.luogo}`);
      });
      return;
    }

    console.log("✅ Postazione trovata:");
    console.log("   ID:", postazione.id);
    console.log("   Luogo:", postazione.luogo);
    console.log("   Indirizzo:", postazione.indirizzo);
    console.log("   Stato:", postazione.stato);
    console.log("   Max proclamatori:", postazione.max_proclamatori);
    console.log("   Giorni settimana:", postazione.giorni_settimana);

    // 2. Verifica gli slot orari
    const slotOrari = await db.any(
      "SELECT * FROM slot_orari WHERE postazione_id = $1 ORDER BY orario_inizio",
      [postazione.id]
    );

    console.log("\n📅 Slot orari configurati:");
    if (slotOrari.length === 0) {
      console.log("❌ PROBLEMA: Nessun slot orario configurato!");
    } else {
      slotOrari.forEach(slot => {
        console.log(`   ${slot.orario_inizio} - ${slot.orario_fine} (max: ${slot.max_volontari}, stato: ${slot.stato})`);
      });
    }

    // 3. Verifica le disponibilità per agosto 2025
    const disponibilita = await db.any(`
      SELECT 
        d.data,
        d.stato,
        v.nome,
        v.cognome,
        so.orario_inizio,
        so.orario_fine
      FROM disponibilita d
      JOIN volontari v ON d.volontario_id = v.id
      JOIN slot_orari so ON d.slot_orario_id = so.id
      WHERE so.postazione_id = $1
        AND d.data BETWEEN '2025-08-01' AND '2025-08-31'
        AND d.stato = 'disponibile'
      ORDER BY d.data, so.orario_inizio
    `, [postazione.id]);

    console.log("\n👥 Disponibilità per agosto 2025:");
    if (disponibilita.length === 0) {
      console.log("❌ PROBLEMA: Nessuna disponibilità trovata per agosto 2025!");
      
      // Verifica se ci sono disponibilità in generale per questa postazione
      const disponibilitaTotali = await db.any(`
        SELECT COUNT(*) as count
        FROM disponibilita d
        JOIN slot_orari so ON d.slot_orario_id = so.id
        WHERE so.postazione_id = $1
      `, [postazione.id]);
      
      console.log(`   Disponibilità totali per questa postazione: ${disponibilitaTotali[0].count}`);
    } else {
      disponibilita.forEach(disp => {
        console.log(`   ${disp.data} ${disp.orario_inizio}-${disp.orario_fine}: ${disp.nome} ${disp.cognome}`);
      });
    }

    // 4. Verifica i volontari attivi
    const volontariAttivi = await db.one(
      "SELECT COUNT(*) as count FROM volontari WHERE stato = 'attivo'"
    );
    console.log("\n👤 Volontari attivi nel sistema:", volontariAttivi.count);

    // 5. Verifica la corrispondenza giorni settimana per le prime date di agosto
    console.log("\n📆 Verifica giorni settimana per agosto 2025:");
    const dateAgosto = [
      '2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', 
      '2025-08-05', '2025-08-06', '2025-08-07'
    ];

    for (const data of dateAgosto) {
      const dayOfWeek = await db.one(`
        SELECT CASE 
          WHEN EXTRACT(DOW FROM $1::date) = 0 THEN 1  -- Domenica
          WHEN EXTRACT(DOW FROM $1::date) = 1 THEN 2  -- Lunedì
          WHEN EXTRACT(DOW FROM $1::date) = 2 THEN 3  -- Martedì
          WHEN EXTRACT(DOW FROM $1::date) = 3 THEN 4  -- Mercoledì
          WHEN EXTRACT(DOW FROM $1::date) = 4 THEN 5  -- Giovedì
          WHEN EXTRACT(DOW FROM $1::date) = 5 THEN 6  -- Venerdì
          WHEN EXTRACT(DOW FROM $1::date) = 6 THEN 7  -- Sabato
        END as day_number
      `, [data]);

      const isActive = postazione.giorni_settimana && postazione.giorni_settimana.includes(dayOfWeek.day_number);
      console.log(`   ${data}: giorno ${dayOfWeek.day_number} - ${isActive ? '✅ ATTIVO' : '❌ NON ATTIVO'}`);
    }

    // 6. Verifica specifica per gli slot 10:00-12:00 e 15:00-17:00
    console.log("\n🕐 Verifica slot specifici (10:00-12:00 e 15:00-17:00):");
    const slotSpecifici = slotOrari.filter(slot => 
      (slot.orario_inizio === '10:00:00' && slot.orario_fine === '12:00:00') ||
      (slot.orario_inizio === '15:00:00' && slot.orario_fine === '17:00:00')
    );

    if (slotSpecifici.length === 0) {
      console.log("❌ PROBLEMA: Gli slot 10:00-12:00 e 15:00-17:00 non sono configurati!");
    } else {
      slotSpecifici.forEach(slot => {
        console.log(`   ${slot.orario_inizio}-${slot.orario_fine}: stato ${slot.stato}, max volontari: ${slot.max_volontari}`);
      });
    }

  } catch (error) {
    console.error("❌ Errore durante il debug:", error);
  } finally {
    process.exit(0);
  }
}

debugNotarbartolo();