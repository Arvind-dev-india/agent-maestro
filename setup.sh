#!/bin/bash
# setup.sh - One-time setup script for Agent Maestro with Tailscale

set -e

echo "=== Agent Maestro Setup with Tailscale ==="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
print_step "Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Check if we're running on a supported platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="Linux"
else
    print_warning "Unsupported platform: $OSTYPE. Proceeding anyway..."
    PLATFORM="Unknown"
fi

print_status "Platform: $PLATFORM"

# Check for Tailscale auth key
print_step "Checking Tailscale configuration..."

if [ -z "$TAILSCALE_AUTH_KEY" ]; then
    print_warning "TAILSCALE_AUTH_KEY environment variable is not set"
    echo ""
    echo "To get your Tailscale auth key:"
    echo "1. Go to https://login.tailscale.com/admin/settings/keys"
    echo "2. Generate a new auth key"
    echo "3. Set it as an environment variable:"
    echo "   export TAILSCALE_AUTH_KEY='tskey-auth-xxxxx'"
    echo ""
    read -p "Do you want to enter your auth key now? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Tailscale auth key: " TAILSCALE_AUTH_KEY
        if [ -z "$TAILSCALE_AUTH_KEY" ]; then
            print_error "No auth key provided. Exiting."
            exit 1
        fi
    else
        print_warning "Continuing without Tailscale auth key. Container will start without Tailscale connectivity."
    fi
fi

# No authentication setup needed for Tailscale network
print_step "Configuring for Tailscale network access..."

print_status "Authentication disabled - using Tailscale network security"
DEMO_PORT="${DEMO_PORT:-3000}"

# Create .env file
print_step "Creating environment configuration..."

cat > .env << EOF
# Tailscale Configuration
TAILSCALE_AUTH_KEY=$TAILSCALE_AUTH_KEY

# Server Configuration
DEMO_PORT=$DEMO_PORT
USER=$(whoami)

# Optional: Uncomment and modify as needed
# SESSION_TIMEOUT=3600000
# RATE_LIMIT_MAX=100
# API_TIMEOUT=30000
# LOG_LEVEL=info
# CORS_ORIGINS=http://localhost:$DEMO_PORT
EOF

print_status "Configuration saved to .env"

# Create a simple management script
print_step "Creating management scripts..."

cat > start.sh << 'EOF'
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
EOF

chmod +x start.sh

cat > stop.sh << 'EOF'
#!/bin/bash
# Stop the Agent Maestro demo site

echo "Stopping Agent Maestro Demo Site..."
docker compose down
echo "Service stopped!"
EOF

chmod +x stop.sh

cat > logs.sh << 'EOF'
#!/bin/bash
# View logs from the Agent Maestro demo site

echo "Showing Agent Maestro Demo Site logs..."
echo "Press Ctrl+C to exit"
docker compose logs -f
EOF

chmod +x logs.sh

cat > status.sh << 'EOF'
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
EOF

chmod +x status.sh

print_status "Created management scripts: start.sh, stop.sh, logs.sh, status.sh"

# Show final configuration
print_step "Setup complete!"

echo ""
echo "=== Configuration Summary ==="
echo "Demo Port: $DEMO_PORT"
echo "Platform: $PLATFORM"
echo "Authentication: Disabled (Tailscale network security)"

if [ -n "$TAILSCALE_AUTH_KEY" ]; then
    echo "Tailscale: Configured ✅"
else
    echo "Tailscale: Not configured ⚠️"
fi

echo ""
echo "=== Next Steps ==="
echo "1. Make sure VS Code with Agent Maestro extension is running on port 23333"
echo "2. Start the demo site:"
echo "   ./start.sh"
echo ""
echo "3. Check status:"
echo "   ./status.sh"
echo ""
echo "4. View logs:"
echo "   ./logs.sh"
echo ""
echo "5. Stop the service:"
echo "   ./stop.sh"
echo ""

if [ -n "$TAILSCALE_AUTH_KEY" ]; then
    print_status "Once started, the demo site will be accessible from any device on your Tailscale network!"
else
    print_warning "Without Tailscale, the demo site will only be accessible locally."
fi

echo ""
print_status "Setup completed successfully! 🎉"