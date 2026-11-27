/* ==========================================================================
   College Placement Portal — Frontend Authentication (Login & Registration)
   ========================================================================== */

const AUTH_PATTERNS = {
  name: /^[A-Za-z]+(?: [A-Za-z]+)*$/,
  email: /^[A-Za-z0-9._%+-]+@gmail\.com$/i,
  phone: /^[6-9]\d{9}$/,
  roll: /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/,
};

function setupRoleTabs() {
  const tabs = document.querySelectorAll('.role-login .tab');
  const panels = document.querySelectorAll('.role-login .tab-panel');
  if (!tabs.length || !panels.length) return;

  function activateTab(targetId) {
    const id = targetId.replace('#', '');
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('href') === `#${id}`));
    panels.forEach(p => p.classList.toggle('active', p.id === id));
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      const href = tab.getAttribute('href');
      activateTab(href);
      history.replaceState(null, '', href);
    });
  });

  const hash = window.location.hash;
  activateTab(hash && document.getElementById(hash.slice(1)) ? hash : 'login-student');
}

function initializeLogin() {
  if (!document.querySelector('.role-login')) return;
  setupRoleTabs();

  const destinations = {
    student: 'student/dashboard.html',
    company: 'company/dashboard.html',
    admin: 'admin/dashboard.html',
  };

  try {
    const saved = JSON.parse(localStorage.getItem(AppData.KEYS.rememberMeta) || '{}');
    Object.entries(saved).forEach(([role, val]) => {
      const el = document.getElementById(`name-${role}`);
      if (el && val) el.value = val;
    });
  } catch { /* ignore */ }

  Object.entries(destinations).forEach(([role, destination]) => {
    const button = document.getElementById(`btn-login-${role}`);
    const idInput = document.getElementById(`name-${role}`);
    const passInput = document.getElementById(`password-${role}`);
    const rememberInput = document.getElementById(`remember-${role}`);
    if (!button || !idInput || !passInput) return;

    const performLogin = e => {
      e.preventDefault();
      const entered = idInput.value.trim();
      const password = passInput.value;

      if (!entered) {
        idInput.setCustomValidity('Please enter your Gmail or name.');
      } else if (role !== 'admin' && entered.includes('@') && !AUTH_PATTERNS.email.test(entered)) {
        idInput.setCustomValidity('Only @gmail.com email addresses are allowed.');
      } else {
        idInput.setCustomValidity('');
      }
      passInput.setCustomValidity(password ? '' : 'Please enter your password.');
      if (!idInput.reportValidity() || !passInput.reportValidity()) return;

      const account = AppData.getAccounts().find(
        a =>
          a.role === role &&
          ((a.email && a.email.toLowerCase() === entered.toLowerCase()) ||
            (a.name && a.name.toLowerCase() === entered.toLowerCase()))
      );

      if (!account || !AppData.verifyDemoPassword(password, account.passwordHash)) {
        showToast('Invalid email/name or password.', 'error');
        passInput.focus();
        return;
      }

      const remember = rememberInput ? rememberInput.checked : true;
      try {
        const meta = JSON.parse(localStorage.getItem(AppData.KEYS.rememberMeta) || '{}');
        if (remember) meta[role] = account.email || account.name;
        else delete meta[role];
        localStorage.setItem(AppData.KEYS.rememberMeta, JSON.stringify(meta));
      } catch { /* ignore */ }

      setButtonLoading(button, true, 'Signing in...');
      AppData.setCurrentUser({ role, id: account.id, name: account.name, email: account.email }, remember);
      showToast(`Welcome back, ${account.name}!`, 'success');
      setTimeout(() => { window.location.href = destination; }, 300);
    };

    button.addEventListener('click', performLogin);
    [idInput, passInput].forEach(el => {
      el.addEventListener('keydown', e => { if (e.key === 'Enter') performLogin(e); });
    });
  });
}

function initializeRegistration() {
  const form = document.getElementById('register-form');
  const roleSelect = document.getElementById('role');
  const studentFields = document.getElementById('student-registration-fields');
  const companyFields = document.getElementById('company-registration-fields');
  if (!form || !roleSelect || !studentFields || !companyFields) return;

  function updateRoleFields() {
    const isStudent = roleSelect.value === 'student';
    studentFields.hidden = !isStudent;
    companyFields.hidden = isStudent;
    studentFields.querySelectorAll('input, select').forEach(f => { f.disabled = !isStudent; });
    companyFields.querySelectorAll('input, select').forEach(f => { f.disabled = isStudent; });
  }

  roleSelect.addEventListener('change', updateRoleFields);
  updateRoleFields();

  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const rollInput = document.getElementById('roll');
  const cgpaInput = document.getElementById('cgpa');
  const locationInput = document.getElementById('location');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm');

  const check = () => {
    nameInput.setCustomValidity(AUTH_PATTERNS.name.test(nameInput.value.trim()) && nameInput.value.trim().length >= 2 ? '' : 'Use English letters and spaces only.');
    emailInput.setCustomValidity(AUTH_PATTERNS.email.test(emailInput.value.trim()) ? '' : 'Only @gmail.com email addresses are allowed.');
    phoneInput.setCustomValidity(AUTH_PATTERNS.phone.test(phoneInput.value.trim()) ? '' : 'Enter a valid 10-digit mobile number.');

    if (roleSelect.value === 'student') {
      rollInput?.setCustomValidity(AUTH_PATTERNS.roll.test(rollInput.value.trim()) ? '' : 'Use letters, numbers, and hyphens only.');
      const num = Number(cgpaInput.value);
      cgpaInput?.setCustomValidity(!Number.isNaN(num) && num >= 0 && num <= 10 ? '' : 'Enter CGPA between 0 and 10.');
      locationInput?.setCustomValidity('');
    } else {
      rollInput?.setCustomValidity('');
      cgpaInput?.setCustomValidity('');
      locationInput?.setCustomValidity(locationInput.value.trim().length >= 2 ? '' : 'Enter a valid location.');
    }

    passwordInput.setCustomValidity(AUTH_PATTERNS.password.test(passwordInput.value) ? '' : 'Min 8 chars with upper, lower, number, and special character.');
    confirmInput.setCustomValidity(confirmInput.value === passwordInput.value ? '' : 'Passwords do not match.');
  };

  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
    check();
  });
  [nameInput, emailInput, rollInput, cgpaInput, locationInput, passwordInput, confirmInput].forEach(el => {
    el?.addEventListener('input', check);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    check();
    if (!form.reportValidity()) return;

    const role = roleSelect.value;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const phone = phoneInput.value.trim();

    if (AppData.getAccounts().some(a => (a.email || '').toLowerCase() === email)) {
      showToast('An account with this email already exists.', 'error');
      return;
    }

    let profile;
    if (role === 'student') {
      const roll = rollInput.value.trim();
      if (AppData.getStudents().some(s => (s.roll || '').toLowerCase() === roll.toLowerCase())) {
        showToast('That roll number is already registered.', 'error');
        return;
      }
      profile = AppData.addStudent({
        name, email, phone, dob: '', roll,
        branch: document.getElementById('branch').value,
        cgpa: Number(cgpaInput.value), backlogs: 0, skills: '', resume: '', status: 'pending',
      });
    } else {
      if (AppData.getCompanies().some(c => (c.name || '').toLowerCase() === name.toLowerCase())) {
        showToast('A company with this name is already registered.', 'error');
        return;
      }
      profile = AppData.addCompany({
        name, email, phone,
        sector: document.getElementById('sector').value,
        location: locationInput.value.trim(), website: '', description: '', status: 'pending',
      });
    }

    AppData.addAccount({
      role, id: profile.id, name: profile.name, email: profile.email,
      passwordHash: AppData.hashDemoPassword(passwordInput.value),
    });

    setButtonLoading(form.querySelector('button[type="submit"]'), true, 'Creating account...');
    showToast('Account created! Redirecting to login...', 'success');
    setTimeout(() => { window.location.href = `login.html#login-${role}`; }, 800);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if ((document.querySelector('.role-login') || document.getElementById('register-form')) && redirectIfAuthenticated()) {
    return;
  }
  initializeLogin();
  initializeRegistration();
});
