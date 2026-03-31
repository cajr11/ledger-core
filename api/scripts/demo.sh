#!/bin/bash
# Demo script for ledger-core
# Creates test users, funds accounts, and runs transfers
# Prerequisites: API running at localhost:3000, all Docker services up

API="http://localhost:3000"
set -e

echo "=== Ledger Core Demo ==="
echo ""

# 1. Create users
echo "--- Creating users ---"
CARLOS=$(curl -s -X POST "$API/users" -H "Content-Type: application/json" \
  -d '{"email":"carlos@demo.com","fullName":"Carlos Martinez","country":"MX"}')
CARLOS_ID=$(echo $CARLOS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Carlos (MX): $CARLOS_ID"

MARIA=$(curl -s -X POST "$API/users" -H "Content-Type: application/json" \
  -d '{"email":"maria@demo.com","fullName":"Maria Lopez","country":"MX"}')
MARIA_ID=$(echo $MARIA | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Maria  (MX): $MARIA_ID"

KWAME=$(curl -s -X POST "$API/users" -H "Content-Type: application/json" \
  -d '{"email":"kwame@demo.com","fullName":"Kwame Asante","country":"GH"}')
KWAME_ID=$(echo $KWAME | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Kwame  (GH): $KWAME_ID"

echo ""

# 2. Fund Carlos with MXN
echo "--- Funding accounts ---"
curl -s -X POST "$API/transfers/fund" -H "Content-Type: application/json" \
  -d "{\"userId\":\"$CARLOS_ID\",\"currency\":\"MXN\",\"amount\":\"500000\"}" | echo "Carlos funded: 5,000 MXN (500,000 centavos)"

curl -s -X POST "$API/transfers/fund" -H "Content-Type: application/json" \
  -d "{\"userId\":\"$MARIA_ID\",\"currency\":\"MXN\",\"amount\":\"200000\"}" | echo "Maria funded:  2,000 MXN (200,000 centavos)"

echo ""

# 3. Check balances
echo "--- Checking balances ---"
CARLOS_ACCOUNTS=$(curl -s "$API/users/$CARLOS_ID/accounts")
CARLOS_ACC_ID=$(echo $CARLOS_ACCOUNTS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
CARLOS_BAL=$(curl -s "$API/users/account/$CARLOS_ACC_ID")
echo "Carlos balance: $CARLOS_BAL"

echo ""

# 4. Same-currency transfer
echo "--- Same-currency transfer (Carlos -> Maria, MXN) ---"
TRANSFER=$(curl -s -X POST "$API/transfers/create" -H "Content-Type: application/json" \
  -d "{\"idempotencyKey\":\"demo-same-001\",\"senderId\":\"$CARLOS_ID\",\"recipientId\":\"$MARIA_ID\",\"senderCurrency\":\"MXN\",\"recipientCurrency\":\"MXN\",\"amount\":\"50000\"}")
TRANSFER_ID=$(echo $TRANSFER | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Transfer: $TRANSFER_ID"
echo "Status: $(echo $TRANSFER | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"

echo ""

# 5. Get a quote for cross-border
echo "--- Cross-border quote (MXN -> GHS) ---"
QUOTE=$(curl -s -X POST "$API/quotes" -H "Content-Type: application/json" \
  -d '{"senderCurrency":"MXN","recipientCurrency":"GHS","amount":"100000"}')
QUOTE_ID=$(echo $QUOTE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Quote: $QUOTE"

echo ""

# 6. Cross-border transfer using quote
echo "--- Cross-border transfer (Carlos -> Kwame, MXN -> GHS) ---"
CROSS=$(curl -s -X POST "$API/transfers/create" -H "Content-Type: application/json" \
  -d "{\"idempotencyKey\":\"demo-cross-001\",\"senderId\":\"$CARLOS_ID\",\"senderCurrency\":\"MXN\",\"recipientCurrency\":\"GHS\",\"amount\":\"100000\",\"quoteId\":\"$QUOTE_ID\",\"recipientDetails\":{\"name\":\"Kwame Asante\",\"country\":\"GH\",\"accountNumber\":\"1234567890\"}}")
CROSS_ID=$(echo $CROSS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Transfer: $CROSS_ID"
echo "Status: $(echo $CROSS | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)"

echo ""
echo "--- Waiting for webhooks (6 seconds) ---"
sleep 6

# 7. Check final state
echo ""
echo "--- Transfer history ---"
curl -s "$API/transfers/$CROSS_ID/history" | python3 -m json.tool 2>/dev/null || curl -s "$API/transfers/$CROSS_ID/history"

echo ""
echo "--- Carlos final balance ---"
curl -s "$API/users/account/$CARLOS_ACC_ID"

echo ""
echo ""
echo "=== Demo complete ==="
