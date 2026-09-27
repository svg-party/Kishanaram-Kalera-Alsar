/* ============================================================
   FIREBASE CONFIGURATION
   Project: Kishanaram-Kalera-Alsar
   Includes: Firestore, Realtime Database, Auth, Analytics
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyCCDF9CY_BamxzolSqMbWUlAT9kR5QhO5w",
  authDomain: "kishanaram-kalera-alsar.firebaseapp.com",
  databaseURL: "https://kishanaram-kalera-alsar-default-rtdb.firebaseio.com",
  projectId: "kishanaram-kalera-alsar",
  storageBucket: "kishanaram-kalera-alsar.firebasestorage.app",
  messagingSenderId: "1009456782279",
  appId: "1:1009456782279:web:10225c0ab112cebeb917e2",
  measurementId: "G-2D0LCPYM5F"
};

/* ============================================================
   INITIALIZE FIREBASE (Compat Build — works with index.html)
   ============================================================ */
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

/* ============================================================
   FIREBASE SERVICE INSTANCES
   ============================================================ */
const auth      = firebase.auth();                       // Authentication
const db        = firebase.firestore();                  // Firestore (main data)
const rtdb      = firebase.database();                   // Realtime Database (live counters / chat)
const analytics = firebase.analytics ? firebase.analytics() : null; // Optional

/* ============================================================
   REALTIME DATABASE REFERENCES (Future-Ready)
   Use these paths for live counters, online users, chat, etc.
   ============================================================ */
const rtdbRefs = {
  supporterCount: rtdb.ref('stats/supporterCount'),      // Live support counter
  onlineUsers:    rtdb.ref('presence/online'),           // Active users presence
  liveVisits:     rtdb.ref('stats/liveVisits'),          // Page visit counter
  announcements:  rtdb.ref('announcements'),             // Live announcements
  liveChat:       rtdb.ref('chat/messages')              // Live chat messages
};

/* ============================================================
   ADMIN CONFIG
   ============================================================ */
const ADMIN_EMAIL = "admin@alsar.com";   // ← Apna admin email yahan daalo

/* ============================================================
   GLOBAL STATE
   ============================================================ */
let currentLang    = 'en';
let allSupporters  = [];
let dynamicUnsub   = null;
let supporterUnsub = null;

/* ============================================================
   DEFAULT CONTENT (fallback if Firestore empty)
   ============================================================ */
const DEFAULT_CONTENT = {
  en: {
    slogan: '"Your Trust, My Strength... Village Development, Our Resolve..."',
    about: "Shri Kishanaram Kalera, son of Shri Ladhuram Ji Kalera, is a dedicated social worker from Gram Panchayat Alsar (Churu, Rajasthan). With over 20 years of grassroots service, he represents maturity, integrity, and an unwavering commitment to the village's holistic development.",
    manifesto: [
      "Accelerating development works in the village",
      "Clean drinking water system for everyone",
      "Special focus on Education, Health, and Employment",
      "Better facilities for Farming, Animal Husbandry & Youth",
      "Maintaining village unity and social harmony"
    ]
  },
  hi: {
    slogan: '"आपका भरोसा, मेरी ताकत... गाँव का विकास, हमारा संकल्प..."',
    about: "श्री किशनाराम कालेरा, सपुत्र श्री लादूराम जी कालेरा, ग्राम पंचायत आलसर (चूरू, राजस्थान) के एक समर्पित समाजसेवी हैं। 20 वर्षों से अधिक के जमीनी सेवा के अनुभव के साथ, वे परिपक्वता, ईमानदारी और गाँव के सर्वांगीण विकास के प्रति अटूट प्रतिबद्धता का प्रतीक हैं।",
    manifesto: [
      "गाँव में विकास कार्यों को तेजी देना",
      "सभी के लिए स्वच्छ पेयजल की व्यवस्था",
      "शिक्षा, स्वास्थ्य और रोजगार पर विशेष ध्यान",
      "खेती, पशुपालन व युवाओं के लिए बेहतर सुविधाएं",
      "गाँव की एकता और सौहार्द बनाए रखना"
    ]
  }
};

/* ============================================================
   AUDIO JUKEBOX — Multi-Track Player
   ============================================================ */
const TRACKS = [
  "sarpanch1.mp3",
  "sarpanch.m4a",
  "sarpanch3.mp3",
  "sarpanch4.mp3",
  "sarpanch5.mp3",
  "sarpanch6.mp3"
];
let currentTrackIndex = 0;
let audioPlayer, playBtn, prevBtn, nextBtn, trackSelect, trackTitle,
    progressFill, progressWrap, timeDisplay;

function initJukebox() {
  audioPlayer  = document.getElementById('audioPlayer');
  playBtn      = document.getElementById('playBtn');
  prevBtn      = document.getElementById('prevBtn');
  nextBtn      = document.getElementById('nextBtn');
  trackSelect  = document.getElementById('trackSelect');
  trackTitle   = document.getElementById('trackTitle');
  progressFill = document.getElementById('progressFill');
  progressWrap = document.getElementById('progressWrap');
  timeDisplay  = document.getElementById('timeDisplay');

  if (!audioPlayer) return;

  loadTrack(currentTrackIndex);

  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', () => changeTrack(-1));
  nextBtn.addEventListener('click', () => changeTrack(1));
  trackSelect.addEventListener('change', (e) => loadTrack(parseInt(e.target.value)));

  // Progress update
  audioPlayer.addEventListener('timeupdate', updateProgress);
  audioPlayer.addEventListener('ended', () => changeTrack(1));
  audioPlayer.addEventListener('loadedmetadata', updateProgress);

  // Seek on progress bar click
  progressWrap.addEventListener('click', (e) => {
    const rect = progressWrap.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    if (audioPlayer.duration) {
      audioPlayer.currentTime = pct * audioPlayer.duration;
    }
  });
}

function loadTrack(index) {
  if (index < 0) index = TRACKS.length - 1;
  if (index >= TRACKS.length) index = 0;
  currentTrackIndex = index;

  const wasPlaying = !audioPlayer.paused;
  audioPlayer.src = TRACKS[index];
  audioPlayer.load();

  trackTitle.textContent = TRACKS[index];
  trackSelect.value = index;

  if (wasPlaying) audioPlayer.play().catch(() => {});
  updatePlayButton();
}

function togglePlay() {
  if (audioPlayer.paused) {
    audioPlayer.play().catch(err => console.warn("Playback error:", err));
  } else {
    audioPlayer.pause();
  }
  updatePlayButton();
}

function changeTrack(direction) {
  loadTrack(currentTrackIndex + direction);
  audioPlayer.play().catch(() => {});
}

function updatePlayButton() {
  if (!playBtn) return;
  playBtn.textContent = audioPlayer.paused ? "▶" : "❚❚";
}

function updateProgress() {
  if (!audioPlayer.duration) return;
  const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  progressFill.style.width = pct + "%";

  const cur = formatTime(audioPlayer.currentTime);
  const dur = formatTime(audioPlayer.duration);
  timeDisplay.textContent = `${cur} / ${dur}`;
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ============================================================
   LANGUAGE TOGGLE
   ============================================================ */
function setLanguage(lang) {
  currentLang = lang;

  // Toggle all elements with .lang-en / .lang-hi
  document.querySelectorAll('.lang-en').forEach(el => {
    el.classList.toggle('active', lang === 'en');
  });
  document.querySelectorAll('.lang-hi').forEach(el => {
    el.classList.toggle('active', lang === 'hi');
  });

  // Update toggle button label
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.querySelector('.lang-en').classList.toggle('active', lang === 'en');
    langBtn.querySelector('.lang-hi').classList.toggle('active', lang === 'hi');
  }

  // Update HTML lang attribute
  document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';

  // Filter dynamic sections by language
  applyDynamicLangFilter();
}

/* ============================================================
   MANIFESTO RENDERING
   ============================================================ */
function renderManifesto(points) {
  const grid = document.getElementById('manifestoGrid');
  if (!grid) return;
  grid.innerHTML = points.map((text, i) => `
    <div class="manifesto-card">
      <div class="manifesto-num">${i + 1}</div>
      <p>${text}</p>
    </div>
  `).join('');
}

/* ============================================================
   CONTENT LOADING FROM FIRESTORE
   ============================================================ */
async function loadSiteContent() {
  try {
    const doc = await db.collection('site_content').doc('main').get();
    let data = DEFAULT_CONTENT;

    if (doc.exists) {
      const d = doc.data();
      // Merge with defaults
      data = {
        en: { ...DEFAULT_CONTENT.en, ...(d.en || {}) },
        hi: { ...DEFAULT_CONTENT.hi, ...(d.hi || {}) }
      };
    } else {
      // Seed defaults on first run (optional)
      db.collection('site_content').doc('main').set(DEFAULT_CONTENT).catch(() => {});
    }

    // Apply to DOM
    const aboutEn = document.getElementById('aboutTextEn');
    const aboutHi = document.getElementById('aboutTextHi');
    if (aboutEn) aboutEn.textContent = data.en.about;
    if (aboutHi) aboutHi.textContent = data.hi.about;

    // Slogan (hero)
    const sloganEn = document.querySelector('.hero-slogan .lang-en');
    const sloganHi = document.querySelector('.hero-slogan .lang-hi');
    if (sloganEn) sloganEn.textContent = data.en.slogan;
    if (sloganHi) sloganHi.textContent = data.hi.slogan;

    // Manifesto — render both languages (CSS shows correct one)
    // We render English by default; language filter handles visibility.
    // Better: render both, hide via CSS. We'll render into two containers.
    renderManifestoBothLanguages(data);

  } catch (err) {
    console.warn("Firestore content load failed, using defaults:", err);
    renderManifestoBothLanguages(DEFAULT_CONTENT);
  }
}

function renderManifestoBothLanguages(data) {
  const grid = document.getElementById('manifestoGrid');
  if (!grid) return;

  // Build combined markup with lang wrappers
  let html = '';
  data.en.manifesto.forEach((point, i) => {
    html += `
      <div class="manifesto-card">
        <div class="manifesto-num">${i + 1}</div>
        <p class="lang-en active">${point}</p>
        <p class="lang-hi">${data.hi.manifesto[i] || point}</p>
      </div>
    `;
  });
  grid.innerHTML = html;

  // Re-apply current language
  setLanguage(currentLang);
}

/* ============================================================
   SUPPORTER WALL — Live Counter & Cards
   ============================================================ */
function listenToSupporters() {
  if (supporterUnsub) supporterUnsub();
  supporterUnsub = db.collection('supporters')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      allSupporters = [];
      snapshot.forEach(doc => {
        allSupporters.push({ id: doc.id, ...doc.data() });
      });

      // Update counter
      const counter = document.getElementById('supporterCount');
      if (counter) counter.textContent = allSupporters.length.toLocaleString('en-IN');

      // Render wall (show max 12 for performance)
      renderSupporterWall(allSupporters.slice(0, 12));
    }, err => console.warn("Supporter listener error:", err));
}

function renderSupporterWall(supporters) {
  const wall = document.getElementById('supporterWall');
  if (!wall) return;

  if (!supporters.length) {
    wall.innerHTML = `<p class="text-center text-gray-500 col-span-full py-4">Be the first to support!</p>`;
    return;
  }

  wall.innerHTML = supporters.map(s => `
    <div class="supporter-card">
      <div class="s-name">${escapeHtml(s.name || 'Anonymous')}</div>
      <div class="s-ward">${escapeHtml(s.ward || 'Ward not specified')}</div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

/* ============================================================
   AUTHENTICATION & SUPPORT REGISTRATION
   ============================================================ */
function initAuth() {
  const modal      = document.getElementById('authModal');
  const closeBtn   = document.getElementById('modalCloseBtn');
  const supportBtn = document.getElementById('supportBtn');
  const regBtn     = document.getElementById('registerSupportBtn');
  const googleBtn  = document.getElementById('googleLoginBtn');
  const emailBtn   = document.getElementById('emailLoginBtn');
  const authInfo   = document.getElementById('authUserInfo');

  // Open modal
  supportBtn?.addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  closeBtn?.addEventListener('click', () => modal.style.display = 'none');
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  // Google login
  googleBtn?.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
      modal.style.display = 'none';
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  });

  // Email login / signup
  emailBtn?.addEventListener('click', async () => {
    const email = document.getElementById('emailInput').value.trim();
    const pass  = document.getElementById('passwordInput').value;
    if (!email || !pass) { alert("Enter email & password"); return; }

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      modal.style.display = 'none';
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        try {
          await auth.createUserWithEmailAndPassword(email, pass);
          modal.style.display = 'none';
        } catch (e2) { alert("Signup failed: " + e2.message); }
      } else {
        alert("Login failed: " + err.message);
      }
    }
  });

  // Auth state listener
  auth.onAuthStateChanged(user => {
    if (user) {
      supportBtn.style.display = 'none';
      regBtn.style.display = 'inline-block';
      if (authInfo) authInfo.textContent = `Signed in as ${user.displayName || user.email}`;
    } else {
      supportBtn.style.display = 'inline-block';
      regBtn.style.display = 'none';
      if (authInfo) authInfo.textContent = '';
    }
  });

  // Register support
  regBtn?.addEventListener('click', registerSupport);
}

async function registerSupport() {
  const user = auth.currentUser;
  if (!user) { alert("Please sign in first."); return; }

  const name = prompt("Enter your name (or leave blank for Anonymous):", user.displayName || "");
  if (name === null) return;
  const ward = prompt("Enter your ward / village part:", "");
  if (ward === null) return;

  try {
    await db.collection('supporters').add({
      name: name.trim() || 'Anonymous',
      ward: ward.trim() || 'Not specified',
      uid: user.uid,
      email: user.email || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("🙏 Thank you! Your support has been registered.");
  } catch (err) {
    console.error(err);
    alert("Error registering support. Please try again.");
  }
}

/* ============================================================
   DYNAMIC SECTIONS (Custom HTML Injector)
   ============================================================ */
function loadDynamicSections() {
  if (dynamicUnsub) dynamicUnsub();
  dynamicUnsub = db.collection('dynamic_sections')
    .orderBy('order', 'asc')
    .onSnapshot(snapshot => {
      const container = document.getElementById('dynamicSectionsContainer');
      if (!container) return;
      container.innerHTML = '';

      snapshot.forEach(doc => {
        const data = doc.data();
        const wrapper = document.createElement('div');
        wrapper.className = 'dynamic-block';
        wrapper.setAttribute('data-lang', data.lang || 'both');
        wrapper.setAttribute('data-id', doc.id);
        wrapper.innerHTML = data.html || '';
        container.appendChild(wrapper);
      });

      applyDynamicLangFilter();
    }, err => console.warn("Dynamic listener error:", err));
}

function applyDynamicLangFilter() {
  document.querySelectorAll('.dynamic-block').forEach(block => {
    const lang = block.getAttribute('data-lang');
    if (!lang || lang === 'both') {
      block.style.display = 'block';
    } else {
      block.style.display = (currentLang === lang) ? 'block' : 'none';
    }
  });
}

/* ============================================================
   PUBLIC PAGE INITIALIZER
   ============================================================ */
function initPublicPage() {
  // Language toggle
  const langToggle = document.getElementById('langToggle');
  langToggle?.addEventListener('click', () => {
    setLanguage(currentLang === 'en' ? 'hi' : 'en');
  });

  // Mobile hamburger
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  hamburger?.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  // Close nav on link click (mobile)
  navLinks?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  // Load everything
  initJukebox();
  initAuth();
  loadSiteContent();
  listenToSupporters();
  loadDynamicSections();
  setLanguage('en');
}

/* ============================================================
   ADMIN DASHBOARD LOGIC
   ============================================================ */
function initAdminPage() {
  const gate       = document.getElementById('adminLoginGate');
  const dashboard  = document.getElementById('adminDashboard');
  const loginBtn   = document.getElementById('adminLoginBtn');
  const logoutBtn  = document.getElementById('adminLogoutBtn');
  const errorEl    = document.getElementById('adminLoginError');
  const emailEl    = document.getElementById('adminEmail');

  // Auth guard
  auth.onAuthStateChanged(user => {
    if (user && user.email === ADMIN_EMAIL) {
      gate.style.display = 'none';
      dashboard.style.display = 'block';
      if (emailEl) emailEl.textContent = user.email;

      initAdminTabs();
      initContentManager();
      initSupporterLog();
      initInjector();
    } else {
      gate.style.display = 'flex';
      dashboard.style.display = 'none';
    }
  });

  // Admin login (email/password)
  loginBtn?.addEventListener('click', async () => {
    const email = prompt("Admin email:");
    if (!email) return;
    const pass = prompt("Admin password:");
    if (!pass) return;

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      if (auth.currentUser.email !== ADMIN_EMAIL) {
        await auth.signOut();
        errorEl.textContent = "❌ Not authorized as admin.";
      }
    } catch (err) {
      errorEl.textContent = "❌ " + err.message;
    }
  });

  logoutBtn?.addEventListener('click', () => auth.signOut());
}

/* ---------- Admin Tabs ---------- */
function initAdminTabs() {
  const tabs   = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.admin-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      panels.forEach(p => {
        p.classList.toggle('active', p.id === `tab-${target}`);
      });
    });
  });
}

/* ---------- Content Manager ---------- */
function initContentManager() {
  const form = document.getElementById('contentForm');
  if (!form) return;

  // Load current content
  db.collection('site_content').doc('main').get().then(doc => {
    const data = doc.exists ? doc.data() : DEFAULT_CONTENT;
    const en = data.en || DEFAULT_CONTENT.en;
    const hi = data.hi || DEFAULT_CONTENT.hi;

    document.getElementById('sloganEn').value      = en.slogan || '';
    document.getElementById('sloganHi').value      = hi.slogan || '';
    document.getElementById('aboutEn').value       = en.about || '';
    document.getElementById('aboutHi').value       = hi.about || '';
    document.getElementById('manifestoEn').value   = (en.manifesto || []).join('\n');
    document.getElementById('manifestoHi').value   = (hi.manifesto || []).join('\n');
  });

  // Save content
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      en: {
        slogan:    document.getElementById('sloganEn').value.trim(),
        about:     document.getElementById('aboutEn').value.trim(),
        manifesto: document.getElementById('manifestoEn').value.split('\n').map(l => l.trim()).filter(Boolean)
      },
      hi: {
        slogan:    document.getElementById('sloganHi').value.trim(),
        about:     document.getElementById('aboutHi').value.trim(),
        manifesto: document.getElementById('manifestoHi').value.split('\n').map(l => l.trim()).filter(Boolean)
      }
    };

    try {
      await db.collection('site_content').doc('main').set(payload, { merge: true });
      alert("✅ Content saved successfully!");
    } catch (err) {
      alert("❌ Error saving: " + err.message);
    }
  });
}

/* ---------- Supporter Log ---------- */
function initSupporterLog() {
  const tbody    = document.getElementById('supporterTableBody');
  const searchEl = document.getElementById('supporterSearch');
  const sortEl   = document.getElementById('supporterSort');
  const exportBtn = document.getElementById('exportCsvBtn');

  if (!tbody) return;

  let liveData = [];

  db.collection('supporters').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    liveData = [];
    snapshot.forEach(doc => liveData.push({ id: doc.id, ...doc.data() }));
    renderSupporterTable(liveData);
  });

  function renderSupporterTable(data) {
    const query  = (searchEl?.value || '').toLowerCase();
    const sort   = sortEl?.value || 'newest';

    let filtered = data.filter(s =>
      (s.name || '').toLowerCase().includes(query) ||
      (s.ward || '').toLowerCase().includes(query)
    );

    if (sort === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sort === 'oldest') {
      filtered.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    } else {
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">No supporters found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(s.name || '—')}</td>
        <td>${escapeHtml(s.ward || '—')}</td>
        <td><code>${escapeHtml((s.uid || '').slice(0, 8))}…</code></td>
        <td>${s.createdAt ? new Date(s.createdAt.seconds * 1000).toLocaleString() : '—'}</td>
      </tr>
    `).join('');
  }

  searchEl?.addEventListener('input', () => renderSupporterTable(liveData));
  sortEl?.addEventListener('change', () => renderSupporterTable(liveData));

  // CSV Export
  exportBtn?.addEventListener('click', () => {
    const rows = [['Name', 'Ward', 'UID', 'Email', 'Date']];
    liveData.forEach(s => {
      rows.push([
        s.name || '',
        s.ward || '',
        s.uid || '',
        s.email || '',
        s.createdAt ? new Date(s.createdAt.seconds * 1000).toISOString() : ''
      ]);
    });

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `supporters_${Date.now()}.csv`;
    link.click();
  });
}

/* ---------- Custom Code Injector ---------- */
function initInjector() {
  const form      = document.getElementById('injectorForm');
  const listEl    = document.getElementById('dynamicListContainer');
  if (!form) return;

  // Load existing dynamic sections
  db.collection('dynamic_sections').orderBy('order', 'asc').onSnapshot(snapshot => {
    listEl.innerHTML = '';
    if (snapshot.empty) {
      listEl.innerHTML = `<p class="text-gray-500 text-sm">No dynamic sections published yet.</p>`;
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const item = document.createElement('div');
      item.className = 'dynamic-item';
      item.innerHTML = `
        <div>
          <code>${escapeHtml((data.html || '').slice(0, 80))}${(data.html || '').length > 80 ? '…' : ''}</code>
          <div class="text-xs text-gray-500 mt-1">
            Order: <strong>${data.order}</strong> · Lang: <strong>${data.lang}</strong>
          </div>
        </div>
        <button class="btn-delete" data-id="${doc.id}">Delete</button>
      `;
      listEl.appendChild(item);
    });

    // Attach delete handlers
    listEl.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm("Delete this dynamic section?")) {
          await db.collection('dynamic_sections').doc(id).delete();
        }
      });
    });
  });

  // Publish new section
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const html  = document.getElementById('customCode').value.trim();
    const order = parseInt(document.getElementById('codeOrder').value) || 1;
    const lang  = document.getElementById('codeLang').value;

    if (!html) { alert("Please enter some HTML/CSS/JS code."); return; }

    try {
      await db.collection('dynamic_sections').add({
        html, order, lang,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert("✅ Section published! It will appear on the public site.");
      form.reset();
      document.getElementById('codeOrder').value = 1;
    } catch (err) {
      alert("❌ Error publishing: " + err.message);
    }
  });
}

/* ============================================================
   EXPOSE ADMIN INIT (called from admin.html)
   ============================================================ */
window.initAdminPage = initAdminPage;

/* ============================================================
   AUTO-DETECT PAGE & BOOTSTRAP
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // If public page elements exist → init public
  if (document.getElementById('manifestoGrid')) {
    initPublicPage();
  }
});
