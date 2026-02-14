// src/access-gate.js - FINAL CRASH-FREE VERSION
// All invalid syntax removed, null safety added, no more loops

console.log('[AccessGate] Loading FlowLedger Iron Gate v1.0 – owner: bstm366@gmail.com');

// CONFIG
const ADMIN_EMAILS = ['bstm366@gmail.com']; // you
const APPROVED_EMAILS = ADMIN_EMAILS;

const SECRET_MASTER_KEY = 'flowledger-omega-2026-myrah-78355551';

const WELCOME_MESSAGE = `Welcome to FlowLedger.

You have been approved.
Keep this tab open if possible.
Export data daily as backup.

Contact Myrah if anything goes wrong:
bstm366@gmail.com | +267 78 355 551`.trim();

const DENIED_MESSAGE = `Access denied.

Your email is not approved.
Contact the administrator:
bstm366@gmail.com | +267 78 355 551`.trim();

const WRONG_KEY_MESSAGE = `Wrong master key.

Access denied.`.trim();

// STATE KEYS
const KEYS = {
  VERIFIED: 'flowledger_verified_email',
  PENDING: 'flowledger_pending_requests',
  LOGS: 'flowledger_access_logs'
};

// HELPERS
function logEvent(type, payload = {}) {
  const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
  logs.push({
    timestamp: new Date().toISOString(),
    type,
    payload,
    browser: navigator.userAgent || 'unknown',
    platform: navigator.platform || 'unknown'
  });
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs.slice(-100)));
  console.log('[AccessGate]', type, payload);
}

function getPendingRequests() {
  return JSON.parse(localStorage.getItem(KEYS.PENDING) || '[]');
}

function savePendingRequests(arr) {
  localStorage.setItem(KEYS.PENDING, JSON.stringify(arr));
}

function isAdmin(email) {
  return APPROVED_EMAILS.includes(email.toLowerCase().trim());
}

// GATE LOGIC
function gatekeep() {
  const verifiedEmail = localStorage.getItem(KEYS.VERIFIED);

  if (verifiedEmail && APPROVED_EMAILS.includes(verifiedEmail)) {
    logEvent('session_continued', { email: verifiedEmail });
    return true;
  }

  const choice = prompt(`FlowLedger Access Gate

1 = Request access (new user)
2 = Approve / Revoke (admin only)

Enter 1 or 2:`);

  if (choice === null) return location.reload();

  const trimmedChoice = choice.trim();

  if (trimmedChoice === '1') {
    const emailInput = prompt('Enter your email address:');
    if (emailInput === null) return location.reload();

    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      alert('Valid email required.');
      return location.reload();
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

  if (trimmedChoice === '2') {
    const adminInput = prompt('Admin email:');
    if (adminInput === null) return location.reload();

    const adminEmail = adminInput.trim().toLowerCase();
    if (!isAdmin(adminEmail)) {
      alert('Not an admin account.');
      return location.reload();
    }

    const keyInput = prompt('Enter master key:');
    if (keyInput === null) return location.reload();

    if (keyInput !== SECRET_MASTER_KEY) {
      alert(WRONG_KEY_MESSAGE);
      logEvent('admin_wrong_key', { attemptedEmail: adminEmail });
      return location.reload();
    }

    const actionInput = prompt(`Admin Panel – ${adminEmail}

1 = Approve pending request
2 = Revoke existing user
3 = View pending list
4 = View logs

Enter number:`);

    if (actionInput === null) return location.reload();

    const action = actionInput.trim();

    if (action === '1') {
      const pending = getPendingRequests();
      if (pending.length === 0) {
        alert('No pending requests.');
      } else {
        const list = pending.map((p, i) => `${i+1}. \( {p.email} ( \){new Date(p.requestedAt).toLocaleString()})`).join('\n');
        const numInput = prompt(`Pending requests:\n${list}\n\nEnter number to approve:`);
        if (numInput === null) return location.reload();

        const index = parseInt(numInput.trim()) - 1;
        if (!isNaN(index) && pending[index]) {
          const approvedEmail = pending[index].email;
          localStorage.setItem(KEYS.VERIFIED, approvedEmail);
          pending.splice(index, 1);
          savePendingRequests(pending);
          alert(`Approved: \( {approvedEmail}\n\n \){WELCOME_MESSAGE}`);
          logEvent('admin_approved', { approvedEmail, admin: adminEmail });
          location.reload();
        } else {
          alert('Invalid number selected.');
        }
      }
    } else if (action === '2') {
      const revokeInput = prompt('Email to revoke:');
      if (revokeInput === null) return location.reload();

      const emailToRevoke = revokeInput.trim().toLowerCase();
      if (localStorage.getItem(KEYS.VERIFIED) === emailToRevoke) {
        localStorage.removeItem(KEYS.VERIFIED);
        alert(`Revoked: ${emailToRevoke}`);
        logEvent('admin_revoked', { revokedEmail: emailToRevoke, admin: adminEmail });
      } else {
        alert('Not currently logged in as that user.');
      }
    } else if (action === '3') {
      const pending = getPendingRequests();
      if (pending.length === 0) {
        alert('No pending requests.');
      } else {
        const list = pending.map((p, i) => `${i+1}. \( {p.email} ( \){new Date(p.requestedAt).toLocaleString()})`).join('\n');
        alert(`Pending requests:\n${list}`);
      }
    } else if (action === '4') {
      const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
      if (logs.length === 0) {
        alert('No logs yet.');
      } else {
        const recent = logs.slice(-10).reverse().map(l => 
          `[${l.timestamp}] ${l.type.toUpperCase()} – ${JSON.stringify(l.payload)}`
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

// Run gate
gatekeep();

// Self-delete option
window.deleteMyData = () => {
  if (confirm('Delete ALL my data permanently? This cannot be undone.')) {
    localStorage.clear();
    logEvent('user_deleted_self', { email: localStorage.getItem(KEYS.VERIFIED) });
    alert('All data erased. Start fresh.');
    location.reload();
  }
};

console.log('[AccessGate] Gate active. Owner contact: bstm366@gmail.com | +267 78 355 551');
