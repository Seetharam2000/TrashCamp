import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// IMPORTANT: Do not commit real Firebase config values.
// Provide config at runtime by creating `firebase-config.js` (untracked) that sets:
//   window.TRASHCAMP_FIREBASE_CONFIG = { ... };
// See `firebase-config.example.js`.
let cached = null;

export function getFirebase() {
  if (cached) return cached;
  const firebaseConfig = window.TRASHCAMP_FIREBASE_CONFIG;
  if (!firebaseConfig) return null;

  const app = initializeApp(firebaseConfig);

  // Analytics can fail on unsupported/browser-restricted environments.
  isSupported().then((ok) => {
    if (ok) getAnalytics(app);
  }).catch(() => {});

  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  cached = { app, auth, googleProvider };
  return cached;
}
