// Script di avvio robusto per il server
const { spawn } = require("child_process");
const path = require("path");

console.log("=== AVVIO SERVER ROBUSTO ===");

// Funzione per avviare il server
function startServer() {
  console.log("Avvio del server...");

  const serverProcess = spawn("node", ["index.js"], {
    cwd: path.join(__dirname, "server"),
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development" },
  });

  serverProcess.on("error", (error) => {
    console.error("Errore nell'avvio del server:", error);
  });

  serverProcess.on("exit", (code, signal) => {
    if (code !== 0) {
      console.error(`Server terminato con codice ${code} e segnale ${signal}`);
      console.log("Riavvio del server in 3 secondi...");
      setTimeout(startServer, 3000);
    }
  });

  // Gestione interruzione
  process.on("SIGINT", () => {
    console.log("\nInterruzione ricevuta, terminazione del server...");
    serverProcess.kill("SIGINT");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\nTerminazione ricevuta, terminazione del server...");
    serverProcess.kill("SIGTERM");
    process.exit(0);
  });
}

// Avvia il server
startServer();
