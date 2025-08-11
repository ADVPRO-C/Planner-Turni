const db = require("./config/database");

async function setupDatabase() {
  try {
    console.log("🔧 SETUP DATABASE E RISOLUZIONE NOTARBARTOLO");
    console.log("=".repeat(50));

    // Test connessione database
    await db.connect();
    console.log("✅ Connessione database riuscita");

    // 1. Verifica se le tabelle esistono
    const tabelle = await db.any(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`📊 Tabelle trovate: ${tabelle.length}`);
    
    if (tabelle.length === 0) {
      console.log("❌ Database vuoto - esegui prima: npm run init-db");
      return;
    }

    // 2. Verifica/Crea Stazione Notarbartolo
    let notarbartolo = await db.oneOrNone(
      "SELECT * FROM postazioni WHERE luogo ILIKE '%notarbartolo%'"
    );

    if (!notarbartolo) {
      console.log("📍 Creazione Stazione Notarbartolo...");
      
      notarbartolo = await db.one(`
        INSERT INTO postazioni (luogo, indirizzo, giorni_settimana, stato, max_proclamatori)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'Stazione Notarbartolo',
        'Via Notarbartolo, Palermo',
        [1, 2, 3, 4, 5, 6, 7],
        'attiva',
        3
      ]);
      
      console.log(`✅ Postazione creata: ID ${notarbartolo.id}`);
    } else {
      console.log(`✅ Postazione esistente: ${notarbartolo.luogo}`);
    }

    // 3. Verifica/Crea slot orari
    const slotsRichiesti = [
      { inizio: '10:00:00', fine: '12:00:00' },
      { inizio: '15:00:00', fine: '17:00:00' }
    ];

    for (const slot of slotsRichiesti) {
      const esistente = await db.oneOrNone(`
        SELECT * FROM slot_orari 
        WHERE postazione_id = $1 AND orario_inizio = $2 AND orario_fine = $3
      `, [notarbartolo.id, slot.inizio, slot.fine]);

      if (!esistente) {
        await db.none(`
          INSERT INTO slot_orari (postazione_id, orario_inizio, orario_fine, max_volontari, stato)
          VALUES ($1, $2, $3, $4, $5)
        `, [notarbartolo.id, slot.inizio, slot.fine, 3, 'attivo']);
        
        console.log(`✅ Slot ${slot.inizio.slice(0,5)}-${slot.fine.slice(0,5)} creato`);
      } else {
        console.log(`✅ Slot ${slot.inizio.slice(0,5)}-${slot.fine.slice(0,5)} esistente`);
      }
    }

    // 4. Verifica volontari
    const volontari = await db.one("SELECT COUNT(*) as count FROM volontari");
    console.log(`👤 Volontari nel sistema: ${volontari.count}`);

    // 5. Crea volontario di test se non esistono
    if (volontari.count === 0) {
      await db.none(`
        INSERT INTO volontari (nome, cognome, email, telefono, stato)
        VALUES ($1, $2, $3, $4, $5)
      `, ['Mario', 'Rossi', 'mario.rossi@test.com', '123456789', 'attivo']);
      
      console.log("✅ Volontario di test creato");
    }

    // 6. Crea disponibilità di test per agosto 2025
    const volontarioTest = await db.one("SELECT id FROM volontari LIMIT 1");
    const slotNotarbartolo = await db.any(
      "SELECT id FROM slot_orari WHERE postazione_id = $1",
      [notarbartolo.id]
    );

    // Aggiungi alcune disponibilità per agosto 2025
    const dateTest = ['2025-08-01', '2025-08-02', '2025-08-03'];
    
    for (const data of dateTest) {
      for (const slot of slotNotarbartolo) {
        const esisteDisp = await db.oneOrNone(`
          SELECT id FROM disponibilita 
          WHERE volontario_id = $1 AND slot_orario_id = $2 AND data = $3
        `, [volontarioTest.id, slot.id, data]);

        if (!esisteDisp) {
          await db.none(`
            INSERT INTO disponibilita (volontario_id, slot_orario_id, data, stato)
            VALUES ($1, $2, $3, $4)
          `, [volontarioTest.id, slot.id, data, 'disponibile']);
        }
      }
    }

    console.log("✅ Disponibilità di test create per agosto 2025");

    console.log("\n🎉 SETUP COMPLETATO!");
    console.log("La Stazione Notarbartolo è ora configurata e funzionante.");
    console.log("Riavvia l'applicazione con: npm run dev");

  } catch (error) {
    console.error("❌ Errore:", error.message);
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log("\n💡 SOLUZIONE:");
      console.log("1. Installa PostgreSQL: brew install postgresql@14");
      console.log("2. Avvia PostgreSQL: brew services start postgresql@14");
      console.log("3. Inizializza database: npm run init-db");
      console.log("4. Riprova questo script");
    }
  } finally {
    process.exit(0);
  }
}

setupDatabase();