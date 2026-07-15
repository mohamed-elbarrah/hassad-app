#!/bin/bash
# Test AI Assistant end-to-end
set -e

API="http://localhost:3001/v1"

# Start server with all output to file
cd /home/mohamed/Documents/Apps/hassad-platform/apps/api
rm -f /tmp/ai-server.log
nohup node dist/src/main.js > /tmp/ai-server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server
for i in $(seq 1 30); do
  if curl -s "$API/health/live" > /dev/null 2>&1; then
    echo "Server is up"
    break
  fi
  sleep 1
done

# Login
LOGIN=$(curl -s "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hassad.com","password":"password123"}')
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "Login failed: $LOGIN"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi
echo "Token obtained: ${TOKEN:0:20}..."

# Create conversation
CONV=$(curl -s "$API/ai-assistant/conversations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"اختبار الأدوات","areas":["ALL"]}')

echo "Create response: $CONV"
CONV_ID=$(echo "$CONV" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
if [ -z "$CONV_ID" ]; then
  echo "Failed to create conversation"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi
echo "Conversation ID: $CONV_ID"

# Send SSE message with timeout
echo ""
echo "=== SENDING MESSAGE WITH TOOL CALLING ==="
timeout 120 curl -s -N "$API/ai-assistant/conversations/$CONV_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"مرحباً، كم عدد العملاء والمشاريع الحالية؟"}' 2>&1

echo ""
echo "=== TEST COMPLETE ==="

# Kill server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "Server stopped"
