/* ============================================================
   GALLERY MANAGER — Full Logic
   Groups + Images + Cloudinary Upload
   ============================================================ */

let currentGroupId = null;
let currentGroupData = null;
let groupsUnsub = null;
let imagesUnsub = null;
let editingGroupId = null;
let selectedFiles = [];
let selectedCoverFile = null;
let coverMode = 'url';
let imageMode = 'upload';

/* ============================================================
   AUTH GUARD
   ============================================================ */
guardAdmin(function (user) {
  console.log("✅ Gallery admin ready");
  loadGroups();
});

/* ============================================================
   CLOUDINARY UPLOAD
   ============================================================ */
async function uploadToCloudinary(file, onProgress) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', CLOUDINARY_CONFIG.folder);

  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (onProgress) {
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          const pct = (e.loaded / e.total) * 100;
          onProgress(pct);
        }
      };
    }

    xhr.onload = function () {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
          format: data.format,
          bytes: data.bytes
        });
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || 'Upload failed'));
        } catch (e) {
          reject(new Error('Upload failed: ' + xhr.status));
        }
      }
    };

    xhr.onerror = function () {
      reject(new Error('Network error'));
    };

    xhr.send(formData);
  });
}

/* ============================================================
   LOAD GROUPS
   ============================================================ */
function loadGroups() {
  if (groupsUnsub) groupsUnsub();

  groupsUnsub = db.collection('gallery_groups')
    .orderBy('order', 'desc')
    .onSnapshot(function (snap) {
      const container = document.getElementById('groupsContainer');
      if (!container) return;

      if (snap.empty) {
        container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">' +
          '<div class="icon">📁</div>' +
          '<h3>अभी कोई group नहीं है</h3>' +
          '<p>पहला group बनाओ — जैसे "तेजाजी मंदिर" या "Election 2026"</p>' +
          '<button class="btn-primary" onclick="openGroupModal()">➕ Create First Group</button>' +
        '</div>';
        return;
      }

      container.innerHTML = '';
      snap.forEach(function (doc) {
        const d = doc.data();
        const card = document.createElement('div');
        card.className = 'group-card';
        card.onclick = function () { openGroupDetail(doc.id, d); };

        const coverHtml = d.coverUrl
          ? '<img src="' + d.coverUrl + '" alt="' + esc(d.name) + '" onerror="this.style.display=\'none\'; this.parentElement.innerHTML=\'<div class=&quot;placeholder&quot;>📁</div>\';" />'
          : '<div class="placeholder">📁</div>';

        card.innerHTML =
          '<div class="group-cover">' +
            coverHtml +
            '<div class="count-badge">📸 ' + (d.imageCount || 0) + '</div>' +
          '</div>' +
          '<div class="group-info">' +
            '<h4>' + esc(d.name) + '</h4>' +
            '<p>' + esc(d.description || 'No description') + '</p>' +
          '</div>';

        container.appendChild(card);
      });
    }, function (err) {
      console.warn("Groups error:", err);
      const container = document.getElementById('groupsContainer');
      if (container) {
        container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">' +
          '<div class="icon">⚠️</div><h3>Groups load नहीं हो पाए</h3>' +
          '<p>' + err.message + '</p></div>';
      }
    });
}

/* ============================================================
   GROUP MODAL
   ============================================================ */
window.openGroupModal = function () {
  editingGroupId = null;
  document.getElementById('groupModalTitle').textContent = 'Create New Group';
  document.getElementById('groupForm').reset();
  document.getElementById('coverPreview').innerHTML = '';
  document.getElementById('groupCoverUrl').value = '';
  selectedCoverFile = null;
  document.getElementById('groupModal').classList.add('active');
};

window.openGroupEditModal = function () {
  if (!currentGroupData) return;
  editingGroupId = currentGroupId;
  document.getElementById('groupModalTitle').textContent = 'Edit Group';
  document.getElementById('groupName').value = currentGroupData.name || '';
  document.getElementById('groupDesc').value = currentGroupData.description || '';
  document.getElementById('groupCoverUrl').value = currentGroupData.coverUrl || '';
  document.getElementById('coverPreview').innerHTML = '';
  selectedCoverFile = null;
  document.getElementById('groupModal').classList.add('active');
};

window.closeGroupModal = function () {
  document.getElementById('groupModal').classList.remove('active');
};

window.toggleCoverMode = function (mode) {
  coverMode = mode;
  document.querySelectorAll('#groupModal .mode-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  document.getElementById('coverUrlMode').style.display = mode === 'url' ? 'block' : 'none';
  document.getElementById('coverUploadMode').style.display = mode === 'upload' ? 'block' : 'none';
};

// Cover file select
document.addEventListener('DOMContentLoaded', function () {
  const coverInput = document.getElementById('coverFileInput');
  if (coverInput) {
    coverInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;
      selectedCoverFile = file;
      const reader = new FileReader();
      reader.onload = function (ev) {
        document.getElementById('coverPreview').innerHTML =
          '<div class="upload-preview-item">' +
          '<img src="' + ev.target.result + '" />' +
          '<button class="remove" onclick="clearCoverFile()">✕</button>' +
          '</div>';
      };
      reader.readAsDataURL(file);
    });
  }
});

window.clearCoverFile = function () {
  selectedCoverFile = null;
  const el = document.getElementById('coverFileInput');
  if (el) el.value = '';
  document.getElementById('coverPreview').innerHTML = '';
};

/* ============================================================
   SAVE GROUP
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('groupForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('groupName').value.trim();
    const description = document.getElementById('groupDesc').value.trim();
    let coverUrl = '';

    if (coverMode === 'url') {
      coverUrl = document.getElementById('groupCoverUrl').value.trim();
    }

    if (!name) return toast('❌ Group name required', 'error');

    const btn = document.getElementById('saveGroupBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Saving...';

    try {
      if (coverMode === 'upload' && selectedCoverFile) {
        coverUrl = (await uploadToCloudinary(selectedCoverFile, function (pct) {
          document.getElementById('coverProgress').classList.add('active');
          document.getElementById('coverProgressFill').style.width = pct + '%';
        })).url;
      }

      const data = {
        name: name,
        description: description,
        coverUrl: coverUrl,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (editingGroupId) {
        await db.collection('gallery_groups').doc(editingGroupId).update(data);
        toast('✅ Group updated', 'success');
      } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        data.order = Date.now();
        data.imageCount = 0;
        data.createdBy = firebase.auth().currentUser.email;
        await db.collection('gallery_groups').add(data);
        toast('✅ Group created!', 'success');
      }

      closeGroupModal();
    } catch (err) {
      console.error(err);
      toast('❌ ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Save Group';
      document.getElementById('coverProgress').classList.remove('active');
      document.getElementById('coverProgressFill').style.width = '0%';
    }
  });
});

/* ============================================================
   OPEN GROUP DETAIL
   ============================================================ */
window.openGroupDetail = function (groupId, groupData) {
  currentGroupId = groupId;
  currentGroupData = groupData;

  document.getElementById('viewGroups').classList.remove('active');
  document.getElementById('viewGroupDetail').classList.add('active');

  document.getElementById('detailGroupName').textContent = groupData.name;
  document.getElementById('detailGroupDesc').textContent = groupData.description || '';

  loadGroupImages(groupId);
  window.scrollTo(0, 0);
};

window.backToGroups = function () {
  if (imagesUnsub) { imagesUnsub(); imagesUnsub = null; }
  currentGroupId = null;
  currentGroupData = null;
  document.getElementById('viewGroups').classList.add('active');
  document.getElementById('viewGroupDetail').classList.remove('active');
};

/* ============================================================
   LOAD IMAGES IN GROUP
   ============================================================ */
function loadGroupImages(groupId) {
  if (imagesUnsub) imagesUnsub();

  imagesUnsub = db.collection('gallery_images')
    .where('groupId', '==', groupId)
    .onSnapshot(function (snap) {
      // Client side sort
      const images = [];
      snap.forEach(function (doc) {
        images.push({ id: doc.id, data: doc.data() });
      });
      images.sort(function (a, b) {
        return (b.data.order || 0) - (a.data.order || 0);
      });

      const container = document.getElementById('groupImagesContainer');
      const countEl = document.getElementById('detailGroupCount');

      if (countEl) countEl.textContent = '📸 ' + images.length + ' images';

      // Update group imageCount in Firestore
      if (currentGroupId) {
        db.collection('gallery_groups').doc(currentGroupId).update({ imageCount: images.length }).catch(function () {});
      }

      if (!images.length) {
        container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">' +
          '<div class="icon">🖼️</div>' +
          '<h3>इस group में कोई image नहीं है</h3>' +
          '<p>पहली image add करो</p>' +
          '<button class="btn-primary" onclick="openImageModal()">➕ Add Images</button>' +
        '</div>';
        return;
      }

      container.innerHTML = '';
      images.forEach(function (item) {
        const d = item.data;
        const card = document.createElement('div');
        card.className = 'img-card';
        card.innerHTML =
          '<div class="img-wrap">' +
            '<img src="' + d.imageUrl + '" alt="' + esc(d.title || '') + '" loading="lazy" onerror="this.style.display=\'none\'; this.parentElement.innerHTML=\'<div style=&quot;display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:2rem;&quot;>🖼️</div>\';" />' +
          '</div>' +
          '<div class="img-info">' +
            '<h5>' + esc(d.title || d.captionHi || 'Untitled') + '</h5>' +
            '<p>' + esc(d.description || d.captionHi || '') + '</p>' +
          '</div>' +
          '<div class="img-actions">' +
            '<button class="btn-mini danger" onclick="deleteImage(\'' + item.id + '\')">🗑 Delete</button>' +
          '</div>';
        container.appendChild(card);
      });
    }, function (err) {
      console.warn("Images error:", err);
    });
}

/* ============================================================
   DELETE GROUP
   ============================================================ */
window.deleteCurrentGroup = async function () {
  if (!currentGroupId) return;
  if (!confirm('Delete this group AND all its images?')) return;

  try {
    // Delete all images in group
    const imgs = await db.collection('gallery_images').where('groupId', '==', currentGroupId).get();
    const batch = db.batch();
    imgs.forEach(function (doc) { batch.delete(doc.ref); });
    batch.delete(db.collection('gallery_groups').doc(currentGroupId));
    await batch.commit();

    toast('🗑 Group deleted', 'success');
    backToGroups();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
};

/* ============================================================
   DELETE IMAGE
   ============================================================ */
window.deleteImage = async function (imageId) {
  if (!confirm('Delete this image?')) return;
  try {
    await db.collection('gallery_images').doc(imageId).delete();
    toast('🗑 Image deleted', 'success');
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
};

/* ============================================================
   IMAGE MODAL
   ============================================================ */
window.openImageModal = function () {
  if (!currentGroupId) return;
  document.getElementById('imageModal').classList.add('active');
};

window.closeImageModal = function () {
  document.getElementById('imageModal').classList.remove('active');
  // Reset
  selectedFiles = [];
  document.getElementById('uploadPreview').innerHTML = '';
  document.getElementById('imageFileInput').value = '';
  document.getElementById('uploadHeadline').value = '';
  document.getElementById('uploadCaptionHi').value = '';
  document.getElementById('uploadCaptionEn').value = '';
  document.getElementById('uploadDescription').value = '';
  document.getElementById('imgUrl').value = '';
  document.getElementById('imgTitle').value = '';
  document.getElementById('imgCapHi').value = '';
  document.getElementById('imgCapEn').value = '';
  document.getElementById('imgDescription').value = '';
};

window.toggleImageMode = function (mode) {
  imageMode = mode;
  document.querySelectorAll('#imageModal .mode-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  document.getElementById('imageUploadMode').style.display = mode === 'upload' ? 'block' : 'none';
  document.getElementById('imageUrlMode').style.display = mode === 'url' ? 'block' : 'none';
};

/* ============================================================
   FILE SELECTION (UPLOAD MODE)
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  const fileInput = document.getElementById('imageFileInput');
  const dropZone = document.getElementById('dropZone');

  if (fileInput) {
    fileInput.addEventListener('change', function (e) {
      handleFiles(e.target.files);
    });
  }

  // Drag & drop
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(function (evt) {
      dropZone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function (evt) {
      dropZone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    });
  }
});

function handleFiles(files) {
  Array.from(files).forEach(function (file) {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      toast('⚠️ ' + file.name + ' is larger than 10MB', 'error');
      return;
    }
    selectedFiles.push(file);

    const reader = new FileReader();
    reader.onload = function (ev) {
      const item = document.createElement('div');
      item.className = 'upload-preview-item';
      item.innerHTML =
        '<img src="' + ev.target.result + '" />' +
        '<button class="remove" data-name="' + file.name + '">✕</button>';
      document.getElementById('uploadPreview').appendChild(item);

      item.querySelector('.remove').addEventListener('click', function () {
        selectedFiles = selectedFiles.filter(function (f) { return f.name !== file.name; });
        item.remove();
      });
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   UPLOAD IMAGES (UPLOAD MODE)
   ============================================================ */
window.uploadSelectedImages = async function () {
  if (!selectedFiles.length) {
    toast('❌ कोई image select नहीं की', 'error');
    return;
  }

  const btn = document.getElementById('uploadImagesBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Uploading...';

  const headline = document.getElementById('uploadHeadline').value.trim();
  const captionHi = document.getElementById('uploadCaptionHi').value.trim();
  const captionEn = document.getElementById('uploadCaptionEn').value.trim();
  const description = document.getElementById('uploadDescription').value.trim();

  let uploaded = 0;
  let failed = 0;

  try {
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      try {
        const result = await uploadToCloudinary(file, function (pct) {
          const overall = ((i / selectedFiles.length) * 100) + (pct / selectedFiles.length);
          document.getElementById('uploadProgress').classList.add('active');
          document.getElementById('uploadProgressFill').style.width = overall + '%';
        });

        await db.collection('gallery_images').add({
          groupId: currentGroupId,
          imageUrl: result.url,
          cloudinaryId: result.publicId,
          title: headline || file.name.replace(/\.[^/.]+$/, ''),
          captionHi: captionHi,
          captionEn: captionEn,
          description: description,
          order: Date.now() + i,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          uploadedBy: firebase.auth().currentUser.email
        });

        uploaded++;
      } catch (err) {
        console.error('Upload failed for', file.name, err);
        failed++;
      }
    }

    toast('✅ ' + uploaded + ' images uploaded!' + (failed ? ' (' + failed + ' failed)' : ''), 'success');

    // Reset
    selectedFiles = [];
    document.getElementById('uploadPreview').innerHTML = '';
    document.getElementById('imageFileInput').value = '';
    closeImageModal();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '📤 Upload All Images';
    document.getElementById('uploadProgress').classList.remove('active');
    document.getElementById('uploadProgressFill').style.width = '0%';
  }
};

/* ============================================================
   ADD IMAGE FROM URL
   ============================================================ */
window.addImageFromUrl = async function () {
  const url = document.getElementById('imgUrl').value.trim();
  if (!url) {
    toast('❌ Image URL required', 'error');
    return;
  }

  try {
    await db.collection('gallery_images').add({
      groupId: currentGroupId,
      imageUrl: url,
      title: document.getElementById('imgTitle').value.trim(),
      captionHi: document.getElementById('imgCapHi').value.trim(),
      captionEn: document.getElementById('imgCapEn').value.trim(),
      description: document.getElementById('imgDescription').value.trim(),
      order: Date.now(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uploadedBy: firebase.auth().currentUser.email
    });

    toast('✅ Image added!', 'success');
    closeImageModal();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
};
