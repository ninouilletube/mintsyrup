'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio?: string | null;
  pronoms?: string | null;
  age?: string | null;
  esthetique?: string | null;
  couleur_preferee?: string | null;
  couleur_preferee_hex?: string | null;
  couleur_moment?: string | null;
  couleur_moment_hex?: string | null;
  obsession?: string | null;
  recherche?: string | null;
  inspiration?: string | null;
  decennies?: string | null;
  ville?: string | null;
  interets?: string | null;
  rencontres?: boolean | null;
  friperies?: string | null;
  profile_visibility?: Record<string, boolean> | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null; confirmed?: boolean }>;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Omit<Profile, 'id'>>) => Promise<{ error: string | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: string | null }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
  uploadAvatar: async () => ({ url: null, error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, attempt = 0) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!data && attempt < 3) {
      await new Promise(r => setTimeout(r, 600));
      return fetchProfile(userId, attempt + 1);
    }
    setProfile(data ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) fetchProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { error: error.message };
    if (data.user) setProfile({ id: data.user.id, username, avatar_url: null });
    return { error: null, confirmed: !!data.session };
  };

  const signIn = async (username: string, password: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username.trim())
      .single();
    if (profileError || !profileData?.email) return { error: 'Nom d\'utilisateur introuvable' };
    const { error } = await supabase.auth.signInWithPassword({ email: profileData.email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Omit<Profile, 'id'>>) => {
    if (!user) return { error: 'Non connecté' };
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (!error) setProfile(prev => prev ? { ...prev, ...data } : null);
    return { error: error?.message ?? null };
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { url: null, error: 'Non connecté' };
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('mint-assets').upload(path, file, { upsert: true });
    if (error) return { url: null, error: error.message };
    const { data } = supabase.storage.from('mint-assets').getPublicUrl(path);
    await updateProfile({ avatar_url: data.publicUrl });
    return { url: data.publicUrl, error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, updateProfile, uploadAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
