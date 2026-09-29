/* ============================================================
   LACHHARSAR ADMIN — Management Logic
   ============================================================ */

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, type = 'info') {
  const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#0c2340';
  const t = document.createElement('div');
  t.style.cssText = `position:fixed; top:1.5rem; right:1.5rem; padding:0.9rem 1.3rem; border-radius:12px; color:#fff; font-weight:600; z-index:9999; font-size:0.9rem; box-shadow:0 10px 30px rgba(0,0,0,0.2); background:${bg}; max-width:320px;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
window.__toast = showToast;

/* ============================================================
   TABS
   ============================================================ */
function initAdminTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.admin-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      panels.forEach(p => p.classList.toggle('active', p.id === 'tab-' + target));
    });
  });
}

/* ============================================================
   LOAD + SAVE ALL FORMS
   ============================================================ */
function initAdminForms() {
  loadGeneralForm();
  loadHeroForm();
  loadAboutForm();
  loadPanchayatForm();
  loadContactForm();
  loadNotices();
  loadPopup();
  loadThemeForm();
  loadGalleryList();

  bindForm('generalForm', saveGeneral);
  bindForm('heroForm', saveHero);
  bindForm('aboutForm', saveAbout);
  bindForm('panchayatForm', savePanchayat);
  bindForm('contactForm', saveContact);
  bindForm('noticeForm', saveNotice);
  bindForm('popupForm', savePopup);
  bindForm('themeForm', saveTheme);
  bindForm('galleryForm', saveGalleryItem);

  const previewBtn = document.getElementById('popupPreviewBtn');
  if (previewBtn) previewBtn.addEventListener('click', previewPopup);

  const disableBtn = document.getElementById('popupDisableBtn');
  if (disableBtn) disableBtn.addEventListener('click', async () => {
    await db.collection('popup').doc('main').set({ isActive: false }, { merge: true });
    const cb = document.getElementById('popupActive');
    if (cb) cb.checked = false;
    showToast("🚫 Popup disabled", "info");
  });
}

function bindForm(id, handler) {
  const form = document.getElementById(id);
  if (form) form.addEventListener('submit', handler);
}

/* ============================================================
   GENERAL
   ============================================================ */
async function loadGeneralForm() {
  const doc = await db.collection('site').doc('general').get();
  if (!doc.exists) return;
  const d = doc.data();
  if (d.siteName) {
    setVal('siteNameHi', d.siteName.hi || '');
    setVal('siteNameEn', d.siteName.en || '');
  }
  if (d.logoUrl) setVal('logoUrl', d.logoUrl);
  if (d.faviconUrl) setVal('faviconUrl', d.faviconUrl);
  if (d.footerText) {
    setVal('footerHi', d.footerText.hi || '');
    setVal('footerEn', d.footerText.en || '');
  }
}

async function saveGeneral(e) {
  e.preventDefault();
  try {
    await db.collection('site').doc('general').set({
      siteName: { hi: getVal('siteNameHi'), en: getVal('siteNameEn') },
      logoUrl: getVal('logoUrl'),
      faviconUrl: getVal('faviconUrl'),
      footerText: { hi: getVal('footerHi'), en: getVal('footerEn') }
    }, { merge: true });
    showToast("✅ General saved", "success");
  } catch (err) { showToast("❌ " + err.message, "error"); }
}

/* ============================================================
   HERO
   ============================================================ */
async function loadHeroForm() {
  const doc = await db.collection('site').doc('hero').get();
  if (!doc.exists) return;
  const d = doc.data();
  if (d.tagline) {
    setVal('heroTagHi', d.tagline.hi || '');
    setVal('heroTagEn', d.tagline.en || '');
  }
  if (d.villageName) {
    setVal('heroNameHi', d.villageName.hi || '');
    setVal('heroNameEn', d.villageName.en || '');
  }
  if (d.description) {
    setVal('heroDescHi', d.description.hi || '');
    setVal('heroDescEn', d.description.en || '');
  }
  if (d.imageUrl) setVal('heroImageUrl', d.imageUrl);
}

async function saveHero(e) {
  e.preventDefault();
  try {
    await db.collection('site').doc('hero').set({
      tagline: { hi: getVal('heroTagHi'), en: getVal('heroTagEn') },
      villageName: { hi: getVal('heroNameHi'), en: getVal('heroNameEn') },
      description: { hi: getVal('heroDescHi'), en: getVal('heroDescEn') },
      imageUrl: getVal('heroImageUrl')
    }, { merge: true });
    showToast("✅ Hero saved", "success");
  } catch (err) { showToast("❌ " + err.message, "error"); }
}

/* ============================================================
   ABOUT
   ============================================================ */
async function loadAboutForm() {
  const doc = await db.collection('site').doc('about').get();
  if (!doc.exists) return;
  const d = doc.data();
  setVal('aboutHi', d.contentHi || '');
  setVal('aboutEn', d.contentEn || '');
}

async function saveAbout(e) {
  e.preventDefault();
  try {
    await db.collection('site').doc('about').set({
      contentHi: getVal('aboutHi'),
      contentEn: getVal('aboutEn')
    }, { merge: true });
    showToast("✅ About saved", "success");
  } catch (err) { showToast("❌ " + err.message, "error"); }
}

/* ============================================================
   PANCHAYAT
   ============================================================ */
async function loadPanchayatForm() {
  const doc = await db.collection('site').doc('panchayat').get();
  if (!doc.exists) return;
  const d = doc.data();
  setVal('sarpanchName', d.sarpanchName || '');
  setVal('sarpanchPhone', d.sarpanchPhone || '');
  setVal('secretaryName', d.secretaryName || '');
  setVal('secretaryPhone', d.secretaryPhone || '');
  setVal('panchayatAddress', d.address || '');
}

async function savePanchayat(e) {
  e.preventDefault();
  try {
    await db.collection('site').doc('panchayat').set({
      sarpanchName: getVal('sarpanchName'),
      sarpanchPhone: getVal('sarpanchPhone'),
      secretaryName: getVal('secretaryName'),
      secretaryPhone: getVal('secretaryPhone'),
      address: getVal('panchayatAddress')
    }, { merge: true });
    showToast("✅ Panchayat saved", "success");
  } catch (err) { showToast("❌ " + err.message, "error"); }
}

/* ============================================================
   CONTACT
   ============================================================ */
async function loadContactForm() {
  const doc = await db.collection('site').doc('contact').get();
  if (!doc.exists) return;
  const d = doc.data();
  setVal('contactPhone1', d.phone1 || '');
  setVal('contactPhone2', d.phone2 || '');
  setVal('contactEmail', d.email || '');
  setVal('contactWhatsapp', d.whatsapp || '');
  setVal('contactAddress', d.address || '');
}

async function saveContact(e) {
  e.preventDefault();
  try {
    await db.collection('site').doc('contact').set({
      phone1: getVal('contactPhone1'),
      phone2: getVal('contactPhone2'),
      email: getVal('contactEmail'),
      whatsapp: getVal('contactWhatsapp'),
      address: getVal('contactAddress')
    }, { merge: true });
    showToast("✅ Contact saved", "success");
  } catch (err) { showToast("❌ " + err.message, "error"); }
}

/* ============================================================
   NOTICES
   ============================================================ */
async function saveNotice(e) {
  e.preventDefault();
  try {
    await db.collection('notices').add({
      titleHi: getVal('noticeTitleHi'),
      titleEn: getVal('noticeTitleEn'),
      bodyHi: getVal('noticeBodyHi'),
      bodyEn: getVal('noticeBodyEn'),
      isActive: document.getElementById('noticeActive').checked,
      isPinned: document.getElementById('noticePinned').checked,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast("✅ Notice published", "success");
    e.target.reset();
    document.getElementById('noticeActive').checked = true;
  } catch (err) { showToast("❌ " + err.message, "error"); }
}

function loadNotices() {
  const list = document.getElementById('noticesList');
  if (!list) return;
  db.collection('notices').orderBy('createdAt', 'desc').onSnapshot(snap => {
    if (snap.empty) { list.innerHTML = '<p style="color:#94a3b8;">No notices yet</p>'; return; }
    list.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const el = document.createElement('div');
      el.className = 'dynamic-item';
      el.innerHTML = `
        <div style="flex:1; min-width:0;">
          <strong style="color:#0c2340;">${escapeHtml(d.titleHi || d.titleEn || '—')}</strong>
          <div class="meta">
            <span style="color:${d.isActive ? '#16a34a' : '#dc2626'}; font-weight:600;">
              ${d.isActive ? '● Active' : '● Inactive'}
            </span>
            ${d.isPinned ? ' · 📌 Pinned' : ''}
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-danger notice-toggle" data-id="${doc.id}" data-active="${d.isActive}">
            ${d.isActive ? 'Disable' : 'Enable'}
          </button>
          <button class="btn-danger notice-del" data-id="${doc.id}">Delete</button>
        </div>
      `;
      list.appendChild(el);
    });
    list.querySelectorAll('.notice-toggle').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const wasActive = btn.getAttribute('data-active') === 'true';
        await db.collection('notices').doc(id).update({ isActive: !wasActive });
      });
    });
    list.querySelectorAll('.notice-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this notice?')) return;
        await db.collection('notices').doc(btn.getAttribute('data-id')).delete();
      });
    });
  });
}

/* ============================================================
   POPUP
   ============================================================ */
async function loadPopup() {
  const doc = await db.collection('popup').doc('main').get();
  if (!doc.exists) return;
  const d = doc.data();
  setVal('popupType', d.type || 'image');
  setVal('popupContent', d.content || '');
  setVal('popupFrequency', d.frequency || 'once');
  const active = document.getElementById('popupActive');
  if (active) active.checked = !!d.isActive;
}

async function savePopup(e) {
  e.preventDefault();
  try {
    await db.collection('popup').doc('main').set({
      type: getVal('popupType'),
      content: getVal('popupContent'),
      frequency: getVal('popupFrequency'),
      isActive: document.getElementById('popupActive').checked,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    showToast("✅ Popup saved", "success");
  } catch (err) { showToast("❌ " + err.message, "error"); }
}

function previewPopup() {
  const type = getVal('popupType');
  const content = getVal('popupContent');
  if (!content) { showToast("Add content first", "error"); return; }

  let html = type === 'image'
    ? `<img src="${content}" style="width:100%; max-width:500px; border-radius:16px;" />`
    : content;

  const preview = document.createElement('div');
  preview.className = 'popup-overlay';
  preview.style.display = 'flex';
  preview.innerHTML = `
    <div class="popup-box">
      <button class="popup-close" onclick="this.parentElement.parentElement.remove()">✕</button>
      <div class="popup-content">${html}</div>
    </div>`;
  document.body.appendChild(preview);
  preview.addEventListener('click', e => { if (e.target === preview) preview.remove(); });
}

/* ============================================================
   THEME
   ============================================================ */
async function loadThemeForm() {
  const doc = await db.collection('site').doc('theme').get();
  if (!doc.exists) return;
  const d = doc.data();
  if (d.primary) setVal('themePrimary', d.primary);
  if (d.accent)  setVal('themeAccent', d.accent);
  if (d.bg)      setVal('themeBg', d.bg);
  if (d.text)    setVal('themeText', d.text);
}

async function saveTheme(e) {
  e.preventDefault();
  try {
    await db.collection('site').doc('theme').set({
      primary: getVal('themePrimary'),
      accent: getVal('themeAccent'),
      bg: getVal('themeBg'),
      text: getVal('themeText')
    }, { merge: true });
    showToast("✅ Theme saved", "success");
  } catch (err) { showToast("❌ " + err.message, "error"); }
}

/* ============================================================
   GALLERY
   ============================================================ */
async function saveGalleryItem(e) {
  e.preventDefault();
  try {
    await db.collection('gallery').add({
      imageUrl: getVal('galleryImageUrl'),
      captionHi: getVal('galleryCaptionHi'),
      captionEn: getVal('galleryCaptionEn'),
      order: Date.now(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast("✅ Image added", "success");
    e.target.reset();
  } catch (err) { showToast("❌ " + err.message, "error"); }
}

function loadGalleryList() {
  const list = document.getElementById('galleryList');
  if (!list) return;
  db.collection('gallery').orderBy('order', 'desc').onSnapshot(snap => {
    if (snap.empty) { list.innerHTML = '<p style="color:#94a3b8;">No images</p>'; return; }
    list.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const el = document.createElement('div');
      el.className = 'dynamic-item';
      el.innerHTML = `
        <img src="${d.imageUrl}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;" />
        <div style="flex:1; min-width:0;">
          <strong>${escapeHtml(d.captionHi || d.captionEn || '—')}</strong>
        </div>
        <button class="btn-danger gallery-del" data-id="${doc.id}">Delete</button>
      `;
      list.appendChild(el);
    });
    list.querySelectorAll('.gallery-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this image?')) return;
        await db.collection('gallery').doc(btn.getAttribute('data-id')).delete();
      });
    });
  });
}

/* ============================================================
   HELPERS
   ============================================================ */
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}
function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}