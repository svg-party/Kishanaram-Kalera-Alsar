/* ============================================================
   LACHHARSAR ADMIN LOGIC
   ============================================================ */

const auth = firebase.auth();
const db = firebase.firestore();

function toast(msg, type = 'info') {
  const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#0c2340';
  const t = document.createElement('div');
  t.style.cssText = `position:fixed; top:1.5rem; right:1.5rem; padding:0.9rem 1.3rem; border-radius:12px; color:#fff; font-weight:600; z-index:9999; font-size:0.9rem; box-shadow:0 10px 30px rgba(0,0,0,0.2); background:${bg}; max-width:320px;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* AUTH GUARD */
auth.onAuthStateChanged(user => {
  if (!user || user.email !== ADMIN_EMAIL) {
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('userEmail').textContent = user.email;
  initDashboard(user);
});

/* LOGOUT */
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  if (confirm('Logout?')) auth.signOut().then(() => window.location.href = 'login.html');
});

/* TABS */
document.querySelectorAll('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

function initDashboard(user) {
  initPopups(user);
  initThemes(user);
  initGallery(user);
  initPages();
}

/* ============================================================
   POPUPS
   ============================================================ */
let editingPopupId = null;

function initPopups(user) {
  const form = document.getElementById('popupForm');
  if (!form) return;

  document.getElementById('pScope').addEventListener('change', e => {
    const v = e.target.value;
    document.getElementById('scopeListWrap').style.display = v === 'list' ? 'block' : 'none';
    document.getElementById('scopeRegexWrap').style.display = v === 'regex' ? 'block' : 'none';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      title: document.getElementById('pTitle').value.trim(),
      body: document.getElementById('pBody').value.trim(),
      category: document.getElementById('pCategory').value.trim(),
      customHTML: document.getElementById('pCustomHTML').value.trim(),
      url: document.getElementById('pUrl').value.trim(),
      buttonLabel: document.getElementById('pButtonLabel').value.trim(),
      imageUrl: document.getElementById('pImageUrl').value.trim(),
      scheduleFrom: document.getElementById('pFrom').value,
      scheduleTo: document.getElementById('pTo').value,
      isActive: document.getElementById('pActive').checked,
      rank: parseInt(document.getElementById('pRank').value) || 1,
      scope: document.getElementById('pScope').value,
      scopeList: document.getElementById('pScopeList').value.split(',').map(s => s.trim()).filter(Boolean),
      scopeRegex: document.getElementById('pScopeRegex').value.trim(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      if (editingPopupId) {
        await db.collection('popups').doc(editingPopupId).update(data);
        toast('✅ Popup updated', 'success');
      } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        data.createdBy = user.email;
        await db.collection('popups').add(data);
        toast('✅ Popup created', 'success');
      }
      resetPopupForm();
    } catch (err) {
      toast('❌ ' + err.message, 'error');
    }
  });

  document.getElementById('cancelBtn').addEventListener('click', resetPopupForm);

  db.collection('popups').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const html = snap.docs.map(doc => {
      const d = doc.data();
      return `<div class="list-item">
        <div>
          <strong>${d.title || '(no title)'}</strong>
          <span class="badge">${d.scope || 'global'}</span>
          <span class="status ${d.isActive ? 'on' : 'off'}">${d.isActive ? '● Active' : '● Inactive'}</span>
          <div class="meta">Rank: ${d.rank || 1} · Type: ${d.customHTML ? 'HTML' : d.imageUrl ? 'Image' : 'Text'}</div>
        </div>
        <div>
          <button class="btn-mini" onclick="editPopup('${doc.id}')">Edit</button>
          <button class="btn-mini danger" onclick="deletePopup('${doc.id}')">Delete</button>
        </div>
      </div>`;
    }).join('');
    document.getElementById('popupsList').innerHTML = html || '<p>No popups yet.</p>';
  });
}

function resetPopupForm() {
  editingPopupId = null;
  document.getElementById('popupForm').reset();
  document.getElementById('scopeListWrap').style.display = 'none';
  document.getElementById('scopeRegexWrap').style.display = 'none';
}

window.editPopup = async function (id) {
  const doc = await db.collection('popups').doc(id).get();
  if (!doc.exists) return;
  const d = doc.data();
  editingPopupId = id;
  document.getElementById('pTitle').value = d.title || '';
  document.getElementById('pBody').value = d.body || '';
  document.getElementById('pCategory').value = d.category || '';
  document.getElementById('pCustomHTML').value = d.customHTML || '';
  document.getElementById('pUrl').value = d.url || '';
  document.getElementById('pButtonLabel').value = d.buttonLabel || '';
  document.getElementById('pImageUrl').value = d.imageUrl || '';
  document.getElementById('pFrom').value = d.scheduleFrom || '';
  document.getElementById('pTo').value = d.scheduleTo || '';
  document.getElementById('pActive').checked = !!d.isActive;
  document.getElementById('pRank').value = d.rank || 1;
  document.getElementById('pScope').value = d.scope || 'global';
  document.getElementById('pScope').dispatchEvent(new Event('change'));
  document.getElementById('pScopeList').value = (d.scopeList || []).join(', ');
  document.getElementById('pScopeRegex').value = d.scopeRegex || '';
  window.scrollTo(0, 0);
  toast('✏️ Editing popup', 'info');
};

window.deletePopup = async function (id) {
  if (!confirm('Delete this popup?')) return;
  await db.collection('popups').doc(id).delete();
  toast('🗑 Deleted', 'success');
};

/* ============================================================
   THEMES
   ============================================================ */
const PRESETS = {
  default: { label: 'Default (Navy + Saffron)', styles: '' },
  dark: { label: 'Dark Mode', styles: `:root { --bg: #0f172a; --text: #e2e8f0; --light-bg: #1e293b; } body { background: #0f172a; color: #e2e8f0; } .navbar, .footer { background: #020617; } .info-card, .about-block, .contact-card, .gallery-item { background: #1e293b; color: #e2e8f0; } .info-card h4, .about-block h2, .contact-card h4 { color: #ff9933; } .info-table td:last-child { color: #e2e8f0; }` },
  green: { label: 'Green (Nature)', styles: `:root { --primary: #14532d; --accent: #84cc16; }` },
  maroon: { label: 'Maroon (Royal)', styles: `:root { --primary: #7f1d1d; --accent: #fbbf24; }` },
  purple: { label: 'Purple', styles: `:root { --primary: #4c1d95; --accent: #f472b6; }` },
  ocean: { label: 'Ocean Blue', styles: `:root { --primary: #0c4a6e; --accent: #06b6d4; }` }
};

function initThemes(user) {
  const grid = document.getElementById('presetGrid');
  if (grid) {
    grid.innerHTML = Object.entries(PRESETS).map(([k, v]) =>
      `<button class="preset-btn" data-key="${k}">${v.label}</button>`
    ).join('');

    grid.querySelectorAll('.preset-btn').forEach(btn => {
      btn.onclick = () => applyPreset(btn.dataset.key, user);
    });
  }

  document.getElementById('themeForm').addEventListener('submit', async e => {
    e.preventDefault();
    const key = document.getElementById('tKey').value.trim() || 'custom';
    const label = document.getElementById('tLabel').value.trim() || 'Custom';
    const styles = document.getElementById('tStyles').value.trim();
    if (!styles) return toast('CSS required', 'error');

    await db.collection('settings').doc('theme').set({
      key, label, styles, isCustom: true,
      updatedBy: user.email,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('✅ Theme applied', 'success');
  });

  document.getElementById('resetTheme').addEventListener('click', async () => {
    if (!confirm('Reset to default theme?')) return;
    await db.collection('settings').doc('theme').delete();
    toast('🎨 Reset to default', 'info');
  });

  db.collection('settings').doc('theme').onSnapshot(doc => {
    const el = document.getElementById('activeThemeInfo');
    if (!el) return;
    if (doc.exists) {
      const d = doc.data();
      el.innerHTML = `Active Theme: <strong>${d.label}</strong> · Applied by ${d.updatedBy || '—'}`;
    } else {
      el.innerHTML = 'Active Theme: <strong>Default</strong>';
    }
  });
}

async function applyPreset(key, user) {
  if (key === 'default') {
    await db.collection('settings').doc('theme').delete();
    toast('🎨 Default theme', 'success');
    return;
  }
  await db.collection('settings').doc('theme').set({
    key,
    label: PRESETS[key].label,
    styles: PRESETS[key].styles,
    isCustom: false,
    updatedBy: user.email,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  toast('🎨 Theme applied: ' + PRESETS[key].label, 'success');
}

/* ============================================================
   GALLERY
   ============================================================ */
function initGallery(user) {
  const form = document.getElementById('galleryForm');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const url = document.getElementById('gImgUrl').value.trim();
      if (!url) return toast('Image URL required', 'error');

      await db.collection('gallery').add({
        imageUrl: url,
        captionHi: document.getElementById('gCapHi').value.trim(),
        captionEn: document.getElementById('gCapEn').value.trim(),
        order: Date.now(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      toast('✅ Image added', 'success');
      form.reset();
    });
  }

  db.collection('gallery').orderBy('order', 'desc').onSnapshot(snap => {
    const list = document.getElementById('galleryList');
    if (!list) return;
    if (snap.empty) { list.innerHTML = '<p>No images yet.</p>'; return; }

    list.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      return `<div class="list-item">
        <img src="${d.imageUrl}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;" />
        <div style="flex:1;">
          <strong>${d.captionHi || d.captionEn || '(no caption)'}</strong>
        </div>
        <button class="btn-mini danger" onclick="deleteGalleryItem('${doc.id}')">Delete</button>
      </div>`;
    }).join('');
  });
}

window.deleteGalleryItem = async function (id) {
  if (!confirm('Delete this image?')) return;
  await db.collection('gallery').doc(id).delete();
  toast('🗑 Deleted', 'success');
};

/* ============================================================
   PAGES
   ============================================================ */
function initPages() {
  const list = document.getElementById('pagesList');
  if (!list) return;
  const pages = ['index.html', 'about.html', 'panchayat.html', 'gallery.html', 'contact.html'];
  list.innerHTML = pages.map(p => `
    <div class="list-item">
      <div>
        <strong>${p}</strong>
        <div class="meta"><a href="../${p}" target="_blank">Open page →</a></div>
      </div>
    </div>
  `).join('');
}