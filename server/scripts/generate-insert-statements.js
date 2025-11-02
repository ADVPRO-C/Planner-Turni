const readline = require("readline");

// Script interattivo per generare INSERT statements dai dati esportati

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const tables = [
  {
    name: "congregazioni",
    columns: ["id", "codice", "nome", "created_at", "updated_at"],
    required: true,
  },
  {
    name: "volontari",
    columns: [
      "id",
      "congregazione_id",
      "nome",
      "cognome",
      "sesso",
      "stato",
      "ultima_assegnazione",
      "email",
      "telefono",
      "password_hash",
      "ruolo",
      "created_at",
      "updated_at",
    ],
    required: true,
  },
  {
    name: "postazioni",
    columns: [
      "id",
      "congregazione_id",
      "luogo",
      "indirizzo",
      "giorni_settimana",
      "stato",
      "max_proclamatori",
      "created_at",
      "updated_at",
    ],
    required: true,
  },
  {
    name: "slot_orari",
    columns: [
      "id",
      "postazione_id",
      "congregazione_id",
      "orario_inizio",
      "orario_fine",
      "max_volontari",
      "stato",
      "created_at",
      "updated_at",
    ],
    required: true,
  },
  {
    name: "disponibilita",
    columns: [
      "id",
      "volontario_id",
      "congregazione_id",
      "data",
      "stato",
      "note",
      "created_at",
      "slot_orario_id",
    ],
    required: true,
  },
  {
    name: "assegnazioni",
    columns: [
      "id",
      "postazione_id",
      "congregazione_id",
      "slot_orario_id",
      "data_turno",
      "stato",
      "note",
      "created_at",
      "updated_at",
    ],
    required: true,
  },
  {
    name: "assegnazioni_volontari",
    columns: [
      "id",
      "assegnazione_id",
      "volontario_id",
      "congregazione_id",
      "ruolo_turno",
      "created_at",
    ],
    required: true,
  },
];

function escapeSQL(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  // String: escape single quotes
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function formatValue(value, columnType) {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }
  
  // Array handling (per giorni_settimana)
  if (Array.isArray(value)) {
    return "'{" + value.join(",") + "}'";
  }
  
  return escapeSQL(value);
}

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function processTable(table) {
  console.log(`\n📋 Tabella: ${table.name}`);
  console.log("=".repeat(60));
  console.log(
    `\n1. Vai su Supabase Dashboard → SQL Editor`
  );
  console.log(`2. Esegui questa query:`);
  console.log(`\nSELECT * FROM ${table.name} ORDER BY id;\n`);
  
  const hasData = await askQuestion(
    `\n✅ Hai copiato i risultati della query? (s/n): `
  );

  if (hasData.toLowerCase() !== "s") {
    console.log(`⚠️  Skippando ${table.name}...`);
    return null;
  }

  console.log(
    `\n📝 Incolla qui i risultati (riga per riga, formato CSV o tab-separated).`
  );
  console.log(`   Quando hai finito, scrivi "FINE" su una riga vuota.\n`);

  const rows = [];
  let lineCount = 0;

  while (true) {
    const line = await askQuestion(`Riga ${lineCount + 1}: `);
    if (line.trim().toUpperCase() === "FINE" || line.trim() === "") {
      break;
    }
    rows.push(line);
    lineCount++;
  }

  if (rows.length === 0) {
    console.log(`⚠️  Nessun dato per ${table.name}`);
    return null;
  }

  // Parse rows (assumendo formato CSV o tab-separated)
  const parsedRows = rows.map((row) => {
    // Prova prima tab, poi comma
    const parts = row.includes("\t")
      ? row.split("\t")
      : row.split(",").map((s) => s.trim());
    return parts;
  });

  // Genera INSERT statement
  const columnsStr = table.columns.map((c) => `"${c}"`).join(", ");
  let insertSQL = `\n-- ${table.name}\n`;
  insertSQL += `INSERT INTO ${table.name} (${columnsStr})\nVALUES\n`;

  const values = parsedRows.map((row, idx) => {
    const rowValues = table.columns
      .map((col, colIdx) => {
        const value = row[colIdx] || null;
        return formatValue(value, col);
      })
      .join(", ");

    const comma = idx < parsedRows.length - 1 ? "," : "";
    return `  (${rowValues})${comma}`;
  });

  insertSQL += values.join("\n");
  insertSQL += `\nON CONFLICT (id) DO NOTHING;\n`;

  return insertSQL;
}

async function main() {
  console.log("🚀 Generatore INSERT Statements per Migrazione");
  console.log("=".repeat(60));
  console.log(
    "\nQuesto script ti guida a generare gli INSERT statements"
  );
  console.log("dai dati esportati da Supabase.\n");

  const allStatements = [];

  // Disabilita foreign keys all'inizio
  allStatements.push("SET session_replication_role = 'replica';\n");

  for (const table of tables) {
    const statement = await processTable(table);
    if (statement) {
      allStatements.push(statement);
    }
  }

  // Riabilita foreign keys
  allStatements.push("SET session_replication_role = 'origin';\n");

  // Salva in file
  const fs = require("fs");
  const path = require("path");
  const outputPath = path.join(__dirname, "import-railway-generated.sql");
  fs.writeFileSync(outputPath, allStatements.join("\n"), "utf8");

  console.log("\n" + "=".repeat(60));
  console.log("✅ File generato: " + outputPath);
  console.log("\n📋 Prossimi passi:");
  console.log("1. Controlla il file generato");
  console.log("2. Esegui il file SQL su Railway");
  console.log("\nComando per eseguire:");
  console.log(
    `psql "postgresql://postgres:vyiPjmjNpiYugHWGFmtSXCKMImXVpHDV@ballast.proxy.rlwy.net:30883/railway" < ${outputPath}`
  );

  rl.close();
}

main().catch((error) => {
  console.error("Errore:", error);
  rl.close();
  process.exit(1);
});

