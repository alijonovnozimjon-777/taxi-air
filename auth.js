// =====================================================================
// AUTH.JS — Taxi Airport Tashkent shaxsiy kabineti uchun umumiy logika
// =====================================================================
// Bu fayl index.html, login.html, register.html va member.html sahifalarida
// bir xilda ishlatiladi. firebase-config.js dan KEYIN ulanishi shart.
// =====================================================================

const BONUS_PER_BOOKING = 5000; // har bir yuborilgan buyurtma uchun beriladigan bonus (so'm). O'zingizga moslab o'zgartiring.
const SUPER_ADMIN_EMAIL = 'alijonovnozimjon@gmail.com'; // bosh administrator — faqat shu email yangi admin qo'sha/o'chira oladi

// Foydalanuvchi admin panelga (admin.html) kira oladimi — bosh admin YOKI
// Firestore'dagi "admins" to'plamiga qo'shilgan qo'shimcha adminlardan biri bo'lsa, true qaytaradi.
async function isAdminUser(user) {
  if (!user) return false;
  if (user.email === SUPER_ADMIN_EMAIL) return true;
  try {
    const doc = await db.collection('admins').doc(user.email).get();
    return doc.exists;
  } catch (e) {
    return false;
  }
}

// Faqat bosh admin uchun true — yangi adminlarni qo'shish/o'chirish shu funksiya bilan cheklanadi.
function isSuperAdminUser(user) {
  return !!user && user.email === SUPER_ADMIN_EMAIL;
}

// ---------- RO'YXATDAN O'TISH ----------
async function registerUser({ name, phone, email, password }) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName: name });
  await db.collection('users').doc(cred.user.uid).set({
    name: name,
    phone: phone,
    email: email,
    bonus: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return cred.user;
}

// ---------- KIRISH ----------
async function loginUser(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

// ---------- CHIQISH ----------
async function logoutUser() {
  await auth.signOut();
}

// ---------- PROFIL ----------
async function getUserProfile(uid) {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? snap.data() : null;
}

async function updateUserProfile(uid, { name, phone }) {
  await db.collection('users').doc(uid).set({ name, phone }, { merge: true });
  if (auth.currentUser) {
    await auth.currentUser.updateProfile({ displayName: name });
  }
}

// ---------- BUYURTMALAR ----------
async function createBooking(uid, email, payload) {
  await db.collection('bookings').add({
    uid: uid,
    userEmail: email || null, // admin panelida "qaysi email yubordi" ustuni uchun
    ...payload,
    price: null, // narx hali belgilanmagan — admin panelidan (admin.html) qo'lda kiritiladi
    paymentLink: null, // to'lov havolasi ham admin panelidan qo'lda kiritiladi
    status: 'yuborildi', // yuborildi -> tasdiqlandi -> bajarildi -> bekor (admin.html orqali o'zgartiriladi)
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  // Har bir buyurtma uchun sodiqlik bonusi qo'shamiz.
  // set(..., {merge:true}) ishlatilyapti — agar profil hujjati (users/{uid})
  // biror sababdan mavjud bo'lmasa ham xatolik bermay, avtomatik yaratadi.
  await db.collection('users').doc(uid).set({
    bonus: firebase.firestore.FieldValue.increment(BONUS_PER_BOOKING)
  }, { merge: true });
}

async function getUserBookings(uid) {
  const snap = await db.collection('bookings')
    .where('uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---------- ADMIN: barcha buyurtmalarni ko'rish/boshqarish ----------
async function getAllBookingsAdmin() {
  const snap = await db.collection('bookings')
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function updateBookingAdmin(bookingId, { status, price, paymentLink }) {
  const data = {};
  if (status !== undefined) data.status = status;
  if (price !== undefined) data.price = price;
  if (paymentLink !== undefined) data.paymentLink = paymentLink;
  await db.collection('bookings').doc(bookingId).update(data);
}

// ---------- ADMIN: qo'shimcha adminlarni boshqarish (faqat SUPER_ADMIN_EMAIL uchun) ----------
async function listAdmins() {
  const snap = await db.collection('admins').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function addAdmin(email, addedByEmail) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || cleanEmail.indexOf('@') === -1) throw new Error('Email noto\'g\'ri kiritildi.');
  await db.collection('admins').doc(cleanEmail).set({
    email: cleanEmail,
    addedBy: addedByEmail || null,
    addedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function removeAdmin(email) {
  await db.collection('admins').doc(email).delete();
}

// ---------- ADMIN: barcha mijozlar ro'yxati (bonus boshqaruvi uchun) ----------
async function getAllUsersAdmin() {
  const snap = await db.collection('users').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---------- ADMIN: bonusni qo'lda qo'shish/ayirish + tarix yozuvi ----------
// amount musbat bo'lsa qo'shiladi, manfiy bo'lsa ayiriladi (masalan -10000 — rasxod)
async function adjustUserBonus(userId, userEmail, amount, reason, adminEmail) {
  const numAmount = Number(amount);
  if (!numAmount) throw new Error('Miqdor noto\'g\'ri kiritildi.');
  await db.collection('users').doc(userId).set({
    bonus: firebase.firestore.FieldValue.increment(numAmount)
  }, { merge: true });
  await db.collection('bonusLogs').add({
    userId: userId,
    userEmail: userEmail || null,
    amount: numAmount,
    reason: reason || '',
    adminEmail: adminEmail || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// Barcha bonus tarixi yozuvlari (bitta so'rovda olib, admin.html tomonida foydalanuvchi bo'yicha filtrlanadi)
async function getAllBonusLogs() {
  const snap = await db.collection('bonusLogs')
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---------- SAHIFANI HIMOYALASH / YO'NALTIRISH ----------
// member.html boshida chaqiriladi: login qilinmagan bo'lsa login.html'ga yo'naltiradi
function requireAuth(onReady) {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      onReady(user);
    }
  });
}

// login.html / register.html boshida chaqiriladi: login qilingan bo'lsa kabinetga yo'naltiradi
function redirectIfLoggedIn() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = 'member.html';
    }
  });
}

// index.html header'idagi "Kirish / Kabinet" havolasini holatga qarab yangilaydi
function initHeaderAuthState(linkSelector) {
  document.querySelectorAll(linkSelector).forEach((el) => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        el.textContent = 'Kabinetim';
        el.href = 'member.html';
      } else {
        el.textContent = 'Kirish';
        el.href = 'login.html';
      }
    });
  });
}

// Xatolik xabarlarini o'zbek tiliga tarjima qilib beradi (Firebase xato kodlari bo'yicha)
function friendlyAuthError(err) {
  const code = err && err.code ? err.code : '';
  const map = {
    'auth/email-already-in-use': 'Bu email allaqachon ro\'yxatdan o\'tgan. Kirish sahifasidan foydalaning.',
    'auth/invalid-email': 'Email manzil noto\'g\'ri formatda.',
    'auth/weak-password': 'Parol juda oddiy — kamida 6 ta belgidan iborat bo\'lishi kerak.',
    'auth/user-not-found': 'Bunday foydalanuvchi topilmadi.',
    'auth/wrong-password': 'Parol noto\'g\'ri.',
    'auth/invalid-credential': 'Email yoki parol noto\'g\'ri.',
    'auth/too-many-requests': 'Juda ko\'p urinish. Biroz kutib qayta urinib ko\'ring.'
  };
  return map[code] || ('Xatolik yuz berdi: ' + (err && err.message ? err.message : 'noma\'lum'));
}
