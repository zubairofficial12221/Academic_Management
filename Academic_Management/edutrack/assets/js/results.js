(function () {
  if (typeof supabaseClient === 'undefined') return;

  window.EduTrackResults = {
    searchRollNumbers: async function (query) {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabaseClient.from('users').select('id, name, roll_number, department').eq('role', 'student').ilike('roll_number', '%' + query + '%').limit(20);
      if (error) return [];
      return data || [];
    },
    addResult: async function (studentId, examType, subject, subjectCode, marksObtained, maxMarks, semester, academicYear) {
      const grade = calcGrade(marksObtained, maxMarks);
      const { error } = await supabaseClient.from('results').insert({
        student_id: studentId,
        exam_type: examType,
        subject: subject,
        subject_code: subjectCode || null,
        marks_obtained: parseFloat(marksObtained),
        max_marks: parseFloat(maxMarks) || 100,
        grade: grade,
        semester: semester ? parseInt(semester, 10) : null,
        academic_year: academicYear || null
      });
      if (error) throw error;
    },
    loadResults: async function (filters) {
      let q = supabaseClient.from('results').select('*, users!results_student_id_fkey(name, roll_number)').order('created_at', { ascending: false });
      if (filters && filters.studentId) q = q.eq('student_id', filters.studentId);
      if (filters && filters.semester) q = q.eq('semester', filters.semester);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    updateResult: async function (id, payload) {
      if (payload.marks_obtained != null && payload.max_marks != null) payload.grade = calcGrade(payload.marks_obtained, payload.max_marks);
      const { error } = await supabaseClient.from('results').update(payload).eq('id', id);
      if (error) throw error;
    },
    deleteResult: async function (id) {
      const { error } = await supabaseClient.from('results').delete().eq('id', id);
      if (error) throw error;
    },
    publishAndNotify: async function (resultIds) {
      if (!resultIds || !resultIds.length) return;
      const { data: results } = await supabaseClient.from('results').select('student_id').in('id', resultIds);
      const studentIds = [...new Set((results || []).map(function (r) { return r.student_id; }))];
      const rows = studentIds.map(function (sid) {
        return { recipient_id: sid, type: 'result', message: 'New result has been published. Check your results page.', is_read: false };
      });
      await supabaseClient.from('notifications').insert(rows);
    },
    parseCSV: function (csvText) {
      return Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
    },
    bulkInsert: async function (rows, mapFields) {
      const toInsert = rows.map(function (row) {
        const studentId = mapFields.studentId(row);
        const marks = parseFloat(mapFields.marksObtained(row)) || 0;
        const max = parseFloat(mapFields.maxMarks(row)) || 100;
        return {
          student_id: studentId,
          exam_type: mapFields.examType(row) || 'internal',
          subject: mapFields.subject(row) || '',
          subject_code: mapFields.subjectCode(row) || null,
          marks_obtained: marks,
          max_marks: max,
          grade: calcGrade(marks, max),
          semester: mapFields.semester(row) ? parseInt(mapFields.semester(row), 10) : null,
          academic_year: mapFields.academicYear(row) || null
        };
      }).filter(function (r) { return r.student_id && r.subject; });
      if (!toInsert.length) throw new Error('No valid rows to insert');
      const { error } = await supabaseClient.from('results').insert(toInsert);
      if (error) throw error;
      return toInsert.length;
    }
  };
})();
