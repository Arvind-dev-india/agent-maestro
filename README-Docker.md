# Agent Maestro Docker Deployment with Tailscale

This guide explains how to deploy Agent Maestro demo site with Tailscale integration using Docker, allowing remote access to your VS Code AI extensions from anywhere in your Tailscale network.

## 🎯 Overview

The Docker deployment creates a container that:
- Runs the Agent Maestro demo website
- Connects to your Tailscale network automatically
- Provides secure remote access to your local VS Code extension
- Requires no authentication (secured by Tailscale network)

## 🚀 Quick Start

### Prerequisites

1. **Docker and Docker Compose** installed on your system
2. **Tailscale account** with an auth key
3. **VS Code with Agent Maestro extension** running locally
4. **Supported AI extension** (Roo, Cline, etc.) installed in VS Code

### Step 1: Get Tailscale Auth Key

1. Go to [Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys)
2. Generate a new auth key
3. Copy the auth key (starts with `tskey-auth-`)

### Step 2: Setup and Deploy

```bash
# Clone the repository (if not already done)
cd /path/to/agent-maestro

# Set your Tailscale auth key
export TAILSCALE_AUTH_KEY="tskey-auth-your-key-here"

# Run the setup script
chmod +x setup.sh
./setup.sh

# Start the service
./start.sh
```

### Step 3: Access Your Demo Site

After starting, you'll get output like:
```
Demo site is available at:
  Tailscale network: http://100.x.x.x:3000
  Local access: http://localhost:3000
```

Access the demo site from any device in your Tailscale network using the provided IP address.

## 📋 Detailed Setup

### Manual Setup

If you prefer manual setup:

```bash
# 1. Create environment file
cat > .env << EOF
TAILSCALE_AUTH_KEY=tskey-auth-your-key-here
DEMO_PORT=3000
USER=$(whoami)
EOF

# 2. Build and start
docker compose up -d

# 3. Check status
docker compose ps
docker compose logs -f
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TAILSCALE_AUTH_KEY` | Tailscale authentication key | - | Yes |
| `DEMO_PORT` | Port to expose demo site | 3000 | No |
| `LOCAL_VSCODE_HOST` | VS Code host address | host.docker.internal | No |
| `LOCAL_VSCODE_PORT` | VS Code extension port | 23333 | No |
| `LOG_LEVEL` | Logging level | info | No |

## 🔧 Management Scripts

The setup creates several management scripts:

### `./start.sh` - Start the service
```bash
./start.sh
```

### `./stop.sh` - Stop the service
```bash
./stop.sh
```

### `./logs.sh` - View logs
```bash
./logs.sh
```

### `./status.sh` - Check status
```bash
./status.sh
```

## 🌐 Network Architecture

```
Your Device (Tailscale) → Tailscale Network → Docker Container → localhost:23333 (VS Code)
```

1. **Your Device**: Any device in your Tailscale network
2. **Tailscale Network**: Encrypted tunnel to the Docker container
3. **Docker Container**: Runs demo site with Tailscale client
4. **VS Code Extension**: Running on localhost:23333 on the host

## 📊 Monitoring and Health Checks

### Built-in Health Monitoring

The demo site includes real-time connection monitoring:
- **Tailscale Status**: Shows network connection and IP
- **VS Code Status**: Monitors extension connectivity
- **Auto-refresh**: Updates every 30 seconds

### API Endpoints

- `GET /api/health` - Overall health status
- `GET /api/health/tailscale` - Tailscale connection status
- `GET /api/health/vscode` - VS Code extension status

### Docker Health Checks

The container includes built-in health checks:
```bash
# Check container health
docker compose ps

# View health check logs
docker inspect agent-maestro-demo --format='{{.State.Health.Status}}'
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Tailscale Connection Failed
```bash
# Check Tailscale auth key
docker compose logs | grep -i tailscale

# Verify auth key is correct
docker exec agent-maestro-demo tailscale status
```

#### 2. VS Code Extension Not Accessible
```bash
# Check if VS Code extension is running
curl -f http://localhost:23333/api/v1/info

# Check Docker container can reach host
docker exec agent-maestro-demo curl -f http://host.docker.internal:23333/api/v1/info
```

#### 3. Container Won't Start
```bash
# Check Docker permissions for /dev/net/tun
ls -la /dev/net/tun

# On Linux, ensure tun module is loaded
sudo modprobe tun

# Check container logs
docker compose logs
```

### Debug Commands

```bash
# Get container shell
docker exec -it agent-maestro-demo /bin/sh

# Check Tailscale status inside container
docker exec agent-maestro-demo tailscale status

# Test VS Code connection from container
docker exec agent-maestro-demo curl -v http://host.docker.internal:23333/api/v1/info

# View real-time logs
docker compose logs -f --tail=50
```

## 🔒 Security Considerations

### Tailscale Network Security
- All traffic encrypted by Tailscale
- No ports exposed to public internet
- Access controlled by Tailscale ACLs
- Automatic device authentication

### Container Security
- Runs with minimal privileges
- No persistent storage of secrets
- Health checks for service monitoring
- Resource limits configured

### Best Practices
1. **Rotate Tailscale keys** regularly
2. **Use Tailscale ACLs** to restrict access
3. **Monitor container logs** for unusual activity
4. **Keep Docker images updated**

## 🎛️ Advanced Configuration

### Custom Network Configuration

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  agent-maestro-demo:
    environment:
      - TAILSCALE_HOSTNAME=my-custom-hostname
      - API_TIMEOUT=60000
      - CORS_ORIGINS=http://100.x.x.x:3000,http://localhost:3000
```

### Resource Limits

```yaml
# Adjust resource limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '1.0'
```

### Persistent Data

```yaml
# Add persistent volume for Tailscale state
volumes:
  tailscale-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/to/persistent/tailscale-data
```

## 📈 Performance Tips

1. **Use SSD storage** for Docker volumes
2. **Allocate sufficient memory** (minimum 512MB)
3. **Monitor container resources** with `docker stats`
4. **Keep container updated** for performance improvements

## 🆘 Support

### Getting Help

1. **Check logs first**: `./logs.sh`
2. **Verify connectivity**: `./status.sh`
3. **Review this documentation**
4. **Check Tailscale status** in admin console
5. **Test VS Code extension** independently

### Useful Resources

- [Tailscale Documentation](https://tailscale.com/kb/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Agent Maestro Repository](https://github.com/Joouis/agent-maestro)

## 🔄 Updates and Maintenance

### Updating the Container

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose down
docker compose up -d --build

# Clean up old images
docker image prune
```

### Backup Configuration

```bash
# Backup your configuration
cp .env .env.backup
tar -czf agent-maestro-backup.tar.gz .env docker-compose.yml
```

This deployment gives you secure, remote access to your VS Code AI extensions through the Tailscale network without exposing any ports to the public internet.