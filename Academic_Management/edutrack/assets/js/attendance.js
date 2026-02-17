(function () {
  if (typeof supabaseClient === 'undefined') return;
  const base = window.location.pathname.indexOf('/edutrack') !== -1 ? '/edutrack' : '';

  window.EduTrackAttendance = {
    loadDepartments: async function () {
      const { data } = await supabaseClient.from('users').select('department').eq('role', 'student').not('department', 'is', null);
      const set = new Set((data || []).map(function (r) { return r.department; }).filter(Boolean));
      return Array.from(set).sort();
    },
    loadStudents: async function (department, year, section) {
      let q = supabaseClient.from('users').select('id, name, roll_number, year, section, department').eq('role', 'student');
      if (department) q = q.eq('department', department);
      if (year) q = q.eq('year', parseInt(year, 10));
      if (section) q = q.eq('section', section);
      const { data, error } = await q.order('roll_number');
      if (error) throw error;
      return data || [];
    },
    loadRecords: async function (fromDate, toDate, department, page, pageSize) {
      let q = supabaseClient.from('attendance').select('*, users!attendance_student_id_fkey(name, roll_number, department, year, section)', { count: 'exact' });
      if (fromDate) q = q.gte('date', fromDate);
      if (toDate) q = q.lte('date', toDate);
      q = q.order('date', { ascending: false }).order('hour');
      const from = (page - 1) * pageSize;
      q = q.range(from, from + pageSize - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      if (department && data) {
        return { data: data.filter(function (r) { return r.users && r.users.department === department; }), count: count || data.length };
      }
      return { data: data || [], count: count || 0 };
    },
    loadSummary: async function () {
      const { data: students } = await supabaseClient.from('users').select('id, name, roll_number, department, year, section').eq('role', 'student');
      if (!students || !students.length) return [];
      const today = new Date().toISOString().slice(0, 10);
      const start = new Date();
      start.setDate(start.getDate() - 90);
      const startStr = start.toISOString().slice(0, 10);
      const { data: records } = await supabaseClient.from('attendance').select('student_id, status').gte('date', startStr).lte('date', today);
      const byStudent = {};
      (records || []).forEach(function (r) {
        if (!byStudent[r.student_id]) byStudent[r.student_id] = { present: 0, total: 0 };
        byStudent[r.student_id].total++;
        if (r.status === 'present' || r.status === 'late') byStudent[r.student_id].present++;
      });
      return students.map(function (s) {
        const st = byStudent[s.id] || { present: 0, total: 0 };
        const pct = st.total ? Math.round((st.present / st.total) * 100) : 0;
        return { id: s.id, name: s.name, roll_number: s.roll_number, department: s.department, year: s.year, section: s.section, present: st.present, total: st.total, percentage: pct };
      });
    },
    saveMark: async function (rows, date, hour, subject, markedBy) {
      const studentIds = rows.map(function (r) { return r.id; });
      await supabaseClient.from('attendance').delete().eq('date', date).eq('hour', parseInt(hour, 10)).in('student_id', studentIds);
      const toInsert = rows.map(function (r) {
        return { student_id: r.id, date: date, hour: parseInt(hour, 10), subject: subject || null, status: r.status || 'absent', marked_by: markedBy };
      });
      const { error } = await supabaseClient.from('attendance').insert(toInsert);
      if (error) throw error;
      var absentIds = toInsert.filter(function (r) { return r.status === 'absent'; }).map(function (r) { return r.student_id; });
      if (absentIds.length && markedBy) {
        for (var i = 0; i < absentIds.length; i++) {
          await supabaseClient.from('notifications').insert({ recipient_id: absentIds[i], type: 'absence', message: 'You were marked absent for hour ' + hour + ' on ' + date + '.' });
        }
      }
    },
    getExistingForHour: async function (date, hour) {
      const { data } = await supabaseClient.from('attendance').select('student_id, status').eq('date', date).eq('hour', parseInt(hour, 10));
      const map = {};
      (data || []).forEach(function (r) { map[r.student_id] = r.status; });
      return map;
    }
  };
})();
