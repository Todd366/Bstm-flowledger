// src/final-auth-inject.js
// FINAL INJECTION – AUTH + ALL LAST FEATURES
// Run once, patches login + adds extras, then disappears

console.log('FlowLedger Final Auth Inject – loaded');

// 1. Replace PIN login with real email/password + create account
const originalLogin = document.querySelector('input[type="password"]')?.parentElement;
if (originalLogin) {
  const loginContainer = originalLogin.parentElement;
  loginContainer.innerHTML = `
    <input type="email" id="emailInput" placeholder="Email" class="w-full p-4 border-2 border-gray-300 rounded-xl text-center text-lg mb-2 focus:border-blue-500 focus:outline-none" />
    <input type="password" id="passwordInput" placeholder="Password" class="w-full p-4 border-2 border-gray-300 rounded-xl text-center text-lg mb-4 focus:border-blue-500 focus:outline-none" />
    <button id="loginBtn" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all">Sign In</button>
    <button id="createAccountBtn" class="w-full text-blue-600 mt-3 text-sm underline">Create New Account</button>
    <button id="resetDemoBtn" class="w-full text-red-600 mt-2 text-xs underline">Reset Demo Data (Clear All)</button>
    <p id="lastLoginInfo" class="text-xs text-gray-500 mt-4 text-center"></p>
  `;

  // Load saved users or use default
  let users = JSON.parse(localStorage.getItem('flowledger_users')) || [
    { id: 1, name: 'John Keeper', role: 'storekeeper', email: 'storekeeper@flowledger.com', password: 'Pass123', trustScore: 98, lastLogin: null },
    { id: 2, name: 'Mary Dispatch', role: 'dispatcher', email: 'dispatch@flowledger.com', password: 'Pass123', trustScore: 95, lastLogin: null },
    { id: 3, name: 'Peter Driver', role: 'driver', email: 'driver@flowledger.com', password: 'Pass123', trustScore: 92, lastLogin: null },
    { id: 4, name: 'Sarah Receiver', role: 'receiver', email: 'receiver@flowledger.com', password: 'Pass123', trustScore: 96, lastLogin: null },
    { id: 5, name: 'Owner Boss', role: 'manager', email: 'manager@flowledger.com', password: 'Pass123', trustScore: 100, lastLogin: null }
  ];

  // Save users to localStorage if first time
  if (!localStorage.getItem('flowledger_users')) {
    localStorage.setItem('flowledger_users', JSON.stringify(users));
  }

  // Login handler
  document.getElementById('loginBtn').addEventListener('click', () => {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    if (!email || !password) {
      alert('Email and password required');
      return;
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      // Update last login (real timestamp)
      user.lastLogin = new Date().toISOString();
      localStorage.setItem('flowledger_users', JSON.stringify(users));

      // Show last login
      document.getElementById('lastLoginInfo').textContent = user.lastLogin 
        ? `Last login: ${new Date(user.lastLogin).toLocaleString()}` 
        : 'First login';

      // Save current user
      localStorage.setItem('flowledger_current_user', JSON.stringify(user));

      // Trigger real login (simulate your original login function)
      alert(`Welcome ${user.name}! Logged in as ${user.role}`);
      location.reload(); // Reload to apply logged-in state
    } else {
      alert('Wrong email or password');
    }
  });

  // Create account
  document.getElementById('createAccountBtn').addEventListener('click', () => {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    if (!email || !password) {
      alert('Enter email and password first');
      return;
    }

    if (password.length < 6 || !/\d/.test(password)) {
      alert('Password must be at least 6 characters and contain a number');
      return;
    }

    const name = prompt('Your name:');
    const role = prompt('Your role (storekeeper, dispatcher, driver, receiver, manager):');

    if (!name || !role) return;

    const newUser = {
      id: Date.now(),
      name,
      role,
      email,
      password,
      trustScore: 100,
      lastLogin: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('flowledger_users', JSON.stringify(users));
    alert(`Account created! Login with ${email} / ${password}`);
  });

  // Reset demo data
  document.getElementById('resetDemoBtn').addEventListener('click', () => {
    if (confirm('Clear ALL demo data? This cannot be undone.')) {
      localStorage.clear();
      location.reload();
    }
  });

  // Auto-logout after 20 min idle
  let idleTimer;
  const resetIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      localStorage.removeItem('flowledger_current_user');
      location.reload();
    }, 20 * 60 * 1000); // 20 minutes
  };

  ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => 
    document.addEventListener(evt, resetIdle, { passive: true })
  );
  resetIdle();

  // Show last login if already logged in (on reload)
  const currentUser = JSON.parse(localStorage.getItem('flowledger_current_user'));
  if (currentUser) {
    document.getElementById('lastLoginInfo').textContent = 
      `Last login: ${new Date(currentUser.lastLogin).toLocaleString()}`;
  }
}

// 7. Export all data button in manager view (add dynamically)
const addExportButton = () => {
  const managerView = document.querySelector('.manager-view'); // add class="manager-view" to ManagerView div if needed
  if (managerView && !document.getElementById('exportDataBtn')) {
    const btn = document.createElement('button');
    btn.id = 'exportDataBtn';
    btn.innerHTML = '<Download class="w-5 h-5 inline" /> Export All Data (JSON)';
    btn.className = 'mt-4 w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700';
    btn.onclick = () => {
      const data = JSON.parse(localStorage.getItem('flowledger_data') || '{}');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flowledger_data_backup.json';
      a.click();
      URL.revokeObjectURL(url);
    };
    managerView.appendChild(btn);
  }
};

// Run export button adder after login
setInterval(addExportButton, 2000); // Check every 2s until manager view appears

// 8. Forgot password – simple alert
const forgotLink = document.createElement('p');
forgotLink.innerHTML = '<a href="#" class="text-blue-600 text-xs underline">Forgot password?</a>';
forgotLink.style.marginTop = '8px';
forgotLink.querySelector('a').onclick = (e) => {
  e.preventDefault();
  alert('Contact admin (Myrah) to reset password.');
};
document.querySelector('#loginBtn')?.parentNode.appendChild(forgotLink);

// Done – script self-destructs after running
setTimeout(() => {
  const script = document.querySelector('script[src*="final-auth-inject"]');
  if (script) script.remove();
}, 5000);
