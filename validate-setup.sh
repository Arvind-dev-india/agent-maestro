#!/bin/bash
# validate-setup.sh - Validate the Docker + Tailscale setup

set -e

echo "=== Agent Maestro Docker + Tailscale Setup Validation ==="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check required files exist
echo "Checking required files..."

files_to_check=(
    "Dockerfile.tailscale"
    "docker-compose.yml" 
    "docker-entrypoint.sh"
    "health-check.js"
    "setup.sh"
    "examples/demo-site/src/app/api/health/route.ts"
    "examples/demo-site/src/app/api/health/vscode/route.ts"
    "examples/demo-site/src/app/api/health/tailscale/route.ts"
    "examples/demo-site/src/components/ConnectionStatus.tsx"
)

missing_files=0
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        check_pass "Found: $file"
    else
        check_fail "Missing: $file"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -eq 0 ]; then
    check_pass "All required files present"
else
    check_fail "$missing_files files missing"
fi

echo ""

# Check script permissions
echo "Checking script permissions..."

scripts_to_check=(
    "setup.sh"
    "docker-entrypoint.sh"
    "health-check.js"
)

for script in "${scripts_to_check[@]}"; do
    if [ -x "$script" ]; then
        check_pass "Executable: $script"
    else
        check_fail "Not executable: $script"
        echo "  Run: chmod +x $script"
    fi
done

echo ""

# Check Docker Compose syntax
echo "Checking Docker Compose configuration..."

if command -v docker &> /dev/null; then
    if docker compose config --quiet 2>/dev/null; then
        check_pass "Docker Compose syntax valid"
    else
        check_fail "Docker Compose syntax invalid"
        echo "  Run: docker compose config"
    fi
else
    check_warn "Docker not available for validation"
fi

echo ""

# Check demo site structure
echo "Checking demo site structure..."

demo_dirs=(
    "examples/demo-site/src/app/api/health"
    "examples/demo-site/src/components"
)

for dir in "${demo_dirs[@]}"; do
    if [ -d "$dir" ]; then
        check_pass "Directory exists: $dir"
    else
        check_fail "Directory missing: $dir"
    fi
done

echo ""

# Check environment requirements
echo "Checking environment requirements..."

if [ -n "$TAILSCALE_AUTH_KEY" ]; then
    check_pass "TAILSCALE_AUTH_KEY is set"
    if [[ $TAILSCALE_AUTH_KEY == tskey-auth-* ]]; then
        check_pass "TAILSCALE_AUTH_KEY format looks correct"
    else
        check_warn "TAILSCALE_AUTH_KEY format may be incorrect (should start with 'tskey-auth-')"
    fi
else
    check_warn "TAILSCALE_AUTH_KEY not set (will be prompted during setup)"
fi

echo ""

# Summary
echo "=== Validation Summary ==="

if [ $missing_files -eq 0 ]; then
    check_pass "Setup appears to be complete!"
    echo ""
    echo "Next steps:"
    echo "1. Set TAILSCALE_AUTH_KEY if not already set:"
    echo "   export TAILSCALE_AUTH_KEY='tskey-auth-xxxxx'"
    echo ""
    echo "2. Run setup:"
    echo "   ./setup.sh"
    echo ""
    echo "3. Start the service:"
    echo "   ./start.sh"
else
    check_fail "Setup incomplete - please address missing files"
    exit 1
fi

echo ""
echo "For detailed instructions, see README-Docker.md"