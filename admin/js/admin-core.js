/* ============================================================
   ADMIN CORE — Shared across all admin pages
   Handles: Auth guard, Firestore init, Toast, helpers
   ============================================================ */

const auth = firebase.auth();
const db = firebase.firestore();

/* ---------- AUTH GUARD ---------- */
function guardAdmin(callback) {
  auth.onAuthStateChanged(user => {
    if (!user || user.email !== ADMIN_EMAIL) {
      window.location.href = 'login.html';
      return;
    }
    const el = document.getElementById('userEmail');
    if (el) el.textContent = user.email;
    if (typeof callback === 'function') callback(user);
  });
}

/* ---------- LOGOUT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Logout?')) {
      auth.signOut().then(() => window.location.href = 'login.html');
    }
  });
});

/* ---------- TOAST ---------- */
function toast(msg, type = 'info') {
  const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#0c2340';
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.background = bg;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
window.toast = toast;

/* ---------- HELPERS ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}
window.esc = esc;

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
window.getVal = getVal;

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}
window.setVal = setVal;