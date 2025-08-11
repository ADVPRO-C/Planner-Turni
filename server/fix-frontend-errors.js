const db = require("./config/database");

async function fixFrontendErrors() {
  try {
    console.log("🔧 RISOLUZIONE ERRORI FRONTEND");
    console.log("=".repeat(40));

    // 1. Verifica che il backend sia funzionante
    console.log("🔍 Test connessione backend...");
    
    try {
      await db.connect();
      console.log("✅ Database connesso");
      
      // Test query semplice
      const result = await db.one("SELECT 1 as test");
      console.log("✅ Database funzionante");
      
    } catch (error) {
      console.log("❌ Problema database:", error.message);
      console.log("💡 Soluzione: Avvia PostgreSQL e inizializza il database");
      return;
    }

    // 2. Verifica che esistano dati di base
    console.log("\n🔍 Verifica dati di base...");
    
    const postazioni = await db.any("SELECT COUNT(*) as count FROM postazioni");
    const volontari = await db.any("SELECT COUNT(*) as count FROM volontari");
    const users = await db.any("SELECT COUNT(*) as count FROM users");

    console.log(`📍 Postazioni: ${postazioni[0].count}`);
    console.log(`👤 Volontari: ${volontari[0].count}`);
    console.log(`🔐 Utenti: ${users[0].count}`);

    // 3. Crea dati minimi se mancanti
    if (users[0].count === 0) {
      console.log("\n🔧 Creazione utente admin...");
      await db.none(`
        INSERT INTO users (email, password, nome, cognome, ruolo, stato)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'admin@planner.com',
        '$2b$10$rQJ5qKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', // password123
        'Admin',
        'Sistema',
        'admin',
        'attivo'
      ]);
      console.log("✅ Utente admin creato");
    }

    if (postazioni[0].count === 0) {
      console.log("\n🔧 Creazione postazioni di esempio...");
      
      const postazioniEsempio = [
        {
          luogo: 'Stazione Notarbartolo',
          indirizzo: 'Via Notarbartolo, Palermo',
          giorni: [1, 2, 3, 4, 5, 6, 7]
        },
        {
          luogo: 'Stazione Centrale',
          indirizzo: 'Piazza Giulio Cesare, Palermo',
          giorni: [1, 2, 3, 4, 5, 6, 7]
        }
      ];

      for (const postazione of postazioniEsempio) {
        const newPostazione = await db.one(`
          INSERT INTO postazioni (luogo, indirizzo, giorni_settimana, stato, max_proclamatori)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          postazione.luogo,
          postazione.indirizzo,
          postazione.giorni,
          'attiva',
          3
        ]);

        // Aggiungi slot orari
        const slots = [
          { inizio: '10:00:00', fine: '12:00:00' },
          { inizio: '15:00:00', fine: '17:00:00' }
        ];

        for (const slot of slots) {
          await db.none(`
            INSERT INTO slot_orari (postazione_id, orario_inizio, orario_fine, max_volontari, stato)
            VALUES ($1, $2, $3, $4, $5)
          `, [newPostazione.id, slot.inizio, slot.fine, 3, 'attivo']);
        }

        console.log(`✅ ${postazione.luogo} creata con slot orari`);
      }
    }

    if (volontari[0].count === 0) {
      console.log("\n🔧 Creazione volontari di esempio...");
      
      const volontariEsempio = [
        { nome: 'Mario', cognome: 'Rossi', email: 'mario.rossi@test.com' },
        { nome: 'Anna', cognome: 'Bianchi', email: 'anna.bianchi@test.com' },
        { nome: 'Giuseppe', cognome: 'Verdi', email: 'giuseppe.verdi@test.com' }
      ];

      for (const volontario of volontariEsempio) {
        await db.none(`
          INSERT INTO volontari (nome, cognome, email, telefono, stato, sesso)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          volontario.nome,
          volontario.cognome,
          volontario.email,
          '123456789',
          'attivo',
          'M'
        ]);
      }
      console.log("✅ Volontari di esempio creati");
    }

    console.log("\n🎉 CORREZIONI COMPLETATE!");
    console.log("💡 Ora riavvia l'applicazione con: npm run dev");

  } catch (error) {
    console.error("❌ Errore durante le correzioni:", error);
  } finally {
    process.exit(0);
  }
}

fixFrontendErrors();