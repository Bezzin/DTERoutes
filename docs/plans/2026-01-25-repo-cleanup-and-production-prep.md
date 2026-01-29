# Repository Cleanup & Production Prep Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up the messy repository by promoting DTERoutes as the main app, verify all Alpha features work, and prepare for Google Play Open Alpha release.

**Architecture:** The working app lives in `DTERoutes/` folder. The root folder contains an older version that was incorrectly modified. We will backup the root, move DTERoutes content to root, apply Android 14 compatibility patches, and verify all features.

**Tech Stack:** React Native 0.73, Zustand, Supabase, RevenueCat, Mapbox, Android SDK 35

---

## Phase 1: Repository Backup & Cleanup

### Task 1: Create Safety Backup

**Files:**
- Backup: entire repository state

**Step 1: Create a backup branch of current state**

```bash
git add -A
git stash push -m "WIP: root folder changes before cleanup"
git checkout -b backup/root-changes-2026-01-25
git stash pop
git add -A
git commit -m "backup: root folder state before DTERoutes promotion"
git push origin backup/root-changes-2026-01-25
```

**Step 2: Return to main branch**

```bash
git checkout main
git stash drop
```

**Step 3: Verify backup exists**

Run: `git branch -a | grep backup`
Expected: `backup/root-changes-2026-01-25` listed

---

### Task 2: Clean Root and Promote DTERoutes

**Files:**
- Delete: root `src/` folder
- Delete: root `App.tsx`
- Delete: root `index.js`
- Keep: root `android/` (has SDK 35 config)
- Keep: root `patches/` (has Android 14 fixes)
- Move: `DTERoutes/src/` → root `src/`
- Move: `DTERoutes/App.tsx` → root `App.tsx`
- Move: `DTERoutes/index.js` → root `index.js`

**Step 1: Remove root src folder**

```bash
rm -rf src/
```

**Step 2: Copy DTERoutes source to root**

```bash
cp -r DTERoutes/src ./src
cp DTERoutes/App.tsx ./App.tsx
cp DTERoutes/index.js ./index.js
```

**Step 3: Verify file structure**

Run: `ls -la src/`
Expected: screens/, components/, store/, services/, theme/, navigation/, types/ folders

**Step 4: Commit cleanup**

```bash
git add -A
git commit -m "refactor: promote DTERoutes to root, remove duplicate code"
```

---

### Task 3: Merge Package Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Compare package.json files**

Check if DTERoutes has any dependencies not in root:

```bash
diff DTERoutes/package.json package.json
```

**Step 2: Ensure all DTERoutes dependencies are in root package.json**

Key dependencies that must exist (verify each):
- `@supabase/supabase-js`
- `react-native-purchases`
- `react-native-purchases-ui`
- `zustand`
- `@react-native-async-storage/async-storage`
- `@gorhom/bottom-sheet`
- `@pawan-pk/react-native-mapbox-navigation`
- `react-native-reanimated`
- `lottie-react-native`

**Step 3: Install dependencies**

```bash
npm install
```

**Step 4: Commit if changes made**

```bash
git add package.json package-lock.json
git commit -m "chore: sync dependencies from DTERoutes"
```

---

### Task 4: Apply Android 14 Compatibility Patches

**Files:**
- Verify: `patches/react-native-screens+3.28.0.patch`
- Verify: `patches/react-native-gesture-handler+2.14.1.patch`
- Modify: `package.json` (postinstall script)

**Step 1: Verify patches exist**

```bash
ls patches/
```

Expected: Both patch files present

**Step 2: Verify postinstall script**

Check `package.json` has:
```json
"postinstall": "patch-package"
```

**Step 3: Apply patches**

```bash
npm run postinstall
```

**Step 4: Verify patches applied**

```bash
grep -r "removeAt.*lastIndex" node_modules/react-native-screens/android/
grep -r "asReversed" node_modules/react-native-gesture-handler/android/
```

Expected: Patched code found in both

**Step 5: Commit verification**

```bash
git add -A
git commit -m "chore: verify Android 14 compatibility patches"
```

---

## Phase 2: Verify Alpha Features

### Task 5: Verify Alpha Welcome Modal

**Files:**
- Read: `src/components/AlphaWelcomeModal.tsx`
- Read: `src/store/useAlphaModalStore.ts`
- Read: `App.tsx`

**Step 1: Check AlphaWelcomeModal component exists**

```bash
cat src/components/AlphaWelcomeModal.tsx | head -50
```

Expected: Component with "Welcome to Alpha" heading, bullet points, "I Understand" button

**Step 2: Check store uses AsyncStorage for persistence**

```bash
grep -n "AsyncStorage" src/store/useAlphaModalStore.ts
```

Expected: AsyncStorage import and usage for `hasSeenModal` flag

**Step 3: Check App.tsx renders modal**

```bash
grep -n "AlphaWelcomeModal" App.tsx
```

Expected: AlphaWelcomeModal imported and rendered

**Step 4: Document verification**

No code changes needed - just verify feature exists.

---

### Task 6: Verify Route Request Feature (Hot Spot Collection)

**Files:**
- Read: `src/components/RouteRequestCard.tsx`
- Read: `src/screens/TestCenterScreen.tsx`
- Read: `supabase/functions/slack-notification/index.ts` (if exists)

**Step 1: Check RouteRequestCard component exists**

```bash
cat src/components/RouteRequestCard.tsx | head -50
```

Expected: Component with "Request Full Route Pack" functionality

**Step 2: Check TestCenterScreen uses RouteRequestCard**

```bash
grep -n "RouteRequestCard" src/screens/TestCenterScreen.tsx
```

Expected: RouteRequestCard imported and rendered when routes are limited

**Step 3: Check Supabase types for route_requests table**

```bash
grep -rn "route_requests" src/
```

Expected: Type definitions and API calls for route_requests

**Step 4: Verify Slack Edge Function exists**

```bash
ls supabase/functions/slack-notification/ 2>/dev/null || echo "Edge function folder not found in repo"
```

Note: Edge function may be deployed directly to Supabase, not in repo

---

### Task 7: Verify Internal Feedback System

**Files:**
- Read: `src/screens/FeedbackScreen.tsx`
- Read: `src/screens/SettingsScreen.tsx`
- Read: `src/screens/TestCenterScreen.tsx`

**Step 1: Check FeedbackScreen exists**

```bash
cat src/screens/FeedbackScreen.tsx | head -80
```

Expected: Form with Type (Bug/Missing Content/Suggestion), Test Center Name, Message fields

**Step 2: Check Settings has feedback entry point**

```bash
grep -n "Feedback\|Issue\|Suggestion" src/screens/SettingsScreen.tsx
```

Expected: "Report an Issue / Suggestion" button that navigates to Feedback

**Step 3: Check TestCenterScreen has feedback entry point**

```bash
grep -n "Feedback\|Missing" src/screens/TestCenterScreen.tsx
```

Expected: "Missing Routes?" or similar entry point

**Step 4: Verify NO store review prompts**

```bash
grep -rn "store-review\|StoreReview\|requestReview" src/
```

Expected: No matches (review prompts should not exist)

---

### Task 8: Verify UI/UX Alpha Badges

**Files:**
- Read: `src/navigation/AppNavigator.tsx`

**Step 1: Check Home screen header has Alpha badge**

```bash
grep -A 20 "headerTitle" src/navigation/AppNavigator.tsx | head -30
```

Expected: Alpha badge component in header with orange/yellow styling

**Step 2: Check test center banner for single-route centers**

```bash
grep -n "Help us grow\|Request" src/screens/TestCenterScreen.tsx
```

Expected: Banner text for centers with limited routes

---

## Phase 3: Production Build Preparation

### Task 9: Verify Android Build Configuration

**Files:**
- Read: `android/build.gradle`
- Read: `android/app/build.gradle`
- Read: `android/gradle.properties`

**Step 1: Check SDK versions**

```bash
grep -E "compileSdk|targetSdk|minSdk" android/app/build.gradle
```

Expected: compileSdkVersion = 35, targetSdkVersion = 35

**Step 2: Check Gradle version**

```bash
cat android/gradle/wrapper/gradle-wrapper.properties | grep distributionUrl
```

Expected: gradle-8.7-all.zip or higher

**Step 3: Check AGP version**

```bash
grep "com.android.tools.build:gradle" android/build.gradle
```

Expected: 8.6.1 or compatible version

---

### Task 10: Clean Android Build

**Files:**
- Android build artifacts

**Step 1: Clean previous build**

```bash
cd android && ./gradlew clean && cd ..
```

**Step 2: Rebuild app**

```bash
cd android && ./gradlew assembleDebug && cd ..
```

**Step 3: Verify APK created**

```bash
ls -la android/app/build/outputs/apk/debug/
```

Expected: app-debug.apk exists

**Step 4: Commit all changes**

```bash
git add -A
git commit -m "feat: production-ready Alpha build with all features verified"
```

---

### Task 11: Test on Emulator

**Files:**
- None (runtime testing)

**Step 1: Start Metro bundler**

```bash
npx react-native start --reset-cache
```

**Step 2: Install and run on emulator**

```bash
npx react-native run-android
```

**Step 3: Manual verification checklist**

Test each feature:
- [ ] First launch shows Alpha Welcome Modal
- [ ] Dismissing modal persists (doesn't show again)
- [ ] Home screen shows ALPHA badge in header
- [ ] Test centers list loads correctly
- [ ] Selecting a center shows routes
- [ ] "Request Full Route Pack" appears for limited centers
- [ ] Settings screen opens
- [ ] "Report an Issue / Suggestion" opens FeedbackScreen
- [ ] Feedback form submits successfully
- [ ] No Play Store review prompts appear anywhere

---

### Task 12: Final Cleanup

**Files:**
- Delete: `DTERoutes/` folder (now redundant)

**Step 1: Remove DTERoutes folder**

```bash
rm -rf DTERoutes/
```

**Step 2: Final commit**

```bash
git add -A
git commit -m "chore: remove redundant DTERoutes folder after promotion"
```

**Step 3: Push to remote**

```bash
git push origin main
```

---

## Summary

| Phase | Tasks | Purpose |
|-------|-------|---------|
| 1 | Tasks 1-4 | Backup, cleanup, promote DTERoutes |
| 2 | Tasks 5-8 | Verify all 4 Alpha features |
| 3 | Tasks 9-12 | Production build and testing |

**Total Tasks:** 12
**Estimated Time:** 30-45 minutes

**Pre-requisites:**
- Android emulator running (API 33 or 34)
- Node.js 18+
- Git configured

**Post-completion:**
- Single unified codebase at root
- All Alpha features verified working
- Android 14 compatibility patches applied
- Ready for Google Play Open Alpha upload
