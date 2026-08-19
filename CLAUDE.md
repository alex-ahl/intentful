# Intentful

iOS "Attention Awareness Layer" app built with Expo. Instead of blocking or delaying apps, it detects behavioral patterns silently and introduces adaptive friction only when autopilot behavior is detected.

## Stack

- **Expo SDK 54** with development builds (bare workflow via `expo-dev-client`)
- **React Native 0.81** with new architecture enabled
- **expo-router** for file-based routing
- **react-native-device-activity** v0.6.1 (Kingstinct) for Apple Screen Time APIs
- **AsyncStorage** for persistence

iOS-only — there is no web or Android target.

## Running

```bash
# Build and install on physical device
npm run build

# Start dev server (tunnel mode, works across networks)
npm run dev

# TypeScript check
npm run typecheck
```

Requires physical iPhone connected via USB for build. Dev server uses `--tunnel` so phone and computer don't need same WiFi.

## Architecture

### 3-Layer System
1. **Detection** — Silent monitoring via DeviceActivity time thresholds + Shortcuts-based per-app open tracking
2. **Classification** — Categorizes behavior as intentional / habitual / compulsive based on daily interaction count
3. **Intervention** — Adaptive shields that escalate: gentle → moderate → strong

### Adaptive Rules Engine (`lib/adaptive.ts`)
Thresholds adjust dynamically based on 5 multiplicative rules: time-block intensity, day-of-week patterns, compulsive-free streak bonus, week-over-week trend. Time blocks: morning/afternoon/evening/night.

### Shield System
iOS Shield UI only supports 2 buttons. Shield = brief pause prompt; the richer reflection flow lives in the React Native app. Three escalating shields configured in `lib/shield-config.ts`.

### Shortcuts Integration
- Pre-built shortcut shared via iCloud link (set `SHORTCUT_ICLOUD_LINK` in `lib/shortcuts.ts`)
- Users still must manually create per-app automations (Apple limitation)
- Deep link: `intentful://opened?app=AppName` → recorded by `_layout.tsx`

## Key Files

```
app/
  _layout.tsx                 # Root layout, deep link handler, foreground reconfiguration
  (tabs)/index.tsx            # Dashboard: patterns, adaptive thresholds, daily report, monitored app count
  (tabs)/settings.tsx         # Awareness toggle, shortcuts setup, clear data
  onboarding/                 # welcome → select-apps → confirm
  reflect/                    # why → alternatives → timer/breathe
  shortcuts-setup.tsx         # Shortcuts automation setup flow (iCloud link or manual URL copy)
lib/
  adaptive.ts                 # Adaptive threshold rules engine
  classification.ts           # Behavior classification (intentional/habitual/compulsive)
  constants.ts                # Thresholds, reasons, alternatives, behavior levels
  device-activity.ts          # Screen Time API wrapper
  monitoring.ts               # Start/stop monitoring, configure escalating actions
  notifications.ts            # Post-session nudges, weekly reflection
  patterns.ts                 # Pattern detection (time-of-day, streaks, escalation)
  shield-config.ts            # 3 escalating shield configurations
  shortcuts.ts                # App open tracking via Shortcuts deep links
  storage.ts                  # AsyncStorage helpers, reflection log, daily reports
  types.ts                    # ReflectionEntry, DailyReport
plugins/
  withAutoSigning.js          # Config plugin: sets CODE_SIGN_STYLE=Automatic on all targets
targets/                      # Vendored — overwritten from node_modules on every prebuild
  ActivityMonitorExtension/   # DeviceActivity monitor extension
  ShieldConfiguration/        # Shield UI extension
  ShieldAction/               # Shield action handler extension
scripts/
  build.sh                    # Full build: prebuild → xcodebuild → install on device
  dev.sh                      # Start dev server with tunnel
```

## Configuration

- **Bundle ID**: `app.intentful.ios`
- **App Group**: `group.intentful.shared`
- **URL Scheme**: `intentful`
- **Apple Team ID**: `APPLE_TEAM_ID` (set in `app.config.ts`)
- **Apple ID**: `6761717073`
- **iOS Deployment Target**: 16.0

### Apple Developer Portal Registrations
- 4 App IDs in use: `app.intentful.ios`, `.ActivityMonitorExtension`, `.ShieldConfiguration`, `.ShieldAction`
  (a 5th, `.AttentionWidget`, is still registered in the portal but the widget target was removed)
- 1 App Group: `group.intentful.shared`
- Capabilities: Family Controls (Development) + App Groups on extensions

## Important Notes

- Screen Time APIs only work on physical iOS devices, not Simulator
- `startMonitoring` events need the **raw base64 selection data** from `getFamilyActivitySelectionId()`, NOT the selection ID string — passing the ID string causes a native crash
- DeviceActivity events are TIME-based thresholds only (cumulative minutes), not open-count-based
- Minimum effective threshold is 15 minutes (Apple limitation)
- Maximum 20 simultaneous DeviceActivity monitors
- Family Controls (Development) entitlement works immediately for testing; Distribution entitlement requires separate Apple approval
- The `SHORTCUT_ICLOUD_LINK` in `lib/shortcuts.ts` needs to be set with a real iCloud link once the shortcut is created
- Xcode must have Apple ID signed in (one-time: Xcode → Settings → Accounts) for builds to work
- A reusable template extracted from this project lives at `~/git/expo-template`
