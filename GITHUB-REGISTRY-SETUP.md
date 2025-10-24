# GitHub Container Registry Setup Guide

## Quick Setup for Private Repository

Your repository is **private**, but you can still publish Docker images easily using GitHub Container Registry (ghcr.io).

## ✅ What's Already Set Up

The GitHub Actions workflow (`.github/workflows/docker-publish.yml`) is **already configured** to:

- Build Docker images automatically
- Publish to `ghcr.io/YOUR_USERNAME/agent-maestro/tailscale`
- Tag images properly (`latest`, version tags, etc.)
- Work with private repositories

## 🚀 Step-by-Step: First-Time Setup

### Step 1: Push Code to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Add Docker publishing infrastructure"

# Push to GitHub
git push origin main
```

### Step 2: Wait for GitHub Actions

1. Go to your repository on GitHub
2. Click on **"Actions"** tab
3. Watch the workflow run
4. Wait for it to complete (usually 5-10 minutes)

The image will be published to:

```
ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest
```

### Step 3: Check Your Packages

1. Go to: `https://github.com/YOUR_USERNAME?tab=packages`
2. You should see: `agent-maestro/tailscale`
3. Initially, it will be **private** (only you can access)

### Step 4: Choose Visibility

You have two options:

#### Option A: Make Image Public (Recommended for Easy Deployment)

**Advantages:**

- ✅ Anyone can pull the image (no authentication needed)
- ✅ Your code repository stays private
- ✅ Easier to deploy on remote VMs
- ✅ No tokens or passwords needed

**Steps:**

1. Go to the package: `https://github.com/users/YOUR_USERNAME/packages/container/agent-maestro%2Ftailscale/settings`
2. Scroll to **"Danger Zone"**
3. Click **"Change visibility"**
4. Select **"Public"**
5. Confirm

**Now anyone can use:**

```bash
docker pull ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest
```

#### Option B: Keep Image Private

**Advantages:**

- ✅ Complete privacy
- ✅ Only authorized users can pull

**Requirements:**

- Need GitHub Personal Access Token (PAT) on each VM
- Must login before pulling

---

## 📦 Using the Image

### If Image is Public

On any remote VM:

```bash
# No login needed!
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/agent-maestro/main/quick-deploy.sh | bash
# Enter: ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest
```

### If Image is Private

On remote VM:

```bash
# 1. Create GitHub PAT
# Go to: https://github.com/settings/tokens/new
# Scopes: read:packages
# Create token and copy it

# 2. Login to ghcr.io
echo YOUR_TOKEN_HERE | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 3. Deploy
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/agent-maestro/main/quick-deploy.sh | bash
# Enter: ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest
# When asked about private image, answer 'N' (already logged in)
```

---

## 🔄 Updating the Image

### Automatic Updates (Recommended)

Every time you push to `main` branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
# GitHub Actions automatically builds and publishes
```

### Version Tags

For versioned releases:

```bash
git tag v2.3.5
git push --tags
# GitHub Actions builds and tags as v2.3.5
```

Users can then use:

```bash
docker pull ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:v2.3.5
```

---

## 🧪 Testing Your Published Image

```bash
# Pull the image
docker pull ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest

# Run it locally to test
docker run --rm -it \
  --cap-add NET_ADMIN \
  --cap-add SYS_MODULE \
  --device /dev/net/tun \
  -e TAILSCALE_AUTH_KEY=tskey-auth-YOUR-KEY \
  -e LOCAL_VSCODE_HOST=host.docker.internal \
  -p 3000:3000 \
  ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest
```

---

## 📋 Complete Workflow Example

### Publishing (One-time setup)

```bash
# 1. Add all the new files
git add .dockerignore \
        .github/workflows/docker-publish.yml \
        docker-compose.remote.yml \
        .env.example \
        build-and-push.sh \
        quick-deploy.sh \
        DOCKER-PUBLISH.md \
        PRIVATE-REPO-OPTIONS.md

# 2. Commit
git commit -m "Add Docker publishing infrastructure"

# 3. Push to GitHub
git push origin main

# 4. Check GitHub Actions
# Go to: https://github.com/YOUR_USERNAME/agent-maestro/actions

# 5. After build completes, make image public (optional)
# Go to: https://github.com/YOUR_USERNAME?tab=packages
# Click on package → Settings → Change to Public
```

### Deploying on Remote VM

```bash
# On your remote VM
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/agent-maestro/main/quick-deploy.sh | bash

# When prompted:
# - Image name: ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest
# - Tailscale auth key: [get from https://login.tailscale.com/admin/settings/keys]
# - Hostname prefix: vm1 (or whatever you want)
# - VS Code location: Select option 1 or 2 depending on your setup
```

---

## 💡 Pro Tips

### 1. Use Different Tags for Different Environments

```yaml
# Production
IMAGE_NAME=ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:v2.3.5

# Staging
IMAGE_NAME=ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:latest

# Development
IMAGE_NAME=ghcr.io/YOUR_USERNAME/agent-maestro/tailscale:main-abc123
```

### 2. Automate Everything

The workflow automatically:

- ✅ Builds on every push to `main`
- ✅ Creates version tags from git tags
- ✅ Builds for both AMD64 and ARM64
- ✅ Uses build cache for faster builds

### 3. Keep Repository Private, Image Public

Best of both worlds:

- Your **source code** stays private
- Your **Docker image** is public
- Easy distribution without exposing code

---

## 🆘 Troubleshooting

### GitHub Actions Fails to Push

**Error:** `denied: permission_denied`

**Fix:** Check workflow permissions

1. Go to: `Settings` → `Actions` → `General`
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Save

### Can't See the Package

**Issue:** Package not visible after build

**Solution:**

1. Check Actions tab for errors
2. Package appears at: `https://github.com/YOUR_USERNAME?tab=packages`
3. May take a few minutes to appear

### Pull Fails on Remote VM

**Error:** `unauthorized: authentication required`

**Fix:**

- Image is private - need to login first
- Or make image public (see Step 4 above)

---

## 📚 Additional Resources

- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Working with Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Managing Package Access](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility)

---

## ✅ Quick Checklist

- [ ] Push code to GitHub
- [ ] Wait for GitHub Actions to complete
- [ ] Check package is published
- [ ] Make package public (optional)
- [ ] Update `IMAGE_NAME` in deployment docs/scripts
- [ ] Test pulling the image
- [ ] Deploy on remote VM
- [ ] Verify API access via Tailscale

---

**You're all set!** The infrastructure is ready - just push to GitHub and it will automatically build and publish your Docker image.
