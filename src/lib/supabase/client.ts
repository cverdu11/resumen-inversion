"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";

type BrowserClientOptions = {
  auth?: {
    detectSessionInUrl?: boolean;
  };
  isSingleton?: boolean;
};

export function createClient(options?: BrowserClientOptions) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createBrowserClient(supabaseUrl, supabaseAnonKey, options);
}
