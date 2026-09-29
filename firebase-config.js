/* ============================================================
   FIREBASE CONFIG — Lachharsar Village Portal
   Shared across all pages (public + admin)
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

const ADMIN_EMAIL = "sovereignvanguardgovernance.svg@gmail.com";

// Initialize Firebase once
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}