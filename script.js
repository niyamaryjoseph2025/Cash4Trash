// ═══════════════════════════════════════════════
//  Cash4Trash — Full Application Script
//  LocalStorage "Database" + All UI Logic
// ═══════════════════════════════════════════════

// ── DB LAYER ────────────────────────────────────
const DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } 
    catch { return null; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
    return val;
  },
  remove(key) { localStorage.removeItem(key); },

  // Users
  getUsers()       { return this.get('c4t_users') || []; },
  saveUsers(u)     { return this.set('c4t_users', u); },
  getUserById(id)  { return this.getUsers().find(u => u.id === id) || null; },
  getUserByName(n) { return this.getUsers().find(u => u.username.toLowerCase() === n.toLowerCase()) || null; },

  // Current session
  getCurrentUser()   { return this.get('c4t_current_user'); },
  setCurrentUser(u)  { return this.set('c4t_current_user', u); },
  clearCurrentUser() { this.remove('c4t_current_user'); },

  getCurrentVolunteer()   { return this.get('c4t_current_volunteer'); },
  setCurrentVolunteer(v)  { return this.set('c4t_current_volunteer', v); },
  clearCurrentVolunteer() { this.remove('c4t_current_volunteer'); },

  // Pickups
  getPickups() { return this.get('c4t_pickups') || []; },
  savePickups(p) { return this.set('c4t_pickups', p); },
  getPickupsByUser(userId) { return this.getPickups().filter(p => p.userId === userId); },
  getPendingPickups() { return this.getPickups().filter(p => p.status === 'pending'); },

  addPickup(pickup) {
    const pickups = this.getPickups();
    pickup.id = 'pk_' + Date.now();
    pickup.createdAt = new Date().toISOString();
    pickups.push(pickup);
    this.savePickups(pickups);
    return pickup;
  },

  updatePickup(id, changes) {
    const pickups = this.getPickups();
    const idx = pickups.findIndex(p => p.id === id);
    if (idx !== -1) {
      pickups[idx] = { ...pickups[idx], ...changes };
      this.savePickups(pickups);
      return pickups[idx];
    }
    return null;
  },

  // Update user credits
  updateUserCredits(userId, delta) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].credits = (users[idx].credits || 0) + delta;
      users[idx].totalPickups = (users[idx].totalPickups || 0) + (delta > 0 ? 1 : 0);
      this.saveUsers(users);
      // Sync current session if same user
      const cur = this.getCurrentUser();
      if (cur && cur.id === userId) {
        cur.credits = users[idx].credits;
        this.setCurrentUser(cur);
      }
      return users[idx];
    }
    return null;
  },

  // Volunteers
  getVolunteers() { return this.get('c4t_volunteers') || []; },
  saveVolunteers(v) { return this.set('c4t_volunteers', v); },
  getVolunteerByName(n) { return this.getVolunteers().find(v => v.name.toLowerCase() === n.toLowerCase()) || null; },

  updateVolunteerCredits(name, delta) {
    const vols = this.getVolunteers();
    let vol = vols.find(v => v.name.toLowerCase() === name.toLowerCase());
    if (!vol) return null;
    vol.credits = (vol.credits || 0) + delta;
    vol.completedPickups = (vol.completedPickups || 0) + 1;
    this.saveVolunteers(vols);
    const cur = this.getCurrentVolunteer();
    if (cur && cur.name.toLowerCase() === name.toLowerCase()) {
      cur.credits = vol.credits;
      cur.completedPickups = vol.completedPickups;
      this.setCurrentVolunteer(cur);
    }
    return vol;
  },

  // Messages
  getMessages() { return this.get('c4t_messages') || []; },
  addMessage(msg) {
    const msgs = this.getMessages();
    msg.id = 'msg_' + Date.now();
    msg.createdAt = new Date().toISOString();
    msg.status = 'unread';
    msgs.push(msg);
    this.set('c4t_messages', msgs);
    return msg;
  },

  // Seed default data if fresh
  seed() {
    if (!this.get('c4t_seeded')) {
      const users = [
        { id: 'u_rahul', username: 'Rahul', credits: 520, totalPickups: 18, joinedAt: '2025-01-15', role: 'user' },
        { id: 'u_anita', username: 'Anita', credits: 410, totalPickups: 14, joinedAt: '2025-02-01', role: 'user' },
        { id: 'u_joseph', username: 'Joseph', credits: 300, totalPickups: 10, joinedAt: '2025-03-10', role: 'user' },
        { id: 'u_meera', username: 'Meera', credits: 180, totalPickups: 6, joinedAt: '2026-01-01', role: 'user' },
        { id: 'u_arjun', username: 'Arjun', credits: 150, totalPickups: 5, joinedAt: '2026-01-15', role: 'user' },
        { id: 'u_nisha', username: 'Nisha', credits: 120, totalPickups: 4, joinedAt: '2026-02-01', role: 'user' },
      ];
      const volunteers = [
        { id: 'v_ravi', name: 'Ravi', credits: 240, completedPickups: 12, joinedAt: '2025-01-01' },
        { id: 'v_priya', name: 'Priya', credits: 180, completedPickups: 9, joinedAt: '2025-03-01' },
      ];
      const pickups = [
        { id: 'pk_seed1', userId: 'u_rahul', type: 'plastic', weight: 8, date: '2026-01-10', instructions: 'Leave at gate', credits: 80, status: 'completed', createdAt: '2026-01-09T08:00:00Z' },
        { id: 'pk_seed2', userId: 'u_anita', type: 'bio', weight: 10, date: '2026-01-20', instructions: '', credits: 50, status: 'completed', createdAt: '2026-01-19T09:00:00Z' },
        { id: 'pk_seed3', userId: 'u_rahul', type: 'plastic', weight: 5, date: '2026-02-05', instructions: 'Call before', credits: 50, status: 'pending', createdAt: '2026-02-04T10:00:00Z' },
      ];
      this.saveUsers(users);
      this.saveVolunteers(volunteers);
      this.savePickups(pickups);
      this.set('c4t_seeded', true);
    }
  }
};

// ── TOAST SYSTEM ────────────────────────────────
function toast(msg, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span style="color:var(--${type === 'success' ? 'lime' : type === 'error' ? 'danger' : 'teal'})">${icons[type]}</span> ${msg}`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, duration);
}

// ── VALIDATION HELPERS ──────────────────────────
function validate(rules) {
  let valid = true;
  rules.forEach(({ field, checks }) => {
    const el = document.getElementById(field);
    const errEl = document.getElementById(field + '-error');
    if (!el) return;
    let errorMsg = '';
    for (const [test, msg] of checks) {
      if (!test(el.value)) { errorMsg = msg; break; }
    }
    if (errorMsg) {
      el.classList.add('input-error');
      if (errEl) errEl.textContent = errorMsg;
      valid = false;
    } else {
      el.classList.remove('input-error');
      if (errEl) errEl.textContent = '';
    }
  });
  return valid;
}

function clearErrors(...fieldIds) {
  fieldIds.forEach(id => {
    const el = document.getElementById(id);
    const errEl = document.getElementById(id + '-error');
    if (el) el.classList.remove('input-error');
    if (errEl) errEl.textContent = '';
  });
}

// ── TAB SYSTEM ──────────────────────────────────
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  const tab = document.getElementById(tabId);
  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  if (tab) tab.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── AUTH GUARDS ──────────────────────────────────
function requireUser() {
  const user = DB.getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return null; }
  return user;
}

function requireVolunteer() {
  const vol = DB.getCurrentVolunteer();
  if (!vol) { window.location.href = 'login.html'; return null; }
  return vol;
}

// ── LOGIN FUNCTIONS ──────────────────────────────
function loginUser() {
  const valid = validate([
    { field: 'userName', checks: [
      [v => v.trim().length > 0, 'Username is required'],
      [v => v.trim().length >= 2, 'Must be at least 2 characters'],
      [v => /^[a-zA-Z0-9_\- ]+$/.test(v.trim()), 'Only letters, numbers, spaces allowed']
    ]}
  ]);
  if (!valid) return;

  const name = document.getElementById('userName').value.trim();
  let user = DB.getUserByName(name);

  if (!user) {
    // Auto-register new user
    const users = DB.getUsers();
    user = {
      id: 'u_' + Date.now(),
      username: name,
      credits: 50,
      totalPickups: 0,
      joinedAt: new Date().toISOString().split('T')[0],
      role: 'user'
    };
    users.push(user);
    DB.saveUsers(users);
    toast(`Welcome, ${name}! 50 starter credits added 🎉`, 'success');
  } else {
    toast(`Welcome back, ${name}!`, 'success');
  }

  DB.setCurrentUser(user);
  setTimeout(() => window.location.href = 'dashboard.html', 800);
}

function loginVolunteer() {
  const valid = validate([
    { field: 'volunteerName', checks: [
      [v => v.trim().length > 0, 'Name is required'],
      [v => v.trim().length >= 2, 'Must be at least 2 characters']
    ]}
  ]);
  if (!valid) return;

  const name = document.getElementById('volunteerName').value.trim();
  let vol = DB.getVolunteerByName(name);

  if (!vol) {
    const vols = DB.getVolunteers();
    vol = {
      id: 'v_' + Date.now(),
      name,
      credits: 0,
      completedPickups: 0,
      joinedAt: new Date().toISOString().split('T')[0]
    };
    vols.push(vol);
    DB.saveVolunteers(vols);
    toast(`Welcome, volunteer ${name}!`, 'success');
  } else {
    toast(`Welcome back, ${name}!`, 'success');
  }

  DB.setCurrentVolunteer(vol);
  setTimeout(() => window.location.href = 'volunteer.html', 800);
}

function loginAdmin() {
  const pw = document.getElementById('adminPassword').value;
  if (pw !== 'admin123') {
    document.getElementById('adminPassword').classList.add('input-error');
    document.getElementById('adminPassword-error').textContent = 'Incorrect password';
    return;
  }
  toast('Admin access granted', 'success');
  setTimeout(() => window.location.href = 'dashboard.html', 800);
}

function logout() {
  DB.clearCurrentUser();
  DB.clearCurrentVolunteer();
  window.location.href = 'index.html';
}

// ── CREDIT CALCULATOR ────────────────────────────
function calculateCredits() {
  const type = document.getElementById('wasteType')?.value;
  const weight = parseFloat(document.getElementById('weight')?.value) || 0;
  if (!type) return 0;
  const rate = type === 'plastic' ? 10 : 5;
  const credits = Math.max(0, weight * rate);
  const el = document.getElementById('estimate');
  if (el) el.textContent = credits.toFixed(0);
  return credits;
}

// ── PICKUP SUBMISSION ────────────────────────────
function submitPickup() {
  const user = requireUser();
  if (!user) return;

  const valid = validate([
    { field: 'weight', checks: [
      [v => v.trim().length > 0, 'Weight is required'],
      [v => !isNaN(parseFloat(v)), 'Must be a number'],
      [v => parseFloat(v) > 0, 'Weight must be greater than 0'],
      [v => parseFloat(v) <= 1000, 'Weight cannot exceed 1000 kg']
    ]},
    { field: 'pickupDate', checks: [
      [v => v.trim().length > 0, 'Pickup date is required'],
      [v => new Date(v) >= new Date(new Date().toDateString()), 'Date must be today or future']
    ]}
  ]);
  if (!valid) return;

  const type = document.getElementById('wasteType').value;
  const weight = parseFloat(document.getElementById('weight').value);
  const date = document.getElementById('pickupDate').value;
  const instructions = document.getElementById('instructions')?.value || '';
  const rate = type === 'plastic' ? 10 : 5;
  const credits = Math.round(weight * rate);

  const pickup = DB.addPickup({
    userId: user.id,
    username: user.username,
    type, weight, date, instructions, credits,
    status: 'pending'
  });

  // Reset form
  document.getElementById('weight').value = '';
  document.getElementById('pickupDate').value = '';
  if (document.getElementById('instructions')) document.getElementById('instructions').value = '';
  document.getElementById('estimate').textContent = '0';

  toast(`Pickup submitted! ${credits} credits pending verification ♻️`, 'success');

  // Re-render history if on dashboard
  if (typeof renderPickupHistory === 'function') renderPickupHistory();
}

// ── DASHBOARD RENDER ─────────────────────────────
function renderDashboard() {
  const user = requireUser();
  if (!user) return;

  // Refresh from DB
  const fresh = DB.getUserById(user.id) || user;

  // Update header
  const nameEl = document.getElementById('dashUserName');
  const avatarEl = document.getElementById('dashAvatar');
  if (nameEl) nameEl.textContent = fresh.username;
  if (avatarEl) avatarEl.textContent = fresh.username[0].toUpperCase();

  // Stats
  const creditsEl = document.getElementById('statCredits');
  const pickupsEl = document.getElementById('statPickups');
  const pendingEl = document.getElementById('statPending');

  const userPickups = DB.getPickupsByUser(fresh.id);
  const pending = userPickups.filter(p => p.status === 'pending').length;

  if (creditsEl) creditsEl.textContent = fresh.credits || 0;
  if (pickupsEl) pickupsEl.textContent = userPickups.length;
  if (pendingEl) pendingEl.textContent = pending;

  renderPickupHistory(fresh.id);
}

function renderPickupHistory(userId) {
  const user = DB.getCurrentUser();
  const uid = userId || user?.id;
  if (!uid) return;

  const tbody = document.getElementById('historyBody');
  if (!tbody) return;

  const pickups = DB.getPickupsByUser(uid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (pickups.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <div class="icon">📦</div>
        <p>No pickups yet. Submit your first one!</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = pickups.map(p => `
    <tr>
      <td>${formatDate(p.date)}</td>
      <td><span class="badge badge-${p.type}">${p.type === 'plastic' ? '♻️ Plastic' : '🌿 Bio Waste'}</span></td>
      <td>${p.weight} kg</td>
      <td><span class="credits-pill">⚡ ${p.credits}</span></td>
      <td><span class="badge badge-${p.status === 'pending' ? 'pending' : 'done'}">${p.status === 'pending' ? '⏳ Pending' : '✓ Verified'}</span></td>
      <td style="color:var(--text-faint);font-size:0.8rem">${p.instructions ? p.instructions.substring(0,30) + '…' : '—'}</td>
    </tr>
  `).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── LEADERBOARD RENDER ────────────────────────────
function renderLeaderboard() {
  const users = DB.getUsers().sort((a, b) => (b.credits || 0) - (a.credits || 0));
  const now = new Date();
  const pickups = DB.getPickups();

  // Monthly: pickups from this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCredits = {};
  pickups.filter(p => p.status === 'completed' && new Date(p.createdAt) >= monthStart)
    .forEach(p => { monthCredits[p.username] = (monthCredits[p.username] || 0) + p.credits; });

  // Yearly
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearCredits = {};
  pickups.filter(p => p.status === 'completed' && new Date(p.createdAt) >= yearStart)
    .forEach(p => { yearCredits[p.username] = (yearCredits[p.username] || 0) + p.credits; });

  const monthTop = Object.entries(monthCredits).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const yearTop = Object.entries(yearCredits).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const ranks = ['gold','silver','bronze','',''];
  const rankEmojis = ['🏆','🥈','🥉','4','5'];

  function renderList(containerId, data, isUserObj = false) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (data.length === 0) {
      el.innerHTML = '<div class="empty-state" style="padding:24px"><p>No data yet</p></div>';
      return;
    }
    el.innerHTML = data.map(([name, credits], i) => `
      <div class="lb-item">
        <div class="lb-rank ${ranks[i]}">${rankEmojis[i]}</div>
        <div class="lb-avatar">${name[0].toUpperCase()}</div>
        <div class="lb-name">${name}</div>
        <div class="lb-credits">⚡ ${credits}</div>
      </div>
    `).join('');
  }

  const overallTop = users.slice(0, 5).map(u => [u.username, u.credits || 0]);
  renderList('lb-overall', overallTop);
  renderList('lb-monthly', monthTop.length ? monthTop : overallTop.map(([n,c]) => [n, Math.round(c*0.3)]));
  renderList('lb-yearly', yearTop.length ? yearTop : overallTop.map(([n,c]) => [n, Math.round(c*2.2)]));
}

// ── VOLUNTEER PANEL ───────────────────────────────
function renderVolunteerPanel() {
  const vol = requireVolunteer();
  if (!vol) return;

  const fresh = DB.getVolunteerByName(vol.name) || vol;

  // Update header
  const nameEl = document.getElementById('volName');
  const avatarEl = document.getElementById('volAvatar');
  const creditsEl = document.getElementById('volCredits');
  const completedEl = document.getElementById('volCompleted');

  if (nameEl) nameEl.textContent = fresh.name;
  if (avatarEl) avatarEl.textContent = fresh.name[0].toUpperCase();
  if (creditsEl) creditsEl.textContent = fresh.credits || 0;
  if (completedEl) completedEl.textContent = fresh.completedPickups || 0;

  renderPendingPickups();
}

function renderPendingPickups() {
  const container = document.getElementById('pickupRequests');
  if (!container) return;

  const pending = DB.getPendingPickups().sort((a,b) => new Date(a.date) - new Date(b.date));

  if (pending.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🎉</div><p>No pending pickups!</p></div>`;
    return;
  }

  container.innerHTML = pending.map(p => `
    <div class="pickup-item" id="pi-${p.id}">
      <div class="pickup-info">
        <h4>${p.username} — <span class="badge badge-${p.type}">${p.type === 'plastic' ? '♻️ Plastic' : '🌿 Bio'}</span></h4>
        <p>${p.weight} kg · ${formatDate(p.date)}${p.instructions ? ' · "' + p.instructions.substring(0,40) + '"' : ''}</p>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0">
        <button class="btn-primary" style="padding:8px 16px;font-size:0.85rem" onclick="completePickup('${p.id}')">✓ Complete</button>
        <button class="btn-danger" style="padding:8px 16px;font-size:0.85rem" onclick="rejectPickup('${p.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

function completePickup(pickupId) {
  const vol = DB.getCurrentVolunteer();
  if (!vol) return;

  const pickup = DB.updatePickup(pickupId, { status: 'completed', completedBy: vol.name, completedAt: new Date().toISOString() });
  if (!pickup) return;

  // Award credits to user
  DB.updateUserCredits(pickup.userId, pickup.credits);
  // Award volunteer credits (20% of pickup value)
  const volCredits = Math.round(pickup.credits * 0.2);
  DB.updateVolunteerCredits(vol.name, volCredits);

  toast(`Pickup completed! User earned ${pickup.credits} cr, you earned ${volCredits} cr 🎉`, 'success');
  renderVolunteerPanel();
}

function rejectPickup(pickupId) {
  DB.updatePickup(pickupId, { status: 'rejected', rejectedAt: new Date().toISOString() });
  toast('Pickup rejected.', 'info');
  renderPendingPickups();
}

// ── CONTACT FORM ──────────────────────────────────
function submitContact() {
  const valid = validate([
    { field: 'contactName', checks: [
      [v => v.trim().length > 0, 'Name is required'],
      [v => v.trim().length >= 2, 'Name too short']
    ]},
    { field: 'contactEmail', checks: [
      [v => v.trim().length > 0, 'Email is required'],
      [v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Invalid email address']
    ]},
    { field: 'contactMessage', checks: [
      [v => v.trim().length > 0, 'Message is required'],
      [v => v.trim().length >= 10, 'Message too short (min 10 chars)']
    ]}
  ]);
  if (!valid) return;

  DB.addMessage({
    name: document.getElementById('contactName').value.trim(),
    email: document.getElementById('contactEmail').value.trim(),
    message: document.getElementById('contactMessage').value.trim()
  });

  document.getElementById('contactName').value = '';
  document.getElementById('contactEmail').value = '';
  document.getElementById('contactMessage').value = '';

  toast("Message sent! We'll get back to you soon ✉️", 'success');

  const btn = document.getElementById('sendBtn');
  if (btn) { btn.textContent = '✓ Sent!'; btn.disabled = true; setTimeout(() => { btn.textContent = 'Send Message'; btn.disabled = false; }, 3000); }
}

// ── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  DB.seed();

  const page = document.body.dataset.page;

  if (page === 'dashboard') renderDashboard();
  if (page === 'leaderboard') renderLeaderboard();
  if (page === 'volunteer') renderVolunteerPanel();

  // Animate elements
  document.querySelectorAll('.animate').forEach((el, i) => {
    el.style.animationDelay = (i * 0.08) + 's';
  });

  // Live credit calculation on input
  const weightInput = document.getElementById('weight');
  const typeSelect = document.getElementById('wasteType');
  if (weightInput) weightInput.addEventListener('input', calculateCredits);
  if (typeSelect) typeSelect.addEventListener('change', calculateCredits);

  // Clear errors on input
  document.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('input-error');
      const errEl = document.getElementById(el.id + '-error');
      if (errEl) errEl.textContent = '';
    });
  });

  // Enter key triggers login
  const userNameInput = document.getElementById('userName');
  if (userNameInput) userNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginUser(); });
  const volNameInput = document.getElementById('volunteerName');
  if (volNameInput) volNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginVolunteer(); });
});
