#!/bin/zsh

# fail if any command fails
set -e

# debug log
set -x

echo "🧩 Stage: Post-clone is activated .... "
export CI="false"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

chmod +x "$REPO_ROOT/wallet/ios/ci_scripts/ci_post_clone.sh"

# Set base directory relative to the script for easier navigation
BASE_DIR="$REPO_ROOT/wallet"
OWNABLES_DIR="$REPO_ROOT/ownables_sdk"
DESTINATION_ENV_FILE="$BASE_DIR/.env"
SOURCE_ENV_FILE="$BASE_DIR/.env.stg"

#copy the appropriate environment file to the root directory based on the branch
if [[ "$CI_COMMIT_REF_NAME" == "main" ]]; then
    SOURCE_ENV_FILE="$BASE_DIR/.env.prod"
fi

cp $SOURCE_ENV_FILE $DESTINATION_ENV_FILE && echo "🔧 $SOURCE_ENV_FILE file is copied to $DESTINATION_ENV_FILE"

#print the environment file
cat $DESTINATION_ENV_FILE

# Install dependencies using Homebrew. This is MUST! Do not delete.
brew install node cocoapods

# Install ownables dependencies
cd "$REPO_ROOT"
git submodule update --init ownables_sdk

cd $OWNABLES_DIR
npm i && echo "🔧 NPM dependencies are installed successfully for ownables"

# Install main project dependencies with legacy peer deps
cd $BASE_DIR
npm install --legacy-peer-deps && echo "🔧 NPM dependencies are installed successfully"

# Clean and install pods
cd $BASE_DIR/ios
rm -rf Pods
rm -rf Podfile.lock
pod install

cd $BASE_DIR

echo "🔧 Build SDK"
cd $OWNABLES_DIR
npm i && npm run rustup && npm run build

cd $BASE_DIR

echo "🔧 Build SDK is done successfully"

echo "🔧 Prebuild"
./run prebuild && cd ios && pod install && cd .. && npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle --assets-dest ios && echo "🔧 Prebuild is done successfully"

echo "🎯 Stage: Post-clone is done .... "

# The exit command is implicit in scripts if no error occurs, and because we use set -e, it will exit on error automatically
