/* ============================================================
   CONTACT PAGE — Dynamic Sections Editor
   Firestore: site_content/contact
   ============================================================ */

const FIRESTORE_DOC = 'contact';

/* ... same as panchayat.js — सिर्फ default sections बदलो ... */

function getDefaultSections() {
  return [
    {
      id: 'sec_ct_1',
      type: 'cards',
      title: '📞 संपर्क जानकारी',
      order: 1,
      data: {
        cards: [
          { icon: '📞', name: 'फोन', role: 'STD कोड: 01567' },
          { icon: '📮', name: 'डाकघर', role: 'राजलदेसर — 331802' },
          { icon: '🏛️', name: 'ग्राम पंचायत', role: 'लाच्छरसर' },
          { icon: '👩‍💼', name: 'सरपंच', role: 'श्रीमती धापू देवी' },
          { icon: '🚂', name: 'नज़दीकी रेलवे', role: 'परसनेउ (8.3 किमी)' },
          { icon: '🗺️', name: 'PIN कोड', role: '331802' }
        ]
      }
    },
    {
      id: 'sec_ct_2',
      type: 'table',
      title: '📍 पूरा पता',
      order: 2,
      data: {
        rows: [
          { key: 'ग्राम पंचायत कार्यालय', value: 'ग्राम पंचायत भवन, मुख्य बाज़ार' },
          { key: 'गाँव', value: 'लाच्छरसर' },
          { key: 'तहसील', value: 'रतनगढ़' },
          { key: 'जिला', value: 'चूरू' },
          { key: 'राज्य', value: 'राजस्थान' },
          { key: 'PIN कोड', value: '331802' }
        ]
      }
    },
    {
      id: 'sec_ct_3',
      type: 'html',
      title: '🗺️ Google Map',
      order: 3,
      data: {
        html: '<div style="border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.1);"><iframe src="https://www.google.com/maps?q=Lachharsar+Ratangarh+Churu+Rajasthan&output=embed" width="100%" height="400" style="border:0; display:block;" allowfullscreen loading="lazy"></iframe></div>'
      }
    }
  ];
}

/* ... बाकी पूरा code same as panchayat.js ... */