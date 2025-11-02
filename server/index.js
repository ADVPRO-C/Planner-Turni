const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const postazioniRoutes = require("./routes/postazioni");
const volontariRoutes = require("./routes/volontari");
const disponibilitaRoutes = require("./routes/disponibilita");
const turniRoutes = require("./routes/turni");
const cronologiaRoutes = require("./routes/cronologia");
const assistenzaRoutes = require("./routes/assistenza");
const congregazioniRoutes = require("./routes/congregazioni");
const esperienzeRoutes = require("./routes/esperienze");

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "127.0.0.1";

// Middleware di sicurezza
app.use(helmet());

// Rate limiting - DISABILITATO
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minuti
//   max: 0, // limite disabilitato (0 = nessun limite)
// });
// app.use(limiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
console.log("Caricamento routes...");
app.use("/api/auth", authRoutes);
console.log("✓ Route auth caricate");
app.use("/api/postazioni", postazioniRoutes);
console.log("✓ Route postazioni caricate");
app.use("/api/volontari", volontariRoutes);
console.log("✓ Route volontari caricate");
app.use("/api/disponibilita", disponibilitaRoutes);
console.log("✓ Route disponibilità caricate");
app.use("/api/turni", turniRoutes);
console.log("✓ Route turni caricate");
app.use("/api/cronologia", cronologiaRoutes);
console.log("✓ Route cronologia caricate");
app.use("/api/assistenza", assistenzaRoutes);
console.log("✓ Route assistenza caricate");
app.use("/api/congregazioni", congregazioniRoutes);
console.log("✓ Route congregazioni caricate");
app.use("/api/esperienze", esperienzeRoutes);
console.log("✓ Route esperienze caricate");

// Route di test
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server funzionante" });
});

// Gestione errori globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Errore interno del server",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Si è verificato un errore",
  });
});

// Route non trovata
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route non trovata" });
});

// Gestione errori non gestiti
process.on("uncaughtException", (err) => {
  console.error("Errore non gestito:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Promise rejection non gestita:", reason);
  process.exit(1);
});

app.listen(PORT, HOST, () => {
  console.log(`Server in esecuzione su http://${HOST}:${PORT}`);
  console.log(
    `Health check disponibile su: http://${HOST}:${PORT}/api/health`
  );
});

module.exports = app;
