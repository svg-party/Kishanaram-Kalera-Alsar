/* ============================================================
   PUBLIC LOADER — Theme + Popup + Dynamic
   Saare public pages mein include karo (</body> se pehle)
   ============================================================ */

(function () {
  'use strict';

  function waitForFirebase(cb, tries) {
    tries = tries || 0;
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      return cb();
    }
    if (tries > 60) {
      console.error("❌ Firebase not loaded");
      return;
    }
    setTimeout(() => waitForFirebase(cb, tries + 1), 100);
  }

  waitForFirebase(function () {
    const db = firebase.firestore();
    const path = window.location.pathname;

    console.log("🚀 Loader init for:", path);

    /* ============================================================
       1. THEME LOADER — Puri site ka theme apply karo
       ============================================================ */
    db.collection('settings').doc('theme').get().then(doc => {
      if (!doc.exists) {
        console.log("ℹ️ No custom theme — using default");
        return;
      }
      const d = doc.data();
      const root = document.documentElement;

      // Apply colors as CSS variables
      if (d.colors) {
        if (d.colors.primary) root.style.setProperty('--primary', d.colors.primary);
        if (d.colors.accent)  root.style.setProperty('--accent', d.colors.accent);
        if (d.colors.bg)      root.style.setProperty('--bg', d.colors.bg);
        if (d.colors.text)    root.style.setProperty('--text', d.colors.text);

        // Auto-derive derived colors
        if (d.colors.primary) root.style.setProperty('--primary-light', lighten(d.colors.primary, 20));
        if (d.colors.accent)  root.style.setProperty('--accent-dark', darken(d.colors.accent, 15));
      }

      // Apply custom CSS if any
      if (d.customCSS && d.customCSS.trim()) {
        const style = document.createElement('style');
        style.id = 'dynamic-theme-css';
        style.textContent = d.customCSS;
        document.head.appendChild(style);
      }

      console.log("🎨 Theme applied:", d.label || d.key);
    }).catch(e => console.warn("Theme error:", e));

    /* ============================================================
       2. POPUP LOADER
       ============================================================ */
    function matchScope(p) {
      if (!p.scope || p.scope === 'global') return true;
      if (p.scope === 'list') return (p.scopeList || []).some(item => path.includes(item));
      if (p.scope === 'regex' && p.scopeRegex) {
        try { return new RegExp(p.scopeRegex).test(path); } catch (e) { return false; }
      }
      return false;
    }

    function isTimeActive(p) {
      if (!p.isActive) return false;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const curTime = now.toTimeString().slice(0, 5);
      if (p.scheduleFrom && p.scheduleFrom > today) return false;
      if (p.scheduleTo && p.scheduleTo < today) return false;
      if (p.timeFrom && p.scheduleFrom === today && p.timeFrom > curTime) return false;
      if (p.timeTo && p.scheduleTo === today && p.timeTo < curTime) return false;
      return true;
    }

    function wasShownRecently(id) {
      const last = localStorage.getItem('popup_shown_' + id);
      if (!last) return false;
      return (Date.now() - parseInt(last)) < 6 * 60 * 60 * 1000; // 6 hours
    }

    function markShown(id) {
      localStorage.setItem('popup_shown_' + id, Date.now().toString());
    }

    function escapeHtml(s) {
      if (!s) return '';
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    function buildPopupHTML(p) {
      // Old format: content only
      if (p.content && !p.title) {
        if (p.type === 'image') return `<img src="${p.content}" alt="Popup" style="max-width:100%; border-radius:16px; display:block; margin:0 auto;" />`;
        if (p.type === 'html') return p.content;
        if (p.type === 'notice') {
          return `<div style="text-align:center; padding:1rem;">
            <div style="font-size:3rem;">📢</div>
            <div style="font-size:1.1rem; font-weight:700; color:var(--primary); margin-top:0.5rem;">${escapeHtml(p.content)}</div>
          </div>`;
        }
      }

      // Modern format
      let html = '';
      if (p.category) {
        html += `<span style="display:inline-block; padding:4px 12px; background:var(--accent); color:var(--primary); border-radius:20px; font-size:0.7rem; margin-bottom:10px; text-transform:uppercase; font-weight:700;">${escapeHtml(p.category)}</span>`;
      }
      if (p.imageUrl) {
        html += `<img src="${p.imageUrl}" style="width:100%; border-radius:14px; margin-bottom:15px; display:block;">`;
      }
      if (p.title) {
        html += `<h2 style="margin-bottom:10px; color:var(--primary); font-size:1.4rem; font-weight:800;">${escapeHtml(p.title)}</h2>`;
      }
      if (p.customHTML && p.customHTML.trim()) {
        html += `<div>${p.customHTML}</div>`;
      } else if (p.body) {
        html += `<p style="color:var(--text); line-height:1.6; margin:0 0 15px 0;">${escapeHtml(p.body)}</p>`;
      }
      if (p.url && p.buttonLabel) {
        html += `<a href="${p.url}" target="_blank" style="display:inline-block; padding:10px 25px; background:var(--accent); color:var(--primary); border-radius:60px; text-decoration:none; font-weight:700; margin-top:10px;">${escapeHtml(p.buttonLabel)}</a>`;
      }
      return html;
    }

    function showPopup(p, id) {
      const existing = document.getElementById('lachharsar-popup');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'lachharsar-popup';
      overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex; align-items: center; justify-content: center;
        padding: 1rem;
      `;

      const box = document.createElement('div');
      box.style.cssText = `
        background: var(--bg, #fff);
        color: var(--text, #1e293b);
        border-radius: 20px;
        padding: 1.5rem;
        max-width: 520px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 24px 60px rgba(0,0,0,0.5);
      `;

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✕';
      closeBtn.style.cssText = `
        position: absolute; top: 0.75rem; right: 0.75rem;
        width: 36px; height: 36px; border-radius: 50%;
        background: #f1f5f9; border: none; font-size: 1.1rem;
        cursor: pointer; z-index: 10; color: #334155;
        transition: all 0.25s;
      `;
      closeBtn.onmouseover = () => { closeBtn.style.background = 'var(--accent)'; closeBtn.style.color = '#fff'; closeBtn.style.transform = 'rotate(90deg)'; };
      closeBtn.onmouseout = () => { closeBtn.style.background = '#f1f5f9'; closeBtn.style.color = '#334155'; closeBtn.style.transform = 'rotate(0)'; };
      closeBtn.onclick = () => overlay.remove();

      const content = document.createElement('div');
      content.style.cssText = 'text-align: center;';
      content.innerHTML = buildPopupHTML(p);

      box.appendChild(closeBtn);
      box.appendChild(content);
      overlay.appendChild(box);

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
      });

      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
      });

      document.body.appendChild(overlay);
      console.log("✅ Popup shown");
    }

    function loadPopups() {
      db.collection('popups')
        .where('isActive', '==', true)
        .get()
        .then(snap => {
          if (snap.empty) {
            console.log("ℹ️ No active popups");
            return;
          }

          let best = null;
          snap.forEach(doc => {
            const p = doc.data();
            p.id = doc.id;
            if (matchScope(p) && isTimeActive(p)) {
              if (!best || (p.rank || 99) < (best.rank || 99)) best = p;
            }
          });

          if (best && !wasShownRecently(best.id)) {
            setTimeout(() => {
              showPopup(best);
              markShown(best.id);
            }, 1500);
          }
        })
        .catch(e => console.warn("Popup error:", e));
    }

    setTimeout(loadPopups, 800);

    /* ============================================================
       3. HELPERS — Color utilities
       ============================================================ */
    function lighten(hex, percent) {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, (num >> 16) + amt);
      const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
      const B = Math.min(255, (num & 0x0000FF) + amt);
      return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    function darken(hex, percent) {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, (num >> 16) - amt);
      const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
      const B = Math.max(0, (num & 0x0000FF) - amt);
      return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
  });
})();