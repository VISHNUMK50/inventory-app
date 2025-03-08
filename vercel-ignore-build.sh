#!/bin/bash

# Exit code 0 = build will proceed
# Exit code 1 = build will be skipped

# Get list of files that changed between the latest two commits
CHANGED_FILES=$(git diff --name-only HEAD^ HEAD)

# Replace these with your specific folders that should trigger builds
IMPORTANT_PATHS=("src/" "public/")chmod +x vercel-ignore-build.sh

# Check if any important paths were modified
for path in "${IMPORTANT_PATHS[@]}"; do
  if echo "$CHANGED_FILES" | grep -q "$path"; then
    echo "🔄 Changes detected in $path - proceeding with build"
    exit 0
  fi
done

# If we reach here, no important paths were changed
echo "⏭️ No changes in monitored folders - skipping build"
exit 1