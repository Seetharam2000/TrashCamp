import { auth, googleProvider } from "./firebase-init.js";
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
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result?.user) setLocalUser(result.user);
  } catch (_e) {
    // Popup blocked or environment issue: fallback to redirect
    await signInWithRedirect(auth, googleProvider);
  }
}

async function handleSignOut() {
  await signOut(auth);
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

  getRedirectResult(auth).then((result) => {
    if (result?.user) {
      setLocalUser(result.user, selectedRole());
      window.location.href = returnTo;
    }
  }).catch(() => {});

  onAuthStateChanged(auth, (user) => {
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
      await handleGoogleSignIn();
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

initSignupFirebase();
