#!/bin/bash

# Script per testare gli endpoint API su Railway

RAILWAY_API="https://planner-turni-production.up.railway.app/api"

echo "🔍 Test API Railway Backend"
echo "============================"
echo ""

# Test 1: Health Check
echo "1️⃣ Test Health Check..."
HEALTH=$(curl -s "$RAILWAY_API/health")
echo "   Risultato: $HEALTH"
echo ""

# Test 2: Login
echo "2️⃣ Test Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$RAILWAY_API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identificatore": "arena@advpro.it",
    "password": "Uditore20",
    "congregazione_codice": "001"
  }')

echo "   Risultato: $LOGIN_RESPONSE"
echo ""

# Estrai token se il login ha successo
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
  echo "✅ Login riuscito! Token ottenuto."
  echo ""
  
  # Test 3: Congregazioni (richiede auth)
  echo "3️⃣ Test GET Congregazioni (con token)..."
  CONG_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$RAILWAY_API/congregazioni")
  echo "   Risultato: $CONG_RESPONSE" | head -c 200
  echo ""
  echo ""
  
  # Test 4: Volontari (richiede auth)
  echo "4️⃣ Test GET Volontari (con token)..."
  VOL_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$RAILWAY_API/volontari?page=1&limit=5")
  echo "   Risultato: $VOL_RESPONSE" | head -c 200
  echo ""
  echo ""
else
  echo "❌ Login fallito. Verifica credenziali o dati migrati."
fi

echo "============================"
echo "✅ Test completati!"

