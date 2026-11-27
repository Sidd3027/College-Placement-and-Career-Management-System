/* ==========================================================================
   College Placement Portal — Core Local Storage Data, Auth Guard & UI Helpers
   ========================================================================== */

const AppData = {
  KEYS: {
    init: 'cpp_initialized_clean_v1',
    jobs: 'cpp_jobs',
    students: 'cpp_students',
    companies: 'cpp_companies',
    accounts: 'cpp_accounts',
    applications: 'cpp_applications',
    interviews: 'cpp_interviews',
    inquiries: 'cpp_inquiries',
    session: 'cpp_user',
    rememberMeta: 'cpp_remember_meta',
  },

  /** Frontend-demo deterministic password hash (non-plaintext). */
  hashDemoPassword(raw) {
    let h1 = 0x811c9dc5;
    let h2 = 0xdeadbeef;
    const salted = `cpp_salt_2026::${String(raw || '')}`;
    for (let i = 0; i < salted.length; i++) {
      const ch = salted.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 0x01000193);
      h2 = Math.imul(h2 ^ ch, 2654435761);
    }
    return `cpp_v2_${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
  },

  verifyDemoPassword(raw, storedHash) {
    return Boolean(storedHash) && this.hashDemoPassword(raw) === storedHash;
  },

  _get(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) : (parsed ?? fallback);
    } catch {
      return fallback;
    }
  },

  _set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch {
      return false;
    }
  },

  init() {
    if (!localStorage.getItem(this.KEYS.init)) {
      // Start with completely empty data — only user-added records appear
      this.setJobs([]);
      this.setStudents([]);
      this.setCompanies([]);
      this.setApplications([]);
      this.setInterviews([]);
      this.setInquiries([]);
      this.setAccounts([
        {
          role: 'admin',
          id: 0,
          name: 'Administrator',
          email: 'admin@college.edu',
          passwordHash: this.hashDemoPassword('Admin@123'),
        },
      ]);
      localStorage.setItem(this.KEYS.init, 'true');
    } else {
      // Ensure admin account exists if storage was partially cleared
      const accounts = this.getAccounts();
      if (!accounts.some(a => a.role === 'admin')) {
        accounts.push({
          role: 'admin',
          id: 0,
          name: 'Administrator',
          email: 'admin@college.edu',
          passwordHash: this.hashDemoPassword('Admin@123'),
        });
        this.setAccounts(accounts);
      }
    }
  },

  nextId(list) {
    return list.length ? Math.max(...list.map(i => Number(i.id) || 0)) + 1 : 1;
  },

  _addItem(getFn, setFn, item) {
    const list = getFn();
    item.id = this.nextId(list);
    list.push(item);
    setFn(list);
    return item;
  },

  _updateItem(getFn, setFn, updated) {
    setFn(getFn().map(item => (item.id === updated.id ? updated : item)));
  },

  // Jobs
  getJobs() { return this._get(this.KEYS.jobs, []); },
  setJobs(v) { this._set(this.KEYS.jobs, v); },
  addJob(j) { return this._addItem(() => this.getJobs(), v => this.setJobs(v), j); },
  updateJob(j) { this._updateItem(() => this.getJobs(), v => this.setJobs(v), j); },
  deleteJob(id) { this.setJobs(this.getJobs().filter(j => j.id !== id)); },

  // Students
  getStudents() { return this._get(this.KEYS.students, []); },
  setStudents(v) { this._set(this.KEYS.students, v); },
  addStudent(s) { return this._addItem(() => this.getStudents(), v => this.setStudents(v), s); },
  updateStudent(s) { this._updateItem(() => this.getStudents(), v => this.setStudents(v), s); },

  // Companies
  getCompanies() { return this._get(this.KEYS.companies, []); },
  setCompanies(v) { this._set(this.KEYS.companies, v); },
  addCompany(c) { return this._addItem(() => this.getCompanies(), v => this.setCompanies(v), c); },
  updateCompany(c) { this._updateItem(() => this.getCompanies(), v => this.setCompanies(v), c); },

  // Accounts
  getAccounts() { return this._get(this.KEYS.accounts, []); },
  setAccounts(v) { this._set(this.KEYS.accounts, v); },
  addAccount(a) { const list = this.getAccounts(); list.push(a); this.setAccounts(list); return a; },
  updateAccount(u) {
    this.setAccounts(this.getAccounts().map(a => (a.role === u.role && a.id === u.id ? u : a)));
  },

  // Applications
  getApplications() { return this._get(this.KEYS.applications, []); },
  setApplications(v) { this._set(this.KEYS.applications, v); },
  addApplication(a) { return this._addItem(() => this.getApplications(), v => this.setApplications(v), a); },
  updateApplication(a) { this._updateItem(() => this.getApplications(), v => this.setApplications(v), a); },

  // Interviews
  getInterviews() { return this._get(this.KEYS.interviews, []); },
  setInterviews(v) { this._set(this.KEYS.interviews, v); },
  addInterview(i) { return this._addItem(() => this.getInterviews(), v => this.setInterviews(v), i); },
  updateInterview(i) { this._updateItem(() => this.getInterviews(), v => this.setInterviews(v), i); },

  // Inquiries
  getInquiries() { return this._get(this.KEYS.inquiries, []); },
  setInquiries(v) { this._set(this.KEYS.inquiries, v); },
  addInquiry(inq) {
    inq.createdAt = new Date().toISOString().slice(0, 10);
    return this._addItem(() => this.getInquiries(), v => this.setInquiries(v), inq);
  },

  // Session
  getCurrentUser() {
    try {
      const s = sessionStorage.getItem(this.KEYS.session);
      if (s) return JSON.parse(s);
      const l = localStorage.getItem(this.KEYS.session);
      return l ? JSON.parse(l) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user, remember) {
    const useLocal = remember !== undefined ? remember : Boolean(localStorage.getItem(this.KEYS.session));
    const payload = JSON.stringify(user);
    if (useLocal) {
      localStorage.setItem(this.KEYS.session, payload);
      sessionStorage.removeItem(this.KEYS.session);
    } else {
      sessionStorage.setItem(this.KEYS.session, payload);
      localStorage.removeItem(this.KEYS.session);
    }
  },

  clearCurrentUser() {
    localStorage.removeItem(this.KEYS.session);
    sessionStorage.removeItem(this.KEYS.session);
  },
};

AppData.init();

/* ── Toast & Modal Helpers ───────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  const old = document.getElementById('cpp-toast');
  if (old) old.remove();

  const colors = { success: '#059669', error: '#dc2626', info: '#0284c7', warning: '#d97706' };
  const toast = document.createElement('div');
  toast.id = 'cpp-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', right: '24px', maxWidth: '380px',
    background: colors[type] || colors.success, color: '#fff',
    padding: '12px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
    zIndex: '9999', boxShadow: '0 10px 25px rgba(0,0,0,0.4)', transition: 'opacity 0.3s',
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function closeModal() {
  document.getElementById('cpp-modal-backdrop')?.remove();
}

function showModal({ title, bodyHtml, confirmText = 'Close', confirmClass = 'btn', onConfirm = null, showCancel = false }) {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.id = 'cpp-modal-backdrop';
  backdrop.className = 'cpp-modal-backdrop';
  backdrop.innerHTML = `
    <div class="cpp-modal" role="dialog" aria-modal="true">
      <div class="cpp-modal-head">
        <h2>${title}</h2>
        <button type="button" class="cpp-modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="cpp-modal-body">${bodyHtml}</div>
      <div class="cpp-modal-foot">
        ${showCancel ? '<button type="button" class="btn secondary cpp-modal-cancel">Cancel</button>' : ''}
        <button type="button" class="${confirmClass} cpp-modal-confirm">${confirmText}</button>
      </div>
    </div>`;
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  backdrop.querySelector('.cpp-modal-close').addEventListener('click', closeModal);
  backdrop.querySelector('.cpp-modal-cancel')?.addEventListener('click', closeModal);
  backdrop.querySelector('.cpp-modal-confirm').addEventListener('click', () => (onConfirm ? onConfirm() : closeModal()));
  document.body.appendChild(backdrop);
}

function setButtonLoading(btn, isLoading, loadingText = 'Please wait...') {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${loadingText}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
  }
}

/* ── Auth Guards & Responsive Nav ────────────────────────────────────────── */
function getDashboardPathForRole(role, inSubfolder = false) {
  const prefix = inSubfolder ? '../' : '';
  const map = { student: `${prefix}student/dashboard.html`, company: `${prefix}company/dashboard.html`, admin: `${prefix}admin/dashboard.html` };
  return map[role] || `${prefix}index.html`;
}

function redirectIfAuthenticated() {
  const user = AppData.getCurrentUser();
  if (!user || !user.role) return false;
  window.location.replace(getDashboardPathForRole(user.role, false));
  return true;
}

function guardRole(requiredRole) {
  const user = AppData.getCurrentUser();
  if (!user || user.role !== requiredRole) {
    window.location.replace('../login.html');
    throw new Error('Unauthorized');
  }
  const roleLabel = document.querySelector('.sidebar .role');
  if (roleLabel) {
    let signedIn = document.querySelector('.sidebar .signed-in');
    if (!signedIn) {
      signedIn = document.createElement('div');
      signedIn.className = 'signed-in';
      roleLabel.insertAdjacentElement('afterend', signedIn);
    }
    signedIn.textContent = `Signed in as ${user.name}`;
  }
  return user;
}

document.addEventListener('DOMContentLoaded', () => {
  // Responsive nav & sidebar drawer
  const topbarInner = document.querySelector('.topbar .inner');
  const nav = document.querySelector('.topbar nav');
  const sidebar = document.querySelector('.sidebar');

  if (topbarInner && !topbarInner.querySelector('.menu-toggle')) {
    const brand = topbarInner.querySelector('.brand');
    if (brand && !brand.querySelector('.brand-mark')) {
      const mark = document.createElement('span');
      mark.className = 'brand-mark';
      mark.textContent = 'CP';
      brand.prepend(mark);
    }
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'menu-toggle';
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.innerHTML = '&#9776;';
    topbarInner.appendChild(toggle);

    if (sidebar) {
      const backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
      const closeDrawer = () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); };
      toggle.addEventListener('click', () => { sidebar.classList.toggle('open'); backdrop.classList.toggle('open'); });
      backdrop.addEventListener('click', closeDrawer);
      sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
    } else if (nav) {
      toggle.addEventListener('click', () => nav.classList.toggle('open'));
    }
  }

  // Logout links
  if (/\/(?:student|company|admin)\//.test(window.location.pathname)) {
    document.querySelectorAll('a.logout, .topbar nav a[href$="login.html"]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        AppData.clearCurrentUser();
        window.location.href = '../login.html';
      });
    });
  }

  // Password visibility toggles
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
    });
  });
});
