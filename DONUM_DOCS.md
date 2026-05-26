# DONUM — Master Project Documentation

> **Last updated:** 2026-05-26 (PM)
> **Owner:** Youssef Al Ali (`youssefalali91@gmail.com`)
> **Collaborator:** Ghaith
> **Read this file daily** to know where the project stands.
> An AI tool (Claude, ChatGPT, Gemini, etc.) reading this file alone should be
> able to continue work without further context.

---

## 0. TL;DR for AI assistants (read this first)

You are helping build **Donum** — a real-estate platform for **land plots in
Syria**. The unique feature is that sellers draw the **exact polygon
boundaries** of their land on a satellite map; buyers see the location, size,
and contact directly. Map-first UX, super simple.

There are two products sharing one Supabase backend:
- **Website** at `C:\Users\YoussefAlalitecclegr\OneDrive - teccle group GmbH\Dokumente\Claude\Projects\Website` — Next.js + Supabase + Leaflet, live, mobile-hardened May 2026.
- **Android app (this repo)** at `C:\Dev\ardmap` — bare React Native 0.75.4, Google Maps via react-native-maps, Supabase backend.

The app is in **active development**. We are not on the Play Store yet.

Brand name: **Donum** (Arabic: **دونم**). Old name was "ard-map" — domain
ard-map.com still exists, brand renamed.

When responding to Youssef:
- Default language is **Arabic** (write in Arabic letters only).
- Keep answers **terse**, no long explanations.
- After each step/question/prompt, write a short Arabic explanation (شرح:).
- Business-quality tone, not hobby project.
- Do **NOT** suggest TWA, PWA, or anything that isn't a real native app —
  Youssef rejected this strongly.

---

## 1. The Vision

**Problem:** Syrians (locals + 6M+ diaspora) want to buy/sell land but the
existing options (Facebook groups, OLX, شامي/سوريا تيوب-style sites) all
have:
- No map-based discovery
- No trust signals (rampant scams)
- No clear pricing intelligence
- No way to see *exactly* what land you're buying

**Donum's wedge:** Sellers literally draw the plot polygon on the satellite
map. Buyers see the exact shape, size, and location instantly. Trust is built
through verified sellers, real photos, and transparent market data.

**Strategic target:** Syrian diaspora investors (Germany, Turkey, Gulf) who
have hard currency but can't visit. They are willing to pay for trust.

---

## 2. Current Status (2026-05-22)

### What's live in the app

**Auth & Profiles**
- Email + password sign-in via Supabase Auth.
- `profiles` table auto-populated for new users.
- Verified-seller badge system (manual verification via WhatsApp).

**Map**
- Google Maps hybrid satellite, centered on Syria.
- Polygon drawing: tap to add corners → undo → finish.
- Price pills (Marker) over each plot.
- Filtered display based on search + filter state.

**Plot listings**
- Draw → fill form (district, use, price, currency, phone, description).
- Upload up to 5 photos (camera or gallery) → Supabase Storage `plot-images` bucket.
- Saves with status `pending` (admin approval still manual).

**Plot detail (bottom sheet)**
- Hero image gallery with pagination dots + counter.
- Status badge (active/sold/pending).
- Favorite heart button (UI only, state not persisted yet).
- Hero price + price-per-m² calculation.
- Utility chips (electricity, water, road) with icons.
- Description, posted date, view count.
- Verified seller badge next to title.
- **Investment Calculator** button → opens ROI sheet (see below).
- Sticky action bar: Call · WhatsApp (with native share + favorite up top).

**Search & Filter**
- Floating search bar — type a district name (AR/DE/EN), map zooms to it.
- Filter sheet with: districts (multi), use, price range, area range,
  utilities, photos-only.
- Active-filter count badge on the filter button.
- Results count badge below the search bar.

**Investment Calculator** *(latest addition)*
- Modal sheet opened from plot detail.
- Compares purchase price/m² to market average (same district + same use).
- Coloured market box: green if below market, red if above.
- 3 / 5 / 10 year projection using growth rates per district × use.
- Shows total ROI %, annual ROI %, district growth rate.
- Text-based timeline bars.
- Legal disclaimer.

**Profile screen**
- Email shown.
- Verification status card (green if verified, yellow if not).
- "Contact to verify" button opens WhatsApp on the admin number.
- Language switcher (AR / DE / EN).
- Sign out.

**i18n**
- Full Arabic + English + German dictionaries (~150 keys).
- `t(lang, key)` helper everywhere.
- Default language is Arabic.

### What's NOT done yet (active backlog, see section 7)

Phone OTP, edit listing, mark-as-sold, report listing, Sentry crash reporting,
in-app chat, marker clustering, push notifications, favorites persistence,
saved searches, admin panel, rich link previews, deep links, currency
conversion, video viewing.

---

## 3. Tech Stack & Pinned Versions

**DO NOT BUMP these without a strong reason — they're known to play nicely
together with RN 0.75.4 + AGP 8.5:**

| Package | Version | Notes |
|---|---|---|
| react-native | 0.75.4 | Bare workflow (not Expo) |
| react-native-reanimated | 3.15.4 | Last 3.x compatible with RN 0.75 |
| react-native-gesture-handler | 2.18.1 | |
| react-native-maps | 1.18.0 | Google Maps, **not** Mapbox |
| react-native-screens | 3.34.0 | |
| react-native-safe-area-context | 4.10.9 | |
| react-native-svg | 15.6.0 | |
| react-native-image-picker | 7.1.2 | Camera permission must be requested manually |
| @react-native-async-storage/async-storage | 1.24.0 | |
| @supabase/supabase-js | 2.45.4 | |
| @react-navigation/* | v6 | Bottom tabs |
| AGP (Android Gradle Plugin) | 8.5.0 | |
| Gradle | 8.8 | |
| compileSdk | 34 | |
| minSdk | 23 | |
| JDK | 17 | |

**Critical pin:** `androidx.core` is forced to `1.13.1` in
`android/app/build.gradle` via `resolutionStrategy`. 1.16+ needs AGP 8.6.

**Why bare RN, not Expo?** Mapbox/Google Maps native modules don't work well
with Expo Go, and Youssef wants a true native build.

**Mapbox?** Abandoned. We tried `@rnmapbox/maps` on multiple versions; codegen
kept failing. Replaced with `react-native-maps` (Google Maps).

---

## 4. File Structure (app, what matters)

```
C:\Dev\ardmap\
├── android\                          # Android native project
│   └── app\
│       ├── build.gradle              # SDK versions, signingConfigs, resolutionStrategy
│       └── src\main\
│           ├── AndroidManifest.xml   # Permissions, Google Maps API key
│           └── res\values\strings.xml # app_name "Donum"
│
├── src\
│   ├── lib\
│   │   ├── env.ts                    # Supabase URL + anon key
│   │   ├── supabase.ts               # Supabase client with AsyncStorage
│   │   ├── theme.ts                  # Earth-tone colors, radii, spacing
│   │   ├── i18n.ts                   # AR/DE/EN dictionaries
│   │   ├── geometry.ts               # polygon area calc, formatters
│   │   ├── districts.ts              # District keys + coordinates + search
│   │   ├── marketEstimates.ts        # Growth rates for investment calculator
│   │   └── uploadImage.ts            # Upload helper for plot photos
│   ├── data\
│   │   └── plots.ts                  # fetchActivePlots, fetchMyPlots,
│   │                                 # createPlot, deletePlot, fetchMyProfile,
│   │                                 # fetchMarketStats, attachVerification
│   ├── screens\
│   │   ├── MapScreen.tsx             # Main map screen + DetailCard component
│   │   ├── CreatePlotForm.tsx        # Modal form to create a plot
│   │   ├── FilterSheet.tsx           # Filter bottom sheet
│   │   ├── InvestmentCalculator.tsx  # ROI calculator modal
│   │   ├── AuthScreen.tsx            # Sign in / sign up
│   │   ├── MyPlotsScreen.tsx         # User's own listings
│   │   └── ProfileScreen.tsx         # Account + verification + language
│   └── App.tsx                       # Root, bottom tabs, NavigationContainer
│
├── DONUM_DOCS.md                     # ← This file
├── SETUP.md                          # New-contributor onboarding guide
├── CLAUDE.md                         # AI assistant rules
├── .env.example                      # Stub (no .env needed currently)
└── package.json
```

**Important caveat:** The `water_source` column in the `plots` table is a
**boolean**, NOT text. When inserting, send `!!p.water_source || !!p.water`.

---

## 5. Database Schema (Supabase)

### Project info
- Supabase project: `aqar-map` (PROD) — owned by Youssef's org.
- Anon key + URL live in `src/lib/env.ts` (acceptable because repo is private).

### Tables

#### `plots` (the main table)
```
id                uuid (PK)
owner_id          uuid (FK → auth.users.id)
district          text
use               text
price             numeric
currency          text
electricity       boolean
water             boolean
road              boolean
water_source      boolean             -- NOT text!
coords            jsonb               -- array of [lat, lng]
area_m2           numeric
phone             text
title_ar          text
title_de          text
title_en          text
desc_ar           text
desc_de           text
desc_en           text
images            text[]              -- public URLs from plot-images bucket
status            text                -- 'active','pending','rejected','sold','hidden'
rejection_reason  text
admin_note        text
view_count        int                 -- not yet wired up
created_at        timestamptz
```

#### `profiles` (added during the verified-seller feature)
```
id            uuid (PK, FK → auth.users.id ON DELETE CASCADE)
full_name     text
phone         text
is_verified   boolean NOT NULL DEFAULT false
verified_at   timestamptz
created_at    timestamptz
updated_at    timestamptz
```

Trigger `on_auth_user_created` on `auth.users` runs `handle_new_user()` to
auto-insert a profile row when a new user signs up.

### Storage buckets
- `plot-images` (public) — holds uploaded plot photos.
  - Path convention: `<owner_id>/<timestamp>-<random>.<ext>`
  - Max 5 MB, mime: jpeg/png/webp
  - Policies: authenticated insert, public read, owners delete own.

### RLS (Row Level Security)
- `profiles`: anyone can read, owner can update own.
- `plots`: insert as authenticated, select where status='active' for public,
  owner can update/delete own.
- `storage.objects` (`plot-images`): authenticated upload, public select,
  owner delete.

### To verify a seller manually (until admin panel exists)
```sql
UPDATE public.profiles
SET is_verified = true, verified_at = now()
WHERE id = '<USER_ID from auth.users>';
```

---

## 6. Features — Completed Checklist

| # | Feature | Status |
|---|---|---|
| 1 | Email auth + sign in/up | ✅ |
| 2 | Map with satellite imagery | ✅ |
| 3 | Polygon drawing flow | ✅ |
| 4 | Create plot form | ✅ |
| 5 | My Plots screen | ✅ |
| 6 | AR/DE/EN i18n | ✅ |
| 7 | Pricing pills on map | ✅ |
| 8 | Plot detail bottom sheet (hero, photos, price, action bar) | ✅ |
| 9 | WhatsApp + Call + Share buttons | ✅ |
| 10 | Image upload (camera + gallery) | ✅ |
| 11 | Camera runtime permission flow | ✅ |
| 12 | Search bar (district zoom) | ✅ |
| 13 | Filter sheet (district, use, price range, area, utilities, has-photos) | ✅ |
| 14 | Verified seller badge | ✅ |
| 15 | Profile verification card + WhatsApp request | ✅ |
| 16 | Investment calculator (market avg + projection) | ✅ |
| 17 | Edit listing flow (resets to `pending` for re-approval) | ✅ |

---

## 7. Pending Roadmap (priority order)

This is the canonical backlog. Tell the AI "**start with item N**" and it
will pick up from there. Numbering matches the 25-item list given on
2026-05-22.

### Tier 1 — Required before any real launch

1. **Phone OTP verification.** Replaces / supplements email login. Stops fake
   accounts.
2. ~~**Edit listing flow.**~~ ✅ Done 2026-05-26. Owner can edit any field from
   "My plots" → ✎ Edit button. After edit, status resets to `pending` for
   re-moderation (anti bait-and-switch).
3. **Mark plot as sold.** Don't delete; flip `status` to `'sold'`. Preserves
   historical pricing data for the market calculator.
4. **Report a listing.** Button on each plot, admin moderation queue.
5. **Sentry crash reporting.** Wire `@sentry/react-native`. Without this we
   can't know what's breaking for users.
6. **Privacy policy + Terms of service** (in-app + hosted web pages).
   Required by Google Play.
7. **Account deletion from inside the app.** Required by Play Store + GDPR.

### Tier 2 — Quality that converts users to advocates

8. **Marker clustering** when >50 plots in view (use
   `react-native-map-clustering`).
9. **In-app chat** seller ↔ buyer (Supabase Realtime channel).
10. **Favorites + price-drop alerts.** Persist a `favorites` table.
11. **Saved searches + new-plot notifications.** FCM push.
12. **View counter + seller analytics** (already have `view_count` column,
    just wire it).
13. **Polished empty states** for "no plots", "no favorites", "no internet".
14. **Onboarding flow** (3-screen explainer before sign-in).

### Tier 3 — Polish

15. **Real icon set** (Lucide) instead of emoji 📷📍✓.
16. **Arabic-friendly font** (Cairo / IBM Plex Sans Arabic).
17. **Full RTL audit** of every screen.
18. **Light theme** that follows system preference.
19. **Migrate animations to Reanimated 3** for buttery feel.

### Tier 4 — Growth

20. **Rich Open Graph previews** when sharing plot links.
21. **Deep links / Android App Links** so a shared URL opens the app.
22. **Admin Panel** (web app or new tab) to verify sellers + approve plots
    without touching SQL.
23. **Live currency conversion** (USD / EUR / TRY / SYP) via API.
24. **Live video viewing** appointment (huge for diaspora investors).
25. **Refer-a-friend program** with shared code.

---

## 8. Daily Development Workflow

### Prerequisites (already set up on Youssef's machine)
- Node.js + npm
- Android Studio with Pixel 7 API 34 emulator (or use a physical device)
- JDK 17
- ADB on PATH

### Connect a physical phone via USB (preferred — fast)
1. Enable Developer Options: Einstellungen → Über das Telefon → tap
   Build-Nummer 7 times.
2. Enable USB-Debugging in Entwickleroptionen.
3. Plug in cable, accept "Allow always from this computer".
4. `adb devices` should list the phone (current device id:
   `9cce68a1e5c3`).

### Daily run command
```powershell
# Kill any stale Metro processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Build + install on phone (uses USB or wireless adb)
cd C:\Dev\ardmap
npx react-native run-android --deviceId=9cce68a1e5c3
```

After the first install, **save TypeScript files** and Metro will hot-reload
in ~3 seconds — no need to re-run `run-android`.

### Git workflow with Ghaith
```powershell
# Before editing
git pull

# After editing
git add .
git commit -m "feat: short description"
git push
```

GitHub repo: `https://github.com/youssef3153999/donum-app` (private).

---

## 9. Building a Release APK (for sharing)

```powershell
cd C:\Dev\ardmap\android
.\gradlew assembleRelease
```

Output: `C:\Dev\ardmap\android\app\build\outputs\apk\release\app-release.apk`

Currently signed with the **debug keystore** — fine for sharing with
testers, **not OK for Play Store**. Before Play Store launch, generate a
proper keystore:
```powershell
cd C:\Dev\ardmap\android\app
keytool -genkeypair -v -storetype PKCS12 -keystore donum-release.keystore -alias donum -keyalg RSA -keysize 2048 -validity 10000
```
Then update `signingConfigs` in `app/build.gradle` and **back up that
keystore forever** — losing it means losing the ability to update the
Play Store listing.

---

## 10. Known Issues & Solutions

| Symptom | Cause | Fix |
|---|---|---|
| Mapbox SDK fails codegen | `@rnmapbox/maps` incompatible with RN 0.75.4 | Use `react-native-maps` (Google Maps) instead |
| `INSTALL_FAILED_USER_RESTRICTED` on Xiaomi phones | MIUI blocks unknown sources | Use Pixel emulator or other brand phone |
| Metro port 8081 in use | Old node process not killed | `Get-Process node \| Stop-Process -Force` |
| `babel-plugin-module-resolver` missing | npm install failed | `npm install --legacy-peer-deps` |
| `water_source NULL violation` | Column is boolean not text | Send `!!p.water_source \|\| !!p.water` |
| Camera button does nothing | Android 6+ runtime permission denied | Use `PermissionsAndroid.request(CAMERA)` (we added this) |
| Public IP in wireless adb pairing fails | Phone hotspot exposes cellular IP | Use USB cable instead |

---

## 11. Secrets & Configuration

The repo is **private**, so the following secrets live inside the code
(acceptable for now):

- `SUPABASE_URL` + `SUPABASE_ANON_KEY` → `src/lib/env.ts`
- Google Maps API key → `android/app/src/main/AndroidManifest.xml`
- Admin WhatsApp number for verification → `src/screens/ProfileScreen.tsx`
  (`VERIFY_WHATSAPP` constant — **change `963999999999` to your real
  number**)

**If the repo ever goes public:** move these to a `.env` file outside git
+ a build-time substitution step.

---

## 12. Decision Log (why we built things this way)

| Decision | Date | Rationale |
|---|---|---|
| Bare RN, not Expo | initial | Mapbox native modules + future deep customization |
| Mapbox → Google Maps | initial | Mapbox codegen broke repeatedly on RN 0.75 |
| `androidx.core` pinned to 1.13.1 | initial | 1.16+ needs AGP 8.6, we're on 8.5 |
| Brand renamed ard-map → Donum | early 2026 | Cleaner name, .app domain available |
| Save photos in Supabase Storage, not third-party | 2026-05-22 | One vendor = one bill, one outage surface |
| Verify sellers manually first | 2026-05-22 | Volume is low; build admin panel later |
| Market growth rates are static (not from data) | 2026-05-22 | We have <100 listings; not enough data for a real model |
| Investment calculator uses district × use multipliers | 2026-05-22 | Simple and explainable; refine later with sold-plot data |
| Search auto-applies the district filter | 2026-05-22 | One action ≈ one intent |
| Bottom sheet has a backdrop dim | 2026-05-22 | Matches Airbnb / Booking UX expectation |
| `.env.example` neutered; no .env needed | 2026-05-26 | Repo is private, all values live in code — simpler for new contributors |
| Added `SETUP.md` for new contributors | 2026-05-26 | Ghaith and any future collaborator should be able to run the project without asking Youssef |
| Edit reuses CreatePlotForm with `existingPlot` prop | 2026-05-26 | One form, two modes — half the code to maintain |
| Edited plots reset to `status='pending'` | 2026-05-26 | Anti bait-and-switch: prevents seller from publishing clean listing, then editing to spam after approval |
| Coords/area can't be edited | 2026-05-26 | Polygon was drawn at creation — to redraw, delete + recreate (rare operation) |

---

## 13. AI Continuation Prompt (copy this into ANY AI tool)

If you switch to ChatGPT, Gemini, another Claude session, or any new
AI tool, paste **this prompt** at the start of the conversation, then
paste the contents of this file. The AI will be able to continue the
work seamlessly.

```
You are taking over development of an Android app called Donum — a
real-estate platform for land plots in Syria where sellers draw the exact
polygon boundary of their land on a satellite map.

I (Youssef) will guide you through changes step by step. Before you make
any code suggestions, please:

1. Read the DONUM_DOCS.md file I'm about to paste — it contains the full
   project state, tech stack, file structure, database schema, and a
   roadmap.
2. Respect the pinned package versions (RN 0.75.4, AGP 8.5, etc.). Do not
   suggest bumping them unless I explicitly ask.
3. Reply to me primarily in Arabic (Arabic letters only). Keep answers
   terse. After each step or command, add a short Arabic explanation
   prefixed with "شرح:".
4. Do NOT suggest TWA, PWA, or non-native solutions.
5. When I say "start with item N", look up item N in section 7 (Pending
   Roadmap) of the docs and begin that task.
6. When you change a file, give me the exact path under C:\Dev\ardmap\
   and the full edited contents (or a precise diff).
7. When I ask "where are we?", read section 6 and 7 and summarize.

Here is the current project state:
[ paste contents of DONUM_DOCS.md here ]
```

---

## 14. Quick reference — files to read first when re-opening this project

If you (Youssef or AI) only have time to look at a few files, look at:

1. **`DONUM_DOCS.md`** (this file) — full context.
2. **`src/screens/MapScreen.tsx`** — main screen + DetailCard.
3. **`src/data/plots.ts`** — all backend reads/writes.
4. **`src/lib/i18n.ts`** — all UI text.
5. **`src/screens/InvestmentCalculator.tsx`** — newest feature.
6. **`package.json`** — pinned versions.
7. **`android/app/build.gradle`** — Android build config.

---

## 15. How to update this file

Every time we finish a meaningful change:

1. Move the completed item from section 7 (Pending) to section 6 (Done).
2. Add a line to section 12 (Decision Log) if we made a non-obvious choice.
3. Bump the "Last updated" date at the top.
4. Commit:
   ```
   git add DONUM_DOCS.md
   git commit -m "docs: update DONUM_DOCS for <what changed>"
   git push
   ```

That's it. Treat this file as the single source of truth for the project.
