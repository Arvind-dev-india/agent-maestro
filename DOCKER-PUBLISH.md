# Publishing and Using Agent Maestro Docker Image

This guide explains how to publish the Agent Maestro Docker image and use it on remote VMs.

## 📦 Publishing the Docker Image

### Option 1: Docker Hub (Public/Private)

#### 1. Build the image

```bash
# Clone the repository
git clone https://github.com/yourusername/agent-maestro.git
cd agent-maestro

# Build the image
docker build -f Dockerfile.tailscale -t yourusername/agent-maestro-tailscale:latest .

# Optionally tag with version
docker tag yourusername/agent-maestro-tailscale:latest yourusername/agent-maestro-tailscale:2.3.5
```

#### 2. Login to Docker Hub

```bash
docker login
```

#### 3. Push to Docker Hub

```bash
# Push latest tag
docker push yourusername/agent-maestro-tailscale:latest

# Push version tag
docker push yourusername/agent-maestro-tailscale:2.3.5
```

### Option 2: GitHub Container Registry (ghcr.io)

#### 1. Login to GitHub Container Registry

```bash
# Create a Personal Access Token (PAT) with write:packages scope
# https://github.com/settings/tokens

echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

#### 2. Build and tag

```bash
docker build -f Dockerfile.tailscale -t ghcr.io/yourusername/agent-maestro-tailscale:latest .
docker tag ghcr.io/yourusername/agent-maestro-tailscale:latest ghcr.io/yourusername/agent-maestro-tailscale:2.3.5
```

#### 3. Push to GHCR

```bash
docker push ghcr.io/yourusername/agent-maestro-tailscale:latest
docker push ghcr.io/yourusername/agent-maestro-tailscale:2.3.5
```

### Option 3: Private Registry

```bash
# Tag for private registry
docker tag yourusername/agent-maestro-tailscale:latest registry.example.com/agent-maestro-tailscale:latest

# Push to private registry
docker push registry.example.com/agent-maestro-tailscale:latest
```

## 🚀 Using the Published Image on Remote VM

### Prerequisites on Remote VM

1. Docker and Docker Compose installed
2. Tailscale installed (optional, but recommended for accessing VS Code on another machine)
3. Access to `/dev/net/tun` device
4. Tailscale auth key

### Setup on Remote VM

#### 1. Create project directory

```bash
mkdir -p ~/agent-maestro
cd ~/agent-maestro
```

#### 2. Download docker-compose file

```bash
# Download the remote compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/yourusername/agent-maestro/main/docker-compose.remote.yml

# Or manually create it (see docker-compose.remote.yml)
```

#### 3. Create environment file

```bash
cat > .env << 'EOF'
# Tailscale auth key (REQUIRED)
TAILSCALE_AUTH_KEY=tskey-auth-your-key-here

# Your username for hostname
USER=myusername

# VS Code API host (REQUIRED - choose one option below)

# Option A: VS Code on same machine as Docker
VSCODE_HOST=host.docker.internal

# Option B: VS Code on different machine (use Tailscale IP)
# VSCODE_HOST=100.x.x.x

# Option C: VS Code on different machine (use Tailscale hostname)
# VSCODE_HOST=my-vscode-machine

VSCODE_PORT=23333
DEMO_PORT=3000
EOF
```

#### 4. Update docker-compose.yml with your image

Edit `docker-compose.yml` and replace:

```yaml
image: yourusername/agent-maestro-tailscale:latest
```

With your actual image name, for example:

```yaml
image: ghcr.io/yourusername/agent-maestro-tailscale:latest
```

#### 5. Start the service

```bash
# Pull the image
docker compose pull

# Start the service
docker compose up -d

# View logs
docker compose logs -f
```

## 📋 Deployment Scenarios

### Scenario 1: VS Code on Same Machine as Docker

**Use Case**: Running Docker container on the same machine where VS Code is installed.

```bash
# .env file
TAILSCALE_AUTH_KEY=tskey-auth-xxx
VSCODE_HOST=host.docker.internal
VSCODE_PORT=23333
USER=myusername
```

**How it works**: Docker's `host.docker.internal` resolves to the host machine's localhost.

### Scenario 2: VS Code on Different Machine (Tailscale Network)

**Use Case**: VS Code running on one machine, Docker container on another, both on Tailscale network.

```bash
# .env file
TAILSCALE_AUTH_KEY=tskey-auth-xxx
VSCODE_HOST=100.64.1.50  # Tailscale IP of VS Code machine
VSCODE_PORT=23333
USER=myusername
```

**Prerequisites**:

- VS Code machine has Tailscale installed and connected
- Agent Maestro extension is exposing API on port 23333
- Both machines can communicate over Tailscale network

### Scenario 3: Multiple VMs, Centralized VS Code

**Use Case**: One VS Code instance, multiple Docker containers on different VMs.

1. **On VS Code Machine**:

   - Install Tailscale
   - Install Agent Maestro extension
   - Ensure API is accessible: `http://localhost:23333/api/v1/info`
   - Get Tailscale IP: `tailscale ip -4`

2. **On Each VM**:
   ```bash
   # .env file
   TAILSCALE_AUTH_KEY=tskey-auth-xxx-vm1  # Different key for each VM
   VSCODE_HOST=100.64.1.10  # Tailscale IP of VS Code machine
   VSCODE_PORT=23333
   USER=vm1  # Different username for each VM
   ```

## 🔧 Management Commands

### Start/Stop

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Restart
docker compose restart
```

### View Logs

```bash
# Follow logs
docker compose logs -f

# View last 100 lines
docker compose logs --tail=100
```

### Check Status

```bash
# Container status
docker compose ps

# Tailscale status
docker exec agent-maestro-demo tailscale status

# Get Tailscale IP
docker exec agent-maestro-demo tailscale ip -4
```

### Update Image

```bash
# Pull latest image
docker compose pull

# Restart with new image
docker compose up -d
```

## 🧪 Testing After Deployment

```bash
# Get the Tailscale IP
TAILSCALE_IP=$(docker exec agent-maestro-demo tailscale ip -4)

# Test demo site (from any Tailscale device)
curl http://$TAILSCALE_IP:3000

# Test API (from any Tailscale device)
curl http://$TAILSCALE_IP:23333/api/v1/info

# Test OpenAPI spec
curl http://$TAILSCALE_IP:23333/openapi.json | jq '.info'
```

## 🔍 Troubleshooting

### Image Pull Issues

```bash
# Check if you're logged in
docker login

# For GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull manually
docker pull yourusername/agent-maestro-tailscale:latest
```

### VS Code Connection Issues

```bash
# Test from container to VS Code host
docker exec agent-maestro-demo curl http://$VSCODE_HOST:$VSCODE_PORT/api/v1/info

# Check environment variables
docker exec agent-maestro-demo env | grep VSCODE
```

### Tailscale Connection Issues

```bash
# Check Tailscale status in container
docker exec agent-maestro-demo tailscale status

# View Tailscale logs
docker logs agent-maestro-demo | grep -i tailscale
```

## 📝 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/docker-publish.yml`:

```yaml
name: Publish Docker Image

on:
  push:
    branches: [main]
    tags: ["v*"]
  release:
    types: [published]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}-tailscale

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.tailscale
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

## 🌍 Multi-Architecture Builds

To support ARM and AMD64:

```bash
# Create builder
docker buildx create --name multiarch --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.tailscale \
  -t yourusername/agent-maestro-tailscale:latest \
  --push \
  .
```

## 🔐 Security Best Practices

1. **Use separate Tailscale auth keys** for each deployment
2. **Set auth key expiration** in Tailscale admin console
3. **Use tagged versions** instead of `:latest` in production
4. **Rotate auth keys** periodically
5. **Use private registries** for proprietary deployments
6. **Limit container resources** in docker-compose.yml
7. **Enable auto-updates** for security patches

## 📚 Additional Resources

- [Tailscale Auth Keys](https://login.tailscale.com/admin/settings/keys)
- [Docker Hub](https://hub.docker.com/)
- [GitHub Container Registry](https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
