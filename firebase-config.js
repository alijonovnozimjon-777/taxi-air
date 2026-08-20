// =====================================================================
// FIREBASE KONFIGURATSIYASI — SHAXSIY KABINET UCHUN
// =====================================================================

const firebaseConfig = {
  apiKey: "AIzaSyCHv8BJcunTIL02JkJHI6bxI-w_I51ynoc",
  authDomain: "taxiairport-uz.firebaseapp.com",
  projectId: "taxiairport-uz",
  storageBucket: "taxiairport-uz.firebasestorage.app",
  messagingSenderId: "557592733254",
  appId: "1:557592733254:web:f89f75617325b63f2a4c47"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
