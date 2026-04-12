#!/bin/bash
# Build the iOS app and install on connected device
set -e

echo "→ Prebuilding iOS project..."
npx expo prebuild --platform ios --clean

echo "→ Building with Xcode..."
xcodebuild \
  -workspace ios/Intentful.xcworkspace \
  -scheme Intentful \
  -destination 'generic/platform=iOS' \
  -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration \
  | tail -5

echo "→ Installing on device..."
npx expo run:ios --device --no-bundler

echo "✓ Build complete. Run 'npm run dev' to start the dev server."
