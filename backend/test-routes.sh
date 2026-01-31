#!/usr/bin/env bash
# Quick test for MIRA backend. Start the server first: npm run dev

BASE="${1:-http://localhost:3001}"

echo "=== Health ==="
curl -s "$BASE/health" | head -1

echo -e "\n\n=== Routes (Jungfernstieg → Hamburg Hbf) ==="
curl -s -X POST "$BASE/api/routes" \
  -H "Content-Type: application/json" \
  -d '{"start":"Jungfernstieg","end":"Hamburg Hbf"}' | head -50
