#!/bin/zsh

echo "🧩 Stage: Post-clone is activated .... "

# Set environment variables
export CI=false
export NODE_ENV=production

# Make script executable
chmod +x "$0"

# Set base directories
BASE_DIR="/Volumes/workspace/repository/universal-wallet"
OWNABLES_DIR="/Volumes/workspace/repository/ownables_sdk"
DESTINATION_ENV_FILE="$BASE_DIR/.env"
SOURCE_ENV_FILE="$BASE_DIR/.env.stg"

# Copy environment file
if [[ -f "$SOURCE_ENV_FILE" ]]; then
  cp "$SOURCE_ENV_FILE" "$DESTINATION_ENV_FILE"
  echo "🔧 $SOURCE_ENV_FILE file is copied to $DESTINATION_ENV_FILE"
  cat "$DESTINATION_ENV_FILE"
fi

# Install dependencies
echo "🔧 Installing dependencies..."

# Install Node.js and CocoaPods if not already installed
if ! command -v node &> /dev/null; then
  echo "🔧 Installing Node.js..."
  brew install node
fi

if ! command -v pod &> /dev/null; then
  echo "🔧 Installing CocoaPods..."
  brew install cocoapods
fi

# Install ownables dependencies
echo "🔧 Installing ownables dependencies..."
cd "$OWNABLES_DIR" || exit 1
npm install --legacy-peer-deps || {
  echo "⚠️ Warning: npm install for ownables had some issues, but continuing..."
}

# Install universal wallet dependencies
echo "🔧 Installing universal wallet dependencies..."
cd "$BASE_DIR" || exit 1
rm -rf node_modules
npm install --legacy-peer-deps || {
  echo "⚠️ Warning: npm install had some issues, but continuing..."
}

# Install iOS dependencies
echo "🔧 Installing iOS dependencies..."
cd "$BASE_DIR/ios" || exit 1
rm -rf Pods
rm -rf Podfile.lock

# Ensure React Native is properly linked
echo "🔧 Linking React Native..."
cd "$BASE_DIR" || exit 1
npx react-native link

# Install pods
echo "🔧 Installing pods..."
cd "$BASE_DIR/ios" || exit 1
pod install || {
  echo "⚠️ Warning: pod install had some issues, but continuing..."
}

echo "✅ Post-clone stage completed"