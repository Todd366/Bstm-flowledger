// src/app-fix-inject.js - FINAL INJECTION TO FIX WHITE SCREEN & LINK EVERYTHING
// Runs after gate, catches crashes, forces clean load

console.log('[AppFix] Loading final app recovery script');

// VERIFIED KEY (same as gate)
const VERIFIED_KEY = 'flowledger_verified_email';
const ADMIN_EMAIL = 'bstm366@gmail.com';

// Run on load
(function appFix() {
  const verified = localStorage.getItem(VERIFIED_KEY);

  if (verified && verified.toLowerCase() === ADMIN_EMAIL) {
    console.log('[AppFix] Verified as admin - allowing full app load');
    return; // do nothing - app should render
  }

  // Minimal fallback gate if not verified
  const choice = prompt('App Access\n\n1 = Request\n2 = Admin\nEnter 1 or 2:');

  if (choice === null) return location.reload();

  if (choice.trim() === '1') {
    alert('Request sent. Contact admin.');
    location.reload();
    return;
  }

  if (choice.trim() === '2') {
    const email = prompt('Admin email:');
    if (email?.trim().toLowerCase() !== ADMIN_EMAIL) {
      alert('Not admin.');
      return location.reload();
    }

    const key = prompt('Master key:');
    if (key !== 'flowledger-omega-2026-myrah-78355551') {
      alert('Wrong key.');
      return location.reload();
    }

    const approveEmail = prompt('Approve email:');
    if (approveEmail && approveEmail.includes('@')) {
      localStorage.setItem(VERIFIED_KEY, approveEmail.trim().toLowerCase());
      alert('Approved. Reloading...');
      location.reload();
    }
    return;
  }

  alert('Invalid choice.');
  location.reload();
})();

// Catch global errors (last resort)
window.addEventListener('error', (event) => {
  console.error('[AppFix] Global error caught:', event.message, event.filename, event.lineno);
  // Optional: alert('App crashed - check console for details.');
});

// Catch unhandled promise rejections (camera, etc.)
window.addEventListener('unhandledrejection', (event) => {
  console.error('[AppFix] Unhandled promise rejection:', event.reason);
  // Optional: event.preventDefault(); // stop default browser handling
});

console.log('[AppFix] Recovery script active');
