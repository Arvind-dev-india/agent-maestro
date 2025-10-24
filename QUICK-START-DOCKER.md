# 🐳 Quick Reference: Docker Image Publishing & Deployment

## For Maintainers: Publishing the Image

### Quick Publish

```bash
# Build and push to Docker Hub
./build-and-push.sh --username YOUR_DOCKERHUB_USERNAME --version 2.3.5

# Build and push to GitHub Container Registry
./build-and-push.sh --username YOUR_GITHUB_USERNAME --registry ghcr.io --version 2.3.5

# Multi-architecture (AMD64 + ARM64)
./build-and-push.sh --username YOUR_USERNAME --multiarch --version 2.3.5
```

### Automated Publishing (GitHub Actions)

Just push to GitHub - the workflow will auto-build and publish!

---

## For Users: Deploying on Remote VM

### One-Line Deploy (Easiest)

```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/agent-maestro/main/quick-deploy.sh | bash
```

### Manual Deploy

```bash
# 1. Create directory
mkdir ~/agent-maestro && cd ~/agent-maestro

# 2. Download compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/YOUR_USERNAME/agent-maestro/main/docker-compose.remote.yml

# 3. Create .env file
cat > .env << EOF
TAILSCALE_AUTH_KEY=tskey-auth-YOUR-KEY-HERE
VSCODE_HOST=host.docker.internal  # or Tailscale IP if remote
VSCODE_PORT=23333
USER=myusername
EOF

# 4. Update image name in docker-compose.yml
# Change: image: YOUR_USERNAME/agent-maestro-tailscale:latest

# 5. Deploy
docker compose pull
docker compose up -d
```

---

## Quick Checks

### After Deployment

```bash
# Get Tailscale IP
docker exec agent-maestro-demo tailscale ip -4

# Check status
docker exec agent-maestro-demo tailscale status

# Test API
curl http://$(docker exec agent-maestro-demo tailscale ip -4):23333/api/v1/info
```

### Access URLs

Replace `TAILSCALE_IP` with your container's Tailscale IP:

- **Demo Site**: `http://TAILSCALE_IP:3000`
- **API Info**: `http://TAILSCALE_IP:23333/api/v1/info`
- **OpenAPI**: `http://TAILSCALE_IP:23333/openapi.json`

---

## 📚 Full Documentation

- **[DOCKER-PUBLISH.md](DOCKER-PUBLISH.md)** - Complete publishing guide
- **[DOCKER-IMAGE-SETUP.md](DOCKER-IMAGE-SETUP.md)** - Implementation details
- **[README-Docker.md](README-Docker.md)** - Main Docker guide
- **[TAILSCALE-API-ACCESS.md](TAILSCALE-API-ACCESS.md)** - API access details

---

## 🆘 Common Issues

**Image won't pull?**

```bash
# Login to registry
docker login  # Docker Hub
docker login ghcr.io  # GitHub
```

**Can't connect to VS Code API?**

```bash
# Test from container
docker exec agent-maestro-demo curl http://host.docker.internal:23333/api/v1/info

# If VS Code is remote, use Tailscale IP
VSCODE_HOST=100.64.1.10  # in .env
```

**Tailscale not connecting?**

```bash
# Check logs
docker logs agent-maestro-demo | grep -i tailscale

# Verify auth key is valid
# Get new key: https://login.tailscale.com/admin/settings/keys
```
