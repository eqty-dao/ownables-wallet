#!/bin/bash

# Exit on error
set -e

echo "Starting post-build cleanup..."

# Clean up build artifacts
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Caches/CocoaPods
rm -rf Pods
rm -rf build

# Verify the build
if [ -d "build/Build/Products/Release-iphoneos/universalWallet.app" ]; then
    echo "Build verification successful"
    ls -la build/Build/Products/Release-iphoneos/universalWallet.app
else
    echo "Build verification failed - app bundle not found"
    exit 1
fi

echo "Post-build cleanup completed successfully." 