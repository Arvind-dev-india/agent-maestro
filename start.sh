#!/bin/bash
# Start the Agent Maestro demo site

set -e

echo "Starting Agent Maestro Demo Site..."

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Start the service
docker compose up -d

echo "Service started!"
echo ""
echo "Checking container status..."
docker compose ps

echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
echo ""

# Wait a bit for container to start and get Tailscale IP
sleep 10

echo "Getting Tailscale IP..."
TAILSCALE_IP=$(docker exec agent-maestro-demo tailscale ip -4 2>/dev/null || echo "Not available yet")

if [ "$TAILSCALE_IP" != "Not available yet" ]; then
    echo "Demo site is available at:"
    echo "  Tailscale network: http://$TAILSCALE_IP:3000"
    echo "  Local access: http://localhost:3000"
else
    echo "Tailscale IP not available yet. Check logs with: docker compose logs -f"
fi
