console.log('FlowLedger: full backtest mode – camera, GPS, security, backup');

// 1. CAMERA: stop stream after every photo
const stopCamera = () => {
  const video = document.querySelector('video');
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
};

document.addEventListener('click', e => {
  if (e.target.textContent.includes('Use Photo')) {
    setTimeout(stopCamera, 400);
  }
});

// 2. GPS: real location, fallback mock
window.getRealGPS = async () => {
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    return `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
  } catch {
    return 'GPS: -24.6282, 25.9231 (mock)';
  }
};

// 3. OFFLINE SAVE: warn before silent loss
window.beforeSave = (data) => {
  if (!navigator.onLine) {
    if (!confirm('You’re offline. Save locally anyway?')) {
      return false;
    }
  }
  return true;
};

// 4. AUTO-BACKUP: every save → JSON in Downloads
window.autoBackup = (data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flowledger_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// 5. PASSWORD HASH: simple SHA-256 (async) – returns promise
window.hashPass = async (pw) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;  // hex is standard and readable
  // if you really want base64: return btoa(String.fromCharCode(...hashArray));
};

// 6. AUTO-LOGOUT: 15 min idle
let timer;
const resetTimer = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    localStorage.removeItem('user');
    location.reload();
  }, 15 * 60 * 1000);
};

['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
  document.addEventListener(event, resetTimer, { passive: true });
});
resetTimer();

// 7. EXPORT REMINDER: nudge after every save
window.nudgeExport = () => {
  setTimeout(() => {
    alert('Remember: hit Export JSON before you close!');
  }, 3000);
};

// Hook into existing save functions (assumes they call window.saveData)
const origSave = window.saveData;
window.saveData = function(d) {
  if (origSave) origSave(d);
  if (window.beforeSave(d)) {
    window.autoBackup(d);
    window.nudgeExport();
  }
};

// Done – self-destruct after load
setTimeout(() => {
  const script = document.querySelector('script[src*="patch"]') || document.currentScript;
  if (script) script.remove();
}, 6000);
