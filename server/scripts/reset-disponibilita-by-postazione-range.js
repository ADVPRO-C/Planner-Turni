const db = require("../config/database");

/**
 * Script di reset disponibilità filtrato per postazione e range date.
 * - Dry-run di default (non elimina nulla)
 * - Aggiungi --apply per eseguire la cancellazione
 * - Parametri opzionali:
 *    --postazione "Stazione Notarbartolo" (default: cerca ILIKE '%notarbartolo%')
 *    --inizio 2025-08-01
 *    --fine 2025-08-31
 */

function parseArgs(argv) {
  const args = { apply: false };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--apply") {
      args.apply = true;
    } else if (token === "--postazione") {
      args.postazione = argv[++i];
    } else if (token === "--inizio") {
      args.inizio = argv[++i];
    } else if (token === "--fine") {
      args.fine = argv[++i];
    }
  }
  return args;
}

async function run() {
  const args = parseArgs(process.argv);
  const postazioneQuery = args.postazione || "%notarbartolo%";
  const dataInizio = args.inizio || "2025-08-01";
  const dataFine = args.fine || "2025-08-31";
  const isApply = args.apply === true;

  try {
    console.log("🔄 RESET DISPONIBILITÀ FILTRATO (dry-run di default)");
    console.log("=".repeat(70));
    console.log(`🎯 Postazione ILIKE: ${postazioneQuery}`);
    console.log(`📅 Intervallo date: ${dataInizio} → ${dataFine}`);
    console.log(`🛡️ Modalità: ${isApply ? "APPLY (elimina)" : "DRY-RUN (solo conteggio)"}`);

    // 1) Identifica postazione
    const postazione = await db.oneOrNone(
      "SELECT id, luogo FROM postazioni WHERE luogo ILIKE $1",
      [postazioneQuery]
    );
    if (!postazione) {
      console.log("❌ Postazione non trovata");
      process.exit(1);
    }
    console.log(`📍 Postazione trovata: ${postazione.luogo} (ID: ${postazione.id})`);

    // 2) Slot della postazione
    const slot = await db.any(
      "SELECT id, orario_inizio, orario_fine FROM slot_orari WHERE postazione_id = $1",
      [postazione.id]
    );
    if (slot.length === 0) {
      console.log("⚠️ Nessuno slot associato alla postazione. Nulla da fare.");
      process.exit(0);
    }

    const slotIds = slot.map((s) => s.id);
    console.log(`🕐 Slot coinvolti: ${slot.map(s => `${s.orario_inizio}-${s.orario_fine}`).join(", ")}`);

    // 3) Conteggio disponibilità target
    const count = await db.one(
      `SELECT COUNT(*)::int AS c
       FROM disponibilita d
       WHERE d.slot_orario_id = ANY($1)
         AND d.data >= $2::date AND d.data <= $3::date
         AND d.stato = 'disponibile'`,
      [slotIds, dataInizio, dataFine]
    );
    console.log(`📊 Disponibilità target (stato=disponibile) da eliminare: ${count.c}`);

    // 4) Anteprima (limite 10)
    const sample = await db.any(
      `SELECT d.id, d.volontario_id, d.data, so.orario_inizio, so.orario_fine
       FROM disponibilita d
       JOIN slot_orari so ON d.slot_orario_id = so.id
       WHERE d.slot_orario_id = ANY($1)
         AND d.data >= $2::date AND d.data <= $3::date
         AND d.stato = 'disponibile'
       ORDER BY d.data, so.orario_inizio
       LIMIT 10`,
      [slotIds, dataInizio, dataFine]
    );
    if (sample.length > 0) {
      console.log("🔎 Esempi (max 10):");
      sample.forEach((row) => {
        console.log(`  • ${row.data} ${row.orario_inizio}-${row.orario_fine} (volontario ${row.volontario_id}) [id ${row.id}]`);
      });
    }

    if (!isApply) {
      console.log("✅ DRY-RUN completato. Nessuna riga eliminata.");
      process.exit(0);
    }

    // 5) Eliminazione controllata
    const result = await db.result(
      `DELETE FROM disponibilita d
       WHERE d.slot_orario_id = ANY($1)
         AND d.data >= $2::date AND d.data <= $3::date
         AND d.stato = 'disponibile'`,
      [slotIds, dataInizio, dataFine]
    );

    console.log(`🧹 Cancellazione eseguita. Righe eliminate: ${result.rowCount}`);
    console.log("🎉 Operazione completata");
  } catch (error) {
    console.error("❌ Errore nel reset disponibilità:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();



