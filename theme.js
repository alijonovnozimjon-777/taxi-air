// =====================================================================
// THEME.JS — Kun/tun (light/dark) rejimini boshqarish
// =====================================================================
// Barcha sahifalarda (index.html, login.html, register.html, member.html,
// admin.html) bir xilda ishlatiladi. Sahifa HAR SAFAR ochilganda KUN
// (light) rejimidan boshlanadi — tanlov localStorage'da saqlanmaydi,
// foydalanuvchi shu sahifada ko'rish uchun vaqtincha Tun rejimiga
// o'tkazishi mumkin. Tugma quyosh/oy belgili sirg'anadigan (sliding)
// svitch ko'rinishida.
// =====================================================================

function initThemeSwitcher() {
  const root = document.documentElement;
  const toggleBtns = document.querySelectorAll('[data-theme-toggle]');
  if (!toggleBtns.length) return;

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    toggleBtns.forEach(btn => {
      btn.dataset.active = theme;
      btn.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
      btn.title = theme === 'dark' ? "Kun rejimiga o'tish" : "Tun rejimiga o'tish";
    });
  }

  // Sahifa har doim yorug' (light) rejimdan boshlanadi.
  applyTheme('light');

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      applyTheme(isDark ? 'light' : 'dark');
    });
  });
}

document.addEventListener('DOMContentLoaded', initThemeSwitcher);
