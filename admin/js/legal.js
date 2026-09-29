let currentPage = 'privacy';

guardAdmin(function (user) {
  initLegal(user);
});

function initLegal(user) {
  const form = document.getElementById('legalForm');
  if (!form) return;

  document.querySelectorAll('.legal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.legal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentPage = tab.dataset.page;
      loadLegalPage(currentPage);
    });
  });

  loadLegalPage('privacy');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const content = getVal('legalContent');
    if (!content) return toast('Content khaali hai', 'error');

    await db.collection('pages').doc(currentPage).set({
      content,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.email
    }, { merge: true });
    toast('✅ ' + currentPage + ' saved', 'success');
  });

  document.getElementById('legalReset').addEventListener('click', async () => {
    if (!confirm('Reset to default content?')) return;
    await db.collection('pages').doc(currentPage).delete();
    setVal('legalContent', '');
    toast('🔄 Reset — default content will be shown', 'info');
  });
}

async function loadLegalPage(key) {
  const labels = {
    privacy: '🔒 Privacy Policy Content (HTML allowed)',
    terms: '📜 Terms & Conditions (HTML allowed)',
    disclaimer: '⚠️ Disclaimer (HTML allowed)'
  };
  document.getElementById('legalLabel').textContent = labels[key] || 'Content';

  const doc = await db.collection('pages').doc(key).get();
  if (doc.exists && doc.data().content) {
    setVal('legalContent', doc.data().content);
  } else {
    setVal('legalContent', '');
    document.getElementById('legalContent').placeholder = 'Khaali chhodo → default content dikhega. Ya apna HTML paste karo.';
  }
}