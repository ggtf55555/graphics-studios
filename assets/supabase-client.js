// Supabase project connection — GRAPHICS-STUDIOS
// The publishable key is safe to expose in client code; all access is
// gated by Row Level Security policies on the database side.
const SUPABASE_URL = "https://wwekqeaicvyrgevjxgyh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_5rZsLpOApn_KmK4bkrE79g_vtoz5v2y";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Each person logs in with their name + a 4-digit PIN; we map that to a real
// (internal, non-deliverable) email + a Supabase password derived from the
// PIN, since Supabase Auth needs an email format identifier and a password
// of reasonable length under the hood. The name/email directory itself
// lives in the `team_accounts` table (publicly readable, admin-writable) so
// the admin can rename or add team members from the dashboard without a
// code deploy — see index.html's loadTeamForLogin().

function pinToPassword(pin) {
  return (pin + pin).slice(0, 8);
}

async function signInWithPin(email, pin) {
  return sb.auth.signInWithPassword({ email, password: pinToPassword(pin) });
}

function hasStoredSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (/^sb-.*-auth-token$/.test(k) && localStorage.getItem(k)) return true;
    }
  } catch (e) {}
  return false;
}

// Keeps the person signed in until they press "sign out" themselves.
// When the computer has just booted the network may not be up yet, so a
// failed token refresh must not look like "logged out": while a saved
// session still exists we keep retrying for ~1 minute before giving up.
async function requireSession(redirectTo = "index.html") {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  let { data } = await sb.auth.getSession();
  for (let i = 0; i < 30 && !data.session && hasStoredSession(); i++) {
    await new Promise((r) => setTimeout(r, 2000));
    ({ data } = await sb.auth.getSession());
  }
  if (!data.session) {
    window.location.href = redirectTo;
    return null;
  }
  return data.session;
}

// ---------------- push notifications (new task assigned) ----------------
const VAPID_PUBLIC_KEY = "BFqb1ADMOgvzmmNuI0zXocBLWPxRuESyZimICKN2JeHEhiPOljbuy6oy8GYZE3lXw4TgG7Zx6jtA9fpFf3Zrvko";

function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function urlB64ToUint8(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// Saves this device's push subscription for the signed-in user.
async function syncPushSubscription() {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(VAPID_PUBLIC_KEY) });
  }
  const j = sub.toJSON();
  const { error } = await sb.rpc("register_push", {
    p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_ua: (navigator.userAgent || "").slice(0, 200),
  });
  if (error) throw error;
  return reg;
}

async function enablePush() {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;
  const reg = await syncPushSubscription();
  try {
    await reg.showNotification("تم تفعيل الإشعارات", { body: "ستصلك إشعارات المهام الجديدة على هذا الجهاز.", icon: "assets/icons/icon-192.png", dir: "rtl", lang: "ar" });
  } catch (e) {}
  return true;
}

// Called on sign-out so the next person on this device does not get this person's tasks.
async function disablePushOnDevice() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    if (sub) {
      await sb.rpc("unregister_push", { p_endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
  } catch (e) {}
}
