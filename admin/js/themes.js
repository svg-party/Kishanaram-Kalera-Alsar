/* ============================================================
   THEME MANAGER — Presets + Custom Colors
   ============================================================ */

const PRESET_THEMES = {
  default: {
    label: 'Default (Navy + Saffron)',
    colors: { primary: '#0c2340', accent: '#ff9933', bg: '#ffffff', text: '#1e293b' }
  },
  dark: {
    label: 'Dark Mode',
    colors: { primary: '#0f172a', accent: '#ff9933', bg: '#0f172a', text: '#e2e8f0' },
    css: `body { background: #0f172a; color: #e2e8f0; } .navbar, .footer { background: #020617; } .info-card, .about-block, .contact-card, .gallery-item, .legal-content { background: #1e293b; color: #e2e8f0; } .info-card h4, .about-block h2, .contact-card h4, .legal-content h2 { color: #ff9933; } .info-table td:last-child { color: #e2e8f0; } .info-table td:first-child { color: #94a3b8; } .hero { background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%); } .section-alt { background: #1e293b; }`
  },
  green: {
    label: 'Nature Green',
    colors: { primary: '#14532d', accent: '#84cc16', bg: '#ffffff', text: '#1e293b' }
  },
  maroon: {
    label: 'Royal Maroon',
    colors: { primary: '#7f1d1d', accent: '#fbbf24', bg: '#ffffff', text: '#1e293b' }
  },
  purple: {
    label: 'Royal Purple',
    colors: { primary: '#4c1d95', accent: '#f472b6', bg: '#ffffff', text: '#1e293b' }
  },
  ocean: {
    label: 'Ocean Blue',
    colors: { primary: '#0c4a6e', accent: '#06b6d4', bg: '#ffffff', text: '#1e293b' }
  },
  forest: {
    label: 'Forest',
    colors: { primary: '#166534', accent: '#facc15', bg: '#f0fdf4', text: '#14532d' }
  }
};

let currentThemeKey = 'default';

guardAdmin(function (user) {
  initThemes(user);
});

function initThemes(user) {
  const grid = document.getElementById('presetGrid');
  if (!grid) return;

  // Render presets
  grid.innerHTML = Object.entries(PRESET_THEMES).map(([k, v]) => `
    <div class="theme-card" data-key="${k}">
      <div class="swatch" style="background: linear-gradient(135deg, ${v.colors.primary}, ${v.colors.accent});"></div>
      <div class="label">${v.label}</div>
    </div>
  `).join('');

  // Click handler
  grid.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.key;
      applyTheme(key, user);
    });
  });

  // Custom form
  document.getElementById('themeForm').addEventListener('submit', async e => {
    e.preventDefault();
    const colors = {
      primary: getVal('themePrimary'),
      accent: getVal('themeAccent'),
      bg: getVal('themeBg'),
      text: getVal('themeText')
    };
    const customCSS = getVal('themeCSS');

    try {
      await db.collection('settings').doc('theme').set({
        key: 'custom',
        label: 'Custom Theme',
        colors,
        customCSS,
        isCustom: true,
        updatedBy: user.email,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      toast('✅ Custom theme applied!', 'success');
    } catch (err) {
      toast('❌ ' + err.message, 'error');
    }
  });

  // Reset
  document.getElementById('resetBtn').addEventListener('click', async () => {
    if (!confirm('Reset to default theme?')) return;
    await db.collection('settings').doc('theme').delete();
    toast('🔄 Reset to default', 'info');
  });

  // Watch active theme
  db.collection('settings').doc('theme').onSnapshot(doc => {
    const nameEl = document.getElementById('activeThemeName');
    const infoEl = document.getElementById('activeThemeInfo');
    if (doc.exists) {
      const d = doc.data();
      if (nameEl) nameEl.textContent = d.label || d.key || 'Custom';
      currentThemeKey = d.key || 'custom';

      // Update swatch
      grid.querySelectorAll('.theme-card').forEach(c => {
        c.classList.toggle('active', c.dataset.key === currentThemeKey);
      });

      // Populate custom color inputs
      if (d.colors) {
        if (d.colors.primary) setVal('themePrimary', d.colors.primary);
        if (d.colors.accent)  setVal('themeAccent', d.colors.accent);
        if (d.colors.bg)      setVal('themeBg', d.colors.bg);
        if (d.colors.text)    setVal('themeText', d.colors.text);
      }
      if (d.customCSS) setVal('themeCSS', d.customCSS);
    } else {
      if (nameEl) nameEl.textContent = 'Default';
      currentThemeKey = 'default';
      grid.querySelectorAll('.theme-card').forEach(c => {
        c.classList.toggle('active', c.dataset.key === 'default');
      });
    }
  });
}

async function applyTheme(key, user) {
  const preset = PRESET_THEMES[key];
  if (!preset) return;

  try {
    await db.collection('settings').doc('theme').set({
      key,
      label: preset.label,
      colors: preset.colors,
      customCSS: preset.css || '',
      isCustom: false,
      updatedBy: user.email,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('✅ Theme applied: ' + preset.label, 'success');
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}