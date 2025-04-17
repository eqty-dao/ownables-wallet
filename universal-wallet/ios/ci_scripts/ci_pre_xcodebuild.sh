#!/bin/bash

# Exit on error
set -e

echo "Starting pre-build setup..."

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://fnm.vercel.app/install | bash
    export PATH="/root/.local/share/fnm:$PATH"
    eval "$(fnm env)"
    fnm install 20
    fnm use 20
fi

# Install npm dependencies
echo "Installing npm dependencies..."
cd ..
npm install

# Install CocoaPods if not present
if ! command -v pod &> /dev/null; then
    echo "Installing CocoaPods..."
    gem install cocoapods
fi

# Install pods
echo "Installing pods..."
cd ios
pod install

# Set environment variables
export NO_FLIPPER=1
export USE_HERMES=true
export RCT_NEW_ARCH_ENABLED=0

echo "Pre-build setup completed successfully." 