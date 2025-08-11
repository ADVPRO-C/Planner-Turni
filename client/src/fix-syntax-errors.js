// Script per identificare e correggere errori di sintassi comuni

const fs = require('fs');
const path = require('path');

function checkSyntaxErrors() {
  console.log("🔍 CONTROLLO ERRORI DI SINTASSI");
  console.log("=".repeat(40));

  const srcDir = path.join(__dirname);
  const filesToCheck = [
    'App.js',
    'index.js',
    'pages/GestioneTurni.js',
    'pages/Dashboard.js',
    'contexts/AuthContext.js'
  ];

  const errors = [];

  filesToCheck.forEach(file => {
    const filePath = path.join(srcDir, file);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Controlli comuni per errori di sintassi
        const checks = [
          {
            name: 'Parentesi graffe non bilanciate',
            test: (content) => {
              const openBraces = (content.match(/\{/g) || []).length;
              const closeBraces = (content.match(/\}/g) || []).length;
              return openBraces !== closeBraces;
            }
          },
          {
            name: 'Parentesi tonde non bilanciate',
            test: (content) => {
              const openParens = (content.match(/\(/g) || []).length;
              const closeParens = (content.match(/\)/g) || []).length;
              return openParens !== closeParens;
            }
          },
          {
            name: 'Virgole finali in oggetti',
            test: (content) => content.includes(',}') || content.includes(',]')
          },
          {
            name: 'Import/Export malformati',
            test: (content) => {
              return /import\s+\{[^}]*,\s*\}\s+from/.test(content) ||
                     /export\s+\{[^}]*,\s*\}/.test(content);
            }
          }
        ];

        checks.forEach(check => {
          if (check.test(content)) {
            errors.push(`${file}: ${check.name}`);
          }
        });

        console.log(`✅ ${file} - Controllo completato`);
        
      } catch (error) {
        errors.push(`${file}: Errore di lettura - ${error.message}`);
      }
    } else {
      console.log(`⚠️  ${file} - File non trovato`);
    }
  });

  if (errors.length > 0) {
    console.log("\n❌ ERRORI TROVATI:");
    errors.forEach(error => console.log(`   ${error}`));
    return false;
  } else {
    console.log("\n✅ Nessun errore di sintassi trovato");
    return true;
  }
}

// Funzione per correggere errori comuni
function fixCommonErrors() {
  console.log("\n🔧 CORREZIONE ERRORI COMUNI");
  console.log("=".repeat(40));

  const fixes = [
    {
      file: 'pages/GestioneTurni.js',
      fixes: [
        {
          description: 'Rimuovi virgole finali in oggetti',
          search: /,(\s*[}\]])/g,
          replace: '$1'
        }
      ]
    }
  ];

  fixes.forEach(({ file, fixes: fileFixes }) => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      fileFixes.forEach(fix => {
        if (fix.search.test(content)) {
          content = content.replace(fix.search, fix.replace);
          modified = true;
          console.log(`✅ ${file}: ${fix.description}`);
        }
      });

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`💾 ${file} salvato`);
      }
    }
  });
}

if (require.main === module) {
  const hasErrors = !checkSyntaxErrors();
  
  if (hasErrors) {
    fixCommonErrors();
    console.log("\n🔄 Ricontrolla dopo le correzioni...");
    checkSyntaxErrors();
  }
  
  console.log("\n💡 PROSSIMI PASSI:");
  console.log("1. Riavvia il server di sviluppo: npm start");
  console.log("2. Controlla la console del browser per errori runtime");
  console.log("3. Verifica che tutte le dipendenze siano installate");
}

module.exports = { checkSyntaxErrors, fixCommonErrors };