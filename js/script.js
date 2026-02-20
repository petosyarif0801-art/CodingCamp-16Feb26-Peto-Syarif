// ===== STATE =====
let todos = JSON.parse(localStorage.getItem('peto-todos') || '[]');
let currentFilter = 'all';

// ===== THEME =====
const savedTheme = localStorage.getItem('peto-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeUI(savedTheme);

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('peto-theme', next);
  updateThemeUI(next);
}

function updateThemeUI(theme) {
  const icon  = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (theme === 'dark') {
    icon.textContent  = '☀️';
    label.textContent = 'Light Mode';
  } else {
    icon.textContent  = '🌙';
    label.textContent = 'Dark Mode';
  }
}

// ===== SAVE TO LOCALSTORAGE =====
function save() {
  localStorage.setItem('peto-todos', JSON.stringify(todos));
}

// ===== ADD TODO =====
function addTodo() {
  const input     = document.getElementById('todo-input');
  const dateInput = document.getElementById('todo-date');
  const text      = input.value.trim();
  const date      = dateInput.value;

  if (!text || !date) {
    showToast('⚠️ Isi tugas dan pilih tanggal terlebih dahulu!');
    return;
  }

  todos.unshift({
    id: Date.now(),
    text: escapeHtml(text),
    date: date,
    done: false
  });

  input.value     = '';
  dateInput.value = '';
  save();
  displayTodos();
  showToast('✅ Tugas berhasil ditambahkan!');
  input.focus();
}

function handleEnter(e) {
  if (e.key === 'Enter') addTodo();
}

// ===== TOGGLE DONE =====
function toggleDone(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    save();
    displayTodos();
  }
}

// ===== DELETE ONE TODO =====
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  save();
  displayTodos();
  showToast('🗑️ Todo dihapus.');
}

// ===== DELETE ALL TODOS =====
function deleteAllTodo() {
  if (todos.length === 0) {
    showToast('Tidak ada tugas untuk dihapus.');
    return;
  }
  if (!confirm('Yakin ingin menghapus semua tugas?')) return;
  todos = [];
  save();
  displayTodos();
  showToast('🗑️ Semua tugas dihapus.');
}

// ===== SET FILTER =====
function setFilter(filter) {
  currentFilter = filter;
  ['all', 'active', 'done'].forEach(f => {
    document.getElementById('filter-' + f).classList.toggle('active', f === filter);
  });
  displayTodos();
}

// ===== DISPLAY TODOS =====
function displayTodos() {
  const list    = document.getElementById('todo-list');
  const statsEl = document.getElementById('stats');

  // Apply filter
  let filtered = todos;
  if (currentFilter === 'active') filtered = todos.filter(t => !t.done);
  if (currentFilter === 'done')   filtered = todos.filter(t =>  t.done);

  // Update stats
  const total  = todos.length;
  const done   = todos.filter(t => t.done).length;
  const active = total - done;
  document.getElementById('stat-total').textContent  = total;
  document.getElementById('stat-active').textContent = active;
  document.getElementById('stat-done').textContent   = done;
  statsEl.style.display = total > 0 ? 'flex' : 'none';

  // Empty state
  if (filtered.length === 0) {
    const msg = currentFilter === 'done'
      ? '😊 Belum ada tugas yang selesai!.'
      : currentFilter === 'active'
      ? '🎉 Belum ada tugas yang di ambil!'
      : '📋 Belum ada tugas, Tambahkan sekarang!';
    list.innerHTML = `<li class="empty-state"><span class="emoji"></span>${msg}</li>`;
    return;
  }

  // Render items
  list.innerHTML = filtered.map(todo => {
    const today     = new Date().toISOString().split('T')[0];
    const isOverdue = !todo.done && todo.date < today;
    const dateLabel = isOverdue
      ? `<span class="todo-date overdue">⚠️ Tenggat: ${formatDate(todo.date)}</span>`
      : `<span class="todo-date">📅 ${formatDate(todo.date)}</span>`;

    const checkIcon = todo.done
      ? `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
           <circle cx="12" cy="12" r="10"/>
           <polyline points="9 12 11 14 15 10"/>
         </svg>`
      : `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
           <circle cx="12" cy="12" r="10"/>
         </svg>`;

    return `
      <li class="todo-item ${todo.done ? 'done' : ''}">
        <button class="btn-icon complete" onclick="toggleDone(${todo.id})"
          title="${todo.done ? 'Tandai belum selesai' : 'Tandai selesai'}">
          ${checkIcon}
        </button>
        <div class="todo-content">
          <div class="todo-text">${todo.text}</div>
          ${dateLabel}
        </div>
        <div class="todo-actions">
          <button class="btn-icon delete" onclick="deleteTodo(${todo.id})" title="Hapus">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      </li>`;
  }).join('');
}

// ===== UTILS =====
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== INIT =====
displayTodos();
