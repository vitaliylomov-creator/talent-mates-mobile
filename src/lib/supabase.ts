import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zlkzjeaojpxzccpovygk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3E7wboJ9pXRrMxCfDzxxaA_iauXsILn';

const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const SUPABASE = { URL: SUPABASE_URL, ANON_KEY: SUPABASE_ANON_KEY };
