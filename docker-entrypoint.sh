#!/bin/bash
# docker-entrypoint.sh

set -e

echo "=== Agent Maestro Demo Site with Tailscale ==="
echo "Starting Tailscale daemon..."

# Create necessary directories
mkdir -p /var/run/tailscale /var/cache/tailscale /var/lib/tailscale

# Start tailscaled in background using correct Alpine Linux flags
/usr/sbin/tailscaled --statedir=/var/lib/tailscale --socket=/var/run/tailscale/tailscaled.sock --tun=userspace-networking &
TAILSCALED_PID=$!

# Wait for tailscaled to be ready
sleep 5

# Check if tailscaled is running (use Alpine compatible ps command)
if ! ps | grep -q tailscaled; then
    echo "ERROR: tailscaled failed to start"
    exit 1
fi

echo "Tailscaled started with PID: $TAILSCALED_PID"

# Authenticate with Tailscale using auth key
if [ -n "$TAILSCALE_AUTH_KEY" ]; then
    echo "Authenticating with Tailscale..."
    HOSTNAME="${TAILSCALE_HOSTNAME:-agent-maestro-$(hostname)}"
    
    /usr/bin/tailscale up --auth-key="$TAILSCALE_AUTH_KEY" \
        --hostname="$HOSTNAME" \
        --accept-routes=false \
        --accept-dns=false
    
    # Wait for connection to establish
    echo "Waiting for Tailscale connection..."
    for i in {1..30}; do
        if /usr/bin/tailscale status --json | grep -q '"BackendState":"Running"'; then
            echo "Tailscale connected successfully!"
            break
        fi
        echo "Waiting for connection... ($i/30)"
        sleep 2
    done
    
    # Get Tailscale IP
    TAILSCALE_IP=$(/usr/bin/tailscale ip -4 2>/dev/null || echo "unknown")
    echo "Tailscale IP: $TAILSCALE_IP"
    
    # Export for use by demo site
    export TAILSCALE_IP="$TAILSCALE_IP"
    export TAILSCALE_STATUS="connected"
    
else
    echo "WARNING: No Tailscale auth key provided (TAILSCALE_AUTH_KEY)"
    echo "Container will start without Tailscale connectivity"
    export TAILSCALE_STATUS="disabled"
fi

# Set environment variables for the demo site
export NODE_ENV="${NODE_ENV:-production}"
export API_BASE_URL="${API_BASE_URL:-http://host.docker.internal:23333/api/v1}"
export LOCAL_VSCODE_HOST="${LOCAL_VSCODE_HOST:-host.docker.internal}"
export LOCAL_VSCODE_PORT="${LOCAL_VSCODE_PORT:-23333}"

echo ""
echo "=== Configuration ==="
echo "Demo site URL: http://$TAILSCALE_IP:3000 (via Tailscale)"
echo "Local URL: http://localhost:3000 (if port mapped)"
echo "VS Code API (host): $API_BASE_URL"
echo "VS Code API (Tailscale): http://$TAILSCALE_IP:$LOCAL_VSCODE_PORT"
echo "  - OpenAPI Spec: http://$TAILSCALE_IP:$LOCAL_VSCODE_PORT/openapi.json"
echo "  - System Info: http://$TAILSCALE_IP:$LOCAL_VSCODE_PORT/api/v1/info"
echo "  - All API endpoints accessible via Tailscale network"
echo "Tailscale Status: $TAILSCALE_STATUS"
echo "Authentication: Disabled (Tailscale network security)"
echo "====================="
echo ""

# Start the demo site
echo "Starting demo site..."
cd /app
npm start &
DEMO_SITE_PID=$!

# Start TCP forwarder to expose host VS Code API over Tailscale
if [ -n "$LOCAL_VSCODE_PORT" ]; then
  echo "Starting VS Code API forwarder on port $LOCAL_VSCODE_PORT (-> $LOCAL_VSCODE_HOST:$LOCAL_VSCODE_PORT) ..."
  socat TCP-LISTEN:$LOCAL_VSCODE_PORT,fork,reuseaddr TCP:$LOCAL_VSCODE_HOST:$LOCAL_VSCODE_PORT &
  FORWARD_PID=$!
fi

# Function to handle shutdown
shutdown() {
    echo "Shutting down services..."
    kill $DEMO_SITE_PID 2>/dev/null || true
    kill $TAILSCALED_PID 2>/dev/null || true
    [ -n "$FORWARD_PID" ] && kill $FORWARD_PID 2>/dev/null || true
    wait $DEMO_SITE_PID 2>/dev/null || true
    wait $TAILSCALED_PID 2>/dev/null || true
    echo "Shutdown complete"
    exit 0
}

# Set up signal handlers
trap shutdown SIGTERM SIGINT

# Wait for either process to exit
wait $DEMO_SITE_PID $TAILSCALED_PID