console.log('Final inject ready – users, login, security hooks');

// 1. Demo users – plain text passwords (INSECURE – for demo only!)
if (!localStorage.getItem('flowledger_users')) {
  localStorage.setItem('flowledger_users', JSON.stringify([
    { id: 1, name: 'John Keeper', role: 'storekeeper', email: 'storekeeper@flowledger.com', password: 'Pass123', trustScore: 98, lastLogin: null },
    { id: 2, name: 'Mary Dispatch', role: 'dispatcher', email: 'dispatch@flowledger.com', password: 'Pass123', trustScore: 95, lastLogin: null },
    { id: 3, name: 'Peter Driver', role: 'driver', email: 'driver@flowledger.com', password: 'Pass123', trustScore: 92, lastLogin: null },
    { id: 4, name: 'Sarah Receiver', role: 'receiver', email: 'receiver@flowledger.com', password: 'Pass123', trustScore: 96, lastLogin: null },
    { id: 5, name: 'Owner Boss', role: 'manager', email: 'manager@flowledger.com', password: 'Pass123', trustScore: 100, lastLogin: null }
  ]));
  console.log('[Users] Demo accounts initialized');
}

// 2. Login hook – add basic hash check option
window.flowLogin = async (email, password) => {
  const users = JSON.parse(localStorage.getItem('flowledger_users') || '[]');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;

  // Option A: plain text (current insecure)
  if (user.password === password) {
    user.lastLogin = new Date().toISOString();
    localStorage.setItem('flowledger_users', JSON.stringify(users));
    localStorage.setItem('flowledger_user', JSON.stringify(user));
    return user;
  }

  // Option B: hashed (uncomment when you migrate passwords to hashes)
  // const hashedInput = await window.hashPass(password);
  // if (user.password === hashedInput) { ... same as above }

  return null;
};

// 3. Create account – basic validation + uniqueness
window.flowCreateAccount = async (email, password, name, role) => {
  if (!email || !password || password.length < 8 || !/\d/.test(password) || !/[A-Z]/.test(password)) {
    return { success: false, error: 'Password must be 8+ chars with number & uppercase' };
  }

  const users = JSON.parse(localStorage.getItem('flowledger_users') || '[]');
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Email already exists' };
  }

  // Store plain for now – migrate to hashed later
  // const hashedPw = await window.hashPass(password);
  const hashedPw = password; // <--- change to hashedPw when ready

  users.push({
    id: Date.now(),
    name,
    role,
    email: email.toLowerCase(),
    password: hashedPw,
    trustScore: 100,
    lastLogin: new Date().toISOString()
  });

  localStorage.setItem('flowledger_users', JSON.stringify(users));
  return { success: true };
};

// 4. Reset demo – full wipe
window.flowResetDemo = () => {
  if (confirm('Clear ALL data? This deletes users, logins, everything. Cannot undo.')) {
    localStorage.clear();
    location.reload();
  }
};

// 5. Auto-logout: 20 min idle (single timer)
let idleTimer;
const resetIdleTimer = () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    localStorage.removeItem('flowledger_user');
    location.reload();
    console.log('[Security] Idle logout');
  }, 20 * 60 * 1000);
};

['mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(ev => {
  document.addEventListener(ev, resetIdleTimer, { passive: true });
});
resetIdleTimer();

// 6. Export data – improved filename
window.flowExportData = () => {
  const data = JSON.parse(localStorage.getItem('flowledger_data') || '{}');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flowledger_full_export_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 7. Forgot password handler
document.addEventListener('click', e => {
  if (e.target.textContent.trim() === 'Forgot password?') {
    alert('Contact Myrah for reset: bstm366@gmail.com | +267 78 355 551');
  }
});
