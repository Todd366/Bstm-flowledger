// src/inject-fixes.js
// Runs once, fixes the missing stuff, then forgets itself

// 1. Add the missing Github icon
window.Github = (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.84 9.497.5.09.682-.217.682-.483 0-.237-.008-.866-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.455-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.027 1.531 1.027.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.09.39-1.98 1.03-2.677-.103-.253-.447-1.267.099-2.64 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.373.202 2.387.099 2.64.64.698 1.03 1.587 1.03 2.677 0 3.832-2.336 4.688-4.558 4.94.359.308.678.92.678 1.855 0 .266.181.572.682.483A10.01 10.01 0 0022 12c0-5.523-4.477-10-10-10z"/></svg>;

// 2. Patch camera cleanup (stop tracks on unmount)
if (typeof React !== 'undefined' && React.Component) {
  const oldComponentWillUnmount = React.Component.prototype.componentWillUnmount;
  React.Component.prototype.componentWillUnmount = function () {
    if (this.videoRef && this.videoRef.current && this.videoRef.current.srcObject) {
      this.videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    if (oldComponentWillUnmount) oldComponentWillUnmount.call(this);
  };
}

// 3. Silent storage fallback
if (typeof localStorage !== 'undefined') {
  const oldSetItem = localStorage.setItem;
  localStorage.setItem = function (key, val) {
    try { oldSetItem.call(this, key, val); } catch (e) {
      console.warn('Storage full, clearing old data:', e);
      this.clear();
      oldSetItem.call(this, key, val);
    }
  };
}

// 4. Permission check before camera
window.startCameraSafe = async function () {
  if (!navigator.mediaDevices) {
    alert('Camera not supported');
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    return stream;
  } catch (err) {
    if (err.name === 'NotAllowedError') alert('Camera blocked. Allow in settings.');
    else alert('Camera error: ' + err.message);
    return false;
  }
};

// 5. Auto-clear demo data button (add to login screen)
// Just drop this anywhere in login JSX:
// <button onClick={() => localStorage.clear() && location.reload()} className="text-xs text-red-600">Reset Demo</button>
