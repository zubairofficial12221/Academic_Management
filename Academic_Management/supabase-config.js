/**
 * Supabase Configuration
 * 
 * IMPORTANT: Replace SUPABASE_URL with your actual project URL from Supabase Dashboard:
 * Project Settings > API > Project URL (e.g. https://xxxxx.supabase.co)
 * 
 * SECURITY: Only the publishable key is used here. NEVER put your secret key
 * in client-side JavaScript - it bypasses all security. If you exposed your
 * secret key, regenerate it in Supabase Dashboard > Project Settings > API.
 */
const SUPABASE_URL = 'https://kamolefugxbzojhwcghf.supabase.co';  // Replace with your project URL
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_puEBRY4twfPYfOw1JVP9sA_urIj8bQd';

// Create Supabase client - expose globally for the app
var supabaseClient = null;
try {
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  } else if (typeof window.supabase === 'function') {
    supabaseClient = window.supabase(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
  if (supabaseClient) window.supabaseClient = supabaseClient;
} catch (e) { console.warn('Supabase init failed:', e); }
