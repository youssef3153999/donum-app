# DONUM — Launch Plan (June 2026)

> **Goal:** Launch the Donum app by **end of June 2026 (target: 2026-06-30)**.
> **Today:** 2026-06-03
> **Last updated:** 2026-06-12
> **Owner:** Youssef Al Ali

This file is the **single source of truth for the launch**. It works alongside
`DONUM_DOCS.md` (which tracks the product/tech state). Check items off as they
are done. Claude must read + update this file every time Youssef asks a
question in this project (see "Update protocol" at the bottom).

---

## 0. Launch strategy (decided 2026-06-03)

| Decision | Choice |
|---|---|
| Launch channel | **Both** — direct APK now (the real launch), Google Play in parallel |
| Google Play account | **Not yet created** — must start verification ASAP |
| Phone OTP verification | **Deferred to post-launch** — v1 ships with email login |
| Release ABIs | arm-only (`armeabi-v7a, arm64-v8a`) |

### ⚠️ Timeline reality
- **Direct APK = your guaranteed 2026-06-30 launch.** Fully in your control,
  no review, no waiting.
- **Google Play production by 2026-06-30 is unlikely.** New *personal*
  developer accounts require: identity verification (can take days) **plus**
  a mandatory closed test (~12 testers, ~14 days) before production is
  unlocked. Realistic Play production date = **July 2026**.
- Action: treat Play as a parallel track. The June launch is the APK.

---

## 1. Status snapshot (2026-06-03)

- ✅ App feature-complete enough for a v1 (25 features, see DONUM_DOCS §6)
- ✅ Sentry crash reporting live + verified
- ✅ Release keystore + signed release APK verified (`CN=Youssef Al Ali`)
- ✅ Anonymous-report spam blocked (app layer)
- 🔄 In progress → Smoke-test release APK on a real phone
- ❌ Google Play account not created
- ❌ Privacy Policy / Terms not yet hosted at public URLs

---

## 2. Week-by-week plan

### Week 1 — Stabilize + open both tracks (Jun 3–8)
- [ ] Smoke-test the signed release APK on your own ARM phone (map, sign up,
      draw plot, upload photo, plot detail, call/WhatsApp)
- [ ] Fix any crash Sentry reports during testing
- [ ] **Create Google Play Developer account + start identity verification**
      (DO THIS FIRST — verification is the long pole)
- [x] Apply RLS INSERT policy on the `reports` table (real anti-spam — app
      guard alone is bypassable) — done 2026-06-03, dropped the open "Anyone
      can report" policy; insert now authenticated-only `auth.uid()=reporter_id`
- [x] Add phone-number validation (regex) in the create form — done 2026-06-03
      (`CreatePlotForm.submit`, accepts `+` & 7–15 digits). Sign-up is
      email/password only, no phone field, so nothing to add there.
- [ ] Distribute APK to 3–5 trusted testers (direct)
- [ ] Mirror Privacy Policy + Terms to public website URLs (`/privacy`,
      `/terms`) — required for Play and good practice for the APK too

### Week 2 — Finish v1 scope + prep Play assets (Jun 9–15)
- [x] "Mark plot as sold" feature (DONUM_DOCS §7 item 3 — flip status, keep
      price history) — done 2026-06-12
- [ ] Polished empty states: no plots / no favorites / no internet (§7 item 13)
- [ ] Collect tester feedback, fix the top issues
- [ ] Align app display name to **Donum** (cosmetic: `app.json`)
- [ ] Prepare Play listing assets:
  - [ ] App icon (512×512)
  - [ ] Feature graphic (1024×500)
  - [ ] 2–8 phone screenshots
  - [ ] Short + full description (Arabic + English)

### Week 3 — Play submission + hardening (Jun 16–22)
- [ ] Build release **AAB** (`.\gradlew bundleRelease`) for Play
- [ ] Complete Play Console forms: Data Safety, content rating, target
      audience, privacy policy URL
- [ ] Upload to **Closed Testing** track + invite testers (start the ~14-day
      clock as early as possible)
- [ ] (Optional security) Encrypted session storage via `react-native-keychain`
- [ ] Second tester round on the near-final build

### Week 4 — Public launch + Play in review (Jun 23–30)
- [ ] Final QA pass: all core flows, all 3 languages (AR/DE/EN), RTL check
- [ ] Set `versionName "1.0.0"`, confirm `versionCode`
- [ ] Rebuild + re-verify signed release APK
- [ ] **🚀 PUBLIC LAUNCH (direct APK):** host the APK + a simple download
      link/landing, announce it — this is the 2026-06-30 launch
- [ ] Keep Play closed test running toward production (promotes in July)
- [ ] Monitor Sentry daily, hotfix as needed

---

## 3. Post-launch backlog (July+)
- Phone OTP verification (the deferred item)
- In-app chat (§7 item 9)
- Saved searches + push notifications (§7 item 11)
- Admin panel (§7 item 22)
- Promote Google Play from closed test → production

---

## 4. Update protocol (for Claude)
Every time Youssef asks a question in this project:
1. Read this file first.
2. If the question/work completes a checklist item, tick it `[ ]` → `[x]`.
3. If new steps are discovered, add them under the right week.
4. Bump "Last updated" to today.
5. In the reply, state explicitly which item(s) were checked/added.
6. If anything affects the 2026-06-30 timeline, flag the risk.
7. Keep this in sync with `DONUM_DOCS.md` (product/tech state lives there;
   launch milestones live here).
