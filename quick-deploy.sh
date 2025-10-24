#!/bin/bash
# quick-deploy.sh - Quick deployment script for remote VM

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Agent Maestro Remote Deployment${NC}"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not available${NC}"
    echo "Please install Docker Compose plugin"
    exit 1
fi

# Get image name
read -p "Enter Docker image name (e.g., ghcr.io/username/agent-maestro/tailscale:latest): " IMAGE_NAME
if [ -z "$IMAGE_NAME" ]; then
    echo -e "${RED}Error: Image name is required${NC}"
    exit 1
fi

# Check if authentication is needed for ghcr.io or private registries
if [[ "$IMAGE_NAME" == ghcr.io/* ]]; then
    echo ""
    echo "This image is on GitHub Container Registry."
    read -p "Is this a private image requiring authentication? [y/N]: " NEEDS_AUTH
    
    if [[ "$NEEDS_AUTH" =~ ^[Yy]$ ]]; then
        echo ""
        echo "You need a GitHub Personal Access Token (PAT)"
        echo "Create one at: https://github.com/settings/tokens/new"
        echo "Required scope: read:packages"
        echo ""
        read -p "GitHub username: " GH_USER
        read -sp "GitHub PAT (token): " GH_PAT
        echo ""
        
        if [ -n "$GH_USER" ] && [ -n "$GH_PAT" ]; then
            echo -e "${GREEN}Logging in to ghcr.io...${NC}"
            echo "$GH_PAT" | docker login ghcr.io -u "$GH_USER" --password-stdin
            if [ $? -ne 0 ]; then
                echo -e "${RED}Login failed. Please check your credentials.${NC}"
                exit 1
            fi
        fi
    fi
elif [[ "$IMAGE_NAME" =~ ^[^/]+/[^/]+:[^/]+$ ]]; then
    # Looks like Docker Hub format (username/image:tag)
    echo ""
    read -p "Is this a private Docker Hub image? [y/N]: " NEEDS_AUTH
    
    if [[ "$NEEDS_AUTH" =~ ^[Yy]$ ]]; then
        echo ""
        read -p "Docker Hub username: " DH_USER
        read -sp "Docker Hub password or token: " DH_PASS
        echo ""
        
        if [ -n "$DH_USER" ] && [ -n "$DH_PASS" ]; then
            echo -e "${GREEN}Logging in to Docker Hub...${NC}"
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
            if [ $? -ne 0 ]; then
                echo -e "${RED}Login failed. Please check your credentials.${NC}"
                exit 1
            fi
        fi
    fi
fi

# Get Tailscale auth key
echo ""
echo "Get your Tailscale auth key from: https://login.tailscale.com/admin/settings/keys"
read -sp "Enter Tailscale auth key: " TAILSCALE_KEY
echo ""
if [ -z "$TAILSCALE_KEY" ]; then
    echo -e "${RED}Error: Tailscale auth key is required${NC}"
    exit 1
fi

# Get username
read -p "Enter hostname prefix (default: $USER): " HOSTNAME_PREFIX
HOSTNAME_PREFIX=${HOSTNAME_PREFIX:-$USER}

# Ask about VS Code host
echo ""
echo "Where is VS Code running?"
echo "  1) Same machine as Docker (recommended for local setup)"
echo "  2) Different machine (provide Tailscale IP or hostname)"
read -p "Select option [1-2]: " VSCODE_OPTION

case $VSCODE_OPTION in
    1)
        VSCODE_HOST="host.docker.internal"
        echo -e "${GREEN}Using local VS Code instance${NC}"
        ;;
    2)
        read -p "Enter VS Code machine IP or hostname: " VSCODE_HOST
        if [ -z "$VSCODE_HOST" ]; then
            echo -e "${RED}Error: VS Code host is required${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

# Create directory
INSTALL_DIR="$HOME/agent-maestro"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo ""
echo -e "${GREEN}Creating configuration files...${NC}"

# Create .env file
cat > .env << EOF
# Tailscale Configuration
TAILSCALE_AUTH_KEY=$TAILSCALE_KEY
USER=$HOSTNAME_PREFIX

# VS Code API Configuration
VSCODE_HOST=$VSCODE_HOST
VSCODE_PORT=23333

# Demo Site Port
DEMO_PORT=3000

# Optional Settings
ENABLE_LOGGING=true
LOG_LEVEL=info
EOF

echo -e "${GREEN}Created .env file${NC}"

# Create docker-compose.yml
cat > docker-compose.yml << 'COMPOSE_EOF'
services:
  agent-maestro-demo:
    image: ${IMAGE_NAME}
    container_name: agent-maestro-demo
    hostname: agent-maestro-${USER:-demo}
    
    environment:
      - TAILSCALE_AUTH_KEY=${TAILSCALE_AUTH_KEY}
      - TAILSCALE_HOSTNAME=agent-maestro-${USER:-demo}
      - LOCAL_VSCODE_HOST=${VSCODE_HOST:-host.docker.internal}
      - LOCAL_VSCODE_PORT=${VSCODE_PORT:-23333}
      - API_BASE_URL=http://${VSCODE_HOST:-host.docker.internal}:${VSCODE_PORT:-23333}/api/v1
      - NODE_ENV=production
      - ENABLE_LOGGING=${ENABLE_LOGGING:-true}
      - LOG_LEVEL=${LOG_LEVEL:-info}
    
    ports:
      - "${DEMO_PORT:-3000}:3000"
    
    extra_hosts:
      - "host.docker.internal:host-gateway"
    
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    
    devices:
      - "/dev/net/tun:/dev/net/tun"
    
    volumes:
      - tailscale-data:/var/lib/tailscale
      - /lib/modules:/lib/modules:ro
    
    restart: unless-stopped
    
    security_opt:
      - no-new-privileges:true
    
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

volumes:
  tailscale-data:
    driver: local
COMPOSE_EOF

# Add IMAGE_NAME to .env
echo "IMAGE_NAME=$IMAGE_NAME" >> .env

echo -e "${GREEN}Created docker-compose.yml${NC}"

# Create management scripts
cat > start.sh << 'EOF'
#!/bin/bash
docker compose up -d
docker compose logs -f
EOF
chmod +x start.sh

cat > stop.sh << 'EOF'
#!/bin/bash
docker compose down
EOF
chmod +x stop.sh

cat > status.sh << 'EOF'
#!/bin/bash
echo "=== Container Status ==="
docker compose ps
echo ""
echo "=== Tailscale Status ==="
docker exec agent-maestro-demo tailscale status 2>/dev/null || echo "Container not running"
echo ""
echo "=== Tailscale IP ==="
docker exec agent-maestro-demo tailscale ip -4 2>/dev/null || echo "Container not running"
EOF
chmod +x status.sh

cat > logs.sh << 'EOF'
#!/bin/bash
docker compose logs -f
EOF
chmod +x logs.sh

echo -e "${GREEN}Created management scripts${NC}"

# Pull image
echo ""
echo -e "${GREEN}Pulling Docker image...${NC}"
docker compose pull

# Start service
echo ""
read -p "Start the service now? [y/N]: " START_NOW
if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}Starting service...${NC}"
    docker compose up -d
    
    echo ""
    echo -e "${GREEN}Waiting for container to start...${NC}"
    sleep 5
    
    echo ""
    echo "=== Service Status ==="
    docker compose ps
    
    echo ""
    echo "=== Getting Tailscale IP ==="
    sleep 10  # Wait for Tailscale to connect
    TAILSCALE_IP=$(docker exec agent-maestro-demo tailscale ip -4 2>/dev/null || echo "unknown")
    
    echo ""
    echo -e "${GREEN}Deployment complete!${NC}"
    echo ""
    echo "📍 Installation directory: $INSTALL_DIR"
    echo "🌐 Tailscale IP: $TAILSCALE_IP"
    echo ""
    echo "Access your deployment:"
    echo "  Demo Site: http://$TAILSCALE_IP:3000"
    echo "  API: http://$TAILSCALE_IP:23333/api/v1/info"
    echo "  OpenAPI: http://$TAILSCALE_IP:23333/openapi.json"
    echo ""
    echo "Management commands:"
    echo "  Start:  ./start.sh"
    echo "  Stop:   ./stop.sh"
    echo "  Status: ./status.sh"
    echo "  Logs:   ./logs.sh"
    echo ""
    echo "View logs:"
    docker compose logs --tail=50
else
    echo ""
    echo -e "${GREEN}Setup complete!${NC}"
    echo ""
    echo "📍 Installation directory: $INSTALL_DIR"
    echo ""
    echo "To start the service:"
    echo "  cd $INSTALL_DIR"
    echo "  ./start.sh"
    echo ""
    echo "Or manually:"
    echo "  docker compose up -d"
fi
