import { getFirebase } from "./firebase-init.js";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

function setLocalUser(user, roleOverride) {
  const existing = JSON.parse(localStorage.getItem("cleanspot_user") || "null");
  const role = roleOverride || existing?.role || "citizen";
  if (!user) {
    localStorage.setItem("cleanspot_user", "null");
    localStorage.setItem("cleanspot_broadcast", JSON.stringify({ type: "user:write", payload: { name: null }, ts: Date.now() }));
    return;
  }
  localStorage.setItem("cleanspot_user", JSON.stringify({
    provider: "firebase-google",
    uid: user.uid,
    name: user.displayName || "User",
    email: user.email || "",
    photoURL: user.photoURL || "",
    role,
    ts: Date.now()
  }));
  localStorage.setItem("cleanspot_broadcast", JSON.stringify({ type: "user:write", payload: { name: user.displayName || "User", role }, ts: Date.now() }));
}

function qs(id) {
  return document.getElementById(id);
}

async function handleGoogleSignIn() {
  const fb = getFirebase();
  if (!fb) throw new Error("Missing Firebase config");
  try {
    const result = await signInWithPopup(fb.auth, fb.googleProvider);
    if (result?.user) setLocalUser(result.user);
  } catch (_e) {
    // Popup blocked or environment issue: fallback to redirect
    await signInWithRedirect(fb.auth, fb.googleProvider);
  }
}

async function handleSignOut() {
  const fb = getFirebase();
  if (fb) await signOut(fb.auth);
  setLocalUser(null);
}

function initSignupFirebase() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo") || "index.html";
  const requiredRole = params.get("requiredRole") || "";
  const roleSelect = qs("roleSelect");
  const requiredRoleHint = qs("requiredRoleHint");

  if (requiredRoleHint) {
    requiredRoleHint.textContent = requiredRole ? `This page requires: ${requiredRole.toUpperCase()} account` : "";
  }
  if (roleSelect && requiredRole) roleSelect.value = requiredRole;

  function selectedRole() {
    if (requiredRole) return requiredRole;
    return roleSelect?.value || "citizen";
  }

  const fb = getFirebase();
  if (!fb) {
    const hint = qs("requiredRoleHint");
    if (hint) hint.textContent = "Firebase config not loaded. Ensure firebase-config.js exists and is served.";
  }

  if (fb) getRedirectResult(fb.auth).then((result) => {
    if (result?.user) {
      setLocalUser(result.user, selectedRole());
      window.location.href = returnTo;
    }
  }).catch(() => {});

  if (fb) onAuthStateChanged(fb.auth, (user) => {
    const label = qs("accountLabel");
    if (label) label.textContent = user?.displayName || "Sign in";
    if (user) {
      setLocalUser(user, selectedRole());
    }
  });

  const googleBtn = qs("googleBtn");
  const localBtn = qs("localBtn");
  const signOutBtn = qs("signOutBtn");

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      const role = selectedRole();
      try {
        await handleGoogleSignIn();
      } catch (e) {
        alert("Firebase sign-in not ready. Check firebase-config.js and reload (Ctrl+F5).");
        return;
      }
      const stored = JSON.parse(localStorage.getItem("cleanspot_user") || "null");
      if (stored) {
        stored.role = role;
        localStorage.setItem("cleanspot_user", JSON.stringify(stored));
      }
      window.location.href = returnTo;
    });
  }

  // Keep local/manual sign-in as backup.
  if (localBtn) {
    localBtn.addEventListener("click", () => {
      const name = (qs("nameInput")?.value || "").trim() || "Citizen";
      const email = (qs("emailInput")?.value || "").trim() || "user@example.com";
      localStorage.setItem("cleanspot_user", JSON.stringify({
        provider: "local",
        name,
        email,
        role: selectedRole(),
        ts: Date.now()
      }));
      localStorage.setItem("cleanspot_broadcast", JSON.stringify({ type: "user:write", payload: { name, role: selectedRole() }, ts: Date.now() }));
      window.location.href = returnTo;
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      try {
        await handleSignOut();
      } catch {
        setLocalUser(null);
      }
    });
  }
}

// Allow app.js logout button to sign out of Firebase too.
window.__TRASHCAMP_SIGNOUT__ = handleSignOut;

initSignupFirebase();
