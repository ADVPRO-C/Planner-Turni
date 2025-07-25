const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "planner_db",
  user: "zy0n",
  password: "",
});

async function checkStazioneCentrale() {
  try {
    // 1. Trova la postazione Stazione Centrale
    const postazioneResult = await pool.query(
      "SELECT * FROM postazioni WHERE luogo ILIKE '%stazione centrale%' OR luogo ILIKE '%centrale%'"
    );
    console.log("\n📍 Postazioni trovate:");
    console.log(postazioneResult.rows);

    if (postazioneResult.rows.length > 0) {
      const postazione = postazioneResult.rows[0];
      console.log("\n🏢 Postazione:", postazione.luogo);

      // 2. Trova gli slot orari per questa postazione
      const slotResult = await pool.query(
        "SELECT * FROM slot_orari WHERE postazione_id = $1",
        [postazione.id]
      );
      console.log("\n⏰ Slot orari:");
      console.log(slotResult.rows);

      // 3. Trova le disponibilità per questa settimana
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1); // Lunedì
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Domenica

      console.log(
        "\n📅 Cercando disponibilità dal",
        weekStart.toISOString().split("T")[0],
        "al",
        weekEnd.toISOString().split("T")[0]
      );

      const disponibilitaResult = await pool.query(
        `
        SELECT 
          d.*,
          v.nome,
          v.cognome,
          v.sesso,
          so.orario_inizio,
          so.orario_fine
        FROM disponibilita d
        JOIN volontari v ON d.volontario_id = v.id
        JOIN slot_orari so ON d.slot_orario_id = so.id
        WHERE d.data BETWEEN $1 AND $2
        ORDER BY d.data, so.orario_inizio
      `,
        [
          weekStart.toISOString().split("T")[0],
          weekEnd.toISOString().split("T")[0],
        ]
      );

      console.log("\n👥 Disponibilità totali questa settimana:");
      console.log(disponibilitaResult.rows);

      // 3b. Trova le disponibilità specifiche per la Stazione Centrale
      const disponibilitaStazioneResult = await pool.query(
        `
        SELECT 
          d.*,
          v.nome,
          v.cognome,
          v.sesso,
          so.orario_inizio,
          so.orario_fine
        FROM disponibilita d
        JOIN volontari v ON d.volontario_id = v.id
        JOIN slot_orari so ON d.slot_orario_id = so.id
        WHERE d.data BETWEEN $1 AND $2 
          AND so.postazione_id = $3
          AND d.stato = 'disponibile'
        ORDER BY d.data, so.orario_inizio
      `,
        [
          weekStart.toISOString().split("T")[0],
          weekEnd.toISOString().split("T")[0],
          postazione.id,
        ]
      );

      console.log("\n🏢 Disponibilità specifiche per Stazione Centrale:");
      console.log(disponibilitaStazioneResult.rows);

      // 4. Trova le assegnazioni esistenti per questa postazione
      const assegnazioniResult = await pool.query(
        `
        SELECT 
          a.*,
          av.volontario_id,
          v.nome,
          v.cognome
        FROM assegnazioni a
        JOIN assegnazioni_volontari av ON a.id = av.assegnazione_id
        JOIN volontari v ON av.volontario_id = v.id
        WHERE a.postazione_id = $1 AND a.data_turno BETWEEN $2 AND $3
        ORDER BY a.data_turno, a.id
      `,
        [
          postazione.id,
          weekStart.toISOString().split("T")[0],
          weekEnd.toISOString().split("T")[0],
        ]
      );

      console.log("\n📋 Assegnazioni esistenti per Stazione Centrale:");
      console.log(assegnazioniResult.rows);
    } else {
      console.log("\n❌ Nessuna postazione Stazione Centrale trovata");

      // Mostra tutte le postazioni disponibili
      const allPostazioni = await pool.query("SELECT * FROM postazioni");
      console.log("\n📋 Tutte le postazioni disponibili:");
      console.log(allPostazioni.rows);
    }
  } catch (error) {
    console.error("Errore:", error);
  } finally {
    await pool.end();
  }
}

checkStazioneCentrale();
