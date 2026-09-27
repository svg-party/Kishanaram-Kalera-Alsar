/* ============================================================================
   KISHANARAM KALERA — SARPANCH CAMPAIGN
   Complete app.js — Firebase + All Logic
   Safe-mode initialization (crash-proof)
   ============================================================================ */

/* ============================================================
   FIREBASE CONFIGURATION
   Project: Kishanaram-Kalera-Alsar
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
   SAFE INITIALIZATION — prevents total app crash if any
   individual service fails to load
   ============================================================ */
let auth      = null;
let db        = null;
let rtdb      = null;
let analytics = null;

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  if (typeof firebase.auth === 'function') {
    auth = firebase.auth();
  } else {
    console.warn("⚠️ Auth SDK not loaded");
  }

  if (typeof firebase.firestore === 'function') {
    db = firebase.firestore();
  } else {
    console.warn("⚠️ Firestore SDK not loaded");
  }

  if (typeof firebase.database === 'function') {
    rtdb = firebase.database();
  } else {
    console.warn("⚠️ Realtime DB SDK not loaded — rtdb features disabled");
  }

  if (typeof firebase.analytics === 'function') {
    try { analytics = firebase.analytics(); } catch (e) {}
  }
} catch (err) {
  console.error("❌ Firebase init failed:", err);
}

/* ============================================================
   REALTIME DB REFERENCES (null-safe — future features)
   ============================================================ */
const rtdbRefs = rtdb ? {
  supporterCount: rtdb.ref('stats/supporterCount'),
  onlineUsers:    rtdb.ref('presence/online'),
  liveVisits:     rtdb.ref('stats/liveVisits'),
  announcements:  rtdb.ref('announcements'),
  liveChat:       rtdb.ref('chat/messages')
} : null;

/* ============================================================
   CONFIGURATION CONSTANTS
   ============================================================ */
const ADMIN_EMAIL = "sovereignvanguardgovernance.svg@gmail.com";   // ← Admin email

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
   UTILITY — Escape HTML
   ============================================================ */
function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}

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
  prevBtn.addEventListener('click', function () { changeTrack(-1); });
  nextBtn.addEventListener('click', function () { changeTrack(1); });
  trackSelect.addEventListener('change', function (e) {
    loadTrack(parseInt(e.target.value));
  });

  audioPlayer.addEventListener('timeupdate', updateProgress);
  audioPlayer.addEventListener('ended', function () { changeTrack(1); });
  audioPlayer.addEventListener('loadedmetadata', updateProgress);

  progressWrap.addEventListener('click', function (e) {
    var rect = progressWrap.getBoundingClientRect();
    var pct  = (e.clientX - rect.left) / rect.width;
    if (audioPlayer.duration) {
      audioPlayer.currentTime = pct * audioPlayer.duration;
    }
  });
}

function loadTrack(index) {
  if (index < 0) index = TRACKS.length - 1;
  if (index >= TRACKS.length) index = 0;
  currentTrackIndex = index;

  var wasPlaying = !audioPlayer.paused;
  audioPlayer.src = TRACKS[index];
  audioPlayer.load();

  trackTitle.textContent = TRACKS[index];
  trackSelect.value = index;

  if (wasPlaying) audioPlayer.play().catch(function () {});
  updatePlayButton();
}

function togglePlay() {
  if (audioPlayer.paused) {
    audioPlayer.play().catch(function (err) {
      console.warn("Playback error:", err);
    });
  } else {
    audioPlayer.pause();
  }
  updatePlayButton();
}

function changeTrack(direction) {
  loadTrack(currentTrackIndex + direction);
  audioPlayer.play().catch(function () {});
}

function updatePlayButton() {
  if (!playBtn) return;
  playBtn.textContent = audioPlayer.paused ? "▶" : "❚❚";
}

function updateProgress() {
  if (!audioPlayer.duration) return;
  var pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  progressFill.style.width = pct + "%";

  var cur = formatTime(audioPlayer.currentTime);
  var dur = formatTime(audioPlayer.duration);
  timeDisplay.textContent = cur + " / " + dur;
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  var m = Math.floor(seconds / 60);
  var s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return m + ":" + s;
}

/* ============================================================
   LANGUAGE TOGGLE
   ============================================================ */
function setLanguage(lang) {
  currentLang = lang;

  document.querySelectorAll('.lang-en').forEach(function (el) {
    el.classList.toggle('active', lang === 'en');
  });
  document.querySelectorAll('.lang-hi').forEach(function (el) {
    el.classList.toggle('active', lang === 'hi');
  });

  var langBtn = document.getElementById('langToggle');
  if (langBtn) {
    var enSpan = langBtn.querySelector('.lang-en');
    var hiSpan = langBtn.querySelector('.lang-hi');
    if (enSpan) enSpan.classList.toggle('active', lang === 'en');
    if (hiSpan) hiSpan.classList.toggle('active', lang === 'hi');
  }

  document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';

  applyDynamicLangFilter();
}

/* ============================================================
   MANIFESTO RENDERING
   ============================================================ */
function renderManifestoBothLanguages(data) {
  var grid = document.getElementById('manifestoGrid');
  if (!grid) return;

  var html = '';
  var enList = data.en.manifesto || [];
  var hiList = data.hi.manifesto || [];

  enList.forEach(function (point, i) {
    html += '<div class="manifesto-card">' +
      '<div class="manifesto-num">' + (i + 1) + '</div>' +
      '<p class="lang-en active">' + escapeHtml(point) + '</p>' +
      '<p class="lang-hi">' + escapeHtml(hiList[i] || point) + '</p>' +
    '</div>';
  });

  grid.innerHTML = html;
  setLanguage(currentLang);
}

/* ============================================================
   CONTENT LOADING FROM FIRESTORE
   ============================================================ */
async function loadSiteContent() {
  if (!db) {
    renderManifestoBothLanguages(DEFAULT_CONTENT);
    return;
  }

  try {
    var doc = await db.collection('site_content').doc('main').get();
    var data = DEFAULT_CONTENT;

    if (doc.exists) {
      var d = doc.data();
      data = {
        en: Object.assign({}, DEFAULT_CONTENT.en, d.en || {}),
        hi: Object.assign({}, DEFAULT_CONTENT.hi, d.hi || {})
      };
    } else {
      // Seed defaults on first run
      db.collection('site_content').doc('main').set(DEFAULT_CONTENT).catch(function () {});
    }

    var aboutEn = document.getElementById('aboutTextEn');
    var aboutHi = document.getElementById('aboutTextHi');
    if (aboutEn) aboutEn.textContent = data.en.about;
    if (aboutHi) aboutHi.textContent = data.hi.about;

    var sloganEn = document.querySelector('.hero-slogan .lang-en');
    var sloganHi = document.querySelector('.hero-slogan .lang-hi');
    if (sloganEn) sloganEn.textContent = data.en.slogan;
    if (sloganHi) sloganHi.textContent = data.hi.slogan;

    renderManifestoBothLanguages(data);

  } catch (err) {
    console.warn("Firestore content load failed, using defaults:", err);
    renderManifestoBothLanguages(DEFAULT_CONTENT);
  }
}

/* ============================================================
   SUPPORTER WALL — Live Counter & Cards
   ============================================================ */
function listenToSupporters() {
  if (!db) return;
  if (supporterUnsub) supporterUnsub();

  supporterUnsub = db.collection('supporters')
    .orderBy('createdAt', 'desc')
    .onSnapshot(function (snapshot) {
      allSupporters = [];
      snapshot.forEach(function (doc) {
        allSupporters.push(Object.assign({ id: doc.id }, doc.data()));
      });

      var counter = document.getElementById('supporterCount');
      if (counter) {
        counter.textContent = allSupporters.length.toLocaleString('en-IN');
      }

      renderSupporterWall(allSupporters.slice(0, 12));
    }, function (err) {
      console.warn("Supporter listener error:", err);
    });
}

function renderSupporterWall(supporters) {
  var wall = document.getElementById('supporterWall');
  if (!wall) return;

  if (!supporters.length) {
    wall.innerHTML = '<p class="text-center text-gray-500 col-span-full py-4">Be the first to support!</p>';
    return;
  }

  wall.innerHTML = supporters.map(function (s) {
    return '<div class="supporter-card">' +
      '<div class="s-name">' + escapeHtml(s.name || 'Anonymous') + '</div>' +
      '<div class="s-ward">' + escapeHtml(s.ward || 'Ward not specified') + '</div>' +
    '</div>';
  }).join('');
}

/* ============================================================
   AUTHENTICATION & SUPPORT REGISTRATION
   ============================================================ */
function initAuth() {
  if (!auth) {
    console.warn("Auth not available — skipping auth init");
    return;
  }

  var modal      = document.getElementById('authModal');
  var closeBtn   = document.getElementById('modalCloseBtn');
  var supportBtn = document.getElementById('supportBtn');
  var regBtn     = document.getElementById('registerSupportBtn');
  var googleBtn  = document.getElementById('googleLoginBtn');
  var emailBtn   = document.getElementById('emailLoginBtn');
  var authInfo   = document.getElementById('authUserInfo');

  if (supportBtn) {
    supportBtn.addEventListener('click', function () {
      if (modal) modal.style.display = 'flex';
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      if (modal) modal.style.display = 'none';
    });
  }
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  // Google login
  if (googleBtn) {
    googleBtn.addEventListener('click', async function () {
      var provider = new firebase.auth.GoogleAuthProvider();
      try {
        await auth.signInWithPopup(provider);
        if (modal) modal.style.display = 'none';
      } catch (err) {
        alert("Login failed: " + err.message);
      }
    });
  }

  // Email login / signup
  if (emailBtn) {
    emailBtn.addEventListener('click', async function () {
      var emailEl = document.getElementById('emailInput');
      var passEl  = document.getElementById('passwordInput');
      var email = (emailEl && emailEl.value || '').trim();
      var pass  = (passEl && passEl.value) || '';

      if (!email || !pass) { alert("Enter email & password"); return; }

      try {
        await auth.signInWithEmailAndPassword(email, pass);
        if (modal) modal.style.display = 'none';
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          try {
            await auth.createUserWithEmailAndPassword(email, pass);
            if (modal) modal.style.display = 'none';
          } catch (e2) {
            alert("Signup failed: " + e2.message);
          }
        } else {
          alert("Login failed: " + err.message);
        }
      }
    });
  }

  // Auth state listener
  auth.onAuthStateChanged(function (user) {
    if (user) {
      if (supportBtn) supportBtn.style.display = 'none';
      if (regBtn) regBtn.style.display = 'inline-block';
      if (authInfo) authInfo.textContent = "Signed in as " + (user.displayName || user.email);
    } else {
      if (supportBtn) supportBtn.style.display = 'inline-block';
      if (regBtn) regBtn.style.display = 'none';
      if (authInfo) authInfo.textContent = '';
    }
  });

  if (regBtn) {
    regBtn.addEventListener('click', registerSupport);
  }
}

async function registerSupport() {
  if (!auth || !db) { alert("Firebase not ready"); return; }

  var user = auth.currentUser;
  if (!user) { alert("Please sign in first."); return; }

  var name = prompt("Enter your name (or leave blank for Anonymous):", user.displayName || "");
  if (name === null) return;
  var ward = prompt("Enter your ward / village part:", "");
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
  if (!db) return;
  if (dynamicUnsub) dynamicUnsub();

  dynamicUnsub = db.collection('dynamic_sections')
    .orderBy('order', 'asc')
    .onSnapshot(function (snapshot) {
      var container = document.getElementById('dynamicSectionsContainer');
      if (!container) return;
      container.innerHTML = '';

      snapshot.forEach(function (doc) {
        var data = doc.data();
        var wrapper = document.createElement('div');
        wrapper.className = 'dynamic-block';
        wrapper.setAttribute('data-lang', data.lang || 'both');
        wrapper.setAttribute('data-id', doc.id);
        wrapper.innerHTML = data.html || '';
        container.appendChild(wrapper);
      });

      applyDynamicLangFilter();
    }, function (err) {
      console.warn("Dynamic listener error:", err);
    });
}

function applyDynamicLangFilter() {
  document.querySelectorAll('.dynamic-block').forEach(function (block) {
    var lang = block.getAttribute('data-lang');
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
  var langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', function () {
      setLanguage(currentLang === 'en' ? 'hi' : 'en');
    });
  }

  // Mobile hamburger
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
      });
    });
  }

  // Boot everything
  initJukebox();
  initAuth();
  loadSiteContent();
  listenToSupporters();
  loadDynamicSections();
  setLanguage('en');
}

/* ============================================================
   ADMIN DASHBOARD LOGIC
   Called from admin.html
   ============================================================ */
function initAdminPage() {
  console.log("🔐 Admin page initializing...");

  var gate      = document.getElementById('adminLoginGate');
  var dashboard = document.getElementById('adminDashboard');
  var loginBtn  = document.getElementById('adminLoginBtn');
  var logoutBtn = document.getElementById('adminLogoutBtn');
  var emailIn   = document.getElementById('adminEmailInput');
  var passIn    = document.getElementById('adminPasswordInput');
  var errorEl   = document.getElementById('adminLoginError');
  var emailDisp = document.getElementById('adminEmailDisplay');
  var loginText = document.getElementById('loginBtnText');

  if (!gate || !dashboard) {
    console.error("❌ Admin DOM elements missing");
    return;
  }

  if (!auth) {
    console.error("❌ Firebase Auth not available");
    if (errorEl) errorEl.textContent = "Firebase Auth not loaded.";
    return;
  }

  // Toast helper
  function showToast(msg, type) {
    type = type || 'info';
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }
  window.__adminToast = showToast;

  // AUTH STATE GUARD
  auth.onAuthStateChanged(function (user) {
    console.log("👤 Auth state:", user ? user.email : "logged out");

    if (user && user.email === ADMIN_EMAIL) {
      gate.style.display      = 'none';
      dashboard.style.display = 'block';
      if (emailDisp) emailDisp.textContent = user.email;

      initAdminTabs();
      initContentManager();
      initSupporterLog();
      initInjector();

      showToast("✅ Welcome, Admin!", "success");
    } else {
      gate.style.display      = 'flex';
      dashboard.style.display = 'none';

      if (user && user.email !== ADMIN_EMAIL) {
        auth.signOut();
        if (errorEl) errorEl.textContent = "❌ Not authorized as admin.";
      }
    }
  });

  // LOGIN BUTTON
  if (loginBtn) {
    loginBtn.addEventListener('click', async function () {
      var email = (emailIn && emailIn.value || '').trim();
      var pass  = (passIn && passIn.value) || '';

      if (!email || !pass) {
        if (errorEl) errorEl.textContent = "❌ Enter both email and password.";
        return;
      }

      if (loginText) loginText.innerHTML = '<span class="loader"></span> Signing in...';
      loginBtn.disabled = true;
      if (errorEl) errorEl.textContent = '';

      try {
        await auth.signInWithEmailAndPassword(email, pass);
        // onAuthStateChanged will handle the rest
      } catch (err) {
        console.error(err);
        if (errorEl) errorEl.textContent = "❌ " + (err.message || "Login failed");
      } finally {
        if (loginText) loginText.textContent = "Sign In";
        loginBtn.disabled = false;
      }
    });
  }

  if (passIn) {
    passIn.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && loginBtn) loginBtn.click();
    });
  }

  // LOGOUT
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      if (confirm("Logout from admin panel?")) {
        await auth.signOut();
        showToast("👋 Logged out", "info");
      }
    });
  }
}

/* ============================================================
   ADMIN TABS
   ============================================================ */
function initAdminTabs() {
  var tabs   = document.querySelectorAll('.admin-tab');
  var panels = document.querySelectorAll('.admin-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-tab');

      tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
      panels.forEach(function (p) {
        p.classList.toggle('active', p.id === 'tab-' + target);
      });
    });
  });
}

/* ============================================================
   CONTENT MANAGER
   ============================================================ */
function initContentManager() {
  var form = document.getElementById('contentForm');
  if (!form || !db) return;

  db.collection('site_content').doc('main').get().then(function (doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var en = data.en || {};
    var hi = data.hi || {};

    var el;
    if ((el = document.getElementById('sloganEn')))    el.value = en.slogan || '';
    if ((el = document.getElementById('sloganHi')))    el.value = hi.slogan || '';
    if ((el = document.getElementById('aboutEn')))     el.value = en.about || '';
    if ((el = document.getElementById('aboutHi')))     el.value = hi.about || '';
    if ((el = document.getElementById('manifestoEn'))) el.value = (en.manifesto || []).join('\n');
    if ((el = document.getElementById('manifestoHi'))) el.value = (hi.manifesto || []).join('\n');
  }).catch(function (err) {
    console.warn("Content load error:", err);
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var btn = document.getElementById('saveContentBtn');

    var payload = {
      en: {
        slogan:    (document.getElementById('sloganEn').value || '').trim(),
        about:     (document.getElementById('aboutEn').value || '').trim(),
        manifesto: (document.getElementById('manifestoEn').value || '')
                     .split('\n').map(function (l) { return l.trim(); }).filter(Boolean)
      },
      hi: {
        slogan:    (document.getElementById('sloganHi').value || '').trim(),
        about:     (document.getElementById('aboutHi').value || '').trim(),
        manifesto: (document.getElementById('manifestoHi').value || '')
                     .split('\n').map(function (l) { return l.trim(); }).filter(Boolean)
      }
    };

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="loader"></span> Saving...';
    }

    try {
      await db.collection('site_content').doc('main').set(payload, { merge: true });
      if (window.__adminToast) window.__adminToast("✅ Content saved!", "success");
    } catch (err) {
      console.error(err);
      if (window.__adminToast) window.__adminToast("❌ Save failed: " + err.message, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = "💾 Save Content";
      }
    }
  });
}

/* ============================================================
   SUPPORTER LOG (Live table + search + sort + CSV)
   ============================================================ */
function initSupporterLog() {
  var tbody     = document.getElementById('supporterTableBody');
  var searchEl  = document.getElementById('supporterSearch');
  var sortEl    = document.getElementById('supporterSort');
  var exportBtn = document.getElementById('exportCsvBtn');
  var countLbl  = document.getElementById('supporterCountLabel');

  if (!tbody || !db) return;

  var liveData = [];

  db.collection('supporters').orderBy('createdAt', 'desc')
    .onSnapshot(function (snapshot) {
      liveData = [];
      snapshot.forEach(function (doc) {
        liveData.push(Object.assign({ id: doc.id }, doc.data()));
      });
      renderSupporterTable(liveData);
      if (countLbl) countLbl.textContent = "Total: " + liveData.length + " supporters";
    }, function (err) {
      console.warn("Supporter listener error:", err);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#dc2626;padding:1rem;">Failed to load</td></tr>';
    });

  function renderSupporterTable(data) {
    var query = (searchEl.value || '').toLowerCase();
    var sort  = sortEl.value;

    var filtered = data.filter(function (s) {
      return (s.name || '').toLowerCase().indexOf(query) !== -1 ||
             (s.ward || '').toLowerCase().indexOf(query) !== -1;
    });

    if (sort === 'name') {
      filtered.sort(function (a, b) {
        return (a.name || '').localeCompare(b.name || '');
      });
    } else if (sort === 'oldest') {
      filtered.sort(function (a, b) {
        return ((a.createdAt && a.createdAt.seconds) || 0) - ((b.createdAt && b.createdAt.seconds) || 0);
      });
    } else {
      filtered.sort(function (a, b) {
        return ((b.createdAt && b.createdAt.seconds) || 0) - ((a.createdAt && a.createdAt.seconds) || 0);
      });
    }

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:1.5rem;">No supporters found</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (s, i) {
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + escapeHtml(s.name || '—') + '</td>' +
        '<td>' + escapeHtml(s.ward || '—') + '</td>' +
        '<td><code style="font-size:0.78rem;">' + escapeHtml((s.uid || '').slice(0, 10)) + '…</code></td>' +
        '<td>' + (s.createdAt ? new Date(s.createdAt.seconds * 1000).toLocaleString() : '—') + '</td>' +
      '</tr>';
    }).join('');
  }

  if (searchEl) searchEl.addEventListener('input', function () { renderSupporterTable(liveData); });
  if (sortEl)   sortEl.addEventListener('change', function () { renderSupporterTable(liveData); });

  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      if (!liveData.length) {
        if (window.__adminToast) window.__adminToast("No data to export", "info");
        return;
      }

      var rows = [['Name', 'Ward', 'UID', 'Email', 'Date']];
      liveData.forEach(function (s) {
        rows.push([
          s.name || '',
          s.ward || '',
          s.uid || '',
          s.email || '',
          s.createdAt ? new Date(s.createdAt.seconds * 1000).toISOString() : ''
        ]);
      });

      var csv = rows.map(function (r) {
        return r.map(function (cell) {
          return '"' + String(cell).replace(/"/g, '""') + '"';
        }).join(',');
      }).join('\n');

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var url  = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'supporters_' + Date.now() + '.csv';
      link.click();
      URL.revokeObjectURL(url);

      if (window.__adminToast) window.__adminToast("✅ CSV downloaded", "success");
    });
  }
}

/* ============================================================
   CUSTOM CODE INJECTOR
   ============================================================ */
function initInjector() {
  var form   = document.getElementById('injectorForm');
  var listEl = document.getElementById('dynamicListContainer');
  if (!form || !listEl || !db) return;

  db.collection('dynamic_sections').orderBy('order', 'asc')
    .onSnapshot(function (snapshot) {
      if (snapshot.empty) {
        listEl.innerHTML = '<p style="color:#94a3b8; font-size:0.9rem;">No dynamic sections published yet.</p>';
        return;
      }

      listEl.innerHTML = '';
      snapshot.forEach(function (doc) {
        var data = doc.data();
        var html = data.html || '';
        var preview = html.length > 80 ? html.slice(0, 80) + '…' : html;

        var item = document.createElement('div');
        item.className = 'dynamic-item';
        item.innerHTML =
          '<div style="flex:1; min-width:0;">' +
            '<code>' + escapeHtml(preview) + '</code>' +
            '<div class="meta">Order: <strong>' + (data.order || '—') + '</strong> · ' +
            'Lang: <strong>' + (data.lang || 'both') + '</strong></div>' +
          '</div>' +
          '<button class="btn-danger" data-id="' + doc.id + '">Delete</button>';

        listEl.appendChild(item);
      });

      listEl.querySelectorAll('.btn-danger').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var id = btn.getAttribute('data-id');
          if (confirm("Delete this dynamic section?")) {
            try {
              await db.collection('dynamic_sections').doc(id).delete();
              if (window.__adminToast) window.__adminToast("🗑 Deleted", "success");
            } catch (err) {
              if (window.__adminToast) window.__adminToast("❌ Delete failed", "error");
            }
          }
        });
      });
    }, function (err) {
      console.warn("Dynamic list error:", err);
      listEl.innerHTML = '<p style="color:#dc2626;">Failed to load sections</p>';
    });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var html  = (document.getElementById('customCode').value || '').trim();
    var order = parseInt(document.getElementById('codeOrder').value) || 1;
    var lang  = document.getElementById('codeLang').value;
    var btn   = document.getElementById('publishSectionBtn');

    if (!html) {
      if (window.__adminToast) window.__adminToast("❌ Enter some code first", "error");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="loader"></span> Publishing...';
    }

    try {
      await db.collection('dynamic_sections').add({
        html: html,
        order: order,
        lang: lang,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (window.__adminToast) window.__adminToast("✅ Section published!", "success");

      form.reset();
      document.getElementById('codeOrder').value = 1;
    } catch (err) {
      console.error(err);
      if (window.__adminToast) window.__adminToast("❌ Publish failed: " + err.message, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = "🚀 Publish Section";
      }
    }
  });
}

/* ============================================================
   EXPOSE TO GLOBAL
   ============================================================ */
window.initAdminPage = initAdminPage;

/* ============================================================
   AUTO-DETECT PAGE & BOOTSTRAP
   - If public page → initPublicPage
   - If admin page → initAdminPage
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  // Public page detection (has manifestoGrid)
  if (document.getElementById('manifestoGrid')) {
    initPublicPage();
  }

  // Admin page detection (has adminLoginGate)
  if (document.getElementById('adminLoginGate')) {
    // Slight delay to ensure Firebase is ready
    setTimeout(function () {
      initAdminPage();
    }, 200);
  }
});
