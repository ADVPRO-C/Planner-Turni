const pgp = require("pg-promise")();
require("dotenv").config({ path: "../../.env" });

const db = pgp({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  try {
    console.log("🚀 Esecuzione migrazione: aggiungi congregazione_id a assegnazioni_volontari");
    await db.connect();
    console.log("✅ Connessione database riuscita");

    // Verifica se la colonna esiste già
    const columnExists = await db.oneOrNone(
      `SELECT 1 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
         AND table_name = 'assegnazioni_volontari' 
         AND column_name = 'congregazione_id'`
    );

    if (columnExists) {
      console.log("ℹ️  La colonna congregazione_id esiste già. Nessuna migrazione necessaria.");
      return;
    }

    console.log("📝 Aggiunta colonna congregazione_id...");
    
    await db.tx(async (t) => {
      // Aggiungi la colonna con default temporaneo
      await t.none(`
        ALTER TABLE public.assegnazioni_volontari
        ADD COLUMN congregazione_id INTEGER NOT NULL DEFAULT 1
      `);

      // Popola i dati esistenti usando la congregazione_id dell'assegnazione
      const updatedFromAssegnazioni = await t.result(`
        UPDATE public.assegnazioni_volontari av
        SET congregazione_id = a.congregazione_id
        FROM public.assegnazioni a
        WHERE av.assegnazione_id = a.id
          AND av.congregazione_id = 1
      `);
      
      console.log(`   ✅ Aggiornati ${updatedFromAssegnazioni.rowCount} record da assegnazioni`);

      // Popola i rimanenti usando la congregazione del volontario
      const updatedFromVolontari = await t.result(`
        UPDATE public.assegnazioni_volontari av
        SET congregazione_id = v.congregazione_id
        FROM public.volontari v
        WHERE av.volontario_id = v.id
          AND av.congregazione_id = 1
      `);
      
      console.log(`   ✅ Aggiornati ${updatedFromVolontari.rowCount} record da volontari`);

      // Rimuovi il default
      await t.none(`
        ALTER TABLE public.assegnazioni_volontari
        ALTER COLUMN congregazione_id DROP DEFAULT
      `);

      // Aggiungi foreign key constraint se non esiste
      const fkExists = await t.oneOrNone(`
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'assegnazioni_volontari_congregazione_id_fkey'
      `);

      if (!fkExists) {
        await t.none(`
          ALTER TABLE public.assegnazioni_volontari
          ADD CONSTRAINT assegnazioni_volontari_congregazione_id_fkey 
          FOREIGN KEY (congregazione_id) 
          REFERENCES public.congregazioni(id) 
          ON DELETE CASCADE
        `);
        console.log("   ✅ Foreign key constraint aggiunta");
      }

      // Crea indice se non esiste
      const indexExists = await t.oneOrNone(`
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_assegnazioni_volontari_congregazione'
      `);

      if (!indexExists) {
        await t.none(`
          CREATE INDEX idx_assegnazioni_volontari_congregazione 
          ON public.assegnazioni_volontari(congregazione_id)
        `);
        console.log("   ✅ Indice creato");
      }
    });

    console.log("✅ Migrazione completata con successo!");

  } catch (error) {
    console.error("❌ Errore durante la migrazione:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  } finally {
    pgp.end();
  }
}

runMigration();

