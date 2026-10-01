/* ============================================================
   ABOUT PAGE — Dynamic Sections Editor
   Firestore: site_content/about
   ============================================================ */

guardAdmin(function (user) {
  console.log("✅ About editor ready:", user.email);
  loadSections();
});

let sections = [];         // current sections array
let editingSectionId = null;
let currentType = null;    // table | list | cards | html
let dragSrcIndex = null;

/* ============================================================
   TYPE CONFIG
   ============================================================ */
const TYPE_INFO = {
  table: {
    label: 'Table',
    hint: 'Key-Value pairs — जैसे "गाँव का नाम: लाच्छरसर"',
    keyLabel: 'Label',
    valueLabel: 'Value',
    single: false
  },
  list: {
    label: 'List',
    hint: 'Bullet points — जैसे "सिकराली — 11 किमी"',
    keyLabel: 'Name',
    valueLabel: 'Extra (जैसे दूरी)',
    single: false
  },
  cards: {
    label: 'Cards',
    hint: 'Grid of cards — जैसे पदाधिकारी (icon + name + role)',
    keyLabel: 'Icon / Title',
    valueLabel: 'Subtitle / Role',
    single: false
  },
  html: {
    label: 'Custom HTML',
    hint: 'Raw HTML — पूरी freedom',
    single: true
  }
};

/* ============================================================
   LOAD SECTIONS FROM FIRESTORE
   ============================================================ */
async function loadSections() {
  try {
    const doc = await db.collection('site_content').doc('about').get();
    if (doc.exists && doc.data().sections) {
      sections = doc.data().sections;
      console.log("📥 Loaded", sections.length, "sections");
    } else {
      // First-time: seed with default sections
      sections = getDefaultSections();
      console.log("🌱 Seeding default sections");
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
   DEFAULT SECTIONS (First time के लिए)
   ============================================================ */
function getDefaultSections() {
  return [
    {
      id: 'sec_' + Date.now() + '_1',
      type: 'table',
      title: '📌 बुनियादी परिचय',
      order: 1,
      data: {
        rows: [
          { key: 'गाँव का नाम', value: 'लाच्छरसर (Lachharsar)' },
          { key: 'जिला', value: 'चूरू, राजस्थान (भारत)' },
          { key: 'तहसील / सब-डिस्ट्रिक्ट', value: 'रतनगढ़ / राजलदेसर' },
          { key: 'ग्राम पंचायत', value: 'लाच्छरसर' },
          { key: 'पिन कोड', value: '331802' },
          { key: 'मुख्य डाकघर', value: 'राजलदेसर' },
          { key: 'LGD विलेज कोड', value: '70573' },
          { key: 'संभाग', value: 'बीकानेर' },
          { key: 'भाषा', value: 'हिंदी और राजस्थानी' },
          { key: 'ऊँचाई', value: '309 मीटर (समुद्र तल से)' },
          { key: 'STD कोड', value: '01567' }
        ]
      }
    },
    {
      id: 'sec_' + Date.now() + '_2',
      type: 'table',
      title: '👥 जनसांख्यिकी (2011 जनगणना)',
      order: 2,
      data: {
        rows: [
          { key: 'कुल आबादी', value: '9,459' },
          { key: 'कुल परिवार', value: '1,405' },
          { key: 'पुरुष जनसंख्या', value: '4,862' },
          { key: 'महिला जनसंख्या', value: '4,597 (48.6%)' },
          { key: 'साक्षरता दर', value: '46.0% (4,349)' },
          { key: 'महिला साक्षरता दर', value: '16.3% (1,541)' },
          { key: 'अनुसूचित जाति', value: '14.3% (1,357)' },
          { key: 'अनुसूचित जनजाति', value: '0.8% (75)' },
          { key: 'कार्यशील जनसंख्या', value: '49.7%' },
          { key: 'बाल जनसंख्या (0-6)', value: '1,848' }
        ]
      }
    },
    {
      id: 'sec_' + Date.now() + '_3',
      type: 'list',
      title: '🏘️ नज़दीकी गाँव',
      order: 3,
      data: {
        items: [
          { name: 'सिकराली', extra: '11 किमी' },
          { name: 'अलसर', value: '14 किमी' }.name ? { name: 'अलसर', extra: '14 किमी' } : { name: 'अलसर', extra: '14 किमी' },
          { name: 'भानुडा बिदावतान', extra: '16 किमी' }
        ]
      }
    },
    {
      id: 'sec_' + Date.now() + '_4',
      type: 'list',
      title: '🏙️ नज़दीकी शहर',
      order: 4,
      data: {
        items: [
          { name: 'राजलदेसर', extra: '15 किमी' },
          { name: 'रतनगढ़', extra: '30 किमी' },
          { name: 'सरदारशहर', extra: '43 किमी' },
          { name: 'सुजानगढ़', extra: '50 किमी' }
        ]
      }
    }
  ];
}

/* ============================================================
   RENDER SECTIONS
   ============================================================ */
function renderSections() {
  const container = document.getElementById('secList');
  if (!container) return;

  if (!sections.length) {
    container.innerHTML =
      '<div style="text-align:center; padding:3rem 2rem; background:#fff; border-radius:16px; border:2px dashed #e2e8f0;">' +
      '<div style="font-size:3rem; opacity:0.4;">📄</div>' +
      '<h3 style="color:#0c2340; font-weight:800; margin:0.75rem 0 0.35rem;">No sections yet</h3>' +
      '<p style="color:#64748b; font-size:0.9rem; margin:0;">"➕ नया Section जोड़ो" button से शुरुआत करो</p>' +
      '</div>';
    return;
  }

  // Sort by order
  const sorted = sections.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

  container.innerHTML = '';
  sorted.forEach(function (sec, idx) {
    const card = document.createElement('div');
    card.className = 'sec-card';
    card.draggable = true;
    card.dataset.id = sec.id;
    card.dataset.index = idx;

    const typeInfo = TYPE_INFO[sec.type] || TYPE_INFO.table;
    const typeLabel = typeInfo.label;

    card.innerHTML =
      '<div class="sec-info">' +
        '<h4>' + escapeHtml(sec.title || 'Untitled Section') + '</h4>' +
        '<div class="meta">' +
          '<span class="type-badge ' + sec.type + '">' + typeLabel + '</span>' +
          '<span>Order: ' + (sec.order || idx + 1) + '</span>' +
          '<span>' + getItemCountText(sec) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="sec-actions">' +
        '<button class="move" title="Move Up" onclick="moveSection(\'' + sec.id + '\', -1)">⬆️</button>' +
        '<button class="move" title="Move Down" onclick="moveSection(\'' + sec.id + '\', 1)">⬇️</button>' +
        '<button title="Edit" onclick="openSectionModal(\'edit\', \'' + sec.id + '\')">✏️</button>' +
        '<button class="danger" title="Delete" onclick="deleteSection(\'' + sec.id + '\')">🗑️</button>' +
      '</div>';

    // Drag & drop handlers
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
   OPEN MODAL (Create or Edit)
   ============================================================ */
window.openSectionModal = function (mode, sectionId) {
  const modal = document.getElementById('secModal');
  const title = document.getElementById('modalTitle');
  const sub = document.getElementById('modalSub');
  const typeSelectorWrap = document.getElementById('typeSelectorWrap');
  const contentArea = document.getElementById('contentArea');
  const secTitleInput = document.getElementById('secTitle');

  contentArea.innerHTML = '';
  secTitleInput.value = '';

  if (mode === 'edit' && sectionId) {
    editingSectionId = sectionId;
    const sec = sections.find(function (s) { return s.id === sectionId; });
    if (!sec) return;

    title.textContent = 'Edit Section';
    sub.textContent = 'Title और content बदलो';
    typeSelectorWrap.style.display = 'none';
    secTitleInput.value = sec.title || '';
    currentType = sec.type;
    renderContentFields(sec.type, sec.data || {});
  } else {
    editingSectionId = null;
    currentType = null;
    title.textContent = 'Add New Section';
    sub.textContent = 'Section का type और title चुनो';
    typeSelectorWrap.style.display = 'block';
    document.querySelectorAll('.type-option').forEach(function (el) {
      el.classList.remove('active');
    });
    document.getElementById('typeInfo').style.display = 'none';
    renderContentFields('table', { rows: [{ key: '', value: '' }] });
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

  // Default data per type
  let defaultData = {};
  if (type === 'table') defaultData = { rows: [{ key: '', value: '' }] };
  if (type === 'list') defaultData = { items: [{ name: '', extra: '' }] };
  if (type === 'cards') defaultData = { cards: [{ icon: '', name: '', role: '' }] };
  if (type === 'html') defaultData = { html: '' };

  renderContentFields(type, defaultData);
};

/* ============================================================
   RENDER CONTENT FIELDS (per type)
   ============================================================ */
function renderContentFields(type, data) {
  const area = document.getElementById('contentArea');
  area.innerHTML = '';

  if (type === 'table') {
    area.innerHTML =
      '<label style="display:block; font-weight:600; font-size:0.85rem; color:#334155; margin-bottom:0.5rem;">Rows</label>' +
      '<div id="rowsContainer"></div>' +
      '<button type="button" class="add-row-btn" onclick="addTableRow()">➕ Add Row</button>';

    const rows = data.rows || [{ key: '', value: '' }];
    rows.forEach(function (r) { addTableRow(r.key, r.value); });
  }

  if (type === 'list') {
    area.innerHTML =
      '<label style="display:block; font-weight:600; font-size:0.85rem; color:#334155; margin-bottom:0.5rem;">Items</label>' +
      '<div id="itemsContainer"></div>' +
      '<button type="button" class="add-row-btn" onclick="addListItem()">➕ Add Item</button>';

    const items = data.items || [{ name: '', extra: '' }];
    items.forEach(function (it) { addListItem(it.name, it.extra); });
  }

  if (type === 'cards') {
    area.innerHTML =
      '<label style="display:block; font-weight:600; font-size:0.85rem; color:#334155; margin-bottom:0.5rem;">Cards</label>' +
      '<div id="cardsContainer"></div>' +
      '<button type="button" class="add-row-btn" onclick="addCardItem()">➕ Add Card</button>';

    const cards = data.cards || [{ icon: '', name: '', role: '' }];
    cards.forEach(function (c) { addCardItem(c.icon, c.name, c.role); });
  }

  if (type === 'html') {
    area.innerHTML =
      '<label style="display:block; font-weight:600; font-size:0.85rem; color:#334155; margin-bottom:0.5rem;">HTML Code</label>' +
      '<textarea id="htmlContent" class="code-textarea" rows="10" placeholder="<div>आपका HTML यहाँ...</div>">' +
      escapeHtml(data.html || '') +
      '</textarea>';
  }
}

/* ============================================================
   TABLE ROWS
   ============================================================ */
window.addTableRow = function (key, value) {
  const container = document.getElementById('rowsContainer');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'repeat-row';
  row.innerHTML =
    '<div class="inputs">' +
      '<input type="text" class="row-key" placeholder="Label" value="' + escapeAttr(key || '') + '" />' +
      '<input type="text" class="row-value" placeholder="Value" value="' + escapeAttr(value || '') + '" />' +
    '</div>' +
    '<button type="button" class="remove" onclick="this.parentElement.remove()">✕</button>';
  container.appendChild(row);
};

/* ============================================================
   LIST ITEMS
   ============================================================ */
window.addListItem = function (name, extra) {
  const container = document.getElementById('itemsContainer');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'repeat-row';
  row.innerHTML =
    '<div class="inputs">' +
      '<input type="text" class="item-name" placeholder="Name" value="' + escapeAttr(name || '') + '" />' +
      '<input type="text" class="item-extra" placeholder="Extra" value="' + escapeAttr(extra || '') + '" />' +
    '</div>' +
    '<button type="button" class="remove" onclick="this.parentElement.remove()">✕</button>';
  container.appendChild(row);
};

/* ============================================================
   CARD ITEMS
   ============================================================ */
window.addCardItem = function (icon, name, role) {
  const container = document.getElementById('cardsContainer');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'repeat-row';
  row.innerHTML =
    '<div class="inputs" style="grid-template-columns: 80px 1fr 1fr;">' +
      '<input type="text" class="card-icon" placeholder="Icon" value="' + escapeAttr(icon || '') + '" style="text-align:center;" />' +
      '<input type="text" class="card-name" placeholder="Name / Title" value="' + escapeAttr(name || '') + '" />' +
      '<input type="text" class="card-role" placeholder="Role / Subtitle" value="' + escapeAttr(role || '') + '" />' +
    '</div>' +
    '<button type="button" class="remove" onclick="this.parentElement.remove()">✕</button>';
  container.appendChild(row);
};

/* ============================================================
   SAVE SECTION (from modal)
   ============================================================ */
window.saveSectionInModal = function () {
  const title = document.getElementById('secTitle').value.trim();
  if (!title) {
    toast('❌ Section title required', 'error');
    return;
  }

  const type = currentType;
  if (!type) {
    toast('❌ Section type चुनो', 'error');
    return;
  }

  // Collect data based on type
  const data = {};
  if (type === 'table') {
    data.rows = [];
    document.querySelectorAll('#rowsContainer .repeat-row').forEach(function (row) {
      const k = row.querySelector('.row-key').value.trim();
      const v = row.querySelector('.row-value').value.trim();
      if (k || v) data.rows.push({ key: k, value: v });
    });
  } else if (type === 'list') {
    data.items = [];
    document.querySelectorAll('#itemsContainer .repeat-row').forEach(function (row) {
      const n = row.querySelector('.item-name').value.trim();
      const e = row.querySelector('.item-extra').value.trim();
      if (n) data.items.push({ name: n, extra: e });
    });
  } else if (type === 'cards') {
    data.cards = [];
    document.querySelectorAll('#cardsContainer .repeat-row').forEach(function (row) {
      const i = row.querySelector('.card-icon').value.trim();
      const n = row.querySelector('.card-name').value.trim();
      const r = row.querySelector('.card-role').value.trim();
      if (n) data.cards.push({ icon: i, name: n, role: r });
    });
  } else if (type === 'html') {
    data.html = document.getElementById('htmlContent').value;
  }

  if (editingSectionId) {
    // Update existing
    const idx = sections.findIndex(function (s) { return s.id === editingSectionId; });
    if (idx !== -1) {
      sections[idx].title = title;
      sections[idx].data = data;
      // type doesn't change in edit mode
    }
    toast('✅ Section updated', 'success');
  } else {
    // Create new
    const maxOrder = sections.reduce(function (max, s) { return Math.max(max, s.order || 0); }, 0);
    sections.push({
      id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      type: type,
      title: title,
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
   DELETE SECTION
   ============================================================ */
window.deleteSection = function (sectionId) {
  const sec = sections.find(function (s) { return s.id === sectionId; });
  if (!sec) return;
  if (!confirm('Delete section "' + sec.title + '"?')) return;

  sections = sections.filter(function (s) { return s.id !== sectionId; });

  // Re-order
  sections.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  sections.forEach(function (s, i) { s.order = i + 1; });

  renderSections();
  markUnsaved();
  toast('🗑 Section deleted', 'success');
};

/* ============================================================
   MOVE SECTION (Up/Down)
   ============================================================ */
window.moveSection = function (sectionId, direction) {
  const sorted = sections.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  const idx = sorted.findIndex(function (s) { return s.id === sectionId; });
  if (idx === -1) return;

  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= sorted.length) return;

  // Swap
  const temp = sorted[idx];
  sorted[idx] = sorted[newIdx];
  sorted[newIdx] = temp;

  // Re-assign order
  sorted.forEach(function (s, i) { s.order = i + 1; });
  sections = sorted;

  renderSections();
  markUnsaved();
};

/* ============================================================
   DRAG & DROP
   ============================================================ */
function handleDragStart(e) {
  dragSrcIndex = parseInt(this.dataset.index);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
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
   SAVE ALL (to Firestore)
   ============================================================ */
window.saveAllSections = async function () {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⏳ Saving...';
  try {
    await saveToFirestore();
    toast('✅ About page saved!', 'success');
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
  await db.collection('site_content').doc('about').set({
    sections: sections,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: firebase.auth().currentUser.email
  }, { merge: true });
}

/* ============================================================
   UTILITIES
   ============================================================ */
function markUnsaved() {
  setSaveStatus('⚠️ Unsaved changes — Save दबाओ', false);
}

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