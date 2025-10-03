#!/bin/bash
# Check status of Agent Maestro demo site

echo "=== Container Status ==="
docker compose ps

echo ""
echo "=== Health Check ==="
if docker compose ps | grep -q "healthy"; then
    echo "✅ Container is healthy"
elif docker compose ps | grep -q "unhealthy"; then
    echo "❌ Container is unhealthy"
elif docker compose ps | grep -q "starting"; then
    echo "🔄 Container is starting"
else
    echo "❓ Container status unknown"
fi

echo ""
echo "=== Tailscale Status ==="
TAILSCALE_IP=$(docker exec agent-maestro-demo tailscale ip -4 2>/dev/null || echo "Not available")
if [ "$TAILSCALE_IP" != "Not available" ]; then
    echo "✅ Tailscale connected: $TAILSCALE_IP"
    echo "   Access via: http://$TAILSCALE_IP:3000"
else
    echo "❌ Tailscale not connected"
fi

echo ""
echo "=== VS Code Connection ==="
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:23333/api/v1/info | grep -q "200"; then
    echo "✅ VS Code extension is accessible"
else
    echo "❌ VS Code extension not accessible (make sure it's running on port 23333)"
fi

echo ""
echo "=== Access Information ==="
echo "Local URL: http://localhost:3000"
if [ "$TAILSCALE_IP" != "Not available" ]; then
    echo "Tailscale URL: http://$TAILSCALE_IP:3000"
fi
echo "Authentication: None required (Tailscale network security)"
