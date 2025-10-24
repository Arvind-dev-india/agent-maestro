#!/bin/bash
# build-and-push.sh - Build and push Docker image to registry

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="${DOCKER_IMAGE_NAME:-agent-maestro-tailscale}"
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
USERNAME="${DOCKER_USERNAME}"
VERSION="${VERSION:-latest}"

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help
show_help() {
    cat << EOF
Usage: ./build-and-push.sh [OPTIONS]

Build and push Agent Maestro Docker image to a registry.

OPTIONS:
    -u, --username USERNAME    Docker registry username (required for push)
    -r, --registry REGISTRY    Docker registry (default: docker.io)
                              Examples: docker.io, ghcr.io, registry.example.com
    -i, --image IMAGE         Image name (default: agent-maestro-tailscale)
    -v, --version VERSION     Image version tag (default: latest)
    -b, --build-only          Only build, don't push
    -m, --multiarch           Build for multiple architectures (amd64, arm64)
    -h, --help                Show this help message

ENVIRONMENT VARIABLES:
    DOCKER_USERNAME           Docker registry username
    DOCKER_REGISTRY          Docker registry URL
    DOCKER_IMAGE_NAME        Image name
    VERSION                  Image version

EXAMPLES:
    # Build only
    ./build-and-push.sh --build-only

    # Build and push to Docker Hub
    ./build-and-push.sh --username myuser --version 2.3.5

    # Build and push to GitHub Container Registry
    ./build-and-push.sh --username myuser --registry ghcr.io --version 2.3.5

    # Build multi-architecture image
    ./build-and-push.sh --username myuser --multiarch --version 2.3.5

EOF
}

# Parse arguments
BUILD_ONLY=false
MULTIARCH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--username)
            USERNAME="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -i|--image)
            IMAGE_NAME="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -m|--multiarch)
            MULTIARCH=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate
if [[ "$BUILD_ONLY" == "false" && -z "$USERNAME" ]]; then
    print_error "Username is required for pushing. Use --username or set DOCKER_USERNAME"
    echo ""
    show_help
    exit 1
fi

# Construct full image name
if [[ "$REGISTRY" == "docker.io" ]]; then
    FULL_IMAGE="${USERNAME}/${IMAGE_NAME}"
else
    FULL_IMAGE="${REGISTRY}/${USERNAME}/${IMAGE_NAME}"
fi

print_info "Configuration:"
echo "  Registry: $REGISTRY"
echo "  Username: $USERNAME"
echo "  Image: $FULL_IMAGE"
echo "  Version: $VERSION"
echo "  Build Only: $BUILD_ONLY"
echo "  Multi-arch: $MULTIARCH"
echo ""

# Check if Dockerfile exists
if [[ ! -f "Dockerfile.tailscale" ]]; then
    print_error "Dockerfile.tailscale not found in current directory"
    exit 1
fi

# Build
if [[ "$MULTIARCH" == "true" ]]; then
    print_info "Building multi-architecture image..."
    
    # Check if buildx exists
    if ! docker buildx version &> /dev/null; then
        print_error "docker buildx not found. Install it first."
        exit 1
    fi
    
    # Create builder if it doesn't exist
    if ! docker buildx inspect multiarch &> /dev/null; then
        print_info "Creating buildx builder 'multiarch'..."
        docker buildx create --name multiarch --use
    else
        docker buildx use multiarch
    fi
    
    if [[ "$BUILD_ONLY" == "true" ]]; then
        print_info "Building for linux/amd64 and linux/arm64 (local only)..."
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            -f Dockerfile.tailscale \
            -t "${FULL_IMAGE}:${VERSION}" \
            -t "${FULL_IMAGE}:latest" \
            --load \
            .
    else
        print_info "Building and pushing for linux/amd64 and linux/arm64..."
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            -f Dockerfile.tailscale \
            -t "${FULL_IMAGE}:${VERSION}" \
            -t "${FULL_IMAGE}:latest" \
            --push \
            .
    fi
else
    print_info "Building single-architecture image..."
    docker build \
        -f Dockerfile.tailscale \
        -t "${FULL_IMAGE}:${VERSION}" \
        -t "${FULL_IMAGE}:latest" \
        .
    
    if [[ "$BUILD_ONLY" == "false" ]]; then
        print_info "Pushing image to registry..."
        docker push "${FULL_IMAGE}:${VERSION}"
        docker push "${FULL_IMAGE}:latest"
    fi
fi

print_info "Done!"
echo ""
print_info "Image tags created:"
echo "  ${FULL_IMAGE}:${VERSION}"
echo "  ${FULL_IMAGE}:latest"
echo ""

if [[ "$BUILD_ONLY" == "false" ]]; then
    print_info "To use this image on another machine:"
    echo "  1. Create docker-compose.yml from docker-compose.remote.yml"
    echo "  2. Update image: ${FULL_IMAGE}:${VERSION}"
    echo "  3. Set TAILSCALE_AUTH_KEY in .env file"
    echo "  4. Run: docker compose pull && docker compose up -d"
fi
