const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const CSV_FILE = '/Users/zy0n/Desktop/hourglass-contactlist.csv';
const CONGREGAZIONE_ID = 1; // Palermo Uditore
const DEFAULT_PASSWORD = 'uditore20';

// Funzione per leggere e parsare il CSV
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });
    records.push(record);
  }
  
  return records;
}

// Funzione per sanitizzare il telefono
function sanitizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/\s+/g, '').replace(/\D/g, '') || null;
}

// Funzione principale
async function importCSV() {
  console.log('🚀 Avvio import CSV...\n');
  
  // Leggi CSV
  const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
  const records = parseCSV(csvContent);
  
  console.log(`📄 Totale record nel CSV: ${records.length}\n`);
  
  // Prepara dati validi
  const validRecords = [];
  
  records.forEach((row) => {
    const firstname = (row.firstname || '').trim();
    const lastname = (row.lastname || '').trim();
    const email = (row.email || '').trim() || null;
    const cellphone = sanitizePhone(row.cellphone);
    const homephone = sanitizePhone(row.homephone);
    const telefono = cellphone || homephone || null;
    const sex = (row.sex || '').trim();
    const status = (row.status || '').trim();
    const inactive = (row.inactive || '').trim();
    
    // Skip Unbaptized Publisher
    if (status === 'Unbaptized Publisher') {
      return;
    }
    
    // Skip inattivi
    if (inactive === '1') {
      return;
    }
    
    // Skip senza email e telefono
    if (!email && !telefono) {
      return;
    }
    
    // Skip dati mancanti
    if (!firstname || !lastname || !sex || (sex !== 'Male' && sex !== 'Female')) {
      return;
    }
    
    validRecords.push({
      nome: firstname,
      cognome: lastname,
      email,
      telefono,
      sesso: sex === 'Male' ? 'M' : 'F',
      stato: 'attivo'
    });
  });
  
  console.log(`✅ Record validi trovati: ${validRecords.length}\n`);
  
  // Hash password
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  console.log('🔐 Password hash generata\n');
  
  // Verifica congregazione
  const congregazione = await db.oneOrNone(
    'SELECT id, nome FROM congregazioni WHERE id = $1',
    [CONGREGAZIONE_ID]
  );
  
  if (!congregazione) {
    console.error(`❌ Errore: Congregazione ID ${CONGREGAZIONE_ID} non trovata`);
    process.exit(1);
  }
  
  console.log(`📍 Congregazione: ${congregazione.nome} (ID: ${congregazione.id})\n`);
  
  // Importa record
  const results = {
    imported: [],
    skipped: {
      duplicateEmail: [],
      duplicatePhone: [],
      errors: []
    }
  };
  
  for (const record of validRecords) {
    try {
      // Controlla duplicati email
      if (record.email) {
        const existingEmail = await db.oneOrNone(
          'SELECT id, nome, cognome FROM volontari WHERE LOWER(email) = LOWER($1)',
          [record.email]
        );
        
        if (existingEmail) {
          results.skipped.duplicateEmail.push({
            ...record,
            existing: `${existingEmail.nome} ${existingEmail.cognome} (ID: ${existingEmail.id})`
          });
          continue;
        }
      }
      
      // Controlla duplicati telefono
      if (record.telefono) {
        const sanitizedPhone = record.telefono.replace(/\D/g, '');
        const existingPhone = await db.oneOrNone(
          `SELECT id, nome, cognome FROM volontari 
           WHERE telefono IS NOT NULL 
           AND regexp_replace(telefono, '\\D', '', 'g') = $1`,
          [sanitizedPhone]
        );
        
        if (existingPhone) {
          results.skipped.duplicatePhone.push({
            ...record,
            existing: `${existingPhone.nome} ${existingPhone.cognome} (ID: ${existingPhone.id})`
          });
          continue;
        }
      }
      
      // Inserisci record
      const newVolontario = await db.one(
        `INSERT INTO volontari 
         (congregazione_id, nome, cognome, email, telefono, password_hash, sesso, stato, ruolo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, nome, cognome, email, telefono`,
        [
          CONGREGAZIONE_ID,
          record.nome,
          record.cognome,
          record.email,
          record.telefono,
          passwordHash,
          record.sesso,
          record.stato,
          'volontario'
        ]
      );
      
      results.imported.push(newVolontario);
      console.log(`✅ Importato: ${newVolontario.cognome}, ${newVolontario.nome} (ID: ${newVolontario.id})`);
      
    } catch (error) {
      results.skipped.errors.push({
        ...record,
        error: error.message
      });
      console.error(`❌ Errore per ${record.cognome}, ${record.nome}: ${error.message}`);
    }
  }
  
  // Report finale
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORT FINALE');
  console.log('='.repeat(60));
  console.log(`\n✅ Importati con successo: ${results.imported.length}`);
  console.log(`\n⏭️  Saltati:`);
  console.log(`   - Email duplicate: ${results.skipped.duplicateEmail.length}`);
  console.log(`   - Telefono duplicato: ${results.skipped.duplicatePhone.length}`);
  console.log(`   - Errori: ${results.skipped.errors.length}`);
  
  if (results.skipped.duplicateEmail.length > 0) {
    console.log('\n📧 Email duplicate:');
    results.skipped.duplicateEmail.forEach(r => {
      console.log(`   - ${r.cognome}, ${r.nome} (${r.email}) → già presente: ${r.existing}`);
    });
  }
  
  if (results.skipped.duplicatePhone.length > 0) {
    console.log('\n📱 Telefoni duplicati:');
    results.skipped.duplicatePhone.forEach(r => {
      console.log(`   - ${r.cognome}, ${r.nome} (${r.telefono}) → già presente: ${r.existing}`);
    });
  }
  
  if (results.skipped.errors.length > 0) {
    console.log('\n❌ Errori:');
    results.skipped.errors.forEach(r => {
      console.log(`   - ${r.cognome}, ${r.nome}: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Import completato!`);
  console.log(`   Totale importati: ${results.imported.length}/${validRecords.length}`);
  console.log('='.repeat(60) + '\n');
  
  // Chiudi connessione DB
  await db.$pool.end();
}

// Esegui import
importCSV().catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});

