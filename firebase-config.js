/* ============================================================
   FIREBASE CONFIG — Lachharsar Village Portal
   Shared across all pages (public + admin)
   Project: lachharsar-village
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyDqjskeHAg_W93RZ-ll4k7T1Ot2D_QDgNY",
  authDomain: "lachharsar-village.firebaseapp.com",
  projectId: "lachharsar-village",
  storageBucket: "lachharsar-village.firebasestorage.app",
  messagingSenderId: "858928708033",
  appId: "1:858928708033:web:3eaadc7ae55c6bc2b79740",
  measurementId: "G-K6FZJX1B4J"
};

/* ============================================================
   ADMIN EMAIL — Only this email can access admin panel
   ============================================================ */
const ADMIN_EMAIL = "sovereignvanguardgovernance.svg@gmail.com";

/* ============================================================
   CLOUDINARY CONFIG — Image upload के लिए
   Dashboard: console.cloudinary.com
   Cloud name: dsyrhal
   Upload preset: lachharsar_gallery (Unsigned mode)
   ============================================================ */
const CLOUDINARY_CONFIG = {
  cloudName: "dsyrhal",
  uploadPreset: "lachharsar_gallery",
  folder: "lachharsar/gallery"
};

/* ============================================================
   INITIALIZE FIREBASE (safe mode)
   ============================================================ */
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
