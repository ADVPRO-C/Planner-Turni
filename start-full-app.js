// Script di avvio completo per frontend e backend
const { spawn } = require("child_process");
const path = require("path");

console.log("=== AVVIO APPLICAZIONE COMPLETA ===");

let backendProcess = null;
let frontendProcess = null;

// Funzione per terminare tutti i processi
function cleanup() {
  console.log("\n🛑 Terminazione processi...");
  if (backendProcess) {
    backendProcess.kill("SIGTERM");
  }
  if (frontendProcess) {
    frontendProcess.kill("SIGTERM");
  }
  process.exit(0);
}

// Gestione interruzioni
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Avvio Backend
function startBackend() {
  console.log("🚀 Avvio Backend (porta 5001)...");
  
  backendProcess = spawn("node", ["index.js"], {
    cwd: path.join(__dirname, "server"),
    stdio: "inherit",
    env: { 
      ...process.env, 
      NODE_ENV: "development",
      PORT: "5001"
    },
  });

  backendProcess.on("error", (error) => {
    console.error("❌ Errore Backend:", error);
  });

  backendProcess.on("exit", (code) => {
    if (code !== 0) {
      console.error(`❌ Backend terminato con codice ${code}`);
      console.log("🔄 Riavvio Backend in 3 secondi...");
      setTimeout(startBackend, 3000);
    }
  });
}

// Avvio Frontend
function startFrontend() {
  console.log("🎨 Avvio Frontend (porta 3000)...");
  
  frontendProcess = spawn("npm", ["start"], {
    cwd: path.join(__dirname, "client"),
    stdio: "inherit",
    env: { 
      ...process.env,
      BROWSER: "none" // Evita apertura automatica browser
    },
  });

  frontendProcess.on("error", (error) => {
    console.error("❌ Errore Frontend:", error);
  });

  frontendProcess.on("exit", (code) => {
    if (code !== 0) {
      console.error(`❌ Frontend terminato con codice ${code}`);
      console.log("🔄 Riavvio Frontend in 3 secondi...");
      setTimeout(startFrontend, 3000);
    }
  });
}

// Avvia prima il backend, poi il frontend
console.log("📋 Sequenza di avvio:");
console.log("1. Backend (Express + PostgreSQL)");
console.log("2. Frontend (React)");
console.log("3. Applicazione disponibile su http://localhost:3000");
console.log("");

startBackend();

// Avvia il frontend dopo 5 secondi per dare tempo al backend
setTimeout(() => {
  startFrontend();
  
  setTimeout(() => {
    console.log("");
    console.log("✅ APPLICAZIONE AVVIATA!");
    console.log("🌐 Frontend: http://localhost:3000");
    console.log("🔧 Backend: http://localhost:5001");
    console.log("💾 Health Check: http://localhost:5001/api/health");
    console.log("");
    console.log("Premi Ctrl+C per terminare");
  }, 10000);
}, 5000);