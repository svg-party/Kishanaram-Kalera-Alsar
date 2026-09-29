/* ============================================================
   LACHHARSAR VILLAGE PORTAL — Public + Admin Init
   Firebase Project: lachharsar-village
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyDqjskeHAg_W93RZ-ll4k7T1Ot2D_QDgNY",
  authDomain: "lachharsar-village.firebaseapp.com",
  projectId: "lachharsar-village",
  storageBucket: "lachharsar-village.firebasestorage.app",
  messagingSenderId: "858928708033",
  appId: "1:858928708033:web:3eaadc7ae55c6bc2b79740",
  measurementId: "G-K6FZJX1B4J"
};

/* SAFE INIT */
let auth = null, db = null, storage = null, analytics = null;
try {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  if (typeof firebase.auth === 'function')      auth = firebase.auth();
  if (typeof firebase.firestore === 'function') db = firebase.firestore();
  if (typeof firebase.storage === 'function')   storage = firebase.storage();
  if (typeof firebase.analytics === 'function') { try { analytics = firebase.analytics(); } catch (e) {} }
} catch (e) { console.error("❌ Firebase init:", e); }

const ADMIN_EMAIL = "sovereignvanguardgovernance.svg@gmail.com";
let currentLang = 'hi';

/* ============================================================
   LANGUAGE
   ============================================================ */
function setLanguage(lang) {
  currentLang = lang;
  document.body.setAttribute('data-lang', lang);
  document.documentElement.lang = lang;

  const btn = document.getElementById('langToggle');
  if (btn) {
    const hi = btn.querySelector('.lang-hi');
    const en = btn.querySelector('.lang-en');
    if (hi) hi.style.display = (lang === 'hi') ? 'inline' : 'none';
    if (en) en.style.display = (lang === 'en') ? 'inline' : 'none';
  }
  loadAllContent();
}

/* ============================================================
   LOADERS
   ============================================================ */
async function loadSiteData() {
  if (!db) return;
  try {
    const doc = await db.collection('site').doc('general').get();
    if (!doc.exists) return;
    const d = doc.data();
    const isHi = currentLang === 'hi';

    if (d.siteName) {
      const brand = document.getElementById('brandText');
      if (brand) brand.textContent = isHi ? (d.siteName.hi || d.siteName.en) : (d.siteName.en || d.siteName.hi);
      document.title = (isHi ? (d.siteName.hi || '') : (d.siteName.en || '')) + ' · Lachharsar';
    }
    if (d.logoUrl) {
      const logo = document.getElementById('brandLogo');
      if (logo) { logo.src = d.logoUrl; logo.style.display = 'block'; }
    }
    if (d.faviconUrl) {
      const fav = document.getElementById('faviconLink');
      if (fav) fav.href = d.faviconUrl;
    }
    if (d.footerText) {
      const ft = document.getElementById('footerText');
      if (ft) ft.textContent = isHi ? (d.footerText.hi || d.footerText.en) : (d.footerText.en || d.footerText.hi);
    }
  } catch (e) { console.warn("Site data:", e); }
}

async function loadHero() {
  if (!db) return;
  try {
    const doc = await db.collection('site').doc('hero').get();
    if (!doc.exists) return;
    const d = doc.data();
    const isHi = currentLang === 'hi';

    const tag = document.getElementById('heroTag');
    if (tag && d.tagline) tag.textContent = isHi ? (d.tagline.hi || d.tagline.en) : (d.tagline.en || d.tagline.hi);

    const name = document.getElementById('heroName');
    if (name && d.villageName) name.textContent = isHi ? (d.villageName.hi || d.villageName.en) : (d.villageName.en || d.villageName.hi);

    const desc = document.getElementById('heroDesc');
    if (desc && d.description) desc.innerHTML = isHi ? (d.description.hi || d.description.en) : (d.description.en || d.description.hi);

    const img = document.getElementById('heroImage');
    if (img && d.imageUrl) img.src = d.imageUrl;
  } catch (e) { console.warn("Hero:", e); }
}

async function loadAbout() {
  if (!db) return;
  try {
    const doc = await db.collection('site').doc('about').get();
    if (!doc.exists) return;
    const d = doc.data();
    const isHi = currentLang === 'hi';
    const el = document.getElementById('aboutContent');
    if (el) el.innerHTML = isHi ? (d.contentHi || d.contentEn || '') : (d.contentEn || d.contentHi || '');
  } catch (e) { console.warn("About:", e); }
}

async function loadPanchayat() {
  if (!db) return;
  try {
    const doc = await db.collection('site').doc('panchayat').get();
    if (!doc.exists) return;
    const d = doc.data();
    const grid = document.getElementById('panchayatGrid');
    if (!grid) return;

    const cards = [
      { icon: '👩‍💼', label: 'सरपंच', value: d.sarpanchName || '—', sub: d.sarpanchPhone || '' },
      { icon: '📋',   label: 'सचिव',  value: d.secretaryName || '—', sub: d.secretaryPhone || '' },
      { icon: '📍',   label: 'पता',   value: d.address || 'ग्राम पंचायत लाछड़सर', sub: 'PIN 331802' },
      { icon: '🏛️',   label: 'ब्लॉक', value: 'रतनगढ़', sub: 'जिला चूरू' }
    ];

    grid.innerHTML = cards.map(c => `
      <div class="info-card">
        <div class="icon">${c.icon}</div>
        <h4>${c.label}</h4>
        <p><strong>${c.value}</strong></p>
        ${c.sub ? `<p style="margin-top:0.25rem;">${c.sub}</p>` : ''}
      </div>
    `).join('');
  } catch (e) { console.warn("Panchayat:", e); }
}

async function loadGallery() {
  if (!db) return;
  try {
    const snap = await db.collection('gallery').orderBy('order', 'asc').get();
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    if (snap.empty) {
      grid.innerHTML = '<p style="text-align:center; color:#94a3b8; grid-column:1/-1;">No images yet</p>';
      return;
    }

    const isHi = currentLang === 'hi';
    grid.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const cap = isHi ? (d.captionHi || d.captionEn) : (d.captionEn || d.captionHi);
      return `
        <div class="gallery-item">
          <img src="${d.imageUrl}" alt="${cap || ''}" loading="lazy" />
          ${cap ? `<div class="gallery-caption">${cap}</div>` : ''}
        </div>
      `;
    }).join('');
  } catch (e) { console.warn("Gallery:", e); }
}

async function loadContact() {
  if (!db) return;
  try {
    const doc = await db.collection('site').doc('contact').get();
    if (!doc.exists) return;
    const d = doc.data();
    const grid = document.getElementById('contactGrid');
    if (!grid) return;

    const cards = [];
    if (d.phone1)   cards.push({ icon: '📞', title: 'फोन',     value: d.phone1 });
    if (d.phone2)   cards.push({ icon: '📱', title: 'मोबाइल',  value: d.phone2 });
    if (d.email)    cards.push({ icon: '✉️', title: 'ईमेल',    value: d.email });
    if (d.whatsapp) cards.push({ icon: '💬', title: 'WhatsApp', value: d.whatsapp });

    if (!cards.length) {
      grid.innerHTML = '<p style="text-align:center; color:#94a3b8; grid-column:1/-1;">Contact info coming soon</p>';
      return;
    }

    grid.innerHTML = cards.map(c => `
      <div class="contact-card">
        <div class="icon">${c.icon}</div>
        <h4>${c.title}</h4>
        <p>${c.value}</p>
      </div>
    `).join('');
  } catch (e) { console.warn("Contact:", e); }
}

async function loadTheme() {
  if (!db) return;
  try {
    const doc = await db.collection('site').doc('theme').get();
    if (!doc.exists) return;
    const d = doc.data();
    const root = document.documentElement;
    if (d.primary) root.style.setProperty('--primary', d.primary);
    if (d.accent)  root.style.setProperty('--accent', d.accent);
    if (d.bg)      root.style.setProperty('--bg', d.bg);
    if (d.text)    root.style.setProperty('--text', d.text);
  } catch (e) { console.warn("Theme:", e); }
}

/* ============================================================
   NOTICE BAR
   ============================================================ */
function initNoticeBar() {
  if (!db) return;
  if (sessionStorage.getItem('noticeClosed') === 'true') return;

  const bar = document.getElementById('noticeBar');
  if (!bar) return;
  const titleEl = document.getElementById('noticeTitle');
  const bodyEl = document.getElementById('noticeBody');
  const closeBtn = document.getElementById('noticeClose');

  db.collection('notices')
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .onSnapshot(snap => {
      if (snap.empty) { bar.style.display = 'none'; return; }
      const d = snap.docs[0].data();
      const isHi = currentLang === 'hi';
      if (titleEl) titleEl.textContent = isHi ? (d.titleHi || d.titleEn || '') : (d.titleEn || d.titleHi || '');
      if (bodyEl)  bodyEl.textContent  = isHi ? (d.bodyHi || d.bodyEn || '')   : (d.bodyEn || d.bodyHi || '');
      bar.style.display = 'block';
    }, err => console.warn("Notice:", err));

  if (closeBtn) closeBtn.addEventListener('click', () => {
    bar.style.display = 'none';
    sessionStorage.setItem('noticeClosed', 'true');
  });
}

/* ============================================================
   POPUP
   ============================================================ */
function initPopup() {
  if (!db) return;
  const popup = document.getElementById('sitePopup');
  const content = document.getElementById('popupContent');
  const closeBtn = document.getElementById('popupClose');
  if (!popup || !content) return;

  db.collection('popup').doc('main').get().then(doc => {
    if (!doc.exists) return;
    const d = doc.data();
    if (!d.isActive) return;

    const freq = d.frequency || 'once';
    const key = 'popup_shown_' + (d.updatedAt?.seconds || 'v1');
    if (freq === 'once' && sessionStorage.getItem(key)) return;
    if (freq === 'daily' && localStorage.getItem(key) === new Date().toDateString()) return;

    let html = '';
    if (d.type === 'image' && d.content) {
      html = `<img src="${d.content}" alt="Popup" />`;
    } else if (d.type === 'html') {
      html = d.content || '';
    } else if (d.type === 'notice') {
      html = `<div style="text-align:center; padding:1rem;">
        <div style="font-size:3rem;">📢</div>
        <div style="font-size:1.1rem; font-weight:700; color:#0c2340; margin-top:0.5rem;">${d.content || ''}</div>
      </div>`;
    }

    content.innerHTML = html;
    setTimeout(() => {
      popup.style.display = 'flex';
      if (freq === 'once')  sessionStorage.setItem(key, 'true');
      if (freq === 'daily') localStorage.setItem(key, new Date().toDateString());
    }, 1500);
  }).catch(e => console.warn("Popup:", e));

  if (closeBtn) closeBtn.addEventListener('click', () => popup.style.display = 'none');
  if (popup) popup.addEventListener('click', (e) => { if (e.target === popup) popup.style.display = 'none'; });
}

/* ============================================================
   MASTER LOADER
   ============================================================ */
async function loadAllContent() {
  await Promise.all([
    loadSiteData(), loadHero(), loadAbout(), loadPanchayat(),
    loadGallery(), loadContact(), loadTheme()
  ]);
}

/* ============================================================
   INIT PUBLIC
   ============================================================ */
function initPublicPage() {
  document.body.setAttribute('data-lang', 'hi');

  const langBtn = document.getElementById('langToggle');
  if (langBtn) langBtn.addEventListener('click', () => setLanguage(currentLang === 'hi' ? 'en' : 'hi'));

  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  loadAllContent();
  initNoticeBar();
  initPopup();
}

/* ============================================================
   INIT ADMIN
   ============================================================ */
function initAdminPage() {
  const gate = document.getElementById('adminLoginGate');
  const dashboard = document.getElementById('adminDashboard');
  if (!gate || !dashboard || !auth) return;

  const gBtn = document.getElementById('googleAdminLoginBtn');
  if (gBtn) {
    gBtn.addEventListener('click', async () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      gBtn.disabled = true;
      const originalHTML = gBtn.innerHTML;
      gBtn.innerHTML = '⏳ Signing in...';

      try {
        const result = await auth.signInWithPopup(provider);
        if (result.user.email !== ADMIN_EMAIL) {
          await auth.signOut();
          const errEl = document.getElementById('adminLoginError');
          if (errEl) errEl.textContent = "❌ " + result.user.email + " is not authorized";
        }
      } catch (e) {
        const errEl = document.getElementById('adminLoginError');
        if (errEl) errEl.textContent = "❌ " + e.message;
      } finally {
        gBtn.disabled = false;
        gBtn.innerHTML = originalHTML;
      }
    });
  }

  auth.onAuthStateChanged(user => {
    if (user && user.email === ADMIN_EMAIL) {
      gate.style.display = 'none';
      dashboard.style.display = 'block';
      const emailEl = document.getElementById('adminEmailDisplay');
      if (emailEl) emailEl.textContent = user.email;

      if (typeof initAdminTabs === 'function') initAdminTabs();
      if (typeof initAdminForms === 'function') initAdminForms();
    } else {
      gate.style.display = 'flex';
      dashboard.style.display = 'none';
    }
  });

  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    if (confirm('Logout?')) auth.signOut();
  });
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('hero')) {
    initPublicPage();
  }
  if (document.getElementById('adminLoginGate')) {
    setTimeout(initAdminPage, 300);
  }
});