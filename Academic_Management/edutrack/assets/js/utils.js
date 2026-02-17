function animateCounter(elementId, targetValue, duration = 1500) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (targetValue - start) * easeOut);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = targetValue;
  }
  requestAnimationFrame(update);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container-edu') || (function () {
    const c = document.createElement('div');
    c.id = 'toast-container-edu';
    c.className = 'toast-container-edu';
    document.body.appendChild(c);
    return c;
  })();
  const toast = document.createElement('div');
  toast.className = 'toast-edu ' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () {
    toast.remove();
  }, 4000);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return day + ' ' + month + ' ' + year;
}

function exportTableToCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const rows = table.querySelectorAll('tr');
  const csv = [];
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td, th');
    const row = [];
    for (let j = 0; j < cells.length; j++) row.push('"' + (cells[j].textContent || '').replace(/"/g, '""') + '"');
    csv.push(row.join(','));
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = (filename || 'export') + '.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

function debounce(fn, delay) {
  let t;
  return function () {
    const args = arguments;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(null, args); }, delay);
  };
}

function calcGrade(marks, maxMarks) {
  if (marks == null || maxMarks == null || maxMarks === 0) return '—';
  const p = (Number(marks) / Number(maxMarks)) * 100;
  if (p >= 90) return 'O';
  if (p >= 80) return 'A+';
  if (p >= 70) return 'A';
  if (p >= 60) return 'B+';
  if (p >= 50) return 'B';
  if (p >= 40) return 'C';
  return 'F';
}
