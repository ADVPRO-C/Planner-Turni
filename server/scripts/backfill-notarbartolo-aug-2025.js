const db = require("../config/database");

async function generateDateStringsInRangeInclusive(startDateStr, endDateStr) {
  const dates = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

function jsDayToDbDayNumber(jsDay) {
  // JS: 0=Sun, 1=Mon, ..., 6=Sat -> DB convention used in project: 1=Mon, 2=Tue, ..., 7=Sun
  // Converti JavaScript getDay() al formato del database (1=Lunedì, ..., 7=Domenica)
  return jsDay === 0 ? 7 : jsDay;
}

async function backfillNotarbartoloAugust2025() {
  try {
    console.log("🔧 BACKFILL DISPONIBILITÀ • NOTARBARTOLO • AGOSTO 2025");
    console.log("=".repeat(70));

    // 1) Recupera postazione Notarbartolo
    const postazione = await db.oneOrNone(
      "SELECT * FROM postazioni WHERE luogo ILIKE '%notarbartolo%'"
    );
    if (!postazione) {
      console.log("❌ Postazione Notarbartolo non trovata. Interrompo.");
      process.exit(1);
    }
    console.log(`📍 Postazione: ${postazione.luogo} (ID: ${postazione.id})`);

    // 2) Recupera slot attivi della postazione
    const slotOrari = await db.any(
      "SELECT * FROM slot_orari WHERE postazione_id = $1 AND stato = 'attivo' ORDER BY orario_inizio",
      [postazione.id]
    );
    if (slotOrari.length === 0) {
      console.log("❌ Nessun slot orario attivo per Notarbartolo. Interrompo.");
      process.exit(1);
    }
    console.log(
      `🕐 Slot attivi: ${slotOrari
        .map((s) => `${s.orario_inizio}-${s.orario_fine}`)
        .join(", ")}`
    );

    // 3) Recupera volontari attivi
    const volontari = await db.any(
      "SELECT id, nome, cognome FROM volontari WHERE stato = 'attivo' ORDER BY cognome, nome"
    );
    console.log(`👤 Volontari attivi: ${volontari.length}`);

    if (volontari.length === 0) {
      console.log("⚠️ Nessun volontario attivo. Nulla da fare.");
      process.exit(0);
    }

    // 4) Genera le date di agosto 2025 filtrando sui giorni attivi della postazione
    const giorniAttivi = Array.isArray(postazione.giorni_settimana)
      ? postazione.giorni_settimana
      : [];
    const tutteLeDate = await generateDateStringsInRangeInclusive(
      "2025-08-01",
      "2025-08-31"
    );
    const dateValide = tutteLeDate.filter((dateStr) => {
      const jsDay = new Date(dateStr).getDay(); // 0..6
      const dbDay = jsDayToDbDayNumber(jsDay); // 1..7
      return giorniAttivi.length === 0 || giorniAttivi.includes(dbDay);
    });
    console.log(
      `📅 Date valide in agosto 2025 secondo giorni attivi: ${dateValide.length}`
    );

    // 5) Inserimento idempotente delle disponibilità mancanti
    let inseriti = 0;
    await db.tx(async (t) => {
      for (const volontario of volontari) {
        for (const dataStr of dateValide) {
          for (const slot of slotOrari) {
            const esiste = await t.oneOrNone(
              `SELECT id FROM disponibilita
               WHERE volontario_id = $1 AND slot_orario_id = $2 AND data = $3`,
              [volontario.id, slot.id, dataStr]
            );
            if (!esiste) {
              await t.none(
                `INSERT INTO disponibilita (volontario_id, data, slot_orario_id, stato)
                 VALUES ($1, $2, $3, 'disponibile')`,
                [volontario.id, dataStr, slot.id]
              );
              inseriti += 1;
            }
          }
        }
      }
    });

    console.log(
      `✅ Inserimenti completati. Nuove disponibilità create: ${inseriti}`
    );

    // 6) Riepilogo per controllo
    const conteggio = await db.one(
      `SELECT COUNT(*)::int AS count
       FROM disponibilita d
       JOIN slot_orari so ON d.slot_orario_id = so.id
       WHERE so.postazione_id = $1
         AND d.data BETWEEN '2025-08-01' AND '2025-08-31'
         AND d.stato = 'disponibile'`,
      [postazione.id]
    );
    console.log(
      `📊 Disponibilità totali su Notarbartolo ad agosto 2025 (stato=disponibile): ${conteggio.count}`
    );
  } catch (error) {
    console.error("❌ Errore durante il backfill:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

backfillNotarbartoloAugust2025();

