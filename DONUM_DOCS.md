# DONUM — Master Project Documentation

> **Last updated:** 2026-06-12
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
| react-native-map-clustering | latest | JS wrapper around react-native-maps for clustering |
| geolib | latest | Pure-JS geodesic distances (`getDistance`) for edge lengths/perimeter |
| @turf/area | latest | Pure-JS polygon area (industry standard) for the measurement tool |
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
│   │   ├── geometry.ts               # area, perimeter, haversine, midpoint, formatters
│   │   ├── districts.ts              # District keys + coordinates + search
│   │   ├── marketEstimates.ts        # Growth rates for investment calculator
│   │   ├── sentry.ts                 # Sentry init (crash reporting) + DSN
│   │   └── uploadImage.ts            # Upload helper for plot photos
│   ├── data\
│   │   └── plots.ts                  # fetchActivePlots, fetchMyPlots,
│   │                                 # createPlot, deletePlot, fetchMyProfile,
│   │                                 # fetchMarketStats, attachVerification
│   ├── components\                   # Map sub-components (split 2026-05-31)
│   │   ├── MapTopBar.tsx             # Floating search + filter button
│   │   ├── MapFabStack.tsx           # Zoom + locate-me FABs (right side)
│   │   ├── DrawingToolbar.tsx        # Top banner + bottom cancel/undo/finish (+ "?" help)
│   │   ├── DrawHelpOverlay.tsx       # First-time drawing tutorial (3 steps)
│   │   └── PlotDetailSheet.tsx       # Bottom sheet with hero + actions
│   ├── screens\
│   │   ├── MapScreen.tsx             # Map orchestrator (uses /components)
│   │   ├── CreatePlotForm.tsx        # Modal form (create + edit)
│   │   ├── FilterSheet.tsx           # Filter bottom sheet
│   │   ├── InvestmentCalculator.tsx  # ROI calculator modal
│   │   ├── ReportSheet.tsx           # Report-listing modal
│   │   ├── LegalScreen.tsx           # Privacy + Terms reader
│   │   ├── AuthScreen.tsx            # Sign in / sign up
│   │   ├── MyPlotsScreen.tsx         # User's own listings (edit/delete)
│   │   ├── FavoritesScreen.tsx       # Saved/favorited plots (Favorites tab)
│   │   └── ProfileScreen.tsx         # Account + verification + delete
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

#### `favorites` (added 2026-05-31)
```
user_id     uuid (FK → auth.users.id ON DELETE CASCADE)
plot_id     uuid (FK → plots.id ON DELETE CASCADE)
created_at  timestamptz
PRIMARY KEY (user_id, plot_id)
```
RLS: each user can select/insert/delete only their own rows (`auth.uid() = user_id`).

### Storage buckets
- `plot-images` (public) — holds uploaded plot photos.
  - Path convention: `<owner_id>/<timestamp>-<random>.<ext>`
  - Max 5 MB, mime: jpeg/png/webp
  - Policies: authenticated insert, public read, owners delete own.

### Public-safe view
- `public_profiles` (view) — exposes ONLY `id, name, is_verified` from
  `profiles`. Granted `select` to `anon, authenticated`. Clients read seller
  name + verified badge from THIS view, never from the base table.
  - App: `attachVerification` in `src/data/plots.ts` reads from `public_profiles`.
  - Website: `MapBrowser.tsx` reads seller `name` from `public_profiles`.

### RLS (Row Level Security)
- `profiles`: owner reads OWN row only (`auth.uid() = id`); owner can update
  own. **No public read** — the old "anyone can read" policies were dropped
  2026-05-31 because they leaked `phone` + admin flags to anyone with the anon
  key. Public-safe fields go through `public_profiles` view. Admin reads use
  the service role (bypasses RLS).
- `plots`: insert as authenticated, select where status='active' for public,
  owner can update/delete own.
- `storage.objects` (`plot-images`): authenticated upload, public select,
  owner delete.
- `reports`: INSERT is **authenticated-only** with `auth.uid() = reporter_id`
  (hardened 2026-06-03 — the wide-open "Anyone can report" policy that let the
  raw anon key flood the queue, plus the `reporter_id IS NULL` loophole, were
  dropped). Reporter reads own rows only.

### Functions (RPC)
- `delete_my_account()` — SECURITY DEFINER, deletes caller's plots/profile/auth row.
- `increment_view_count(p_id uuid)` — SECURITY DEFINER, atomically bumps
  `plots.view_count`. Granted to anon + authenticated. Added 2026-05-31 so the
  view counter is real instead of always 0.

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
| 18 | Privacy Policy + Terms of Service screens (AR/EN/DE) | ✅ |
| 19 | Report listing flow (6 reasons + optional note → `reports` table) | ✅ |
| 20 | Account deletion (typed-confirm modal → `delete_my_account()` RPC) | ✅ |
| 21 | Map overhaul: edge-to-edge + marker clustering + Reanimated v3 + split components | ✅ |
| 22 | View counter wired (increment on opening plot detail) | ✅ |
| 23 | Favorites persistence (heart button saves to `favorites` table) | ✅ |
| 24 | Favorites tab + screen (list saved plots, remove) | ✅ |
| 25 | Sentry crash reporting (manual wire, pinned 5.33.1) | ✅ |
| 26 | Light theme re-skin + redesigned bottom tab bar (SVG icons + labels, swapped Map/Profile order) | ✅ |
| 27 | Drawing UX: draggable vertices, undo+redo, edge-length labels + live perimeter, haptic on placement | ✅ |
| 28 | "Add land" recenters the map on the seller's GPS location (location permission + blue dot) | ✅ |
| 29 | Mark plot as sold (owner action, status → 'sold', keeps price history) | ✅ |
| 30 | Polished empty states: Favorites + My Plots (SVG icon + title + subtitle, EmptyState component) | ✅ |

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
3. ~~**Mark plot as sold.**~~ ✅ Done 2026-06-12. `markAsSold(id)` in
   `src/data/plots.ts` flips `status` to `'sold'` (no pending reset — this is
   an owner intent, not a content change). Button appears in `MyPlotsScreen`
   only for `active` plots, behind an Alert confirmation. Optimistic local
   update. Sold plots excluded from map feed, kept in DB for market stats.
4. ~~**Report a listing.**~~ ✅ Done 2026-05-26. ⚑ button in DetailCard
   header opens `ReportSheet` with 6 reasons + optional note. Reports go
   to `public.reports` table. Admin moderation queue still TODO (will
   come with the admin panel).
5. ~~**Sentry crash reporting.**~~ ✅ Done 2026-06-02. Wired
   `@sentry/react-native@5.33.1` (pinned — NOT the wizard's latest 6.x).
   `initSentry()` in `src/lib/sentry.ts` is called at the top of `App.tsx`;
   root exported via `Sentry.wrap(App)`. Crash-only (`tracesSampleRate: 0`)
   to stay on the free plan. DSN is the EU public ingest key (safe in client).
   Still TODO: source-maps upload for readable release stack traces.
6. ~~**Privacy policy + Terms of service**~~ ✅ Done 2026-05-26. In-app
   `LegalScreen` (Modal) accessed from Profile screen. Three languages.
   Content embedded so it works offline. Still TODO: mirror the same
   text on the public website at `/privacy` and `/terms`.
7. ~~**Account deletion from inside the app.**~~ ✅ Done 2026-05-26.
   "Delete account" button (subtle, under sign-out) opens a modal with
   warning + typed confirmation (`DELETE` / `LÖSCHEN` / `حذف`). On confirm,
   calls Supabase RPC `delete_my_account()` which deletes plots, profile,
   and `auth.users` row in one transaction, then signs the user out.

### Tier 2 — Quality that converts users to advocates

8. ~~**Marker clustering**~~ ✅ Done 2026-05-31. Uses
   `react-native-map-clustering@latest`. Wraps `react-native-maps`'s
   MapView. Cluster color = brand, radius 50, min 3 markers.
9. **In-app chat** seller ↔ buyer (Supabase Realtime channel).
10. **Favorites + price-drop alerts.** Persist a `favorites` table.
11. **Saved searches + new-plot notifications.** FCM push.
12. **View counter + seller analytics** (already have `view_count` column,
    just wire it).
13. ~~**Polished empty states**~~ ✅ Done 2026-06-12. `EmptyState` component (SVG icon + title + subtitle) in `src/components/EmptyState.tsx`. Used in `FavoritesScreen` (heart icon) and `MyPlotsScreen` (pin icon). Map offline banner already existed. New i18n keys: `no_favorites_hint`, `no_plots_yet_hint`, `no_plots_hint`, `offline_title`, `offline_hint`.
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

**Release signing (set up 2026-05-31):** the app is now signed with a real
production keystore `android/app/donum-release.keystore` (alias `donum`,
RSA 2048, valid to 2053, CN=Youssef Al Ali). The keystore is git-ignored
(`*.keystore` in `android/.gitignore`). Passwords live in
`~/.gradle/gradle.properties` (NOT in the repo) as `DONUM_STORE_FILE`,
`DONUM_STORE_PASSWORD`, `DONUM_KEY_ALIAS`, `DONUM_KEY_PASSWORD`.
`app/build.gradle` `signingConfigs.release` reads them and falls back to
debug signing if they're absent. Release cert SHA-1:
`83:47:16:AD:AF:91:B3:85:B8:8D:21:F4:AF:2B:C1:62:AF:BC:EE:5A` (registered
on the Google Maps key alongside the debug SHA-1).

⚠️ **BACK UP the keystore + passwords forever** — losing them means losing
the ability to update the Play Store listing. They are NOT in git, so back
them up somewhere safe manually.

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
| Top search bar / filter button overlap the system status bar | `StatusBar.currentHeight` unreliable with translucent edge-to-edge status bar | Use `useSafeAreaInsets().top` (react-native-safe-area-context) in `MapTopBar`; FAB lifted by `insets.bottom` in `MapScreen` |
| App crashes (`SecurityException: vibrate: … android.permission.VIBRATE`) the moment drawing starts | `Vibration.vibrate()` haptic added 2026-06-03 needs the VIBRATE permission, which wasn't declared | Added `<uses-permission android:name="android.permission.VIBRATE" />` to `AndroidManifest.xml`. Normal permission, auto-granted, no runtime prompt. (Found via Sentry 2026-06-03.) |
| `UnsatisfiedLinkError: libreanimated.so` / `Cannot read property 'makeMutable' of undefined` on the **x86_64 emulator** | `gradle.properties` `reactNativeArchitectures` is arm-only (`armeabi-v7a,arm64-v8a`), so the emulator's x86_64 native libs (incl. Reanimated) aren't built | For emulator dev only, build with the override: `cd android && .\gradlew installDebug -PreactNativeArchitectures=x86_64`. Real ARM phones are unaffected — keep the release arm-only. (Found via Sentry 2026-06-03.) |

---

## 11. Secrets & Configuration

The repo is **private**, so the following secrets live inside the code
(acceptable for now):

- `SUPABASE_URL` + `SUPABASE_ANON_KEY` → `src/lib/env.ts`
- Google Maps API key → `android/app/src/main/AndroidManifest.xml`
  - Location permissions `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION`
    added 2026-06-03 (used to center the map on the seller when adding a plot).
  - **Restricted (2026-05-31):** Application restriction = Android apps
    (`com.ardmap` + debug SHA-1 `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`),
    API restriction = **Maps SDK for Android only**. Even if extracted from
    the APK the key is useless elsewhere. ⚠️ When a real release keystore is
    created, add its SHA-1 here too.
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
| Map went edge-to-edge with translucent StatusBar | 2026-05-31 | Modern look matches Tier/Lime; headerShown disabled only for Map tab so other screens keep header |
| Split MapScreen into 4 small components | 2026-05-31 | MapScreen was 1400+ lines and kept getting truncated. Each piece (TopBar, FabStack, DrawingToolbar, PlotDetailSheet) is now <600 lines and editable safely |
| Reanimated v3 replaces Animated API everywhere | 2026-05-31 | Smoother, runs on UI thread, future-proof |
| Added subtle dark customMapStyle | 2026-05-31 | Minimalist look fits brand earth-tones; subtle enough not to hide satellite imagery |
| Locked `profiles` table + added `public_profiles` view | 2026-05-31 | `profiles` had two public "read all" SELECT policies that leaked every user's `phone` and admin flags via the anon key. Dropped them, restricted SELECT to own row, and exposed only `id, name, is_verified` through a view that both clients now read. Verified: anon sees 0 base rows, 7 view rows. |
| Restricted Google Maps API key | 2026-05-31 | Key shipped unrestricted in the APK (anyone could extract + abuse billing). Locked to Android apps (`com.ardmap` + SHA-1) and to "Maps SDK for Android" only. Both debug (`5E:8F:…`) and release (`83:47:…`) SHA-1s registered. |
| Real release keystore + signing config | 2026-05-31 | Release was signed with the debug keystore (can't ship to Play Store). Generated `donum-release.keystore`, wired `signingConfigs.release` to read passwords from `~/.gradle/gradle.properties` (kept out of git). Verified release APK now carries the production cert. |
| Mark as sold: no `pending` reset | 2026-06-12 | Owner intent, not a content change — no re-moderation needed. Button visible only for `active` plots. |
| Softened Investment Calculator wording | 2026-05-31 | ROI/projection figures come from static made-up growth rates; presenting them as confident predictions is a legal/reputational risk. Reworded i18n (AR/EN/DE): `projected_value` → "illustrative estimate", `annual_growth` → "assumed growth", and strengthened `investment_disclaimer` to state it is NOT a prediction or financial advice. No logic change. |
| Wired the view counter | 2026-05-31 | `view_count` existed but was never incremented (fake metric). Added `increment_view_count` RPC; `MapScreen.onSelectPlot` calls it (fire-and-forget) and optimistically shows +1. Section 7 item 12 partially done — counter live, seller analytics still pending. |
| Persisted favorites | 2026-05-31 | Heart button was UI-only state. Added `favorites` table + RLS; `fetchIsFavorited`/`setFavorite` in `data/plots.ts`; `PlotDetailSheet` loads state on open and persists toggles (optimistic, reverts on error). Section 7 item 10 partly done — persistence live, price-drop alerts still pending. |
| Favorites tab + screen | 2026-05-31 | Added `FavoritesScreen.tsx` + a "Favorites" bottom tab (signed-in only, else AuthScreen) + `fetchMyFavorites()`. Lists saved plots (most recent first) with a remove action. New i18n keys `tab_favorites`/`no_favorites_yet`/`remove_favorite` (AR/EN/DE). |
| Map load-error banner | 2026-05-31 | `fetchActivePlots` silently returned `[]` on failure, so offline/server errors looked like "no plots". Added `fetchActivePlotsResult()` (returns `{plots, ok}`); `MapScreen` shows a red banner + Retry when `ok` is false. New i18n keys `load_failed`/`retry` (AR/EN/DE). Partial progress on section 7 item 13 (empty/error states). |
| Re-skin to Slate × Coral theme | 2026-05-31 | Replaced the earth-tone palette in `lib/theme.ts` with a dark blue-gray (slate) base + vibrant coral (#FF6B57) accent + emerald (#00E676) success, pure-white headings, muted silver text, and larger radii (md 14 / lg 18 / xl 24). All screens reskin automatically since every component reads from `colors`/`radii`. No per-component edits. |
| Fixed top safe-area overlap + RTL search icon | 2026-05-31 | Top bar overlapped the status bar on edge-to-edge devices. Switched `MapTopBar` to `useSafeAreaInsets().top`, lifted the "add land" FAB by `insets.bottom` (keeps Google logo clear), and flipped the search magnifier to the right in Arabic (RTL). |
| Hardened reportPlot against anonymous spam | 2026-06-02 | `reportPlot()` inserted `reporter_id: user?.id ?? null`, so the raw anon key could flood the `reports` queue without an account. Added a data-layer guard: returns `auth_required` if no signed-in user (the UI in `ReportSheet` already blocked it, this is defense-in-depth). ⚠️ STILL TODO: add an RLS INSERT policy on `reports` (`auth.uid() = reporter_id`) — the client guard alone is bypassable. |
| Sentry wired manually, not via wizard | 2026-06-02 | The Sentry onboarding wizard installs `@sentry/react-native@latest` (6.x) and patches native build files. That would override our pinned 5.33.1 (chosen for RN 0.75.4) and risk breaking the build. Instead we pinned 5.33.1 and wired it by hand: `src/lib/sentry.ts` + two lines in `App.tsx`. Crash-only (`tracesSampleRate: 0`) to stay on the free plan. Source-maps upload deferred. DSN stored in `DONUM_ACCOUNTS.txt` (git-ignored). |
| Drawing tutorial (coach overlay) | 2026-05-31 | Testers didn't understand how to draw plot boundaries. Added `DrawHelpOverlay` (3 steps) shown the first time a user starts drawing (persisted via AsyncStorage `donum_draw_help_seen`), plus a "?" button in `DrawingToolbar` to reopen. New i18n keys `draw_help_*` (AR/EN/DE). Restricted release build to arm ABIs + raised Gradle heap to 3072m. Partial progress on section 7 item 14 (onboarding). |
| Switched from dark Slate theme to a **light × coral** theme | 2026-06-03 | Youssef found the dark slate palette gloomy. Rewrote `lib/theme.ts` to light surfaces (`bg #F5F6F8`, `panel #FFFFFF`, `panel2 #EEF0F3`, `text #1A1D23`, `muted #6B7480`), kept coral brand, darkened `ok` to `#12B76A` so it reads on white. All screens reskin automatically (every component reads from `colors`). Flipped `NavigationContainer` theme `dark:false` and both StatusBars to `dark-content`. Supersedes the 2026-05-31 "Slate × Coral" row. |
| Redesigned bottom tab bar (Voi-style) + swapped tab order | 2026-06-03 | Tabs were text-only labels. Replaced with white bar (h 68) showing an SVG glyph + label per tab. Icons drawn inline with `react-native-svg` (already a dep) instead of wiring `react-native-vector-icons` fonts — zero new linking risk. New `TabItem` component + `ICON_PATHS` in `App.tsx`. Swapped **Map (الخريطة)** to last and **Profile (حسابي)** to first per Youssef; added `initialRouteName="Map"` so the app still opens map-first despite the reorder. Touches Tier 3 item 15 (real icons) partially — tab bar now has real icons, in-screen emoji icons still pending. |
| Hardened `reports` INSERT with RLS (closed the 2026-06-02 TODO) | 2026-06-03 | The client guard in `reportPlot()` was bypassable with the raw anon key. Applied migration `harden_reports_insert_rls`: dropped the open "Anyone can report" (`with_check true`, all roles) and the loose authenticated policy (`auth.uid()=reporter_id OR reporter_id IS NULL`); recreated a single strict policy — `to authenticated with check (auth.uid() = reporter_id)`. Verified: only one INSERT policy remains. Anon can no longer insert; null reporter_id is rejected. |
| Removed the "verify your account" card from Profile | 2026-06-04 | Youssef didn't want the verification status card + "contact to verify" WhatsApp CTA on the Profile screen. Removed the card JSX, `requestVerification`, the `VERIFY_WHATSAPP` constant, the now-unused `profile`/`loadProfile`/`fetchMyProfile` machinery and the `Linking` import from `ProfileScreen.tsx`. The verified-seller *badge* on listings is untouched — only the in-profile request UI is gone. (Unused verify* styles left in place, harmless.) |
| Professional app launcher icon (adaptive) | 2026-06-04 | App shipped with the default RN icon. Youssef rejected a first flat version as not professional; picked (from 4 options) a **solid coral `#FF6B57` parcel pentagon with white corner nodes** (one coral node w/ white ring) on a slate gradient (`#2C3340`→`#1B1F27`) — matches the app's coral theme and signals the "draw boundary points" feature. Generated via ImageMagick: legacy `ic_launcher.png`/`ic_launcher_round.png` (5 densities), adaptive `ic_launcher_foreground.png` (108–432px) + `mipmap-anydpi-v26/ic_launcher{,_round}.xml` with `@drawable/ic_launcher_background` (slate gradient shape in `drawable/ic_launcher_background.xml`). Manifest already pointed at `@mipmap/ic_launcher`, so no manifest change. NOTE: a leftover unused `values/ic_launcher_background.xml` color file remains (couldn't delete via the Linux mount; harmless — different resource type). Resource change → full rebuild required. |
| Manual area override in the create/edit form | 2026-06-03 | Area was read-only (always the polygon's computed value). Sellers asked to type the real figure (e.g. from the deed). `CreatePlotForm` now has an editable m² field (`areaInput`) prefilled from the computed area; shows the dunam equivalent live + an "auto: <computed> ↺" tap-to-reset. `finalArea` = typed value if > 0 else computed; saved via `createPlot` AND `updatePlot` (`area_m2`). Resets to the freshly drawn polygon each time the create form opens. |
| Vertex editing: replaced long-press drag with tap-select → tap-to-move | 2026-06-03 | Native `react-native-maps` marker `draggable` requires a long-press on Android (Youssef found it annoying). Removed `draggable`/`onDragEnd`; now tapping a corner selects it (`selectedVertex` state; the dot grows + turns emerald) and the next map tap moves that vertex instantly — no long-press. Tap the corner again to deselect. Banner switches to a green `move_hint` while a vertex is armed. Corner markers use a selection-aware `key` so the highlight repaints (Android won't repaint a `tracksViewChanges={false}` marker otherwise); edge labels key on their rounded length for the same reason. Selection is reset on start/cancel/clear/undo. New i18n `move_hint`. |
| Area/distance math moved to Turf + geolib; added Clear All, edge polylines, green fill | 2026-06-03 | Youssef asked (explicitly, after being shown the trade-offs) to follow the GPS-Field-Area spec literally. Swapped the engine inside `geometry.ts` keeping the same signatures: `geodesicArea` now uses `@turf/area` on a closed GeoJSON ring; `haversineMeters` now uses geolib `getDistance` (0.01 m). All callers unchanged. Drawing now renders an open `Polyline` per edge from 2 points (no closing edge) and the filled `Polygon` only at ≥3 (green `rgba(0,255,0,0.4)`, stroke `#00C853`), so the shape "closes" only when valid. Added a **Clear All** button (small red button in the drawing banner; `clearAll` wipes points but stays in drawing mode, unlike Cancel) + i18n `clear`. Both libs are pure JS (no native link). ⚠️ Divergence: app area figures now come from Turf, the website still uses the hand-rolled formula — difference < 0.1%. |
| Area measurement shown in **dunam + m²** while drawing | 2026-06-03 | Turned the drawing flow into a proper "measure land area" tool (à la GPS Field Area apps). Per Youssef: keep tap-on-map input, show area in dunam (دونم, the Syrian unit = 1000 m²) as the headline number with m² beside it. Added `M2_PER_DONUM` + `fmtDonum()` to `geometry.ts` and i18n keys `unit_donum`/`unit_m2` (AR/EN/DE). `DrawingToolbar` banner now shows a large dunam readout + m² + point count + perimeter. GPS-walk input was considered but declined — tap-only is enough for now. |
| "Add land" centers on the seller's GPS location | 2026-06-03 | Pressing the add-land FAB now recenters the map on the user's current position (zoom 18) so they can draw their own plot in place. Implemented with **react-native-maps' own user-location stream — no new geolocation dependency**: added `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` to AndroidManifest; `startDrawing` calls `goToMyLocation()` which requests the runtime permission (`PermissionsAndroid`), enables `showsUserLocation` (blue dot) and animates the camera. `onUserLocationChange` keeps `userLocRef` fresh; if pressed before the first fix, `pendingLocateRef` recenters on the next fix. New i18n keys `ok`, `loc_perm_title`, `loc_perm_msg` (AR/EN/DE). Manifest is a native change → requires a full rebuild. |
| Drawing UX overhaul — draggable vertices + redo + edge metrics | 2026-06-03 | Drawing was tap-only with no edit-after-place (fat-finger problem on phones). Made each in-progress corner a `draggable` `Marker` with `onDragEnd` → `onCornerDragEnd(i,…)` (wide 44px transparent hitbox + high-contrast dot so the finger doesn't hide the target). Added a redo stack (`redoStack` state; `undoLast` pushes onto it, `redoLast` pops back, cleared on add/drag) and a Redo button in `DrawingToolbar`. Added per-edge length labels at segment midpoints + live perimeter in the banner (new geometry helpers `haversineMeters`, `perimeter`, `midpoint`, `fmtLen`). Short `Vibration.vibrate(10)` haptic on each point/drag. All drawing markers set `cluster={false}` so the map's clustering doesn't swallow them. New i18n key `redo` (AR/EN/DE). NOTE: couldn't run `tsc` in this env (the Linux mount served stale/truncated copies of the host files) — verified edits by reading the host files directly; relying on the Windows build to compile. |
| Phone-number format validation in create form | 2026-06-03 | `CreatePlotForm.submit` now validates the phone (when provided) against `/^\+?[0-9]{7,15}$/` after stripping spaces/dashes/brackets, so diaspora (DE/TR/Gulf) and local Syrian numbers pass while junk is rejected. New i18n key `invalid_phone` (AR/EN/DE). Kept the field optional (no required-ness change). Sign-up is email/password only — no phone field there, so nothing to validate on auth. |

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
