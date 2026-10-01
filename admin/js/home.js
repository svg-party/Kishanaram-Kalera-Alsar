/* ============================================================
   HOME PAGE — Dynamic Sections Editor (with Hashtag support)
   Firestore: site_content/home
   ============================================================ */

const FIRESTORE_DOC = 'home';

guardAdmin(function (user) {
  console.log("✅ Home editor ready:", user.email);
  loadSections();
});

let sections = [];
let editingSectionId = null;
let currentType = null;
let dragSrcIndex = null;

const TYPE_INFO = {
  table: { label: 'Table', hint: 'Key-Value pairs — जैसे "जनसंख्या: 9,459"' },
  list: { label: 'List', hint: 'Bullet points — जैसे "सिकराली — 11 किमी"' },
  cards: { label: 'Cards', hint: 'Grid of cards — icon + title + subtitle' },
  html: { label: 'Custom HTML', hint: 'Raw HTML — जो चाहो बनाओ' }
};

/* ============================================================
   DEFAULT SECTIONS — Home के लिए
   ============================================================ */
function getDefaultSections() {
  return [
    {
      id: 'sec_home_1',
      type: 'cards',
      title: '🎯 हमारे बारे में एक नज़र',
      hash: 'about',
      order: 1,
      data: {
        cards: [
          { icon: '🏏', name: 'क्रिकेट स्टेडियम', role: 'इंटरनेशनल लेवल' },
          { icon: '📚', name: 'डिजिटल लाइब्रेरी', role: 'AC + WiFi' },
          { icon: '🎓', name: 'शिक्षा', role: 'बेहतर स्कूल' },
          { icon: '🌾', name: 'कृषि', role: 'किसानों का साथ' }
        ]
      }
    },
    {
      id: 'sec_home_2',
      type: 'table',
      title: '📊 गाँव की जानकारी',
      hash: 'info',
      order: 2,
      data: {
        rows: [
          { key: 'जनसंख्या', value: '9,459' },
          { key: 'परिवार', value: '1,405' },
          { key: 'क्षेत्रफल', value: '~100.9 वर्ग किमी' },
          { key: 'पिन कोड', value: '331802' }
        ]
      }
    }
  ];
}

/* ============================================================
   LOAD
   ============================================================ */
async function loadSections() {
  try {
    const doc = await db.collection('site_content').doc(FIRESTORE_DOC).get();
    if (doc.exists && doc.data().sections) {
      sections = doc.data().sections;
      console.log("📥 Loaded", sections.length, "sections");
    } else {
      sections = getDefaultSections();
      await saveToFirestore();
    }
    renderSections();
  } catch (err) {
    console.error("Load error:", err);
    toast("❌ Load failed: " + err.message, "error");
    sections = getDefaultSections();
    renderSections();
  }
}

/* ============================================================
   RENDER
   ============================================================ */
function renderSections() {
  const container = document.getElementById('secList');
  if (!container) return;

  if (!sections.length) {
    container.innerHTML =
      '<div style="text-align:center; padding:3rem 2rem; background:#fff; border-radius:16px; border:2px dashed #e2e8f0;">' +
      '<div style="font-size:3rem; opacity:0.4;">📄</div>' +
      '<h3 style="color:#0c2340; font-weight:800; margin:0.75rem 0 0.35rem;">No sections yet</h3>' +
      '<p style="color:#64748b;">"➕ नया Section जोड़ो" दबाओ</p>' +
      '</div>';
    return;
  }

  const sorted = sections.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  container.innerHTML = '';

  sorted.forEach(function (sec, idx) {
    const card = document.createElement('div');
    card.className = 'sec-card';
    card.draggable = true;
    card.dataset.id = sec.id;
    card.dataset.index = idx;

    const typeInfo = TYPE_INFO[sec.type] || TYPE_INFO.table;
    const hashBadge = sec.hash
      ? '<span class="hash-badge">#' + escapeHtml(sec.hash) + '</span>'
      : '<span style="color:#cbd5e1; font-size:0.75rem;">— no hashtag —</span>';

    card.innerHTML =
      '<div class="sec-info">' +
        '<h4>' + escapeHtml(sec.title) + '</h4>' +
        '<div class="meta">' +
          '<span class="type-badge ' + sec.type + '">' + typeInfo.label + '</span>' +
          hashBadge +
          '<span>Order: ' + (sec.order || idx + 1) + '</span>' +
          '<span>' + getItemCountText(sec) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="sec-actions">' +
        '<button class="move" onclick="moveSection(\'' + sec.id + '\', -1)">⬆️</button>' +
        '<button class="move" onclick="moveSection(\'' + sec.id + '\', 1)">⬇️</button>' +
        '<button onclick="openSectionModal(\'edit\', \'' + sec.id + '\')">✏️</button>' +
        '<button class="danger" onclick="deleteSection(\'' + sec.id + '\')">🗑️</button>' +
      '</div>';

    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragend', handleDragEnd);
    container.appendChild(card);
  });
}

function getItemCountText(sec) {
  if (sec.type === 'html') return 'Custom HTML';
  if (sec.type === 'table') return (sec.data?.rows?.length || 0) + ' rows';
  if (sec.type === 'list') return (sec.data?.items?.length || 0) + ' items';
  if (sec.type === 'cards') return (sec.data?.cards?.length || 0) + ' cards';
  return '';
}

/* ============================================================
   MODAL
   ============================================================ */
window.openSectionModal = function (mode, sectionId) {
  const modal = document.getElementById('secModal');
  const title = document.getElementById('modalTitle');
  const sub = document.getElementById('modalSub');
  const typeSelectorWrap = document.getElementById('typeSelectorWrap');
  const contentArea = document.getElementById('contentArea');
  const secTitleInput = document.getElementById('secTitle');
  const secHashInput = document.getElementById('secHash');

  contentArea.innerHTML = '';
  secTitleInput.value = '';
  secHashInput.value = '';

  if (mode === 'edit' && sectionId) {
    editingSectionId = sectionId;
    const sec = sections.find(function (s) { return s.id === sectionId; });
    if (!sec) return;
    title.textContent = 'Edit Section';
    sub.textContent = 'Title, hashtag, और content बदलो';
    typeSelectorWrap.style.display = 'none';
    secTitleInput.value = sec.title || '';
    secHashInput.value = sec.hash || '';
    currentType = sec.type;
    renderContentFields(sec.type, sec.data || {});
  } else {
    editingSectionId = null;
    currentType = null;
    title.textContent = 'Add New Section';
    sub.textContent = 'Section का type, title, और hashtag चुनो';
    typeSelectorWrap.style.display = 'block';
    document.querySelectorAll('.type-option').forEach(function (el) { el.classList.remove('active'); });
    document.getElementById('typeInfo').style.display = 'none';
  }

  modal.classList.add('active');
};

window.closeSectionModal = function () {
  document.getElementById('secModal').classList.remove('active');
  editingSectionId = null;
  currentType = null;
};

window.selectType = function (type) {
  currentType = type;
  document.querySelectorAll('.type-option').forEach(function (el) {
    el.classList.toggle('active', el.dataset.type === type);
  });
  const info = document.getElementById('typeInfo');
  info.textContent = 'ℹ️ ' + TYPE_INFO[type].hint;
  info.style.display = 'block';

  let defaultData = {};
  if (type === 'table') defaultData = { rows: [{ key: '', value: '' }] };
  if (type === 'list') defaultData = { items: [{ name: '', extra: '' }] };
  if (type === 'cards') defaultData = { cards: [{ icon: '', name: '', role: '' }] };
  if (type === 'html') defaultData = { html: '' };
  renderContentFields(type, defaultData);
};

/* ============================================================
   CONTENT FIELDS
   ============================================================ */
function renderContentFields(type, data) {
  const area = document.getElementById('contentArea');
  area.innerHTML = '';

  if (type === 'table') {
    area.innerHTML =
      '<label style="display:block; font-weight:600; font-size:0.85rem; color:#334155; margin-bottom:0.5rem;">Rows</label>' +
      '<div id="rowsContainer"></div>' +
      '<button type="button" class="add-row-btn" onclick="addTableRow()">➕ Add Row</button>';
    (data.rows || [{ key: '', value: '' }]).forEach(function (r) { addTableRow(r.key, r.value); });
  }
  if (type === 'list') {
    area.innerHTML =
      '<label style="display:block; font-weight:600; font-size:0.85rem; color:#334155; margin-bottom:0.5rem;">Items</label>' +
      '<div id="itemsContainer"></div>' +
      '<button type="button" class="add-row-btn" onclick="addListItem()">➕ Add Item</button>';
    (data.items || [{ name: '', extra: '' }]).forEach(function (it) { addListItem(it.name, it.extra); });
  }
  if (type === 'cards') {
    area.innerHTML =
      '<label style="display:block; font-weight:600; font-size:0.85rem; color:#334155; margin-bottom:0.5rem;">Cards</label>' +
      '<div id="cardsContainer"></div>' +
      '<button type="button" class="add-row-btn" onclick="addCardItem()">➕ Add Card</button>';
    (data.cards || [{ icon: '', name: '', role: '' }]).forEach(function (c) { addCardItem(c.icon, c.name, c.role); });
  }
  if (type === 'html') {
    area.innerHTML =
      '<label style="display:block; font-weight:600; font-size:0.85rem; color:#334155; margin-bottom:0.5rem;">HTML Code</label>' +
      '<textarea id="htmlContent" class="code-textarea" rows="10" placeholder="<div>...</div>">' +
      escapeHtml(data.html || '') + '</textarea>';
  }
}

window.addTableRow = function (key, value) {
  const c = document.getElementById('rowsContainer');
  if (!c) return;
  const row = document.createElement('div');
  row.className = 'repeat-row';
  row.innerHTML = '<div class="inputs">' +
    '<input type="text" class="row-key" placeholder="Label" value="' + escapeAttr(key || '') + '" />' +
    '<input type="text" class="row-value" placeholder="Value" value="' + escapeAttr(value || '') + '" />' +
    '</div><button type="button" class="remove" onclick="this.parentElement.remove()">✕</button>';
  c.appendChild(row);
};

window.addListItem = function (name, extra) {
  const c = document.getElementById('itemsContainer');
  if (!c) return;
  const row = document.createElement('div');
  row.className = 'repeat-row';
  row.innerHTML = '<div class="inputs">' +
    '<input type="text" class="item-name" placeholder="Name" value="' + escapeAttr(name || '') + '" />' +
    '<input type="text" class="item-extra" placeholder="Extra" value="' + escapeAttr(extra || '') + '" />' +
    '</div><button type="button" class="remove" onclick="this.parentElement.remove()">✕</button>';
  c.appendChild(row);
};

window.addCardItem = function (icon, name, role) {
  const c = document.getElementById('cardsContainer');
  if (!c) return;
  const row = document.createElement('div');
  row.className = 'repeat-row';
  row.innerHTML = '<div class="inputs" style="grid-template-columns: 80px 1fr 1fr;">' +
    '<input type="text" class="card-icon" placeholder="Icon" value="' + escapeAttr(icon || '') + '" style="text-align:center;" />' +
    '<input type="text" class="card-name" placeholder="Name" value="' + escapeAttr(name || '') + '" />' +
    '<input type="text" class="card-role" placeholder="Role" value="' + escapeAttr(role || '') + '" />' +
    '</div><button type="button" class="remove" onclick="this.parentElement.remove()">✕</button>';
  c.appendChild(row);
};

/* ============================================================
   SAVE SECTION
   ============================================================ */
window.saveSectionInModal = function () {
  const title = document.getElementById('secTitle').value.trim();
  const hashRaw = document.getElementById('secHash').value.trim();

  if (!title) return toast('❌ Section title required', 'error');
  if (!currentType) return toast('❌ Type चुनो', 'error');

  // Hashtag sanitize — sirf letters, numbers, dashes
  const hash = hashRaw
    .toLowerCase()
    .replace(/#/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Check duplicate hashtag
  if (hash) {
    const dup = sections.find(function (s) {
      return s.hash === hash && s.id !== editingSectionId;
    });
    if (dup) {
      return toast('❌ ये hashtag पहले से "' + dup.title + '" में इस्तेमाल हो रहा है', 'error');
    }
  }

  const data = {};
  if (currentType === 'table') {
    data.rows = [];
    document.querySelectorAll('#rowsContainer .repeat-row').forEach(function (row) {
      const k = row.querySelector('.row-key').value.trim();
      const v = row.querySelector('.row-value').value.trim();
      if (k || v) data.rows.push({ key: k, value: v });
    });
  } else if (currentType === 'list') {
    data.items = [];
    document.querySelectorAll('#itemsContainer .repeat-row').forEach(function (row) {
      const n = row.querySelector('.item-name').value.trim();
      const e = row.querySelector('.item-extra').value.trim();
      if (n) data.items.push({ name: n, extra: e });
    });
  } else if (currentType === 'cards') {
    data.cards = [];
    document.querySelectorAll('#cardsContainer .repeat-row').forEach(function (row) {
      const i = row.querySelector('.card-icon').value.trim();
      const n = row.querySelector('.card-name').value.trim();
      const r = row.querySelector('.card-role').value.trim();
      if (n) data.cards.push({ icon: i, name: n, role: r });
    });
  } else if (currentType === 'html') {
    data.html = document.getElementById('htmlContent').value;
  }

  if (editingSectionId) {
    const idx = sections.findIndex(function (s) { return s.id === editingSectionId; });
    if (idx !== -1) {
      sections[idx].title = title;
      sections[idx].hash = hash;
      sections[idx].data = data;
    }
    toast('✅ Section updated', 'success');
  } else {
    const maxOrder = sections.reduce(function (max, s) { return Math.max(max, s.order || 0); }, 0);
    sections.push({
      id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      type: currentType,
      title: title,
      hash: hash,
      order: maxOrder + 1,
      data: data
    });
    toast('✅ Section added', 'success');
  }

  renderSections();
  closeSectionModal();
  markUnsaved();
};

/* ============================================================
   DELETE / MOVE / DRAG
   ============================================================ */
window.deleteSection = function (sectionId) {
  const sec = sections.find(function (s) { return s.id === sectionId; });
  if (!sec) return;
  if (!confirm('Delete "' + sec.title + '"?')) return;
  sections = sections.filter(function (s) { return s.id !== sectionId; });
  sections.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  sections.forEach(function (s, i) { s.order = i + 1; });
  renderSections();
  markUnsaved();
  toast('🗑 Deleted', 'success');
};

window.moveSection = function (sectionId, direction) {
  const sorted = sections.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  const idx = sorted.findIndex(function (s) { return s.id === sectionId; });
  if (idx === -1) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= sorted.length) return;
  const temp = sorted[idx];
  sorted[idx] = sorted[newIdx];
  sorted[newIdx] = temp;
  sorted.forEach(function (s, i) { s.order = i + 1; });
  sections = sorted;
  renderSections();
  markUnsaved();
};

function handleDragStart(e) {
  dragSrcIndex = parseInt(this.dataset.index);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function handleDragOver(e) {
  e.preventDefault();
  if (this.classList.contains('dragging')) return;
  this.classList.add('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  const targetIndex = parseInt(this.dataset.index);
  if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;
  const sorted = sections.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  const draggedItem = sorted.splice(dragSrcIndex, 1)[0];
  sorted.splice(targetIndex, 0, draggedItem);
  sorted.forEach(function (s, i) { s.order = i + 1; });
  sections = sorted;
  renderSections();
  markUnsaved();
  dragSrcIndex = null;
}
function handleDragEnd() {
  document.querySelectorAll('.sec-card').forEach(function (c) {
    c.classList.remove('dragging');
    c.classList.remove('drag-over');
  });
  dragSrcIndex = null;
}

/* ============================================================
   SAVE ALL
   ============================================================ */
window.saveAllSections = async function () {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⏳ Saving...';
  try {
    await saveToFirestore();
    toast('✅ Home page saved!', 'success');
    setSaveStatus('✅ Saved at ' + new Date().toLocaleTimeString(), true);
  } catch (err) {
    console.error(err);
    toast('❌ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Save All Changes';
  }
};

async function saveToFirestore() {
  await db.collection('site_content').doc(FIRESTORE_DOC).set({
    sections: sections,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: firebase.auth().currentUser.email
  }, { merge: true });
}

/* ============================================================
   UTILITIES
   ============================================================ */
function markUnsaved() { setSaveStatus('⚠️ Unsaved changes', false); }
function setSaveStatus(text, saved) {
  const el = document.getElementById('saveStatus');
  if (!el) return;
  el.textContent = text;
  el.style.color = saved ? '#16a34a' : '#dc2626';
  el.style.fontWeight = '600';
}
function escapeHtml(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
function escapeAttr(s) {
  return String(s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}