(function () {
  if (typeof supabaseClient === 'undefined') return;

  window.EduTrackSeat = {
    loadStudentsByDepartments: async function (departments) {
      if (!departments || !departments.length) return [];
      const { data, error } = await supabaseClient.from('users').select('id, name, roll_number, department, year, section').eq('role', 'student').in('department', departments).order('roll_number');
      if (error) throw error;
      return data || [];
    },
    sortStudents: function (students, method) {
      const list = students.slice();
      if (method === 'Alphabetical') list.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
      else if (method === 'Roll Number') list.sort(function (a, b) { return (a.roll_number || '').localeCompare(b.roll_number || ''); });
      else if (method === 'Random') for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = list[i]; list[i] = list[j]; list[j] = t; }
      return list;
    },
    assignSeats: function (sortedStudents, numRooms, seatsPerRoom) {
      const totalSeats = numRooms * seatsPerRoom;
      const result = [];
      let idx = 0;
      for (let r = 1; r <= numRooms && idx < sortedStudents.length; r++) {
        for (let s = 1; s <= seatsPerRoom && idx < sortedStudents.length; s++) {
          result.push({ student: sortedStudents[idx], room_number: 'Room ' + r, seat_number: 'S' + String(s).padStart(2, '0') });
          idx++;
        }
      }
      return result;
    },
    hallTicketNo: function (examDate, rollNumber) {
      const d = (examDate || '').replace(/-/g, '');
      return 'HT' + d + (rollNumber || '').replace(/\s/g, '');
    },
    upsertExamSeats: async function (assignments, examName, examDate) {
      const rows = assignments.map(function (a) {
        return {
          student_id: a.student.id,
          exam_name: examName,
          exam_date: examDate || null,
          room_number: a.room_number,
          seat_number: a.seat_number,
          hall_ticket_no: window.EduTrackSeat.hallTicketNo(examDate, a.student.roll_number)
        };
      });
      const { error } = await supabaseClient.from('exam_seats').upsert(rows, { onConflict: 'hall_ticket_no', ignoreDuplicates: false });
      if (error) throw error;
      return rows;
    }
  };
})();
