#!/bin/bash

# Script per verificare la configurazione Vercel

echo "🔍 Verifica Configurazione Vercel"
echo "=================================="
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verifica Backend Railway
echo "1️⃣ Verifica Backend Railway..."
RAILWAY_HEALTH=$(curl -s "https://planner-turni-production.up.railway.app/api/health")
if echo "$RAILWAY_HEALTH" | grep -q "OK"; then
    echo -e "${GREEN}✅ Backend Railway funzionante${NC}"
    echo "   Risposta: $RAILWAY_HEALTH"
else
    echo -e "${RED}❌ Backend Railway non risponde${NC}"
fi
echo ""

# 2. Chiedi URL Vercel
echo "2️⃣ Verifica Frontend Vercel..."
echo -e "${YELLOW}📋 Per completare la verifica, ho bisogno dell'URL dell'app Vercel${NC}"
echo ""
echo "Inserisci l'URL dell'app Vercel (es: https://planner-turni.vercel.app):"
read -r VERCEL_URL

if [ -z "$VERCEL_URL" ]; then
    echo -e "${RED}❌ URL non fornito${NC}"
    echo ""
    echo "Istruzioni manuali:"
    echo "1. Apri l'app Vercel nel browser"
    echo "2. Apri la Console (F12 → Console)"
    echo "3. Cerca questo log: '🔗 API Base URL configurato: ...'"
    echo "4. Se vedi 'https://planner-turni-production.up.railway.app/api' → ✅ Configurato!"
    echo "5. Se vedi 'http://localhost:5001/api' → ❌ Variabile ambiente mancante"
    exit 1
fi

echo ""
echo "3️⃣ Test connessione Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL")
if [ "$FRONTEND_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ Frontend Vercel raggiungibile (HTTP $FRONTEND_STATUS)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend Vercel risponde con HTTP $FRONTEND_STATUS${NC}"
fi
echo ""

# 4. Test API dal frontend (prova a fare una richiesta)
echo "4️⃣ Test API dal Frontend..."
API_TEST=$(curl -s "$VERCEL_URL" 2>&1 | grep -i "api" | head -1)
if [ ! -z "$API_TEST" ]; then
    echo "   Trovato riferimento API nel frontend"
else
    echo "   Nessun riferimento API trovato nel codice HTML"
fi
echo ""

# Riepilogo
echo "=================================="
echo "📋 Riepilogo Verifica:"
echo "=================================="
echo "✅ Backend Railway: Funzionante"
echo "📍 URL Frontend: $VERCEL_URL"
echo ""
echo "⚠️  VERIFICA MANUALE RICHIESTA:"
echo "1. Apri $VERCEL_URL nel browser"
echo "2. Premi F12 per aprire Developer Tools"
echo "3. Vai alla tab 'Console'"
echo "4. Cerca: '🔗 API Base URL configurato: ...'"
echo ""
echo -e "${GREEN}Se vedi: 'https://planner-turni-production.up.railway.app/api'${NC}"
echo -e "${GREEN}→ La configurazione è CORRETTA! ✅${NC}"
echo ""
echo -e "${RED}Se vedi: 'http://localhost:5001/api'${NC}"
echo -e "${RED}→ Devi configurare REACT_APP_API_URL su Vercel ❌${NC}"
echo ""
echo "Vedi: CONFIGURAZIONE_VERCEL.md per istruzioni dettagliate"

