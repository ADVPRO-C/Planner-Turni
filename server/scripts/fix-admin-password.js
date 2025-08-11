const bcrypt = require("bcryptjs");
const db = require("../config/database");

async function fixAdminPassword() {
  try {
    console.log("Aggiornamento password admin...");

    // Hash della password 'password123'
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash("password123", saltRounds);

    // Aggiorna la password dell'admin esistente
    await db.none(
      "UPDATE volontari SET password_hash = $1 WHERE email = 'arena@advpro.it'",
      [passwordHash]
    );

    console.log("✅ Password admin aggiornata con successo!");
    console.log("Credenziali: arena@advpro.it / password123");
    
    // Verifica che l'aggiornamento sia andato a buon fine
    const admin = await db.oneOrNone(
      "SELECT email, ruolo FROM volontari WHERE email = 'arena@advpro.it'"
    );
    
    if (admin) {
      console.log("✅ Admin trovato:", admin);
    } else {
      console.log("❌ Admin non trovato");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Errore:", error);
    process.exit(1);
  }
}

fixAdminPassword();
