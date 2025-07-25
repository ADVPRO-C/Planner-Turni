# Istruzioni per il Debug del Problema di Logout al Refresh

## 🔍 Problema Identificato

Il logout automatico al refresh è causato da un problema nella gestione del token di autenticazione nel browser.

## 🛠️ Script di Debug Disponibili

### 1. Server Debug (Completato)

✅ **Risultato**: Tutto funziona correttamente lato server

- Login: ✅ Funziona
- Token verification: ✅ Funziona
- API endpoints: ✅ Funzionano
- Token expiration: ✅ 24 ore rimanenti

### 2. Browser Debug

Per testare il problema nel browser:

#### Passo 1: Apri la Console del Browser

1. Apri l'applicazione React su `http://localhost:3000`
2. Premi `F12` per aprire gli strumenti di sviluppo
3. Vai alla tab "Console"

#### Passo 2: Esegui il Debug Script

Copia e incolla questo script nella console:

```javascript
// Script di debug per il browser
console.log("🔍 BROWSER DEBUG SCRIPT");
console.log("========================");

function debugBrowserAuth() {
  console.log("\n1️⃣ Testing localStorage availability...");

  // Test localStorage
  try {
    localStorage.setItem("test", "value");
    const testValue = localStorage.getItem("test");
    localStorage.removeItem("test");
    console.log("✅ localStorage is available and working");
  } catch (error) {
    console.log("❌ localStorage is not available:", error.message);
    return;
  }

  console.log("\n2️⃣ Testing current token in localStorage...");
  const currentToken = localStorage.getItem("token");
  console.log("📝 Current token exists:", !!currentToken);
  if (currentToken) {
    console.log("📝 Token length:", currentToken.length);
    console.log("📝 Token preview:", currentToken.substring(0, 50) + "...");

    // Decode JWT token
    try {
      const tokenParts = currentToken.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = payload.exp;
        const timeLeft = expiresAt - now;

        console.log(
          "📅 Token issued at:",
          new Date(payload.iat * 1000).toISOString()
        );
        console.log(
          "📅 Token expires at:",
          new Date(expiresAt * 1000).toISOString()
        );
        console.log("📅 Current time:", new Date(now * 1000).toISOString());
        console.log(
          "⏰ Time left:",
          Math.floor(timeLeft / 3600),
          "hours",
          Math.floor((timeLeft % 3600) / 60),
          "minutes"
        );

        if (timeLeft <= 0) {
          console.log("❌ Token is expired!");
        } else {
          console.log("✅ Token is still valid");
        }
      }
    } catch (error) {
      console.log("❌ Error decoding token:", error.message);
    }
  } else {
    console.log("❌ No token found in localStorage");
  }

  console.log("\n3️⃣ Testing API call with current token...");
  if (currentToken) {
    fetch("http://localhost:5001/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    })
      .then((response) => {
        console.log("🌐 API call status:", response.status);
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      })
      .then((data) => {
        console.log("✅ API call successful:", data);
      })
      .catch((error) => {
        console.log("❌ API call failed:", error.message);
      });
  } else {
    console.log("⚠️ Skipping API call - no token available");
  }
}

// Esegui il debug
debugBrowserAuth();
```

#### Passo 3: Test del Refresh

1. **Effettua il login** con `admin@planner.com` / `password123`
2. **Esegui lo script di debug** nella console
3. **Ricarica la pagina** (F5)
4. **Esegui di nuovo lo script** per vedere se il token è ancora presente

## 🔧 Possibili Soluzioni

### Se il token scompare al refresh:

1. **Problema di localStorage**: Il browser potrebbe avere localStorage disabilitato
2. **Problema di CORS**: Errori CORS potrebbero causare la rimozione del token
3. **Problema di React**: Multiple re-render potrebbero causare problemi

### Se il token è presente ma l'utente viene comunque loggato out:

1. **Problema di verifica**: La chiamata API di verifica potrebbe fallire
2. **Problema di stato**: React potrebbe non aggiornare correttamente lo stato
3. **Problema di timing**: La verifica potrebbe avvenire prima che il componente sia montato

## 📋 Checklist di Debug

- [ ] localStorage è disponibile e funzionante
- [ ] Il token viene salvato correttamente durante il login
- [ ] Il token persiste dopo il refresh
- [ ] La chiamata API di verifica funziona
- [ ] Lo stato React viene aggiornato correttamente
- [ ] Non ci sono errori CORS
- [ ] Non ci sono errori di rete

## 🚀 Prossimi Passi

1. **Esegui il debug script** e condividi i risultati
2. **Identifica il punto esatto** dove il token viene perso
3. **Applica la soluzione specifica** basata sui risultati del debug

## 📞 Supporto

Se hai problemi con gli script di debug, prova a:

1. Verificare che il server sia in esecuzione su porta 5001
2. Verificare che il client React sia in esecuzione su porta 3000
3. Controllare che non ci siano errori nella console del browser
