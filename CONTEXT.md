# Session Context — April 2026

## What is this app?

**Intentful** — an iOS screen time awareness app. Unlike One Sec (breathing exercise every time) or ScreenZen (static delay), Intentful adapts its friction based on your personal usage patterns. First opens are free, friction escalates only when autopilot behavior is detected, and thresholds adjust by time of day, day of week, and personal trends.

No direct competitor does adaptive friction. A 2025 JMIR academic review confirms this gap in the market.

## Current State

- App builds and runs on a physical iPhone via dev build
- Onboarding flow works: welcome → select apps (Screen Time picker) → confirm
- Dashboard shows: monitoring status, app count, interventions, patterns, adaptive thresholds, open counts
- Shield system configured (3 levels: gentle/moderate/strong)
- Notifications working (post-session nudges, weekly reflection)
- Shortcuts setup screen built (supports iCloud link when available, falls back to manual URL copy)
- Codebase cleaned (2026-08-18): all unused code, assets, deps and debug logging removed;
  `npm run typecheck` is clean with `noUnusedLocals`/`noUnusedParameters` enabled
- No widget — the WidgetKit target was never wired into Xcode and has been removed
- iOS only — no web or Android target

## What's NOT working yet

- **`startAwarenessMonitoring()` crashes** — Fixed the root cause (was passing selection ID string instead of base64 data to `startMonitoring`), but hasn't been tested yet. The fix is in `lib/monitoring.ts` — it now calls `getFamilyActivitySelectionId(SELECTION_ID)` to get the raw data. User needs to reinstall/clear data and go through onboarding again to test.
- **Shortcuts iCloud link** — `SHORTCUT_ICLOUD_LINK` in `lib/shortcuts.ts` is still `null`. Need to create the shortcut on a real iPhone and share it via iCloud to get the link.

## What was done this session

1. **Apple Developer enrollment** — completed, Team ID `APPLE_TEAM_ID`
2. **Family Controls entitlement** — approved (Development)
3. **App Store Connect** — app created as "Intentful", Apple ID `6761717073`
4. **Bundle ID renamed** — `com.habitfilter.app` → `app.intentful.ios`
5. **App Group renamed** — `group.intentful.shared`
6. **URL scheme renamed** — `habitfilter://` → `intentful://`
7. **Registered in Apple Developer Portal**: 5 App IDs + 1 App Group with correct capabilities
8. **Removed all debug/Expo Go fallback code** — deleted `lib/debug.ts`, removed try/catch lazy loading of notifications and native imports, removed debug skip buttons
9. **Created `plugins/withAutoSigning.js`** — config plugin that sets Automatic signing on all targets
10. **Created build scripts** — `scripts/build.sh` and `scripts/dev.sh`, added npm scripts
11. **Fixed build issues** — package version mismatches (`npx expo install --fix`), Xcode account sign-in, device registration
12. **Dev server** — works with `--tunnel` flag (phone and computer don't need same WiFi)
13. **Diagnosed startMonitoring crash** — `startMonitoring` events expect raw base64 FamilyActivitySelection data, NOT the string ID. Fixed in `monitoring.ts`.
14. **Added monitored app count to dashboard** — uses `activitySelectionMetadata()` from the library
15. **Created reusable template** at `~/git/expo-template` — extracted generic Screen Time boilerplate
16. **Updated CLAUDE.md** — reflects all current state

## Apple Developer Portal Setup

- **Team ID**: `APPLE_TEAM_ID`
- **Apple ID (App Store Connect)**: `6761717073`
- **Bundle IDs registered**:
  - `app.intentful.ios` (main app) — Family Controls (Dev) + App Groups
  - `app.intentful.ios.ActivityMonitorExtension` — Family Controls (Dev) + App Groups
  - `app.intentful.ios.ShieldConfiguration` — Family Controls (Dev) + App Groups
  - `app.intentful.ios.ShieldAction` — Family Controls (Dev) + App Groups
  - `app.intentful.ios.AttentionWidget` — App Groups only (registered but UNUSED; widget removed)
- **App Group**: `group.intentful.shared`

## Key Technical Lessons

1. **`startMonitoring` events need base64 selection data** — `getFamilyActivitySelectionId("monitored-apps")` returns the raw base64 string. Pass THAT to events, not `"monitored-apps"`.
2. **`configureActions` uses selection ID strings** — different code path, works fine with `"monitored-apps"`.
3. **Minimum threshold is 15 minutes** — Apple silently ignores lower thresholds.
4. **Max 20 simultaneous DeviceActivity monitors**.
5. **Expo CLI doesn't pass `-allowProvisioningUpdates`** — build with xcodebuild directly or use Xcode.
6. **Dev server needs `--tunnel`** — local network connection between phone and Mac was failing.
7. **`expo-dev-menu` version mismatch** — run `npx expo install --fix` after any dependency changes.
8. **Xcode needs Apple ID signed in** (Xcode → Settings → Accounts) — one-time setup, required for provisioning profiles.
9. **`activitySelectionMetadata` takes an object, not a string** — pass
   `{ activitySelectionToken: getFamilyActivitySelectionId(SELECTION_ID) }`. Same ID-vs-token
   trap as lesson 1, different call shape.
10. **`targets/` is vendored** — `react-native-device-activity`'s plugin re-copies it from
    `node_modules` on every prebuild, so edits there are lost. Pass `copyToTargetFolder: false`
    in the plugin props before customizing any extension Swift code.
11. **`expo prebuild` re-adds an `android` script** to `package.json` — remove it again, or ignore.

## Next Steps

1. **Test the monitoring fix** — reinstall app, go through onboarding, verify `startAwarenessMonitoring()` no longer crashes
2. **Test shields actually appear** — open a monitored app, wait past threshold, verify shield shows
3. **Test reflection flow end-to-end** — shield → tap "I have a reason" → opens Intentful → why screen → alternatives
4. **Create the iCloud shortcut** — on iPhone, create shortcut, share via iCloud, paste link in `lib/shortcuts.ts`
5. **App icon and splash screen** — currently using Expo defaults
6. **App Store listing** — screenshots, description, keywords
7. **Request Family Controls Distribution entitlement** — needed for TestFlight/App Store

## Naming

- App name: **Intentful** (reserved in App Store Connect)
- "Nudge" and "Lucid" were taken
- Competitors: One Sec (breathing exercise), ScreenZen (static delay + escalating counter), Opal (blocking + analytics)
- Our differentiator: adaptive friction that learns your patterns — no competitor does this

## Pricing Direction

- Leaning toward **one-time purchase of 50 SEK (~$5)** — stands out against competitors charging $30-50/year
- No backend, no accounts, everything on-device — minimal maintenance cost
- Realistic year-1 revenue with no marketing: 10,000-30,000 SEK

## App Store Description (for Family Controls entitlement)

> My app is a self-awareness tool for screen time. The user picks which apps they want to monitor, and the app uses the Screen Time API to track how much time they spend in those apps. When it notices patterns forming, it steps in with a quick reflection — basically asking "why are you opening this?" and whether it was intentional or just habit.
>
> Over time it classifies behavior into intentional, habitual, or autopilot, and adjusts how much friction it applies based on the user's own trends. So it gets out of the way when things are going well and steps in more when patterns are heading in the wrong direction.
>
> It's a self-management tool for adults — not a parental control app.

## User Info

- Based in Sweden
- Has Apple Developer account (individual, not organization)
- Building this primarily for personal use, with potential to publish
- Interested in learning about own phone habits
- Prefers casual, direct communication
