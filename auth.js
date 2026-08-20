const BONUS_PER_BOOKING = 5000;

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

async function loginUser(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

async function logoutUser() {
  await auth.signOut();
}

async function getUserProfile(uid) {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? snap.data() : null;
}

async function updateUserProfile(uid, { name, phone }) {
  await db.collection('users').doc(uid).update({ name, phone });
  if (auth.currentUser) {
    await auth.currentUser.updateProfile({ displayName: name });
  }
}

async function createBooking(uid, payload) {
  await db.collection('bookings').add({
    uid: uid,
    ...payload,
    status: 'yuborildi',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  await db.collection('users').doc(uid).update({
    bonus: firebase.firestore.FieldValue.increment(BONUS_PER_BOOKING)
  });
}

async function getUserBookings(uid) {
  const snap = await db.collection('bookings')
    .where('uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function requireAuth(onReady) {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      onReady(user);
    }
  });
}

function redirectIfLoggedIn() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = 'member.html';
    }
  });
}

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
