# Aetherwake

Top-down space shooter — twin-stick movement, forge upgrades between waves, local high scores.

**Tagline:** Forge the ship. Wake the void.

## Play (web)

Aetherwake is an **installable web app**. Open the live site, then:

- **Android / Chrome / Edge** — tap **Install app** on the title screen (or the browser install icon).
- **iPhone / iPad** — tap **Add to Home Screen**, then Share → Add to Home Screen.

Once installed it opens full-screen like a native app and keeps working **offline** after the first visit (sprites, title, and the game shell are cached).

Or run locally:

```bash
npm install
npm run dev
```

Controls: WASD move · mouse / arrows / IJKL aim · touch dual sticks · gamepad supported.

## Feedback (bugs & suggestions)

Player feedback lives on **GitHub Issues**:

- Open issues: https://github.com/wilsonsamiano/Aetherwake/issues
- Starter thread: https://github.com/wilsonsamiano/Aetherwake/issues/1
- Use **Bug report** or **Suggestion** templates when creating an issue

**Important:** this repository must be **Public** for strangers to comment.  
Settings → General → Danger Zone → Change visibility → Public.

Optional: enable **Discussions** (Settings → General → Features) for open chat-style feedback separate from tracked bugs.

## Offline & other platforms

| Target | Approach | Offline? |
|--------|----------|----------|
| **Web app** | Install to Home Screen (PWA) — Install app on title, or iOS Share → Add to Home Screen | Yes, after first visit |
| **Android APK** | Wrap the web build with [Capacitor](https://capacitorjs.com/) | Yes, packaged assets |
| **Windows** | [Tauri](https://tauri.app/) or Electron shell around the build | Yes |
| **Linux** | Same Tauri/Electron build (AppImage / deb) | Yes |

The game logic is pure client-side (canvas + `localStorage`). No account server is required for offline play.

Shipping signed APKs and desktop installers needs a one-time setup (Android Studio / signing keys, or Tauri toolchain) on a developer machine. That is not automatic from GitHub alone.

## Support

[Buy me a coffee](https://buymeacoffee.com/wilsonsamiano)
