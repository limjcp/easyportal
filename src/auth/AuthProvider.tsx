import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { LoginPortalRole } from "../resident/data/types";
import { supabase } from "../lib/supabaseClient";
import {
  fetchProfile,
  getSession,
  onAuthStateChange,
  resolvePortalAccess,
  type AuthChangeEvent,
  type PortalAccess,
  updateLastLogin,
} from "./supabaseAuth";
import {
  ensureActiveBuildingForUser,
  getActiveBuildingId,
  setActiveBuildingId,
  setActiveCompanyId,
} from "../data/supabase/buildingContext";
import { maybeIncrementProfileCompletionLogin } from "../data/supabase/profileCompletion";
import { clearAllQueries, invalidateAuthQueries, invalidateCompanyQueries } from "../shared/queryInvalidation";

type Profile = Awaited<ReturnType<typeof fetchProfile>>;

type RefreshAuthOptions = {
  showLoading?: boolean;
  /** Skip React Query invalidation (background token refresh / duplicate session events). */
  skipQueryInvalidation?: boolean;
  /** Re-resolve auth after any in-flight refresh completes (e.g. after required password change). */
  force?: boolean;
  /** Count profile-completion login on explicit sign-in (SIGNED_IN), not session restore. */
  incrementProfileCompletionLogin?: boolean;
};

type AuthContextValue = {
  /** True only until the first auth resolution completes. */
  initializing: boolean;
  /** True during explicit auth loads (initial sign-in), not background token refresh. */
  loading: boolean;
  session: Session | null;
  profile: Profile;
  portalAccess: PortalAccess | null;
  activePortal: LoginPortalRole | null;
  setActivePortal: (portal: LoginPortalRole) => void;
  refreshAuth: (options?: RefreshAuthOptions) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isBackgroundAuthEvent(event: AuthChangeEvent, hasInitialized: boolean): boolean {
  if (!hasInitialized) return false;
  return (
    event === "TOKEN_REFRESHED" ||
    event === "USER_UPDATED" ||
    event === "SIGNED_IN" ||
    event === "INITIAL_SESSION"
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [portalAccess, setPortalAccess] = useState<PortalAccess | null>(null);
  const [activePortal, setActivePortal] = useState<LoginPortalRole | null>(null);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const hasInitialized = useRef(false);
  const lastInvalidatedCompany = useRef<{ userId: string; companyId: string } | null>(null);

  const refreshAuth = useCallback(async (options?: RefreshAuthOptions) => {
    if (!supabase) {
      setLoading(false);
      setInitializing(false);
      hasInitialized.current = true;
      return;
    }
    if (refreshInFlight.current) {
      await refreshInFlight.current;
      if (!options?.force) return;
    }

    const showLoading = options?.showLoading ?? false;
    const skipQueryInvalidation = options?.skipQueryInvalidation ?? false;

    const run = async () => {
      if (showLoading) setLoading(true);
      const currentSession = await getSession();
      setSession(currentSession);
      if (!currentSession?.user) {
        setProfile(null);
        setPortalAccess(null);
        setActivePortal(null);
        setActiveBuildingId(null);
        setActiveCompanyId(null);
        lastInvalidatedCompany.current = null;
        if (showLoading) setLoading(false);
        setInitializing(false);
        hasInitialized.current = true;
        return;
      }
      const p = await fetchProfile(currentSession.user.id);
      setProfile(p);
      const access = await resolvePortalAccess(currentSession.user.id, p);
      setPortalAccess(access);
      let companyId = access.companyId;
      if (access.isSuperAdmin && !companyId) {
        const { data: companies } = await supabase.from("management_companies").select("id").limit(1);
        companyId = companies?.[0]?.id ?? null;
      }
      setActiveCompanyId(companyId);
      const preservedBuildingId = getActiveBuildingId();
      if (
        preservedBuildingId &&
        (access.isSuperAdmin || access.buildingIds.includes(preservedBuildingId))
      ) {
        setActiveBuildingId(preservedBuildingId);
      } else if (access.buildingIds[0]) {
        setActiveBuildingId(access.buildingIds[0]);
      } else {
        setActiveBuildingId(null);
      }
      if (access.defaultPortal === "resident") {
        try {
          await ensureActiveBuildingForUser(currentSession.user.id);
        } catch {
          // Non-resident users may have no occupancy; building context set via portal access above.
        }
      }
      setActivePortal((prev) => prev ?? access.defaultPortal);
      void updateLastLogin(currentSession.user.id);
      if (options?.incrementProfileCompletionLogin && access.portals.includes("resident")) {
        try {
          await maybeIncrementProfileCompletionLogin(currentSession.user.id);
        } catch {
          // Profile completion tracking is best-effort; do not block sign-in.
        }
      }
      if (!skipQueryInvalidation) {
        invalidateAuthQueries();
        if (access.companyId) {
          const userId = currentSession.user.id;
          const prev = lastInvalidatedCompany.current;
          if (!prev || prev.userId !== userId || prev.companyId !== access.companyId) {
            invalidateCompanyQueries(userId, access.companyId);
            lastInvalidatedCompany.current = { userId, companyId: access.companyId };
          }
        }
      }
      if (showLoading) setLoading(false);
      setInitializing(false);
      hasInitialized.current = true;
    };

    refreshInFlight.current = run().finally(() => {
      refreshInFlight.current = null;
    });
    await refreshInFlight.current;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setInitializing(false);
      hasInitialized.current = true;
      return;
    }
    void refreshAuth({ showLoading: true });
    const { data: sub } = onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && hasInitialized.current) {
        setSession(session);
        return;
      }
      const background = isBackgroundAuthEvent(event, hasInitialized.current);
      void refreshAuth({
        showLoading: !background,
        skipQueryInvalidation: background,
        incrementProfileCompletionLogin: event === "SIGNED_IN",
      });
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshAuth]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    clearAllQueries();
    lastInvalidatedCompany.current = null;
    setSession(null);
    setProfile(null);
    setPortalAccess(null);
    setActivePortal(null);
    setActiveBuildingId(null);
    setActiveCompanyId(null);
  }, []);

  const value = useMemo(
    () => ({
      initializing,
      loading,
      session,
      profile,
      portalAccess,
      activePortal,
      setActivePortal,
      refreshAuth,
      signOut,
    }),
    [initializing, loading, session, profile, portalAccess, activePortal, refreshAuth, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
