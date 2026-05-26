# SETUP — Run Donum on your machine

This guide is for **new contributors** (e.g. Ghaith) running the Donum
Android app for the first time. Allow ~30 minutes for first-time setup.

---

## 1. Install the tools (one time)

You need these installed first:

| Tool | Version | Where to get it |
|---|---|---|
| Node.js | 18 or 20 LTS | https://nodejs.org |
| JDK | 17 | https://adoptium.net/temurin/releases/?version=17 |
| Android Studio | latest | https://developer.android.com/studio |
| Git | any | https://git-scm.com |

After installing Android Studio:
1. Open it, go to **Tools → SDK Manager**.
2. Make sure **Android 14 (API 34)** SDK is installed.
3. Go to **Tools → Device Manager**.
4. Create a virtual device: **Pixel 7**, system image **API 34**.

---

## 2. Clone the repo

```powershell
cd C:\Dev   # or wherever you keep code
git clone https://github.com/youssef3153999/donum-app.git ardmap
cd ardmap
```

> The folder is called `ardmap` for historical reasons. The app name is
> Donum.

---

## 3. Install dependencies

```powershell
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is required — without it, the install
breaks on `babel-plugin-module-resolver`.

**Do NOT bump any package versions** — see `DONUM_DOCS.md` section 3
for the pinned list.

---

## 4. Run on the emulator

In Android Studio, **start your Pixel 7 emulator first** (Device
Manager → ▶), wait for it to fully boot, then in PowerShell:

```powershell
npx react-native run-android
```

First build takes 3–7 minutes. The app should open automatically on the
emulator.

---

## 5. (Optional) Run on a physical phone via USB

Much faster for daily development.

1. On your phone: **Settings → About phone → tap Build number 7 times**.
2. **Settings → Developer options → enable USB debugging**.
3. Plug the phone into the computer. Accept the "Allow always" prompt
   on the phone.
4. Confirm the phone is connected:
   ```powershell
   adb devices
   ```
   You should see your device ID listed.
5. Run:
   ```powershell
   npx react-native run-android --deviceId=YOUR_DEVICE_ID
   ```

---

## 6. Hot reload

After the first install, you don't need to rebuild for JavaScript
changes. Just **save the file** and the app updates in ~3 seconds.

If hot reload stops working, shake the phone (or press `R` twice in
the emulator) to manually reload.

---

## 7. Daily git workflow

```powershell
# Before editing — always pull first
git pull

# After editing
git add .
git commit -m "feat: short description of what you did"
git push
```

---

## 8. If something breaks

Look in `DONUM_DOCS.md` **section 10** — it lists every build/runtime
issue we've hit and how we solved it.

The most common one: **Metro port 8081 already in use**.
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```
Then re-run `npx react-native run-android`.

---

## 9. Where to look in the code

| What you want | File |
|---|---|
| Project overview, decisions, roadmap | `DONUM_DOCS.md` ← read this first |
| Quick rules for AI assistants | `CLAUDE.md` |
| Main map screen + plot detail card | `src/screens/MapScreen.tsx` |
| Form to create a plot | `src/screens/CreatePlotForm.tsx` |
| All Supabase reads/writes | `src/data/plots.ts` |
| UI text in AR / DE / EN | `src/lib/i18n.ts` |
| Filters | `src/screens/FilterSheet.tsx` |
| Investment calculator | `src/screens/InvestmentCalculator.tsx` |
| Profile + verification UI | `src/screens/ProfileScreen.tsx` |

---

## 10. Need help?

Ask Youssef on WhatsApp, or post a question in the GitHub repo issues.

Welcome aboard 🚀
