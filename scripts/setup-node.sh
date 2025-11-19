#!/bin/bash
# Setup script to ensure correct Node.js version is used

# Load fnm if available
if command -v fnm &> /dev/null; then
  eval "$(fnm env)"
  fnm use 20.19.4 2>/dev/null || fnm install 20.19.4 && fnm use 20.19.4
  fnm default 20.19.4
fi

# Verify Node.js version
NODE_VERSION=$(node --version)
REQUIRED_VERSION="v20.19.4"

if [ "$NODE_VERSION" != "$REQUIRED_VERSION" ]; then
  echo "Warning: Node.js version is $NODE_VERSION, but $REQUIRED_VERSION is required"
  echo "Please run: eval \"\$(fnm env)\" && fnm use 20.19.4"
  exit 1
fi

echo "✓ Node.js version is correct: $NODE_VERSION"

