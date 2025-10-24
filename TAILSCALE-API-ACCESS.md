# Tailscale API Access Configuration

## Summary

The Agent Maestro Docker deployment with Tailscale now exposes **all API endpoints** (not just the demo site) over the Tailscale network. This allows secure remote access to the complete VS Code extension API from anywhere in your Tailscale network.

## What's Exposed

### Previously (Before Changes)

- ✅ Demo Next.js site on port 3000 via Tailscale

### Now (After Changes)

- ✅ Demo Next.js site on port 3000 via Tailscale
- ✅ **Complete VS Code API on port 23333 via Tailscale**
- ✅ OpenAPI specification at `http://<tailscale-ip>:23333/openapi.json`
- ✅ All documented API endpoints accessible remotely

## Technical Implementation

### Changes Made

1. **Dockerfile.tailscale**

   - Added `socat` package for TCP forwarding
   - Exposed port 23333 in addition to port 3000

2. **docker-entrypoint.sh**

   - Added socat TCP forwarder that proxies port 23333 in the container to `host.docker.internal:23333`
   - Enhanced logging to show all accessible API endpoints
   - Added proper cleanup for the socat process

3. **README-Docker.md**
   - Documented all available API endpoints
   - Added testing examples for API access
   - Enhanced troubleshooting section with API-specific checks
   - Updated network architecture diagram

## How It Works

```
External Device (Tailscale)
    ↓
Tailscale Network (encrypted)
    ↓
Docker Container (100.x.x.x:23333)
    ↓
socat TCP Forwarder
    ↓
host.docker.internal:23333 (VS Code Extension API)
```

The `socat` process inside the container listens on port 23333 and forwards all TCP traffic to the VS Code extension API running on the Docker host at `localhost:23333`.

## Available API Endpoints (via Tailscale)

All endpoints from the OpenAPI spec are now accessible:

### System & Information

- `GET /api/v1/info` - System information
- `GET /openapi.json` - OpenAPI specification

### Tasks

- `POST /api/v1/roo/task` - Create RooCode task
- `POST /api/v1/roo/task/{taskId}/message` - Send message to task
- `POST /api/v1/roo/task/{taskId}/action` - Perform task actions
- `GET /api/v1/roo/tasks` - Get task history
- `GET /api/v1/roo/task/{taskId}` - Get task details
- `POST /api/v1/cline/task` - Create Cline task

### File System

- `POST /api/v1/fs/read` - Read file content
- `POST /api/v1/fs/write` - Write file content

### Workspace

- `POST /api/v1/workspace/updateWorkspaceFolders` - Update workspace folders
- `POST /api/v1/workspace/closeAllWorkspaces` - Close all workspaces

### Language Models

- `GET /api/v1/lm/chatModels` - List chat models
- `GET /api/v1/lm/tools` - List LM tools

### AI API Compatibility

- `POST /api/anthropic/v1/messages` - Anthropic-compatible API
- `POST /api/anthropic/v1/messages/count_tokens` - Token counting
- `POST /api/openai/chat/completions` - OpenAI-compatible API

### Configuration

- `GET /api/v1/roo/profiles` - List profiles
- `POST /api/v1/roo/profiles` - Create profile
- `GET /api/v1/roo/profiles/{name}` - Get profile
- `PUT /api/v1/roo/profiles/{name}` - Update profile
- `DELETE /api/v1/roo/profiles/{name}` - Delete profile
- `PUT /api/v1/roo/profiles/active/{name}` - Set active profile

### MCP Configuration

- `POST /api/v1/roo/install-mcp-config` - Install MCP configuration

## Usage Examples

### From any device on Tailscale network:

```bash
# Get Tailscale IP
TAILSCALE_IP=$(docker exec agent-maestro-demo tailscale ip -4)

# View OpenAPI spec
curl http://$TAILSCALE_IP:23333/openapi.json

# Get system info
curl http://$TAILSCALE_IP:23333/api/v1/info

# List available language models
curl http://$TAILSCALE_IP:23333/api/v1/lm/chatModels

# Create a task
curl -X POST http://$TAILSCALE_IP:23333/api/v1/roo/task \
  -H "Content-Type: application/json" \
  -d '{"text": "Help me write a Python script"}'

# Use Anthropic-compatible API
curl -X POST http://$TAILSCALE_IP:23333/api/anthropic/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Security Considerations

- **No additional authentication needed**: Tailscale network provides secure, encrypted access
- **Network isolation**: Only devices in your Tailscale network can access the APIs
- **Same security model**: All API endpoints follow the same security model as the demo site
- **Firewall friendly**: No port forwarding or firewall configuration needed

## Verification

To verify the setup is working:

```bash
# 1. Check socat is running
docker exec agent-maestro-demo ps aux | grep socat

# 2. Check port 23333 is listening in container
docker exec agent-maestro-demo netstat -tuln | grep 23333

# 3. Test API from within container
docker exec agent-maestro-demo curl http://localhost:23333/api/v1/info

# 4. Test API from Tailscale network
curl http://$(docker exec agent-maestro-demo tailscale ip -4):23333/api/v1/info
```

## Troubleshooting

### API not accessible via Tailscale

1. **Check socat is running**:

   ```bash
   docker exec agent-maestro-demo ps aux | grep socat
   ```

2. **Check logs**:

   ```bash
   docker logs agent-maestro-demo | grep -i "forwarder\|socat"
   ```

3. **Test from host**:

   ```bash
   curl http://localhost:23333/api/v1/info
   ```

4. **Test from container**:

   ```bash
   docker exec agent-maestro-demo curl http://host.docker.internal:23333/api/v1/info
   ```

5. **Restart container** if needed:
   ```bash
   docker compose restart
   ```

## Benefits

1. ✅ **Full API access remotely** - Use all extension features from any Tailscale device
2. ✅ **Secure** - Encrypted Tailscale network, no public exposure
3. ✅ **Simple** - No complex VPN or firewall configuration
4. ✅ **Consistent** - Same API as local access, fully documented via OpenAPI
5. ✅ **Flexible** - Build custom integrations or automations using the remote API
