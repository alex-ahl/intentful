# Intentful (Habit Filter)

iOS-first "Attention Awareness Layer" app built with Expo. Instead of blocking or delaying apps, it detects behavioral patterns silently and introduces adaptive friction only when autopilot behavior is detected.

## Stack

- **Expo SDK 54** with development builds (bare workflow via `expo-dev-client`)
- **React Native 0.81** with new architecture enabled
- **expo-router** for file-based routing
- **react-native-device-activity** (Kingstinct) for Apple Screen Time APIs
- **AsyncStorage** for persistence
- **WidgetKit** (native Swift) for iOS home screen widget

## Running

```bash
# Development in Expo Go (no native APIs)
npx expo start --go

# Development build on physical device (required for Screen Time APIs)
npx expo run:ios --device
```

Debug mode (`__DEV__`) enables test data seeding and skipping Screen Time auth.

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
  (tabs)/index.tsx            # Dashboard: patterns, adaptive thresholds, daily report
  (tabs)/settings.tsx         # Awareness toggle, shortcuts setup, clear data
  onboarding/                 # welcome → select-apps → confirm
  reflect/                    # why → alternatives → timer/breathe
  shortcuts-setup.tsx         # Shortcuts automation setup flow
lib/
  adaptive.ts                 # Adaptive threshold rules engine
  classification.ts           # Behavior classification (intentional/habitual/compulsive)
  constants.ts                # Thresholds, reasons, alternatives, behavior levels
  debug.ts                    # Debug mode, test data seeding
  device-activity.ts          # Screen Time API wrapper
  monitoring.ts               # Start/stop monitoring, configure escalating actions
  notifications.ts            # Post-session nudges, binge alerts, weekly reflection
  patterns.ts                 # Pattern detection (time-of-day, streaks, escalation)
  shield-config.ts            # 3 escalating shield configurations
  shortcuts.ts                # App open tracking via Shortcuts deep links
  storage.ts                  # AsyncStorage helpers, reflection log, daily reports
  types.ts                    # ReflectionEntry, DailyReport, UsageSession
  widget.ts                   # Write data to shared UserDefaults for WidgetKit
targets/
  AttentionWidget/            # Native SwiftUI WidgetKit extension
  ActivityMonitorExtension/   # DeviceActivity monitor extension
  ShieldConfiguration/        # Shield UI extension
  ShieldAction/               # Shield action handler extension
```

## Configuration

- **Bundle ID**: `app.intentful.ios`
- **App Group**: `group.intentful.shared`
- **URL Scheme**: `intentful`
- **Apple Team ID**: Set in `app.config.ts` (currently placeholder `REPLACE_WITH_YOUR_TEAM_ID`)
- **iOS Deployment Target**: 16.0

## Important Notes

- Screen Time APIs only work on physical iOS devices, not Simulator or Expo Go
- `expo-notifications` is lazy-loaded with try/catch — crashes in Expo Go
- DeviceActivity events are TIME-based thresholds only (cumulative minutes), not open-count-based
- Family Controls entitlement required for TestFlight/App Store distribution
- The `SHORTCUT_ICLOUD_LINK` in `lib/shortcuts.ts` needs to be set with a real iCloud link once the shortcut is created
