const db = require("./config/database");

async function fixNotarbartolo() {
  try {
    console.log("🔧 RISOLUZIONE PROBLEMA STAZIONE NOTARBARTOLO");
    console.log("=".repeat(50));

    // 1. Verifica se la postazione esiste
    let postazione = await db.oneOrNone(
      "SELECT * FROM postazioni WHERE luogo ILIKE '%notarbartolo%'"
    );

    if (!postazione) {
      console.log("📍 Creazione Stazione Notarbartolo...");
      
      // Crea la postazione
      postazione = await db.one(`
        INSERT INTO postazioni (luogo, indirizzo, giorni_settimana, stato, max_proclamatori)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'Stazione Notarbartolo',
        'Via Notarbartolo, Palermo',
        [1, 2, 3, 4, 5, 6, 7], // Tutti i giorni della settimana
        'attiva',
        3
      ]);

      console.log(`✅ Postazione creata con ID: ${postazione.id}`);
    } else {
      console.log(`✅ Postazione trovata: ${postazione.luogo} (ID: ${postazione.id})`);
      
      // Verifica se è attiva
      if (postazione.stato !== 'attiva') {
        await db.none("UPDATE postazioni SET stato = 'attiva' WHERE id = $1", [postazione.id]);
        console.log("✅ Postazione riattivata");
      }
    }

    // 2. Verifica e crea gli slot orari necessari
    const slotsEsistenti = await db.any(
      "SELECT * FROM slot_orari WHERE postazione_id = $1",
      [postazione.id]
    );

    console.log(`📅 Slot orari esistenti: ${slotsEsistenti.length}`);

    // Slot orari richiesti
    const slotsRichiesti = [
      { orario_inizio: '10:00', orario_fine: '12:00', max_volontari: 3 },
      { orario_inizio: '15:00', orario_fine: '17:00', max_volontari: 3 }
    ];

    for (const slotRichiesto of slotsRichiesti) {
      const slotEsiste = slotsEsistenti.find(s => 
        s.orario_inizio === slotRichiesto.orario_inizio + ':00' &&
        s.orario_fine === slotRichiesto.orario_fine + ':00'
      );

      if (!slotEsiste) {
        await db.none(`
          INSERT INTO slot_orari (postazione_id, orario_inizio, orario_fine, max_volontari, stato)
          VALUES ($1, $2, $3, $4, 'attivo')
        `, [
          postazione.id,
          slotRichiesto.orario_inizio,
          slotRichiesto.orario_fine,
          slotRichiesto.max_volontari
        ]);
        console.log(`✅ Slot ${slotRichiesto.orario_inizio}-${slotRichiesto.orario_fine} creato`);
      } else if (slotEsiste.stato !== 'attivo') {
        await db.none("UPDATE slot_orari SET stato = 'attivo' WHERE id = $1", [slotEsiste.id]);
        console.log(`✅ Slot ${slotRichiesto.orario_inizio}-${slotRichiesto.orario_fine} riattivato`);
      } else {
        console.log(`✅ Slot ${slotRichiesto.orario_inizio}-${slotRichiesto.orario_fine} già attivo`);
      }
    }

    // 3. Verifica volontari attivi
    const volontariAttivi = await db.one("SELECT COUNT(*) as count FROM volontari WHERE stato = 'attivo'");
    console.log(`👤 Volontari attivi nel sistema: ${volontariAttivi.count}`);

    if (volontariAttivi.count === 0) {
      console.log("⚠️  ATTENZIONE: Nessun volontario attivo nel sistema!");
      console.log("   Per vedere disponibilità, i volontari devono:");
      console.log("   1. Essere registrati e attivi");
      console.log("   2. Inserire le loro disponibilità per agosto 2025");
    }

    // 4. Verifica disponibilità esistenti per agosto 2025
    const disponibilita = await db.any(`
      SELECT COUNT(*) as count
      FROM disponibilita d
      JOIN slot_orari so ON d.slot_orario_id = so.id
      WHERE so.postazione_id = $1
        AND d.data BETWEEN '2025-08-01' AND '2025-08-31'
        AND d.stato = 'disponibile'
    `, [postazione.id]);

    console.log(`📅 Disponibilità per agosto 2025: ${disponibilita[0].count}`);

    if (disponibilita[0].count === 0) {
      console.log("💡 SOLUZIONE: I volontari devono inserire le loro disponibilità");
      console.log("   Vai su 'Gestione Disponibilità' e aggiungi disponibilità per agosto 2025");
    }

    console.log("\n🎉 RISOLUZIONE COMPLETATA!");
    console.log("La Stazione Notarbartolo è ora configurata correttamente.");
    
  } catch (error) {
    console.error("❌ Errore durante la risoluzione:", error);
  } finally {
    process.exit(0);
  }
}

fixNotarbartolo();