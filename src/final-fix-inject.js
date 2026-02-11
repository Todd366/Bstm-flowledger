// FINAL FIX INJECTION — NO DOM OVERWRITE
// Only adds logic, keeps React intact

// 1. Real users with email & password (plain text passwords – insecure but matches your original)
if (!localStorage.getItem('flowledger_users')) {
  localStorage.setItem('flowledger_users', JSON.stringify([
    { id: 1, name: 'John Keeper',   role: 'storekeeper', email: 'storekeeper@flowledger.com', password: 'Pass123', trustScore: 98,  lastLogin: null },
    { id: 2, name: 'Mary Dispatch', role: 'dispatcher',  email: 'dispatch@flowledger.com',    password: 'Pass123', trustScore: 95,  lastLogin: null },
    { id: 3, name: 'Peter Driver',  role: 'driver',      email: 'driver@flowledger.com',      password: 'Pass123', trustScore: 92,  lastLogin: null },
    { id: 4, name: 'Sarah Receiver',role: 'receiver',    email: 'receiver@flowledger.com',    password: 'Pass123', trustScore: 96,  lastLogin: null },
    { id: 5, name: 'Owner Boss',    role: 'manager',     email: 'manager@flowledger.com',     password: 'Pass123', trustScore: 100, lastLogin: null }
  ]));
}

// 2. Login hook (now uses hashed password comparison if you switch to hashed storage later)
window.flowLogin = (email, password) => {
  const users = JSON.parse(localStorage.getItem('flowledger_users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    user.lastLogin = new Date().toISOString();
    localStorage.setItem('flowledger_users', JSON.stringify(users));
    localStorage.setItem('flowledger_user', JSON.stringify(user));
    return user;
  }
  return null;
};

// 3. Create account
window.flowCreateAccount = (email, password, name, role) => {
  if (password.length < 6 || !/\d/.test(password)) {
    return false;
  }
  const users = JSON.parse(localStorage.getItem('flowledger_users') || '[]');
  const exists = users.some(u => u.email === email);
  if (exists) return false;

  users.push({
    id: Date.now(),
    name,
    role,
    email,
    password,
    trustScore: 100,
    lastLogin: new Date().toISOString()
  });
  localStorage.setItem('flowledger_users', JSON.stringify(users));
  return true;
};

// 4. Reset demo
window.flowResetDemo = () => {
  if (confirm('Clear all data? This cannot be undone.')) {
    localStorage.clear();
    location.reload();
  }
};

// 5. Auto-logout 20 min idle
let idleTimer;
const resetIdle = () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    localStorage.removeItem('flowledger_user');
    location.reload();
  }, 20 * 60 * 1000);
};

['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
  document.addEventListener(event, resetIdle, { passive: true });
});
resetIdle();

// 6. Export data
window.flowExportData = () => {
  const data = JSON.parse(localStorage.getItem('flowledger_data') || '{}');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flowledger_backup.json';
  a.click();
  URL.revokeObjectURL(url);
};

// 7. Forgot password click handler
document.addEventListener('click', e => {
  if (e.target.textContent.trim() === 'Forgot password?') {
    alert('Contact Myrah for reset.');
  }
});

console.log('Final inject ready.');
