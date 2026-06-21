import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zlkzjeaojpxzccpovygk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3E7wboJ9pXRrMxCfDzxxaA_iauXsILn';

// AsyncStorage is what Supabase recommends for React Native — works in
// Expo Go and standalone builds. Tokens are short-lived JWTs that
// auto-refresh; the marginal benefit of Keychain over AsyncStorage doesn't
// outweigh the compatibility headache with Expo Go's bundled native modules.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const SUPABASE = { URL: SUPABASE_URL, ANON_KEY: SUPABASE_ANON_KEY };
