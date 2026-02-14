// src/simple-gate.js - SIMPLE, CRASH-PROOF ACCESS GATE
// Replaces access-gate.js - no complex prompts, no syntax risks

console.log('[SimpleGate] Starting reliable gate - owner: bstm366@gmail.com');

const ADMIN_EMAIL = 'bstm366@gmail.com';
const MASTER_KEY = 'flowledger-omega-2026-myrah-78355551';
const VERIFIED_KEY = 'flowledger_verified_email';

// Run immediately on load
(function simpleGate() {
  const verified = localStorage.getItem(VERIFIED_KEY);

  // If already verified as admin email → let app load
  if (verified === ADMIN_EMAIL) {
    console.log('[SimpleGate] Already verified as admin - skipping gate');
    return;
  }

  // Ask for choice
  const choice = prompt('FlowLedger Access\n\n1 = Request access\n2 = Admin login\n\nEnter 1 or 2:');

  if (choice === null) {
    location.reload();
    return;
  }

  if (choice.trim() === '1') {
    const email = prompt('Enter your email for access request:');
    if (email && email.includes('@')) {
      alert('Request sent to admin. Wait for approval.');
      // In real app you'd send to server/email - here just log
      console.log('[SimpleGate] Access request from:', email);
    } else {
      alert('Invalid email.');
    }
    location.reload();
    return;
  }

  if (choice.trim() === '2') {
    const email = prompt('Admin email:');
    if (email?.trim().toLowerCase() !== ADMIN_EMAIL) {
      alert('Not an admin account.');
      location.reload();
      return;
    }

    const key = prompt('Enter master key:');
    if (key !== MASTER_KEY) {
      alert('Wrong master key.');
      location.reload();
      return;
    }

    // Approve current user (for simplicity - approve any email they enter next)
    const approveEmail = prompt('Enter email to approve:');
    if (approveEmail && approveEmail.includes('@')) {
      localStorage.setItem(VERIFIED_KEY, approveEmail.trim().toLowerCase());
      alert(`Approved: ${approveEmail}\n\nWelcome! Page will reload.`);
      console.log('[SimpleGate] Approved:', approveEmail);
      location.reload();
    } else {
      alert('Invalid email.');
      location.reload();
    }
    return;
  }

  alert('Invalid choice.');
  location.reload();
})();

// Optional: expose delete function
window.deleteMyData = () => {
  if (confirm('Delete ALL data permanently?')) {
    localStorage.clear();
    alert('Data erased.');
    location.reload();
  }
};

console.log('[SimpleGate] Gate active');
