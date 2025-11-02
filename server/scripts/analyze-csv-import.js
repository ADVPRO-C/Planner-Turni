const fs = require('fs');
const path = require('path');

// Leggi il CSV manualmente
const csvFile = '/Users/zy0n/Desktop/hourglass-contactlist.csv';
const csvContent = fs.readFileSync(csvFile, 'utf8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Parse header
const headers = lines[0].split(',').map(h => h.trim());
console.log('Headers:', headers);
console.log('');

// Parse records
const records = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  // CSV parsing semplice (gestisce virgolette)
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

console.log('Totale record nel CSV:', records.length);
console.log('');

const toImport = [];
const toSkip = {
  unbaptized: [],
  noEmailNoPhone: [],
  missingData: []
};

records.forEach((row, index) => {
  const firstname = (row.firstname || '').trim();
  const lastname = (row.lastname || '').trim();
  const email = (row.email || '').trim();
  const cellphone = (row.cellphone || '').trim();
  const homephone = (row.homephone || '').trim();
  const sex = (row.sex || '').trim();
  const status = (row.status || '').trim();
  const inactive = (row.inactive || '').trim();
  
  // Controlli per skip
  if (status === 'Unbaptized Publisher') {
    toSkip.unbaptized.push({ nome: firstname, cognome: lastname, email, telefono: cellphone || homephone });
    return;
  }
  
  if (inactive === '1') {
    toSkip.inactive = toSkip.inactive || [];
    toSkip.inactive.push({ nome: firstname, cognome: lastname, email, telefono: cellphone || homephone });
    return;
  }
  
  if (!email && !cellphone && !homephone) {
    toSkip.noEmailNoPhone.push({ nome: firstname, cognome: lastname });
    return;
  }
  
  if (!firstname || !lastname || !sex || (sex !== 'Male' && sex !== 'Female')) {
    toSkip.missingData.push({ nome: firstname, cognome: lastname, email, telefono: cellphone || homephone, sesso: sex });
    return;
  }
  
  // Valido per import (solo attivi)
  const telefono = cellphone || homephone || null;
  const sesso = sex === 'Male' ? 'M' : 'F';
  const stato = 'attivo'; // Solo attivi vengono importati
  
  toImport.push({
    nome: firstname,
    cognome: lastname,
    email: email || null,
    telefono: telefono ? telefono.replace(/\s+/g, '') : null,
    sesso,
    stato,
    riga: index + 2
  });
});

console.log('✅ RECORD DA IMPORTARE:', toImport.length);
console.log('');
console.log('Elenco completo:');
toImport.forEach((r, i) => {
  console.log(`${i+1}. ${r.cognome}, ${r.nome} | ${r.sesso} | ${r.stato} | Email: ${r.email || 'N/A'} | Tel: ${r.telefono || 'N/A'}`);
});

console.log('');
console.log('⏭️  RECORD DA SALTARE:');
console.log('');
console.log('❌ Unbaptized Publisher:', toSkip.unbaptized.length);
toSkip.unbaptized.forEach((r, i) => {
  console.log(`  ${i+1}. ${r.cognome}, ${r.nome}`);
});

console.log('');
console.log('❌ Nessuna email né telefono:', toSkip.noEmailNoPhone.length);
toSkip.noEmailNoPhone.forEach((r, i) => {
  console.log(`  ${i+1}. ${r.cognome}, ${r.nome}`);
});

console.log('');
console.log('❌ Volontari inattivi:', (toSkip.inactive || []).length);
(toSkip.inactive || []).forEach((r, i) => {
  console.log(`  ${i+1}. ${r.cognome}, ${r.nome}`);
});

console.log('');
console.log('❌ Dati mancanti/invalidi:', toSkip.missingData.length);
toSkip.missingData.forEach((r, i) => {
  console.log(`  ${i+1}. ${r.cognome}, ${r.nome} | Sesso: ${r.sesso || 'N/A'}`);
});

console.log('');
console.log('📊 RIEPILOGO:');
console.log(`Totale record CSV: ${records.length}`);
console.log(`Da importare: ${toImport.length}`);
const totalSkipped = toSkip.unbaptized.length + 
                     toSkip.noEmailNoPhone.length + 
                     toSkip.missingData.length + 
                     (toSkip.inactive ? toSkip.inactive.length : 0);
console.log(`Da saltare: ${totalSkipped}`);

// Statistiche aggiuntive
const uomini = toImport.filter(r => r.sesso === 'M').length;
const donne = toImport.filter(r => r.sesso === 'F').length;

console.log('');
console.log('📈 STATISTICHE IMPORT (solo attivi):');
console.log(`  Uomini: ${uomini}`);
console.log(`  Donne: ${donne}`);
console.log(`  Con email: ${toImport.filter(r => r.email).length}`);
console.log(`  Con telefono: ${toImport.filter(r => r.telefono).length}`);

