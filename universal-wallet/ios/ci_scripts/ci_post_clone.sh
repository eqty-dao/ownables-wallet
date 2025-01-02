#!/bin/zsh

# fail if any command fails
set -e

# debug log
set -x

echo "🧩 Stage: Post-clone is activated .... "
export CI="false"

chmod +x /Volumes/workspace/repository/universal-wallet/ios/ci_scripts/ci_post_clone.sh

# Set base directory relative to the script for easier navigation
BASE_DIR="/Volumes/workspace/repository/universal-wallet/"
BASE_CLIENT_DIR="/Volumes/workspace/repository/universal-wallet/"

# detect the branch name and set the environment variable
# if branch name is 'master' use '.env.production' file else use '.env.develop' file
ENV_FILE=".env"
ENV_SOURCE="$BASE_DIR.env.stg"

if [[ "$CI_COMMIT_REF_NAME" == "main" ]]; then
    ENV_SOURCE="$BASE_DIR.env.production"
fi

cp $ENV_SOURCE $BASE_DIR$ENV_FILE && echo "🔧 $ENV_SOURCE file is copied to $ENV_FILE"
[[ "$CI_COMMIT_REF_NAME" != "main" ]] && cp $ENV_SOURCE "$BASE_DIR.env.production"

# Install dependencies using Homebrew. This is MUST! Do not delete.
brew install node yarn cocoapods

# Navigate to the appropriate directory before running pod-install and yarn commands
cd $BASE_CLIENT_DIR
pwd
yarn && echo "🔧 Yarn dependencies are installed successfully"

# Navigate to ios directory and run prebuild
cd $BASE_CLIENT_DIR/ios
npx pod-install
cd $BASE_CLIENT_DIR
./run prebuild && echo "🔧 Prebuild is done successfully"

echo "🎯 Stage: Post-clone is done .... "

# The exit command is implicit in scripts if no error occurs, and because we use set -e, it will exit on error automatically