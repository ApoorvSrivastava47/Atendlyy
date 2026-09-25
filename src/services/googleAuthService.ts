import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

let cachedProviderToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  let mounted = true;

  const applySession = (session: any) => {
    if (!mounted) return;

    if (session?.user) {
      cachedProviderToken = session.provider_token ?? cachedProviderToken;
      // Supabase Auth remains valid even when Google does not return a provider token
      // after a page refresh. Drive/Sheets is treated as an optional integration.
      onAuthSuccess?.(session.user, cachedProviderToken ?? '');
    } else {
      cachedProviderToken = null;
      onAuthFailure?.();
    }
  };

  supabase.auth.getSession().then(({ data }) => applySession(data.session));

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.provider_token) cachedProviderToken = session.provider_token;
    applySession(session);
  });

  return () => {
    mounted = false;
    listener.subscription.unsubscribe();
  };
};

export const googleSignIn = async (): Promise<void> => {
  const redirectTo = window.location.origin;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      scopes: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedProviderToken) return cachedProviderToken;
  const { data } = await supabase.auth.getSession();
  cachedProviderToken = data.session?.provider_token ?? null;
  return cachedProviderToken;
};

export const logoutUser = async () => {
  cachedProviderToken = null;
  await supabase.auth.signOut();
};
