"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Profile } from "@/lib/account/client";
import { ACCOUNTS_ENABLED } from "@/lib/account/config";
// Loaded on demand so the account SDK stays out of the first-screen bundle.
const loadAccount = () => import("@/lib/account/client");

const AccountContext = createContext<{ profile: Profile | null; loading: boolean; authenticated: boolean; refresh: () => Promise<void> }>({ profile: null, loading: false, authenticated: false, refresh: async () => {} });
export function AccountProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(ACCOUNTS_ENABLED);
  const [authenticated, setAuthenticated] = useState(false);
  const requestVersion = useRef({ value: 0 });
  const refresh = useCallback(async () => {
    if (!ACCOUNTS_ENABLED) return;
    const version = ++requestVersion.current.value;
    try {
      const { accountClient, accountRpc, myProfile } = await loadAccount();
      const { data: { session } } = await accountClient().auth.getSession();
      const nextProfile = session ? await myProfile() : null;
      if (version !== requestVersion.current.value) return;
      setAuthenticated(Boolean(session)); setProfile(nextProfile);
      if (nextProfile) void accountRpc("record_yapu_activity").catch(() => {});
    } catch {
      if (version === requestVersion.current.value) { setAuthenticated(false); setProfile(null); }
    } finally { if (version === requestVersion.current.value) setLoading(false); }
  }, []);
  useEffect(() => {
    if (!ACCOUNTS_ENABLED) return;
    const versionCounter = requestVersion.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;
    let disposed = false;
    void loadAccount().then(({ accountClient }) => {
      if (disposed) return;
      const { data: { subscription } } = accountClient().auth.onAuthStateChange((event) => {
        ++versionCounter.value;
        if (timer) clearTimeout(timer);
        if (event === "SIGNED_OUT") {
          setAuthenticated(false); setProfile(null); setLoading(false); return;
        }
        // Auth callbacks must return before making another Supabase request.
        timer = setTimeout(() => { void refresh(); }, 0);
      });
      unsubscribe = () => subscription.unsubscribe();
    }, () => { if (!disposed) setLoading(false); });
    return () => { disposed = true; ++versionCounter.value; if (timer) clearTimeout(timer); unsubscribe?.(); };
  }, [refresh]);
  return <AccountContext.Provider value={{ profile, loading, authenticated, refresh }}>{children}</AccountContext.Provider>;
}
export const useAccount = () => useContext(AccountContext);
