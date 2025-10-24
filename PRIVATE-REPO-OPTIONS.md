# Private Repository - Docker Image Options

## 🔒 Yes, GitHub Container Registry Works with Private Repos!

GitHub Actions can publish Docker images to GitHub Container Registry (ghcr.io) even from **private repositories**. The workflow is already configured for this!

## 📦 Options for Private Repository

### Option 1: GitHub Container Registry (ghcr.io) - **RECOMMENDED** ✅

**Advantages:**

- ✅ Works perfectly with private GitHub repos
- ✅ No extra accounts needed (uses GitHub authentication)
- ✅ Images can be private or public (your choice)
- ✅ Integrated with GitHub (same login, same permissions)
- ✅ Free for public images, included in GitHub pricing for private
- ✅ Already configured in the workflow!

**How it works:**

1. GitHub Actions publishes to `ghcr.io/YOUR_USERNAME/agent-maestro/tailscale`
2. Image visibility is separate from repo visibility
3. You can make images public even if repo is private

**Setup:**

```bash
# Already configured! Just push to GitHub
git push origin main

# Or tag for versioned release
git tag v2.3.5
git push --tags
```

**Using the image on remote VM:**

```bash
# Public image (no login needed)
docker pull ghcr.io/yourusername/agent-maestro/tailscale:latest

# Private image (login required)
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
docker pull ghcr.io/yourusername/agent-maestro/tailscale:latest
```

**Making image public while repo stays private:**

1. Go to: https://github.com/users/YOUR_USERNAME/packages/container/agent-maestro%2Ftailscale/settings
2. Change visibility to "Public"
3. Now anyone can pull the image (no login needed)

---

### Option 2: Docker Hub - Public/Private Images

**Advantages:**

- ✅ Most popular registry
- ✅ Free for public images
- ✅ One private repo free, more with paid plan
- ✅ Good for sharing with others

**Setup:**

```bash
# Login to Docker Hub
docker login

# Build and push using the script
./build-and-push.sh --username YOUR_DOCKERHUB_USERNAME --version 2.3.5
```

**For GitHub Actions:**
Update `.github/workflows/docker-publish.yml`:

```yaml
env:
  REGISTRY: docker.io  # or just remove this line
  IMAGE_NAME: YOUR_DOCKERHUB_USERNAME/agent-maestro-tailscale

# Add Docker Hub login step
- name: Log in to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

Add secrets in GitHub:

- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Access token from https://hub.docker.com/settings/security

---

### Option 3: Self-hosted Private Registry

**Advantages:**

- ✅ Complete control
- ✅ No external dependencies
- ✅ Keep everything internal

**Setup:**

```bash
# Run registry server
docker run -d -p 5000:5000 --name registry registry:2

# Build and push
./build-and-push.sh --registry localhost:5000 --username "" --version 2.3.5
```

---

### Option 4: Other Cloud Registries

**AWS ECR, Azure Container Registry, Google Artifact Registry** all work similarly.

---

## 🎯 Recommended Setup for Private Repo

### For Maximum Convenience:

1. **Use GitHub Container Registry (ghcr.io)**
2. **Make the image public** (even if repo is private)
3. **No authentication needed** on remote VMs

**Why?**

- Repo stays private (your code is protected)
- Image is public (anyone can use it)
- No login required on VMs
- Free and simple

### How to Configure:

**Current workflow is already set up for ghcr.io!** Just need to make image public:

1. **Push code to GitHub** (triggers workflow):

   ```bash
   git add .
   git commit -m "Add Docker publishing"
   git push origin main
   ```

2. **Wait for GitHub Actions** to build and publish

3. **Make image public**:

   - Go to: https://github.com/YOUR_USERNAME?tab=packages
   - Find: `agent-maestro/tailscale`
   - Click → Package settings
   - Change visibility to **Public**

4. **Use on any VM** (no login needed):
   ```bash
   docker pull ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest
   ```

---

## 🔐 Authentication Options

### If you keep image private:

**On remote VM, authenticate once:**

```bash
# Create a GitHub Personal Access Token (PAT)
# https://github.com/settings/tokens/new
# Scopes needed: read:packages

# Login
echo YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Now you can pull
docker pull ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest
```

**Or save credentials:**

```bash
# Login persists in ~/.docker/config.json
docker login ghcr.io
# Enter username and PAT when prompted
```

---

## 📋 Comparison Table

| Option                      | Privacy                        | Cost                        | Setup  | VM Auth Required |
| --------------------------- | ------------------------------ | --------------------------- | ------ | ---------------- |
| **ghcr.io (public image)**  | Repo: Private<br>Image: Public | Free                        | Easy   | ❌ No            |
| **ghcr.io (private image)** | Both Private                   | Free                        | Easy   | ✅ Yes (PAT)     |
| **Docker Hub (public)**     | Repo: Private<br>Image: Public | Free                        | Medium | ❌ No            |
| **Docker Hub (private)**    | Both Private                   | Free (1 repo)<br>$5/mo more | Medium | ✅ Yes           |
| **Self-hosted**             | Both Private                   | Server costs                | Hard   | ✅ Yes           |

---

## ✅ Recommended: Use ghcr.io with Public Image

**Step-by-step:**

### 1. Update docker-compose.remote.yml

The file already uses environment variable for image name:

```yaml
image: ${IMAGE_NAME}
```

Just set it in .env:

```bash
IMAGE_NAME=ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest
```

### 2. Update quick-deploy.sh

Already supports custom image names! Users just enter:

```
ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest
```

### 3. GitHub Actions is Already Configured

The workflow will automatically:

- Build on every push to main
- Tag as `latest`
- Tag with version on git tags
- Publish to ghcr.io

### 4. First Deployment

```bash
# Commit and push
git add .
git commit -m "Add Docker publishing infrastructure"
git push origin main

# Wait for GitHub Actions (check Actions tab)
# Image will be at: ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest

# Make it public (one-time)
# Visit: https://github.com/YOUR_USERNAME?tab=packages
# Find package → Settings → Change to Public
```

### 5. Deploy on Remote VM

```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/agent-maestro/main/quick-deploy.sh | bash
# Enter: ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest
```

---

## 🔧 If You Want to Keep Image Private

Update `.env.example` and `quick-deploy.sh` to include login:

```bash
# In quick-deploy.sh, add after Docker checks:

# If using ghcr.io private image
if [[ "$IMAGE_NAME" == ghcr.io/* ]]; then
    echo "Image is on GitHub Container Registry"
    read -p "Is this a private image? [y/N]: " IS_PRIVATE

    if [[ "$IS_PRIVATE" =~ ^[Yy]$ ]]; then
        echo "You'll need a GitHub Personal Access Token"
        echo "Create one at: https://github.com/settings/tokens/new"
        echo "Required scope: read:packages"
        read -p "Enter GitHub username: " GH_USER
        read -sp "Enter GitHub PAT: " GH_PAT
        echo ""

        echo $GH_PAT | docker login ghcr.io -u $GH_USER --password-stdin
    fi
fi
```

---

## 💡 Pro Tips

1. **Use public images for demo/example deployments** - easier for users
2. **Use private images for internal/proprietary deployments** - more secure
3. **Tag versions** - easier to rollback and track
4. **Separate concerns** - private repo (code) + public image (distribution) = best of both

---

## 🎯 Summary

**You have these options:**

1. ✅ **ghcr.io + public image** (EASIEST, RECOMMENDED)

   - Private repo, public image
   - No auth needed on VMs
   - Already configured!

2. **ghcr.io + private image**

   - Everything private
   - PAT needed on VMs
   - Already configured, just keep image private

3. **Docker Hub**

   - Popular, well-known
   - Need to add credentials to GitHub
   - 1 free private repo

4. **Self-hosted**
   - Full control
   - More complex

**For your use case with private repo:** Use ghcr.io and make the image public. Your code stays private, but the Docker image can be easily used by anyone!
