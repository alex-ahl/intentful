#!/bin/bash
# Start the development server.
#
# LAN by default: the dev client can only auto-discover a server advertised on
# the local network, so --tunnel silently breaks discovery and forces manual
# URL entry. Pass --tunnel explicitly when the phone and Mac are on different
# networks: `npm run dev -- --tunnel`.
#
# If discovery still fails on the same WiFi, check Settings > Intentful >
# Local Network — iOS prompts once and fails silently forever if dismissed.
npx expo start --dev-client "$@"
