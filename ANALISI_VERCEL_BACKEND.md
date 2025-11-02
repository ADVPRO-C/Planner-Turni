# ⚠️ Analisi: Deploy Backend su Vercel

## ❌ Problema Critico Identificato

**Il backend NON può essere deployato direttamente su Vercel Serverless Functions** per i seguenti motivi:

### Problemi Identificati:

1. **File Upload su Filesystem** ❌
   - **File**: `server/routes/documenti.js` - salva PDF su filesystem
   - **File**: `server/routes/assistenza.js` - salva allegati su filesystem
   - **Problema**: Vercel ha filesystem **READ-ONLY** (tranne `/tmp` che viene cancellato)
   - **Impatto**: I file caricati verrebbero **persi** o **non salvabili**

2. **File Download** ❌
   - **File**: `server/routes/documenti.js` - legge file dal filesystem
   - **Problema**: I file non esisterebbero perché il filesystem è read-only
   - **Impatto**: Download dei documenti **non funzionerebbe**

3. **File Storage Persistente** ❌
   - I file devono essere salvati in storage esterno (Supabase Storage, S3, etc.)
   - Attualmente il codice salva su filesystem locale

4. **Multer Disk Storage** ❌
   - `multer.diskStorage()` non funziona su Vercel
   - Serve `multer.memoryStorage()` + upload a storage esterno

## ✅ Soluzione Consigliata

### Opzione 1: Railway/Render per Backend (CONSIGLIATO)

**Pro**:
- ✅ Funziona subito senza modifiche al codice
- ✅ Filesystem completo disponibile
- ✅ Nessun rischio di breaking changes
- ✅ Supporto completo per multer diskStorage

**Deploy su Railway**:
1. Crea progetto su Railway
2. Connetti repository GitHub
3. Root directory: `server`
4. Variabili d'ambiente:
   ```
   DATABASE_URL=postgresql://postgres:2vQ-i60MqwHG@db.wwcgryzbgvxfviwcjnkg.supabase.co:5432/postgres
   JWT_SECRET=un-secret-super-sicuro
   NODE_ENV=production
   ```
5. Vercel frontend punta a: `https://tuo-backend.up.railway.app/api`

### Opzione 2: Migrazione a Supabase Storage (COMPLESSA)

**Cosa richiede**:
- ✅ Modificare `documenti.js` per usare Supabase Storage
- ✅ Modificare `assistenza.js` per usare Supabase Storage
- ✅ Modificare download per servire da Supabase Storage
- ✅ Testare tutte le funzionalità
- ⚠️ **Rischio**: Potrebbe introdurre bug se non fatto correttamente

**Vantaggi**:
- ✅ Tutto su Vercel + Supabase
- ✅ File storage professionale e scalabile

**Svantaggi**:
- ❌ Richiede modifiche significative al codice
- ❌ Richiede testing approfondito
- ❌ Potenziale downtime durante la migrazione

## 🎯 Raccomandazione

**Usa Railway per il backend** (Opzione 1) perché:
1. **Sicuro**: Nessuna modifica al codice esistente
2. **Veloce**: Deploy in 5 minuti
3. **Testato**: Il codice funziona già così
4. **Economico**: Railway ha un tier gratuito generoso

La soluzione Vercel + Supabase + Railway è comune e stabile.

## 📝 Conclusione

**Non procedere con il deploy backend su Vercel** senza prima:
1. Migrare i file upload a Supabase Storage (o S3)
2. Modificare il codice per usare storage esterno
3. Testare approfonditamente tutte le funzionalità

**Procedi con Railway per il backend** - è la soluzione più sicura e veloce.

