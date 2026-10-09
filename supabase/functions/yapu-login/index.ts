import { createClient } from "npm:@supabase/supabase-js@2.117.3";

const projectUrl = Deno.env.get("SUPABASE_URL")!;
const publicKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serverKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(projectUrl, serverKey, { auth: { persistSession: false, autoRefreshToken: false } });
const origins = new Set(["https://yapu.studio", "https://www.yapu.studio"]);

async function hash(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))))
    .map(byte => byte.toString(16).padStart(2, "0")).join("");
}
Deno.serve(async request => {
  const origin = request.headers.get("Origin");
  const headers: Record<string, string> = {
    "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (origin && origins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !origins.has(origin)) return respond({ error: "Request rejected" }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  try {
    if (Number(request.headers.get("content-length")) > 2048) return respond({ error: "Invalid credentials" }, 400);
    const bodyText = await request.text();
    if (bodyText.length > 2048) return respond({ error: "Invalid credentials" }, 400);
    let body;
    try { body = JSON.parse(bodyText); } catch { return respond({ error: "Invalid credentials" }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return respond({ error: "Invalid credentials" }, 400);
    const identifier = typeof body.identifier === "string" ? body.identifier.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!identifier || identifier.length > 254 || !password || password.length > 128) return respond({ error: "Invalid credentials" }, 400);
    const keys = await Promise.all([
      hash(`identifier:${identifier}`),
      hash(`ip:${request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown"}`),
    ]);
    const { data: allowed, error: limitError } = await admin.rpc("check_yapu_login_limit", { p_keys: keys });
    if (limitError) return respond({ error: "Account service unavailable" }, 503);
    if (!allowed) return respond({ error: "Please try again later" }, 429);
    let email: string | undefined;
    let phone: string | undefined;
    if (identifier.includes("@")) email = identifier;
    else if (/^(\+?[1-9]\d{7,14})$/.test(identifier)) phone = /^1[3-9]\d{9}$/.test(identifier) ? `+86${identifier}` : identifier;
    else if (/^[a-z0-9_]{3,24}$/.test(identifier)) {
      const { data: profile } = await admin.from("yapu_profiles").select("id").eq("username", identifier).maybeSingle();
      if (profile) {
        const { data: { user } } = await admin.auth.admin.getUserById(profile.id);
        if (user?.email_confirmed_at) email = user.email;
        else if (user?.phone_confirmed_at) phone = user.phone;
      }
    }
    // A missing username still performs a password check; no lookup result or contact is returned.
    const authClient = createClient(projectUrl, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const credentials = email ? { email, password } : phone ? { phone, password } : { email: "missing-account@invalid.invalid", password };
    const { data, error } = await authClient.auth.signInWithPassword(credentials);
    if (error || !data.session || !data.user || (!data.user.email_confirmed_at && !data.user.phone_confirmed_at)) return respond({ error: "Invalid credentials" }, 401);
    return respond({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
  } catch {
    return respond({ error: "Account service unavailable" }, 503);
  }
});
