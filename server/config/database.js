const pgp = require("pg-promise")();

// Configurazione del database
const config = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "planner_db",
  user: process.env.DB_USER || "zy0n",
  password: process.env.DB_PASSWORD || "",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

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
