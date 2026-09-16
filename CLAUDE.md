# Intentful

iOS app with exactly one behaviour: opening a selected app shows a shield asking
"Are you sure you really want to open this app?". Yes → 15 minutes of access.
No → the app closes. MIT, open source, on-device only.

Deliberately minimal. Resist adding features — the previous version of this app
had adaptive thresholds, a reflection flow, pattern detection and notifications,
and was stripped back to this on purpose.

## Stack

- **Expo SDK 54**, development builds (`expo-dev-client`)
- **React Native 0.81**, new architecture
- **expo-router** (two files: a layout and one screen)
- **react-native-device-activity** v0.6.1 for the Screen Time APIs

iOS only. No web, no Android, no backend, no persistence beyond what the
Screen Time APIs store natively.

## Running

```bash
npm run build      # prebuild → xcodebuild → install on connected iPhone
npm run dev        # dev server on the LAN (add -- --tunnel across networks)
npm run typecheck
```

Needs a physical iPhone over USB. `APPLE_TEAM_ID`, `BUNDLE_ID` and `APP_GROUP`
are read from the environment with the maintainer's values as fallback.

The dev client only auto-discovers servers advertised on the local network, so
`--tunnel` is opt-in rather than the default — it works across networks but
forces manual URL entry.

## How the one behaviour works

DeviceActivity can only fire on cumulative minutes, never on an app being
opened. So there is no threshold: `arm()` applies `blockSelection` and leaves it
applied, and a permanently shielded app shows its shield on every open.

The shield's **Yes** button runs two actions: `unblockSelection`, then
`startMonitoring` for a one-off interval named `rearm`. When that interval ends,
the monitor extension runs the `intervalDidEnd` action registered by `arm()`,
which re-applies `blockSelection`.

## Key files

```
app/_layout.tsx       Stack only
app/index.tsx         the whole UI: picker + toggle
lib/constants.ts      SELECTION_ID, REARM_ACTIVITY_NAME, REARM_MINUTES
lib/device-activity.ts  authorization wrapper
lib/monitoring.ts     arm() / disarm() / isArmed()
lib/shield-config.ts  shield copy and the Yes/No actions
plugins/withAutoSigning.js  CODE_SIGN_STYLE=Automatic on all targets
targets/              vendored — overwritten from node_modules on every prebuild
```

## Constraints worth knowing

- Screen Time APIs only work on physical devices, never the Simulator
- **15 minutes is Apple's minimum DeviceActivity schedule** — the re-arm window
  cannot be shorter
- Shields allow exactly two buttons
- `updateShield` writes the fallback shield keys the extensions read;
  `updateShieldWithId` only applies when an action names that id, and blocking
  from JS cannot pass one
- `targets/` is re-copied from `node_modules` on every prebuild, so edits there
  are lost unless the plugin gets `copyToTargetFolder: false`
- Family Controls **(Development)** is self-serve; **(Distribution)** is
  requested per bundle ID and reviewed by Apple, then enabled under
  *Additional Capabilities*
- Max 20 simultaneous DeviceActivity monitors (this app uses one, briefly)
