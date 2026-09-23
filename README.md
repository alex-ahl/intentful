# Intentful

An iOS app that does one thing: when you open an app you've chosen, it asks
**"Are you sure you really want to open this app?"**

Tap **Open anyway** and it opens. Tap **Not now** and it closes. That's the
whole product — no timers, no streaks, no scores, no analytics, no account.

MIT licensed. Everything stays on your device; nothing is collected or sent
anywhere.

<p align="center">
  <img src="docs/screenshots/onboarding.png" width="30%" alt="First run, asking for Screen Time access">
  <img src="docs/screenshots/choose-apps.png" width="30%" alt="Choosing which apps to shield, with the toggle on">
  <img src="docs/screenshots/shield.png" width="30%" alt="The shield asking Are you sure?">
</p>

## How it works

Apple's Screen Time APIs can only trigger on *cumulative minutes of use*, never
on an app being opened. So Intentful doesn't use thresholds at all — it applies
a shield to your selected apps and leaves it there. A permanently shielded app
shows the shield every time you open it, which is exactly the prompt we want.

Tapping **Open anyway** lifts the shield and schedules a one-off 15-minute
`DeviceActivity` interval. When that interval ends, the monitor extension puts
the shield back.

Two things about that window are worth knowing, because they surprise people:
it lifts the shield on **every** app you've chosen, not just the one you
opened, and it runs on the clock whether you use anything or not.

Fifteen minutes is Apple's minimum schedule length, not a design choice.

## Requirements

- A **physical iPhone** — Screen Time APIs do not exist in the Simulator
- Xcode with your Apple ID signed in (Xcode › Settings › Accounts)
- An Apple Developer account
- iOS 16+

## Building it yourself

```bash
npm install
APPLE_TEAM_ID=YOURTEAM BUNDLE_ID=com.you.intentful APP_GROUP=group.you.intentful \
  npm run build
```

`APPLE_TEAM_ID` is required and has no default — the build fails with a clear
message without it. `BUNDLE_ID` and `APP_GROUP` fall back to this project's own
identifiers, which are registered to someone else's team, so set your own.
Putting them in `.env.local` works too; that file is gitignored.

`npm run build` prebuilds the iOS project, compiles with `xcodebuild`, and
installs onto the connected device. `npm run dev` starts the dev server on the
local network, which is what lets the dev client find it automatically. If the
phone and Mac are on different networks, use `npm run dev -- --tunnel` and enter
the URL by hand.

### Apple setup

Register these four App IDs in the developer portal, each with **Family
Controls** and **App Groups** capabilities, plus one App Group:

```
com.you.intentful
com.you.intentful.ActivityMonitorExtension
com.you.intentful.ShieldConfiguration
com.you.intentful.ShieldAction
```

The **Family Controls (Development)** capability is self-serve — tick it and it
works. Shipping to TestFlight or the App Store additionally requires the
**Family Controls (Distribution)** entitlement, which is
[requested from Apple](https://developer.apple.com/contact/request/family-controls-distribution)
per bundle ID and reviewed manually. Once granted you must enable it under
*Additional Capabilities* on each identifier — it is not the same checkbox.

## Layout

```
app/
  _layout.tsx        Stack, nothing else
  index.tsx          the only screen: app picker + on/off
lib/
  colors.ts          palette, sampled from the app icon
  constants.ts       selection id, re-arm window
  device-activity.ts Screen Time authorization
  monitoring.ts      arm() / disarm()
  shield-config.ts   the "Are you sure?" shield and its two buttons
plugins/
  withAutoSigning.js sets automatic signing on all four targets
targets/             vendored extensions, overwritten from node_modules on prebuild
```

## Credits

Built on [react-native-device-activity](https://github.com/kingstinct/react-native-device-activity)
by Kingstinct, which does the hard work of exposing Apple's Screen Time APIs to
React Native.
