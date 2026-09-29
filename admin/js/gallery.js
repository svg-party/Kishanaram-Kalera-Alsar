guardAdmin(function (user) {
  initGallery(user);
});

function initGallery(user) {
  const form = document.getElementById('galleryForm');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const url = getVal('gImgUrl');
      if (!url) return toast('Image URL required', 'error');

      await db.collection('gallery').add({
        imageUrl: url,
        captionHi: getVal('gCapHi'),
        captionEn: getVal('gCapEn'),
        order: Date.now(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        addedBy: user.email
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
          <strong>${esc(d.captionHi || d.captionEn || '(no caption)')}</strong>
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