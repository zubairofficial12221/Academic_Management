(function () {
  if (typeof supabaseClient === 'undefined') return;

  async function login(email, password, role) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabaseClient.from('users').select('role').eq('id', data.user.id).single();
    const userRole = profile ? profile.role : null;
    if (role && userRole !== role) {
      await supabaseClient.auth.signOut();
      throw new Error('This account does not have ' + role + ' access.');
    }
    return { user: data.user, role: userRole };
  }

  async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error(error);
    window.location.href = '/edutrack/index.html';
  }

  window.EduTrackAuth = { login, logout };
})();
