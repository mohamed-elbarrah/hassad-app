#!/bin/bash
set -e

API_URL="http://localhost:3001/v1"

# Start server
echo "Starting API server..."
cd apps/api && node dist/src/main.js > /tmp/api-server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server
sleep 5

# Check server is running
if ! curl -s "$API_URL/health/live" > /dev/null 2>&1; then
  echo "Server not responding"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi
echo "Server is up"

# Login
echo "Logging in as admin..."
LOGIN_RESP=$(curl -s -c /tmp/cookies.txt "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hassad.com","password":"password123"}')
echo "Login response: $LOGIN_RESP"

# Create conversation
echo "Creating conversation..."
CONV_RESP=$(curl -s -b /tmp/cookies.txt "$API_URL/ai-assistant/conversations" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","areas":["ALL"]}')
echo "Create response: $CONV_RESP"
CONV_ID=$(echo "$CONV_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
if [ -z "$CONV_ID" ]; then
  echo "Failed to create conversation"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi
echo "Conversation ID: $CONV_ID"

# Send message via SSE
echo "Sending message..."
curl -s -N -b /tmp/cookies.txt "$API_URL/ai-assistant/conversations/$CONV_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{"content":"مرحباً، أعطني ملخص سريع عن عدد العملاء والمشاريع الحالية"}' \
  --max-time 120 2>&1 | head -200

echo ""
echo "Test complete"
kill $SERVER_PID 2>/dev/null
echo "Server stopped"
