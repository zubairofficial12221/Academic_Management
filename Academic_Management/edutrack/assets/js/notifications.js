(function () {
  if (typeof supabaseClient === 'undefined') return;

  window.EduTrackNotifications = {
    load: async function (recipientId, typeFilter, page, pageSize) {
      let q = supabaseClient.from('notifications').select('*', { count: 'exact' }).eq('recipient_id', recipientId).order('sent_at', { ascending: false });
      if (typeFilter && typeFilter !== 'all') q = q.eq('type', typeFilter);
      const from = (page - 1) * (pageSize || 20);
      q = q.range(from, from + (pageSize || 20) - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data || [], total: count || 0 };
    },
    loadAllForAdmin: async function (typeFilter, page, pageSize) {
      let q = supabaseClient.from('notifications').select('*, users!notifications_recipient_id_fkey(name, email)', { count: 'exact' }).order('sent_at', { ascending: false });
      if (typeFilter && typeFilter !== 'all') q = q.eq('type', typeFilter);
      const from = (page - 1) * (pageSize || 20);
      q = q.range(from, from + (pageSize || 20) - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data || [], total: count || 0 };
    },
    markRead: async function (id) {
      const { error } = await supabaseClient.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    markAllRead: async function (recipientId) {
      const { error } = await supabaseClient.from('notifications').update({ is_read: true }).eq('recipient_id', recipientId);
      if (error) throw error;
    },
    unreadCount: async function (recipientId) {
      const { count, error } = await supabaseClient.from('notifications').select('*', { count: 'exact', head: true }).eq('recipient_id', recipientId).eq('is_read', false);
      if (error) return 0;
      return count || 0;
    },
    subscribeUnread: function (recipientId, onCount) {
      return supabaseClient.channel('notifications-' + recipientId).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'recipient_id=eq.' + recipientId }, function () {
        window.EduTrackNotifications.unreadCount(recipientId).then(onCount);
      }).subscribe();
    },
    sendManual: async function (recipientType, recipientId, department, message, type) {
      let recipientIds = [];
      if (recipientType === 'all') {
        const { data } = await supabaseClient.from('users').select('id');
        recipientIds = (data || []).map(function (r) { return r.id; });
      } else if (recipientType === 'department' && department) {
        const { data } = await supabaseClient.from('users').select('id').eq('department', department);
        recipientIds = (data || []).map(function (r) { return r.id; });
      } else if (recipientId) {
        recipientIds = [recipientId];
      }
      if (!recipientIds.length) throw new Error('No recipients');
      const rows = recipientIds.map(function (id) {
        return { recipient_id: id, type: type || 'general', message: message, is_read: false };
      });
      const { error } = await supabaseClient.from('notifications').insert(rows);
      if (error) throw error;
      return rows.length;
    }
  };
})();
