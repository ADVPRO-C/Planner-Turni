const bcrypt = require("bcryptjs");
const db = require("../config/database");

async function fixAdminPassword() {
  try {
    console.log("Aggiornamento password admin...");

    // Hash della password 'password123'
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash("password123", saltRounds);

    // Aggiorna la password dell'admin
    await db.none(
      "UPDATE volontari SET password_hash = $1 WHERE email = 'admin@planner.com'",
      [passwordHash]
    );

    console.log("✅ Password admin aggiornata con successo!");
    console.log("Credenziali: admin@planner.com / password123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Errore nell'aggiornamento della password:", error);
    process.exit(1);
  }
}

fixAdminPassword();
