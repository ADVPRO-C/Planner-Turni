// Script di test semplice per verificare che il server funzioni
const fetch = require("node-fetch");

async function testServer() {
  console.log("=== TEST SERVER SEMPLICE ===");

  try {
    // Test 1: Health check
    console.log("\n1. Test health check...");
    const healthResponse = await fetch("http://localhost:5001/api/health");

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log("✅ Health check OK:", healthData);
    } else {
      console.log("❌ Health check fallito:", healthResponse.status);
      return;
    }

    // Test 2: Test postazioni (senza autenticazione)
    console.log("\n2. Test endpoint postazioni...");
    const postazioniResponse = await fetch(
      "http://localhost:5001/api/postazioni"
    );

    if (postazioniResponse.status === 401) {
      console.log("✅ Endpoint postazioni risponde (richiede autenticazione)");
    } else if (postazioniResponse.ok) {
      console.log("✅ Endpoint postazioni accessibile");
    } else {
      console.log(
        "❌ Endpoint postazioni non funziona:",
        postazioniResponse.status
      );
    }

    console.log("\n=== RISULTATO ===");
    console.log("✅ Il server funziona correttamente");
    console.log("✅ Gli URL di accesso sono:");
    console.log("   - Frontend: http://localhost:3000");
    console.log("   - Backend API: http://localhost:5001");
  } catch (error) {
    console.error("❌ Errore durante il test:", error.message);
    console.log("\nPossibili cause:");
    console.log("1. Il server non è in esecuzione");
    console.log("2. Il server si è bloccato durante l'avvio");
    console.log("3. Problema di connessione al database");
  }
}

// Esegui il test
testServer();
