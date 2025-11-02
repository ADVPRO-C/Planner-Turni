const pgp = require("pg-promise")();

// Configurazione del database
// Supporta sia DATABASE_URL (connection string) che variabili separate
let config;

// Debug: verifica se DATABASE_URL è presente
if (process.env.DATABASE_URL) {
  console.log("✅ DATABASE_URL trovata, usando connection string");
  // Usa la connection string (es. Supabase, Railway, Heroku)
  // pg-promise accetta direttamente la connection string
  config = process.env.DATABASE_URL;
} else {
  console.warn(
    "⚠️ DATABASE_URL non trovata, usando variabili separate o default"
  );
  console.log("🔍 Variabili ambiente:", {
    DB_HOST: process.env.DB_HOST || "localhost (default)",
    DB_PORT: process.env.DB_PORT || "5432 (default)",
    DB_NAME: process.env.DB_NAME || "planner_db (default)",
    NODE_ENV: process.env.NODE_ENV || "non settato",
  });
  // Usa variabili separate
  config = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "planner_db",
    user: process.env.DB_USER || "zy0n",
    password: process.env.DB_PASSWORD || "",
    ssl:
      process.env.NODE_ENV === "production" || process.env.DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : false,
  };
}

const db = pgp(config);

// Test della connessione
db.connect()
  .then((obj) => {
    console.log("Connessione al database riuscita");
    obj.done();
  })
  .catch((error) => {
    console.error("Errore nella connessione al database:", error);
  });

module.exports = db;
