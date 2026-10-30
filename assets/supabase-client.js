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

async function requireSession(redirectTo = "index.html") {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    window.location.href = redirectTo;
    return null;
  }
  return data.session;
}
