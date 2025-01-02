#!/bin/bash
set -e

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}🔔 $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Directory setup
BASE_DIR="/Volumes/workspace/repository/universal-wallet/"
BASE_CLIENT_DIR="/Volumes/workspace/repository/universal-wallet/"
ENV_FILE=".env"
ENV_SOURCE=".env.stg"

log "Stage: Post-clone is activated...."

# Make script executable
chmod +x "${BASH_SOURCE[0]}"

# Export CI=false to prevent CI-specific behavior
export CI=false

# Navigate to base directory
cd "$BASE_DIR" || error "Failed to change directory to $BASE_DIR"

# Copy the appropriate environment file based on the branch
if [[ "$CI_COMMIT_REF_NAME" == "main" ]]; then
    ENV_SOURCE=".env.prod"
fi

cp "$ENV_SOURCE" "$BASE_DIR$ENV_FILE" || error "Failed to copy $ENV_SOURCE to $ENV_FILE"
log "$ENV_SOURCE file copied to $ENV_FILE"
brew install node cocoapods

# Install dependencies
log "Installing npm dependencies..."
npm i || error "Yarn installation failed"
log "Yarn dependencies installed successfully"

# Navigate to ios directory and run pod-install
cd "ios" || error "Failed to change directory to ios"
log "Running pod-install..."
npx pod-install || error "Pod installation failed"

# Return to base directory and run prebuild
cd "$BASE_DIR" || error "Failed to return to $BASE_DIR"
log "Running prebuild..."
./run prebuild || error "Prebuild failed"

log "Stage: Post-clone completed successfully"
# #!/bin/zsh

# # fail if any command fails
# set -e

# # debug log
# set -x

# echo "🧩 Stage: Post-clone is activated .... "
# export CI="false"

# chmod +x /Volumes/workspace/repository/universal-wallet/ios/ci_scripts/ci_post_clone.sh

# # Set base directory relative to the script for easier navigation
# BASE_DIR="/Volumes/workspace/repository/universal-wallet/"
# BASE_CLIENT_DIR="/Volumes/workspace/repository/universal-wallet/"

# # detect the branch name and set the environment variable
# # if branch name is 'master' use '.env.production' file else use '.env.develop' file
# ENV_FILE=".env"
# ENV_SOURCE="$BASE_DIR.env.stg"
# pwd
# if [[ "$CI_COMMIT_REF_NAME" == "main" ]]; then
#     ENV_SOURCE="$BASE_DIR.env.prod"
# fi

# cp $ENV_SOURCE $BASE_DIR$ENV_FILE && echo "🔧 $ENV_SOURCE file is copied to $ENV_FILE"
# [[ "$CI_COMMIT_REF_NAME" != "main" ]] && cp $ENV_SOURCE "$BASE_DIR.env.prod"

# # Install dependencies using Homebrew. This is MUST! Do not delete.
# brew install node yarn cocoapods

# # Navigate to the appropriate directory before running pod-install and yarn commands
# cd $BASE_CLIENT_DIR
# pwd
# yarn && echo "🔧 Yarn dependencies are installed successfully"

# # Navigate to ios directory and run prebuild
# cd $BASE_CLIENT_DIR/ios
# npx pod-install
# cd $BASE_CLIENT_DIR
# ./run prebuild && echo "🔧 Prebuild is done successfully"

# echo "🎯 Stage: Post-clone is done .... "

# # The exit command is implicit in scripts if no error occurs, and because we use set -e, it will exit on error automatically