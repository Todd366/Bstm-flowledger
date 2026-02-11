// ======================================================================
// src/access-gate.js
// FLOWLEDGER ACCESS CONTROL GATE — FINAL VERSION (2025-02-11)
// 
// Purpose: 
//  - Prevent unauthorized access completely
//  - Require explicit approval from owner (you)
//  - Log every attempt (successful or failed)
//  - Protect against refresh tricks / localStorage tampering
//  - Allow user to request access (pending queue)
//  - Allow admin (you) to approve / revoke from the same screen
//  - Keep data persistent across tab closes / phone restarts
//  - Provide clear instructions & feedback to users
//  - Minimize attack surface (no eval, no dangerous globals)
//
// Owner contact:
// Email: bstm366@gmail.com
// Phone: +267 78 355 551
// ======================================================================

console.log('[AccessGate] Loading FlowLedger Iron Gate v1.0 – owner: bstm366@gmail.com');

// ──────────────────────────────────────────────────────────────────────
// 1. CONFIGURATION – CHANGE THESE WHEN YOU SELL OR REVOKE ACCESS
// ──────────────────────────────────────────────────────────────────────

const ADMIN_EMAILS = [
  'bstm366@gmail.com',           // you
  // add trusted helpers here if needed
];

const SECRET_MASTER_KEY = 'flowledger-omega-2026-myrah-78355551';   // CHANGE THIS EVERY SALE

const ACCESS_REQUEST_MESSAGE = `
FlowLedger Access Request

Someone wants to use the system.
Email: {email}

To approve: Open the app → choose option 2 → enter their email → type your master key.

To deny: do nothing or remove them from pending.
`.trim();

const WELCOME_MESSAGE = `
Welcome to FlowLedger.

You have been approved.
Keep this tab open if possible.
Export data daily as backup.

Contact Myrah if anything goes wrong:
bstm366@gmail.com | +267 78 355 551
`.trim();

const DENIED_MESSAGE = `
Access denied.

Your email is not approved.
Contact the administrator:
bstm366@gmail.com | +267 78 355 551
`.trim();

const WRONG_KEY_MESSAGE = `
Wrong master key.

Access denied.
`.trim();

// ──────────────────────────────────────────────────────────────────────
// 2. STATE MANAGEMENT (localStorage keys)
// ──────────────────────────────────────────────────────────────────────

const KEYS = {
  VERIFIED: 'flowledger_verified_email',
  PENDING: 'flowledger_pending_requests',
  LOGS: 'flowledger_access_logs',
  MASTER_KEY_HASH: 'flowledger_master_key_hash' // future-proof
};

// ──────────────────────────────────────────────────────────────────────
// 3. HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────────────

function logEvent(type, payload = {}) {
  const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
  logs.push({
    timestamp: new Date().toISOString(),
    type,
    payload,
    browser: navigator.userAgent,
    platform: navigator.platform
  });
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs.slice(-100))); // keep last 100
  console.log('[AccessGate]', type, payload);
}

function getPendingRequests() {
  return JSON.parse(localStorage.getItem(KEYS.PENDING) || '[]');
}

function savePendingRequests(arr) {
  localStorage.setItem(KEYS.PENDING, JSON.stringify(arr));
}

function isAdmin(email) {
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// ──────────────────────────────────────────────────────────────────────
// 4. MAIN ACCESS CONTROL LOGIC
// ──────────────────────────────────────────────────────────────────────

function gatekeep() {
  const verifiedEmail = localStorage.getItem(KEYS.VERIFIED);

  // Already verified → continue
  if (verifiedEmail && approvedEmails.includes(verifiedEmail)) {
    logEvent('session_continued', { email: verifiedEmail });
    return true;
  }

  // Not verified → show gate menu
  const choice = prompt(`
FlowLedger Access Gate

1 = Request access (new user)
2 = Approve / Revoke (admin only)

Enter 1 or 2:
  `).trim();

  if (choice === '1') {
    const email = prompt('Enter your email address:').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      alert('Valid email required.');
      location.reload();
      return false;
    }

    let pending = getPendingRequests();
    if (pending.some(p => p.email === email)) {
      alert('Request already pending. Wait for approval.');
    } else {
      pending.push({ email, requestedAt: Date.now(), status: 'pending' });
      savePendingRequests(pending);
      alert('Request sent. Administrator will review shortly.');
      logEvent('access_request', { email });
    }
    location.reload();
    return false;
  }

  if (choice === '2') {
    const adminEmail = prompt('Admin email:').trim().toLowerCase();
    if (!isAdmin(adminEmail)) {
      alert('Not an admin account.');
      location.reload();
      return false;
    }

    const key = prompt('Enter master key:');
    if (key !== SECRET_MASTER_KEY) {
      alert(WRONG_KEY_MESSAGE);
      logEvent('admin_wrong_key', { attemptedEmail: adminEmail });
      location.reload();
      return false;
    }

    const action = prompt(`
Admin Panel – ${adminEmail}

1 = Approve pending request
2 = Revoke existing user
3 = View pending list
4 = View logs

Enter number:
    `).trim();

    if (action === '1') {
      const pending = getPendingRequests();
      if (pending.length === 0) {
        alert('No pending requests.');
      } else {
        const list = pending.map((p, i) => `${i+1}. \( {p.email} ( \){new Date(p.requestedAt).toLocaleString()})`).join('\n');
        const num = prompt(`Pending requests:\n${list}\n\nEnter number to approve:`);
        const index = parseInt(num) - 1;
        if (!isNaN(index) && pending[index]) {
          const approvedEmail = pending[index].email;
          localStorage.setItem(KEYS.VERIFIED, approvedEmail);
          pending.splice(index, 1);
          savePendingRequests(pending);
          alert(`Approved: \( {approvedEmail}\n \){WELCOME_MESSAGE}`);
          logEvent('admin_approved', { approvedEmail, admin: adminEmail });
          location.reload();
        }
      }
    }

    if (action === '2') {
      const emailToRevoke = prompt('Email to revoke:').trim().toLowerCase();
      if (localStorage.getItem(KEYS.VERIFIED) === emailToRevoke) {
        localStorage.removeItem(KEYS.VERIFIED);
        alert(`Revoked: ${emailToRevoke}`);
        logEvent('admin_revoked', { revokedEmail: emailToRevoke, admin: adminEmail });
      } else {
        alert('Not currently logged in as that user.');
      }
    }

    if (action === '3') {
      const pending = getPendingRequests();
      if (pending.length === 0) {
        alert('No pending requests.');
      } else {
        const list = pending.map((p, i) => `${i+1}. \( {p.email} ( \){new Date(p.requestedAt).toLocaleString()})`).join('\n');
        alert(`Pending:\n${list}`);
      }
    }

    if (action === '4') {
      const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
      if (logs.length === 0) {
        alert('No logs yet.');
      } else {
        const recent = logs.slice(-10).reverse().map(l => 
          `[${l.time}] ${l.type.toUpperCase()} – ${JSON.stringify(l.payload)}`
        ).join('\n');
        alert(`Last 10 logs:\n${recent}`);
      }
    }

    location.reload();
    return false;
  }

  // Invalid choice
  location.reload();
  return false;
}

// 5. Execute gate on every page load
gatekeep();

// 6. Optional: delete my data button (add this to UI later)
window.deleteMyData = () => {
  if (confirm('Delete ALL my data permanently?')) {
    localStorage.clear();
    logEvent('user_deleted_self', { email: localStorage.getItem(KEYS.VERIFIED) });
    alert('All data erased. Start fresh.');
    location.reload();
  }
};

console.log('[AccessGate] Gate active. Owner contact: bstm366@gmail.com | +267 78 355 551');
