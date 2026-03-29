import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { DbUser, DbProfile, UserRole } from '@/types';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  dbUser: DbUser | null;
  profile: DbProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Ensure user + profile rows exist in public tables.
 * Handles cases where the DB trigger didn't fire or user was created before trigger existed.
 */
async function ensureUserAndProfile(authUser: User): Promise<void> {
  // Check if user row exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .single();

  if (!existingUser) {
    await supabase.from('users').insert({
      id: authUser.id,
      email: authUser.email ?? '',
      role: 'client',
    });
  }

  // Check if profile row exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', authUser.id)
    .single();

  if (!existingProfile) {
    const meta = authUser.user_metadata ?? {};
    await supabase.from('profiles').insert({
      user_id: authUser.id,
      first_name: (meta.first_name as string) || '',
      last_name: (meta.last_name as string) || '',
      phone: (meta.phone as string) || null,
    });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async (authUser: User) => {
    // Ensure rows exist (fallback if trigger didn't fire)
    await ensureUserAndProfile(authUser);

    const [userResult, profileResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', authUser.id).single(),
      supabase.from('profiles').select('*').eq('user_id', authUser.id).limit(1).single(),
    ]);

    if (userResult.data) {
      setDbUser(userResult.data as DbUser);
    }
    if (profileResult.data) {
      setProfile(profileResult.data as DbProfile);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchUserData(s.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchUserData(s.user);
      } else {
        setDbUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
  ): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone || '',
        },
      },
    });
    if (error) return error.message;

    // If email confirmation is disabled, session is returned immediately
    // If enabled, data.session is null — user must confirm email first
    if (data.session) {
      // Session active → fetchUserData will be called by onAuthStateChange
      return null;
    }

    // No session = email confirmation required
    // The trigger should have created user + profile rows in the DB
    return null;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setDbUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    await fetchUserData(session.user);
  }, [session, fetchUserData]);

  return (
    <AuthContext.Provider value={{
      session,
      dbUser,
      profile,
      role: dbUser?.role ?? null,
      isAuthenticated: session !== null && dbUser !== null,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
