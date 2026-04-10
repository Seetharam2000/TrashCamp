# TrashCamp

TrashCamp is a multi-page civic web app for waste reporting, verification, cleanup routing, and authority monitoring.

It is built as a static frontend (HTML/CSS/JS) with:
- Leaflet + OpenStreetMap for maps
- Firebase Google Sign-In for authentication
- localStorage for shared state, offline queueing, and cross-page sync

---

## Judges' One-Page Summary

## Problem

Waste complaint platforms often fail because:
- reports are noisy or unverifiable
- authorities cannot prioritize quickly
- citizens do not see proof of action

## Our Solution

TrashCamp introduces a trust-first civic workflow:

**Report -> Verify -> Act -> Prove -> Reward**

- Citizens submit geo-tagged reports with image evidence
- Volunteers verify reports before cleanup routing
- Authorities receive prioritized intelligence, not raw noise
- Cleanup proof is publicly visible in a live feed

## Why We Stand Out

- **Verification-first pipeline** to reduce misuse and fake reports
- **Role-based access control** (citizen / volunteer / authority)
- **Urgency-scored mapping** for faster field response
- **Proof-driven transparency** with before/after feed
- **Incentive loop** (reporter credits after verified reports)
- **Offline resilience** with queue + auto-sync

## Impact

TrashCamp shifts waste management from a passive complaint box to an accountable civic execution system where every action is visible and measurable.

## Current Build

- Fully functional static web prototype
- Runs locally without backend infrastructure
- Firebase Google Sign-In integrated
- Leaflet + OpenStreetMap map stack

## Next Phase

- Connect reporter credits to government subsidy workflows
- Add authority-level analytics exports
- Expand deployment city-wide with ward-level configuration

---

## Core Idea

TrashCamp closes the loop:

**Report -> Verify -> Act -> Prove -> Reward**

- Citizens report waste spots with location + photo
- Volunteers verify reports before they enter cleanup routing
- Verified reports are prioritized by urgency score
- Cleanup proof is published to a public feed
- Reporters gain credits when their reports are verified

---

## Features

- Role-based login: `citizen`, `volunteer`, `authority`
- Separate access controls per page
- Sticky nav with activity indicators
- Chennai seed data (7 initial waste spots near SRM area)
- Composite urgency scoring and dynamic marker visuals
- Citizen map reporting with:
  - map click / GPS pin
  - upload photo or live camera capture
  - AI severity suggestion (size-based simulation)
- Volunteer map with:
  - verification queue
  - route generation (top verified spots within 2km)
  - claim and mark cleaned with proof upload
- Authority map with:
  - heat circles
  - anomaly cluster detection
  - escalation log
  - notify flow with prepared incident message
- Proof feed with filters and before/after placeholders
- Offline queue + online sync toast
- Trust and reporter credit updates in localStorage

---

## Tech Stack

- HTML (multi-page)
- CSS (single shared `styles.css`)
- Vanilla JavaScript (single shared `app.js`)
- Leaflet `1.9.4` via cdnjs
- OpenStreetMap tiles
- Firebase Web SDK (Google auth)

---

## Project Structure

`index.html` - Landing page  
`signup.html` - Role-based sign-in page  
`citizen.html` - Reporting flow  
`volunteer.html` - Verification + cleanup routing  
`authority.html` - Monitoring dashboard  
`proof-feed.html` - Public cleanup proof feed  
`notify.html` - Authority contact + incident message page  
`styles.css` - Shared design system + UI styles  
`app.js` - Shared app state and all page logic  
`firebase-init.js` - Firebase initialization helper  
`firebase-auth.js` - Firebase auth integration  
`firebase-config.example.js` - Safe template config

---

## Local Setup

## 1) Clone

```bash
git clone https://github.com/Seetharam2000/TrashCamp.git
cd TrashCamp
```

## 2) Add Firebase config (local only)

Create local config file:

```bash
cp firebase-config.example.js firebase-config.js
```

Edit `firebase-config.js` and paste your Firebase web config:

```js
window.TRASHCAMP_FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
};
```

Do **not** commit `firebase-config.js`.

## 3) Run static server

```bash
python -m http.server 5500
```

Open:

`http://localhost:5500/signup.html`

---

## Firebase Requirements

In Firebase Console:

- Enable **Authentication -> Google**
- Add `localhost` in **Authentication -> Settings -> Authorized domains**
- Register a Web App and copy config from Project Settings

---

## Role Access Rules

- `citizen.html` -> citizen role required
- `volunteer.html` -> volunteer role required
- `authority.html` and `notify.html` -> authority role required
- `index.html` and `proof-feed.html` -> sign-in required

Users with wrong role are redirected to sign-in with required role hint.

---

## Security Notes

- `firebase-config.js` is local and should never be pushed.
- `firebase-config.example.js` contains placeholders only.
- No backend is used in this version; localStorage is used for prototype data.

---

## Team Workflow (Suggested)

- Create branch per member/task:
  - `feature/<name>-<task>`
- Open PR to `main`
- Keep secrets local (`firebase-config.js` only)

---

## Demo Flow (Quick)

1. Sign in and choose role
2. Citizen reports a spot with camera proof
3. Volunteer verifies report (+1 reporter credit)
4. Volunteer generates route, claims and cleans
5. Authority monitors clusters and notifies field team
6. Proof feed shows cleanup evidence
