const dns = require("dns");
const pgp = require("pg-promise")();

// Forza la preferenza IPv4 in ambienti che forniscono solo record AAAA (es. Railway)
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

// Configurazione del database
// Supporta sia DATABASE_URL (connection string) che variabili separate
let config;

// Debug: verifica se DATABASE_URL è presente
if (process.env.DATABASE_URL) {
  console.log("✅ DATABASE_URL trovata, uso connection string");

  const requiresSSL =
    process.env.DB_SSL === "true" || process.env.NODE_ENV === "production";

  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: requiresSSL ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX || "10", 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || "10000",
      10
    ),
    lookup: (hostname, options, callback) =>
      dns.lookup(
        hostname,
        {
          ...options,
          family: 4,
          hints: dns.ADDRCONFIG | dns.V4MAPPED,
        },
        callback
      ),
  };
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
    max: parseInt(process.env.DB_POOL_MAX || "10", 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || "10000",
      10
    ),
    lookup: (hostname, options, callback) =>
      dns.lookup(
        hostname,
        {
          ...options,
          family: 4,
          hints: dns.ADDRCONFIG | dns.V4MAPPED,
        },
        callback
      ),
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
