// ── DATA ──────────────────────────────────────────────────────────────
var students = [];
var results = {};
var attendanceMap = {};
var notifications = [];
var currentUser = 'Admin';

// ── SUPABASE ──────────────────────────────────────────────────────────
function getSupabase(){ return typeof supabaseClient !== 'undefined' ? supabaseClient : null; }

async function loadFromSupabase(){
  var sb = getSupabase();
  if(!sb){ console.warn('Supabase not loaded - using local data'); setDefaultsAndRender(); return; }
  showDataLoading(true);
  try {
    try {
      var { data: sData } = await sb.from('students').select('*');
      students = (sData||[]).map(function(r){ return { id:r.id, rollNo:r.roll_no, name:r.name, dept:r.dept, mentor:r.mentor, att:r.attendance||0, email:r.email||'' }; });
      if(!students.length){ students = getDefaultStudents(); }
    } catch(e){ console.error('Supabase load students:', e); students = getDefaultStudents(); }
    try {
      var { data: nData } = await sb.from('notifications').select('*').order('created_at',{ascending:false}).limit(50);
      notifications = (nData||[]).map(function(r){ return { id:r.id, icon:r.icon||'fa-bell', color:r.color||'#667eea', title:r.title, msg:r.msg||'', time:new Date(r.created_at).toLocaleTimeString('en-IN') }; });
    } catch(e){ console.error('Supabase load notifications:', e); }
    try {
      var today = new Date().toISOString().slice(0,10);
      var { data: aData } = await sb.from('attendance_records').select('*').eq('record_date', today);
      attendanceMap = {};
      (aData||[]).forEach(function(r){ for(var h=1;h<=6;h++){ var k=r['hour_'+h]; if(k) attendanceMap[r.student_id+'-'+h]=k; } });
    } catch(e){ console.error('Supabase load attendance:', e); }
    await loadResultsFromSupabase();
    setDefaultsAndRender();
  } finally { showDataLoading(false); }
}

function setDefaultsAndRender(){
  if(!students.length) students = getDefaultStudents();
  if(Object.keys(results).length===0) results = getDefaultResults();
}

function showDataLoading(show){
  var el = document.getElementById('dataLoadingIndicator');
  if(el) el.style.display = show ? 'inline' : 'none';
}

function refreshFromSupabase(){
  loadFromSupabase().then(function(){
    updateDashStats();
    if(typeof renderAttendance==='function') renderAttendance();
    if(typeof renderStudents==='function') renderStudents();
    if(typeof renderAllNotifications==='function') renderAllNotifications();
    alert('Data refreshed from database.');
  });
}

function getDefaultStudents(){
  return [
    {id:1,rollNo:'CS001',name:'Rahul Kumar',dept:'Computer Science',mentor:'Dr. Sharma',att:85,email:'rahul@college.edu'},
    {id:2,rollNo:'CS002',name:'Priya Singh',dept:'Computer Science',mentor:'Dr. Sharma',att:92,email:'priya@college.edu'},
    {id:3,rollNo:'EC001',name:'Amit Patel',dept:'Electronics',mentor:'Dr. Reddy',att:78,email:'amit@college.edu'},
    {id:4,rollNo:'EC002',name:'Sneha Iyer',dept:'Electronics',mentor:'Dr. Reddy',att:95,email:'sneha@college.edu'},
    {id:5,rollNo:'ME001',name:'Vikram Shah',dept:'Mechanical',mentor:'Dr. Kumar',att:88,email:'vikram@college.edu'},
    {id:6,rollNo:'ME002',name:'Anjali Desai',dept:'Mechanical',mentor:'Dr. Kumar',att:72,email:'anjali@college.edu'}
  ];
}

async function loadResultsFromSupabase(){
  var sb = getSupabase();
  if(!sb){ results = getDefaultResults(); return; }
  try {
    var { data: rData } = await sb.from('results').select('*');
    results = {};
    for(var i=0;i<(rData||[]).length;i++){
      var r = rData[i];
      var { data: subData } = await sb.from('result_subjects').select('*').eq('result_id', r.id);
      var subs = (subData||[]).map(function(s){ return { sub:s.subject_name, internal:s.internal, external:s.external, max:s.max_marks, grade:s.grade }; });
      if(!results[r.roll_no]) results[r.roll_no] = { name:r.student_name, subjects:[] };
      results[r.roll_no].subjects = (results[r.roll_no].subjects || []).concat(subs);
    }
    if(Object.keys(results).length===0){ results = getDefaultResults(); }
  } catch(e){ console.error('Supabase load results:', e); results = getDefaultResults(); }
}

function getDefaultResults(){
  return {
    CS001:{name:'Rahul Kumar',subjects:[{sub:'Data Structures',internal:38,external:58,max:100,grade:'B+'},{sub:'Operating Systems',internal:42,external:62,max:100,grade:'A'},{sub:'DBMS',internal:35,external:55,max:100,grade:'B'},{sub:'Computer Networks',internal:40,external:60,max:100,grade:'A'},{sub:'Software Engineering',internal:36,external:56,max:100,grade:'B+'}]},
    CS002:{name:'Priya Singh',subjects:[{sub:'Data Structures',internal:45,external:68,max:100,grade:'A+'},{sub:'Operating Systems',internal:43,external:65,max:100,grade:'A'},{sub:'DBMS',internal:44,external:66,max:100,grade:'A'},{sub:'Computer Networks',internal:42,external:63,max:100,grade:'A'},{sub:'Software Engineering',internal:41,external:61,max:100,grade:'A'}]},
    EC001:{name:'Amit Patel',subjects:[{sub:'Analog Circuits',internal:32,external:50,max:100,grade:'C+'},{sub:'Digital Electronics',internal:35,external:55,max:100,grade:'B'},{sub:'Signal Processing',internal:30,external:48,max:100,grade:'C'},{sub:'Microcontrollers',internal:34,external:52,max:100,grade:'B'},{sub:'VLSI Design',internal:33,external:51,max:100,grade:'C+'}]}
  };
}

// ── DATE ──────────────────────────────────────────────────────────────
var todayEl = document.getElementById('todayOption');
if (todayEl) todayEl.textContent = new Date().toLocaleDateString('en-IN',{weekday:'short',year:'numeric',month:'short',day:'numeric'});

// ── AUTH ──────────────────────────────────────────────────────────────
function login(role){
  currentUser = role;
  var loginScreen = document.getElementById('loginScreen');
  var app = document.getElementById('app');
  var userLabel = document.getElementById('userLabel');
  if (loginScreen) loginScreen.style.display = 'none';
  if (app) app.style.display = 'block';
  if (userLabel) userLabel.textContent = role;
  loadFromSupabase().then(function(){
    if (typeof updateDashStats==='function') updateDashStats();
    if (typeof renderAttendance==='function') renderAttendance();
    if (typeof renderStudents==='function') renderStudents();
    if (typeof updateNotifUI==='function') updateNotifUI();
  }).catch(function(e){ console.error('Load data error:', e); if (typeof updateDashStats==='function') updateDashStats(); });
  fetchWeather();
}

function logout(){
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

// ── NAV ───────────────────────────────────────────────────────────────
function showSection(id, btn){
  document.querySelectorAll('.section').forEach(function(s){s.classList.remove('active');});
  document.querySelectorAll('.nav-link').forEach(function(b){b.classList.remove('active');});
  document.getElementById('sec-'+id).classList.add('active');
  if(btn) btn.classList.add('active');
  var titles = {dashboard:'Dashboard',attendance:'Attendance Management',students:'Student Directory',examSeats:'Exam Seat Arrangement',results:'Results Portal',weather:'Weather Monitoring',notifications:'Notifications'};
  document.getElementById('pageTitle').textContent = titles[id] || id;
  if(id==='attendance') renderAttendance();
  if(id==='students') renderStudents();
  if(id==='notifications') renderAllNotifications();
  if(window.innerWidth<768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
}

// ── DASHBOARD ─────────────────────────────────────────────────────────
function updateDashStats(){
  var stTotal = document.getElementById('stTotal');
  var stAvg = document.getElementById('stAvg');
  if (stTotal) stTotal.textContent = students.length;
  var avg = students.length ? Math.round(students.reduce(function(a,s){return a+s.att;},0)/students.length) : 0;
  if (stAvg) stAvg.textContent = avg + '%';
  var absent = Object.values(attendanceMap).filter(function(v){return v==='A';}).length;
  var stAbsent = document.getElementById('stAbsent');
  var stNotif = document.getElementById('stNotif');
  if (stAbsent) stAbsent.textContent = absent;
  if (stNotif) stNotif.textContent = notifications.length;
  var stNotif2 = document.getElementById('stNotif2');
  if(stNotif2) stNotif2.textContent = notifications.length;
  renderDashNotif();
}

function renderDashNotif(){
  var el = document.getElementById('dashNotifList');
  if(!notifications.length){el.innerHTML='<p style="color:#888">No recent activity.</p>';return;}
  el.innerHTML = notifications.slice(0,5).map(function(n){
    return '<div style="padding:10px;background:#f8f9fa;border-radius:8px;margin-bottom:8px;font-size:14px">'
      +'<strong style="color:'+n.color+'"><i class="fas '+n.icon+'"></i> '+n.title+'</strong>'
      +'<p style="margin:4px 0 0;color:#555">'+n.msg+'</p>'
      +'<small style="color:#aaa">'+n.time+'</small></div>';
  }).join('');
}

// ── ATTENDANCE ────────────────────────────────────────────────────────
function renderAttendance(){
  var search = document.getElementById('attSearch').value.toLowerCase();
  var dept = document.getElementById('attDept').value;
  var filtered = students.filter(function(s){
    return (dept==='all'||s.dept===dept) && (s.name.toLowerCase().includes(search)||s.rollNo.toLowerCase().includes(search));
  });
  var html = '';
  filtered.forEach(function(s){
    var presentCount = 0;
    var cells = '';
    for(var h=1;h<=6;h++){
      var key = s.id+'-'+h;
      var val = attendanceMap[key]||'';
      presentCount += (val==='P'?1:0);
      cells += '<td>'
        +'<button class="att-btn'+(val==='P'?' present':'')+'" onclick="markAtt('+s.id+','+h+',\'P\')">P</button>'
        +'<button class="att-btn'+(val==='A'?' absent':'')+'" onclick="markAtt('+s.id+','+h+',\'A\')">A</button>'
        +'</td>';
    }
    var marked = [1,2,3,4,5,6].filter(function(h){return attendanceMap[s.id+'-'+h];}).length;
    var pct = marked ? Math.round(presentCount/marked*100) : '--';
    var pctColor = pct==='--'?'#888':pct>=75?'#10b981':'#ef4444';
    html += '<tr><td>'+s.rollNo+'</td><td>'+s.name+'</td><td>'+s.dept+'</td>'
      +cells
      +'<td style="font-weight:700;color:'+pctColor+'">'+(pct==='--'?'--':pct+'%')+'</td></tr>';
  });
  document.getElementById('attBody').innerHTML = html || '<tr><td colspan="10" style="text-align:center;color:#888">No students found.</td></tr>';
}

async function markAtt(sid, hour, status){
  var key = sid+'-'+hour;
  attendanceMap[key] = status;
  if(status==='A'){
    var s = students.find(function(x){return x.id===sid;});
    addNotification(
      'fa-user-times','#ef4444',
      'Absence Alert',
      s.name+' ('+s.rollNo+') absent in Hour '+hour+'. Mentor: '+s.mentor+' notified.'
    );
  }
  renderAttendance();
  updateDashStats();
}

async function saveAttendance(){
  var sb = getSupabase();
  var today = new Date().toISOString().slice(0,10);
  if(sb){
    try {
      for(var i=0;i<students.length;i++){
        var s = students[i];
        var rec = { student_id: s.id, record_date: today, hour_1: attendanceMap[s.id+'-1']||null, hour_2: attendanceMap[s.id+'-2']||null, hour_3: attendanceMap[s.id+'-3']||null, hour_4: attendanceMap[s.id+'-4']||null, hour_5: attendanceMap[s.id+'-5']||null, hour_6: attendanceMap[s.id+'-6']||null };
        await sb.from('attendance_records').upsert(rec,{onConflict:'student_id,record_date'});
      }
    } catch(e){ console.error('Supabase save attendance:', e); alert('Error saving attendance: '+e.message); return; }
  }
  var count = 0;
  students.forEach(function(s){ for(var h=1;h<=6;h++){ if(attendanceMap[s.id+'-'+h]==='A') count++; } });
  addNotification('fa-check-circle','#10b981','Attendance Saved','Attendance recorded. '+count+' absence(s) flagged and mentors notified.');
  updateDashStats();
  alert('Attendance saved successfully! ' + count + ' absence notification(s) sent to mentors.');
}

// ── STUDENTS ──────────────────────────────────────────────────────────
function renderStudents(){
  var search = document.getElementById('stuSearch').value.toLowerCase();
  var dept = document.getElementById('stuDept').value;
  var attF = document.getElementById('stuAttFilter').value;
  var filtered = students.filter(function(s){
    var matchS = s.name.toLowerCase().includes(search)||s.rollNo.toLowerCase().includes(search);
    var matchD = dept==='all'||s.dept===dept;
    var matchA = attF==='all'||(attF==='low'&&s.att<75)||(attF==='ok'&&s.att>=75&&s.att<=90)||(attF==='good'&&s.att>90);
    return matchS&&matchD&&matchA;
  });
  var html = '';
  filtered.forEach(function(s){
    var badge, color;
    if(s.att<75){badge='Low';color='badge-a';}
    else if(s.att<=90){badge='Good';color='badge-w';}
    else{badge='Excellent';color='badge-p';}
    html += '<tr>'
      +'<td><strong>'+s.rollNo+'</strong></td>'
      +'<td>'+s.name+'</td>'
      +'<td>'+s.dept+'</td>'
      +'<td>'+s.mentor+'</td>'
      +'<td><strong style="color:'+(s.att<75?'#ef4444':s.att<=90?'#f59e0b':'#10b981')+'">'+s.att+'%</strong></td>'
      +'<td><span class="'+color+'">'+badge+'</span></td>'
      +'</tr>';
  });
  document.getElementById('stuBody').innerHTML = html || '<tr><td colspan="6" style="text-align:center;color:#888">No students found.</td></tr>';
}

async function openAddStudent(){
  var roll = prompt('Enter Roll Number:');
  if(!roll) return;
  var name = prompt('Enter Student Name:');
  if(!name) return;
  var dept = prompt('Enter Department (Computer Science / Electronics / Mechanical):') || 'Computer Science';
  var mentor = prompt('Enter Mentor Name:') || 'Dr. TBA';
  var sb = getSupabase();
  if(sb){
    try {
      var { data, error } = await sb.from('students').insert({roll_no:roll,name:name,dept:dept,mentor:mentor,attendance:100,email:roll.toLowerCase()+'@college.edu'}).select('id,roll_no,name,dept,mentor,attendance,email').single();
      if(error) throw error;
      students.push({id:data.id,rollNo:data.roll_no,name:data.name,dept:data.dept,mentor:data.mentor,att:data.attendance||100,email:data.email||''});
    } catch(e){ console.error('Supabase insert student:', e); alert('Error saving student: '+e.message); return; }
  } else {
    students.push({id:Date.now(),rollNo:roll,name:name,dept:dept,mentor:mentor,att:100,email:roll.toLowerCase()+'@college.edu'});
  }
  renderStudents();
  updateDashStats();
  alert('Student added successfully!');
}

// ── EXAM SEATS ────────────────────────────────────────────────────────
function generateSeats(){
  var exam = document.getElementById('examName').value;
  var shuffled = students.slice().sort(function(){return Math.random()-.5;});
  var rooms = {};
  shuffled.forEach(function(s,i){
    var room = 'Room ' + (Math.floor(i/3)+1);
    if(!rooms[room]) rooms[room] = [];
    rooms[room].push(Object.assign({}, s, { seatNo: (i%3)+1 }));
  });
  var html = '<p style="color:#667eea;font-weight:600;margin-bottom:16px"><i class="fas fa-info-circle"></i> Exam: <strong>'+exam+'</strong> | Date: '+new Date().toLocaleDateString('en-IN')+'</p>';
  Object.keys(rooms).forEach(function(room){
    html += '<h6 style="margin-bottom:10px;color:#555"><i class="fas fa-door-open"></i> '+room+'</h6>';
    html += '<div class="seat-grid">';
    rooms[room].forEach(function(s){
      html += '<div class="seat-card">'
        +'<div style="font-size:28px;margin-bottom:6px">🪑</div>'
        +'<strong style="color:#667eea">Seat '+s.seatNo+'</strong>'
        +'<p style="font-size:13px;margin:4px 0">'+s.name+'</p>'
        +'<small style="color:#888">'+s.rollNo+'</small><br>'
        +'<small style="color:#aaa">'+s.dept+'</small>'
        +'</div>';
    });
    html += '</div><hr style="margin:16px 0">';
  });
  document.getElementById('seatsContainer').innerHTML = html;
  addNotification('fa-th','#6366f1','Seats Generated','Exam seat arrangement for "'+exam+'" has been generated and assigned to '+students.length+' students.');
  updateDashStats();
}

// ── RESULTS ───────────────────────────────────────────────────────────
function searchResult(){
  var roll = document.getElementById('rollInput').value.trim().toUpperCase();
  var sem = document.getElementById('semSelect').value;
  var el = document.getElementById('resultOut');
  if(!roll){el.innerHTML='<p style="color:#ef4444">Please enter a roll number.</p>';return;}
  var r = results[roll];
  if(!r){el.innerHTML='<div style="text-align:center;padding:30px;color:#888"><i class="fas fa-search" style="font-size:40px;margin-bottom:10px;display:block"></i>No result found for <strong>'+roll+'</strong>.<br><small>Available: CS001, CS002, EC001</small></div>';return;}
  var total = r.subjects.reduce(function(a,s){return a+(s.internal+s.external);},0);
  var maxTotal = r.subjects.length*100;
  var pct = Math.round(total/maxTotal*100);
  var grade = pct>=90?'O':pct>=80?'A+':pct>=70?'A':pct>=60?'B+':pct>=50?'B':'F';
  var html = '<div class="result-box">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:20px">'
    +'<div><h5 style="margin:0">'+r.name+'</h5><small style="color:#888">'+roll+' | Semester '+sem+'</small></div>'
    +'<div style="text-align:center"><div style="font-size:32px;font-weight:700;color:#667eea">'+pct+'%</div><span class="grade-badge" style="background:#667eea;color:#fff">Grade: '+grade+'</span></div>'
    +'</div>';
  r.subjects.forEach(function(s){
    var total_s = s.internal+s.external;
    var gc = s.grade.indexOf('+')!==-1||s.grade==='A'||s.grade==='O'?'#d1fae5':s.grade==='F'?'#fee2e2':'#fef3c7';
    var gtc = s.grade.indexOf('+')!==-1||s.grade==='A'||s.grade==='O'?'#065f46':s.grade==='F'?'#991b1b':'#92400e';
    html += '<div class="subject-row">'
      +'<div><strong>'+s.sub+'</strong><br><small style="color:#888">Internal: '+s.internal+' | External: '+s.external+'</small></div>'
      +'<div style="display:flex;align-items:center;gap:12px">'
      +'<strong>'+total_s+'/100</strong>'
      +'<span class="grade-badge" style="background:'+gc+';color:'+gtc+'">'+s.grade+'</span>'
      +'</div></div>';
  });
  html += '<div style="margin-top:16px;padding-top:16px;border-top:2px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center">'
    +'<strong>Total: '+total+'/'+maxTotal+'</strong>'
    +'<strong style="color:#667eea">Result: '+(pct>=50?'PASS':'FAIL')+'</strong>'
    +'</div></div>';
  el.innerHTML = html;
}

// ── WEATHER ───────────────────────────────────────────────────────────
function fetchWeather(){
  // Simulated weather data for Chennai
  var data = {temp:32,desc:'Partly Cloudy',humidity:72,wind:14,feels:35,condition:'clouds'};
  document.getElementById('wTemp').textContent = data.temp + '°C';
  document.getElementById('wDesc').textContent = data.desc;
  document.getElementById('wHumidity').textContent = data.humidity + '%';
  document.getElementById('wWind').textContent = data.wind + ' km/h';
  document.getElementById('wFeels').textContent = data.feels + '°C';
  var icons = {rain:'🌧️',storm:'⛈️',snow:'❄️',clouds:'⛅',clear:'☀️',drizzle:'🌦️'};
  document.getElementById('wIcon').textContent = icons[data.condition] || '🌤️';
  addWeatherLog(data);
  // Simulate alert check
  if(data.temp>40||data.humidity>90){
    document.getElementById('weatherAlert').style.display='block';
    document.getElementById('alertMsg').textContent='Extreme conditions detected. Temperature: '+data.temp+'°C, Humidity: '+data.humidity+'%. Recommend declaring a holiday for student safety.';
  }
}

function addWeatherLog(data){
  var log = document.getElementById('weatherLog');
  var time = new Date().toLocaleTimeString('en-IN');
  log.innerHTML = '<div style="padding:10px;background:#f8f9fa;border-radius:8px;font-size:14px">'
    +'<strong>'+time+'</strong> — '+data.temp+'°C, '+data.desc+', Humidity: '+data.humidity+'%, Wind: '+data.wind+' km/h'
    +'</div>';
}

function declareHoliday(){
  addNotification('fa-calendar-times','#ef4444','Holiday Declared','Due to severe weather conditions, tomorrow has been declared a holiday. Notifications sent to all students and staff.');
  updateDashStats();
  alert('Holiday declared! All students and staff have been notified.');
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────
async function addNotification(icon, color, title, msg){
  var sb = getSupabase();
  var n = {id:Date.now(),icon:icon,color:color,title:title,msg:msg,time:new Date().toLocaleTimeString('en-IN')};
  if(sb){ try { var { data } = await sb.from('notifications').insert({icon:icon,color:color,title:title,msg:msg}).select('id,created_at').single(); if(data){ n.id=data.id; n.time=new Date(data.created_at).toLocaleTimeString('en-IN'); } } catch(e){ console.error('Supabase insert notification:', e); } }
  notifications.unshift(n);
  updateNotifUI();
}

function updateNotifUI(){
  document.getElementById('notifCount').textContent = notifications.length;
  var list = document.getElementById('notifList');
  if(!notifications.length){list.innerHTML='<div class="notif-item" style="color:#888;text-align:center">No notifications</div>';return;}
  list.innerHTML = notifications.slice(0,5).map(function(n){
    return '<div class="notif-item"><strong style="color:'+n.color+'"><i class="fas '+n.icon+'"></i> '+n.title+'</strong><span style="display:block;margin-top:3px;color:#555">'+n.msg+'</span><small style="color:#aaa">'+n.time+'</small></div>';
  }).join('');
  renderAllNotifications();
  renderDashNotif();
}

function renderAllNotifications(){
  var el = document.getElementById('allNotifList');
  if(!notifications.length){el.innerHTML='<p style="color:#888;text-align:center;padding:20px">No notifications yet.</p>';return;}
  el.innerHTML = notifications.map(function(n){
    return '<div style="padding:14px;background:#f8f9fa;border-radius:10px;margin-bottom:10px;border-left:4px solid '+n.color+'">'
      +'<strong style="color:'+n.color+'"><i class="fas '+n.icon+'"></i> '+n.title+'</strong>'
      +'<p style="margin:5px 0 4px;color:#444;font-size:14px">'+n.msg+'</p>'
      +'<small style="color:#aaa">'+n.time+'</small></div>';
  }).join('');
}

function toggleNotifDropdown(){
  document.getElementById('notifDropdown').classList.toggle('open');
}

async function clearNotifications(){
  var sb = getSupabase();
  if(sb){ try { await sb.from('notifications').delete().neq('id', 0); } catch(e){ console.error('Supabase clear notifications:', e); } }
  notifications = [];
  updateNotifUI();
  updateDashStats();
}

document.addEventListener('click', function(e){
  var dd = document.getElementById('notifDropdown');
  if(dd.classList.contains('open') && !dd.contains(e.target) && !e.target.closest('.notif-bell')){
    dd.classList.remove('open');
  }
});
