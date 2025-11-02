const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Debug: verifica variabili ambiente all'avvio
console.log("🔍 DEBUG VARIABILI AMBIENTE ALL'AVVIO:");
console.log("- DATABASE_URL:", process.env.DATABASE_URL ? "✅ PRESENTE" : "❌ ASSENTE");
console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "✅ PRESENTE" : "❌ ASSENTE");
console.log("- NODE_ENV:", process.env.NODE_ENV || "❌ NON SETTATO");
console.log("- PORT:", process.env.PORT || "NON SETTATO");

const authRoutes = require("./routes/auth");
const postazioniRoutes = require("./routes/postazioni");
const volontariRoutes = require("./routes/volontari");
const disponibilitaRoutes = require("./routes/disponibilita");
const turniRoutes = require("./routes/turni");
const cronologiaRoutes = require("./routes/cronologia");
const assistenzaRoutes = require("./routes/assistenza");
const congregazioniRoutes = require("./routes/congregazioni");
const esperienzeRoutes = require("./routes/esperienze");
const documentiRoutes = require("./routes/documenti");

const app = express();
const PORT = process.env.PORT || 5001;
// Su Railway/Heroku/Production, ascolta su 0.0.0.0 per accettare connessioni esterne
// Railway imposta PORT automaticamente, quindi se PORT è settato da Railway, usiamo 0.0.0.0
const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT || process.env.PORT;
const HOST = process.env.HOST || (isProduction ? "0.0.0.0" : "127.0.0.1");

// Middleware di sicurezza
// In produzione, disabilita alcune restrizioni di Helmet per permettere richieste da mobile
const helmetConfig = process.env.NODE_ENV === 'production' 
  ? {
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }
  : {};
app.use(helmet(helmetConfig));

// Rate limiting - DISABILITATO
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minuti
//   max: 0, // limite disabilitato (0 = nessun limite)
// });
// app.use(limiter);

// Middleware CORS - Configurazione per permettere richieste da frontend deployato e mobile
const corsOptions = {
  origin: function (origin, callback) {
    // In produzione, accetta tutte le origini (per mobile e vari domini)
    // In sviluppo, accetta localhost
    if (process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      // In sviluppo, permetti localhost e domini comuni
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Congregazione-Id'],
};

app.use(cors(corsOptions));
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
app.use("/api/documenti", documentiRoutes);
console.log("✓ Route documenti caricate");

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
