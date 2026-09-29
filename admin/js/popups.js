let editingPopupId = null;

guardAdmin(function (user) {
  initPopups(user);
});

function initPopups(user) {
  const form = document.getElementById('popupForm');
  if (!form) return;

  document.getElementById('pScope').addEventListener('change', e => {
    document.getElementById('scopeListWrap').style.display = e.target.value === 'list' ? 'block' : 'none';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      title: getVal('pTitle'),
      body: getVal('pBody'),
      category: getVal('pCategory'),
      customHTML: getVal('pCustomHTML'),
      url: getVal('pUrl'),
      buttonLabel: getVal('pButtonLabel') || 'Learn More',
      imageUrl: getVal('pImageUrl'),
      isActive: document.getElementById('pActive').checked,
      rank: parseInt(document.getElementById('pRank').value) || 1,
      scope: getVal('pScope') || 'global',
      scopeList: getVal('pScopeList').split(',').map(s => s.trim()).filter(Boolean),
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
          <strong>${esc(d.title || '(no title)')}</strong>
          <span class="badge">${d.scope || 'global'}</span>
          <span class="status ${d.isActive ? 'on' : 'off'}">${d.isActive ? '● Active' : '● Inactive'}</span>
          <div class="meta">Rank: ${d.rank || 1}</div>
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
  toast('🔄 Form cleared', 'info');
}

window.editPopup = async function (id) {
  const doc = await db.collection('popups').doc(id).get();
  if (!doc.exists) return;
  const d = doc.data();
  editingPopupId = id;
  setVal('pTitle', d.title);
  setVal('pBody', d.body);
  setVal('pCategory', d.category);
  setVal('pCustomHTML', d.customHTML);
  setVal('pUrl', d.url);
  setVal('pButtonLabel', d.buttonLabel);
  setVal('pImageUrl', d.imageUrl);
  setVal('pRank', d.rank || 1);
  setVal('pScope', d.scope || 'global');
  document.getElementById('pScope').dispatchEvent(new Event('change'));
  setVal('pScopeList', (d.scopeList || []).join(', '));
  document.getElementById('pActive').checked = !!d.isActive;
  window.scrollTo(0, 0);
  toast('✏️ Editing popup', 'info');
};

window.deletePopup = async function (id) {
  if (!confirm('Delete this popup?')) return;
  await db.collection('popups').doc(id).delete();
  toast('🗑 Deleted', 'success');
};