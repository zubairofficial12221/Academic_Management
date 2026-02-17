const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function requireAuth(allowedRoles = []) {
  const base = window.location.pathname.indexOf('/edutrack') !== -1 ? '/edutrack' : '';
  if (!supabaseClient) {
    console.error('Supabase client not initialized');
    window.location.href = base + '/index.html';
    return null;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = base + '/index.html';
    return null;
  }
  const { data: profile, error } = await supabaseClient.from('users').select('*').eq('id', session.user.id).single();
  if (error || !profile) {
    window.location.href = base + '/index.html';
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(profile.role)) {
    window.location.href = base + '/index.html';
    return null;
  }
  return profile;
}
