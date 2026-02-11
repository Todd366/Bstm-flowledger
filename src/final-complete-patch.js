console.log('FlowLedger: full backtest mode – camera, GPS, security, backup');

// 1. CAMERA: stop stream after every photo (more robust)
const stopCamera = () => {
  const video = document.querySelector('video');
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    console.log('[Camera] Stream stopped');
  }
};

// Auto-stop on 'Use Photo' button click (with debounce protection)
let stopTimer = null;
document.addEventListener('click', e => {
  if (e.target.textContent.includes('Use Photo')) {
    clearTimeout(stopTimer);
    stopTimer = setTimeout(stopCamera, 500);  // increased delay for safety
  }
});

// 2. GPS: real location with better fallback
window.getRealGPS = async () => {
  try {
    if (!navigator.geolocation) throw new Error('Geolocation not supported');
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
    return `GPS: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)} (accuracy: ${pos.coords.accuracy}m)`;
  } catch (err) {
    console.warn('[GPS] Failed:', err.message);
    return 'GPS: -24.6282, 25.9231 (mock fallback)';
  }
};

// 3. OFFLINE SAVE: warn + force confirm
window.beforeSave = (data) => {
  if (!navigator.onLine) {
    if (!confirm('You are offline. Data will ONLY save to browser storage.\nContinue anyway?')) {
      return false;
    }
  }
  return true;
};

// 4. AUTO-BACKUP: JSON download on every save
window.autoBackup = (data) => {
  if (!data || typeof data !== 'object') return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flowledger_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('[Backup] Auto-download triggered');
};

// 5. PASSWORD HASH: SHA-256 hex (client-side only – NOT secure for production)
window.hashPass = async (pw) => {
  if (!pw) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(pw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // For better security: use Argon2id or bcryptjs (but requires library import)
  // NEVER store plain passwords in real apps
};

// 6. AUTO-LOGOUT: 15 min idle (merged timers, better events)
let logoutTimer;
const resetLogoutTimer = () => {
  clearTimeout(logoutTimer);
  logoutTimer = setTimeout(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('flowledger_user');
    location.reload();
    console.log('[Security] Auto-logout triggered');
  }, 15 * 60 * 1000);
};

['mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(ev => {
  document.addEventListener(ev, resetLogoutTimer, { passive: true });
});
resetLogoutTimer();

// 7. EXPORT REMINDER: nudge after save
window.nudgeExport = () => {
  setTimeout(() => {
    alert('Remember: Export your JSON backup before closing the tab!');
  }, 4000);
};

// Hook into save (assumes app calls window.saveData)
const originalSave = window.saveData;
window.saveData = function(data) {
  if (originalSave) originalSave(data);
  if (window.beforeSave(data)) {
    window.autoBackup(data);
    window.nudgeExport();
  }
};

// Self-destruct script tag after load (more reliable)
setTimeout(() => {
  const scripts = document.querySelectorAll('script');
  scripts.forEach(s => {
    if (s.textContent.includes('full backtest mode')) {
      s.remove();
      console.log('[Patch] Self-destructed');
    }
  });
}, 8000);
