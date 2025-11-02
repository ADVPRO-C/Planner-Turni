const db = require("../config/database");

async function createNovembreDisponibilita() {
  try {
    console.log("🚀 Creazione disponibilità per novembre 2025...");

    // Ottieni volontari della congregazione 001
    const volontari = await db.any(
      "SELECT id, nome, cognome, sesso FROM volontari WHERE congregazione_id = 1 AND stato = 'attivo' ORDER BY id"
    );

    // Ottieni slot orari della congregazione 001
    const slotOrari = await db.any(
      "SELECT id, postazione_id, orario_inizio, orario_fine FROM slot_orari WHERE congregazione_id = 1 AND stato = 'attivo' ORDER BY postazione_id, orario_inizio"
    );

    console.log(`📋 Trovati ${volontari.length} volontari e ${slotOrari.length} slot orari`);

    // Genera tutte le date di novembre 2025
    const dateNovembre = [];
    for (let day = 1; day <= 30; day++) {
      dateNovembre.push(`2025-11-${String(day).padStart(2, "0")}`);
    }

    const disponibilita = [];
    const congregazioneId = 1;

    // Per ogni data
    for (const data of dateNovembre) {
      const dateObj = new Date(data);
      const giornoSettimana = dateObj.getDay(); // 0 = domenica, 6 = sabato

      // Per ogni slot orario
      for (const slot of slotOrari) {
        // Determina quanti volontari rendere disponibili per questo slot in questo giorno
        // Varietà: alcuni giorni più disponibilità, altri meno
        let numVolontari = 0;

        // Pattern realistico:
        // - Weekend (sabato/domenica): più disponibilità (5-8 volontari)
        // - Giorni feriali: disponibilità media (3-6 volontari)
        // - Alcuni slot mattutini: più disponibilità
        // - Alcuni slot pomeridiani: meno disponibilità

        if (giornoSettimana === 0 || giornoSettimana === 6) {
          // Weekend
          numVolontari = slot.orario_inizio <= "12:00:00" ? 7 : 5;
        } else {
          // Feriali
          numVolontari = slot.orario_inizio <= "12:00:00" ? 5 : 3;
        }

        // Varia leggermente per rendere più realistico
        const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, o 1
        numVolontari = Math.max(2, Math.min(volontari.length, numVolontari + variation));

        // Seleziona volontari casuali per questo slot
        const volontariDisponibili = [...volontari]
          .sort(() => Math.random() - 0.5)
          .slice(0, numVolontari);

        // Crea disponibilità per questi volontari
        for (const volontario of volontariDisponibili) {
          disponibilita.push({
            volontario_id: volontario.id,
            slot_orario_id: slot.id,
            congregazione_id: congregazioneId,
            data: data,
            stato: "disponibile",
            note: null,
          });
        }
      }
    }

    console.log(`📝 Creazione di ${disponibilita.length} disponibilità...`);

    // Inserisci le disponibilità in batch
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < disponibilita.length; i += batchSize) {
      const batch = disponibilita.slice(i, i + batchSize);

      await db.tx(async (t) => {
        for (const disp of batch) {
          try {
            await t.none(
              `INSERT INTO disponibilita (volontario_id, slot_orario_id, congregazione_id, data, stato, note)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (volontario_id, data, slot_orario_id) DO NOTHING`,
              [
                disp.volontario_id,
                disp.slot_orario_id,
                disp.congregazione_id,
                disp.data,
                disp.stato,
                disp.note,
              ]
            );
            inserted++;
          } catch (err) {
            // Ignora errori di duplicati
            if (err.code !== "23505") {
              console.error("Errore inserimento:", err);
            }
          }
        }
      });

      if ((i + batchSize) % 500 === 0 || i + batchSize >= disponibilita.length) {
        console.log(`   Inserite ${Math.min(i + batchSize, disponibilita.length)}/${disponibilita.length} disponibilità...`);
      }
    }

    console.log(`✅ Completato! Inserite ${inserted} disponibilità per novembre 2025`);

    // Statistiche
    const stats = await db.one(
      `SELECT 
        COUNT(*) as totale,
        COUNT(DISTINCT volontario_id) as volontari,
        COUNT(DISTINCT data) as giorni,
        COUNT(DISTINCT slot_orario_id) as slot
       FROM disponibilita 
       WHERE data >= '2025-11-01' AND data <= '2025-11-30' 
       AND congregazione_id = $1`,
      [congregazioneId]
    );

    console.log("\n📊 Statistiche:");
    console.log(`   Totale disponibilità: ${stats.totale}`);
    console.log(`   Volontari con disponibilità: ${stats.volontari}`);
    console.log(`   Giorni coperti: ${stats.giorni}`);
    console.log(`   Slot orari utilizzati: ${stats.slot}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Errore:", error);
    process.exit(1);
  }
}

createNovembreDisponibilita();
