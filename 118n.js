const LANG_NAMES = { uz: 'UZ', en: 'EN', tr: 'TR', ru: 'RU', ar: 'AR' };

function initLangSwitcher(TRANSLATIONS) {
  let currentLang = localStorage.getItem('taxiLang') || 'uz';

  function applyLang(lang) {
    if (!TRANSLATIONS[lang]) lang = 'uz';
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    const dict = TRANSLATIONS[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
    });

    const langCurrentEl = document.getElementById('langCurrent');
    if (langCurrentEl) langCurrentEl.innerHTML = LANG_NAMES[lang] + ' <span>▾</span>';
    document.querySelectorAll('#langMenu button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    localStorage.setItem('taxiLang', lang);
    document.dispatchEvent(new CustomEvent('taxiLangChanged', { detail: { lang } }));
  }

  document.querySelectorAll('#langMenu button').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLang(btn.dataset.lang);
      const sw = document.getElementById('langSwitch');
      if (sw) sw.classList.remove('open');
    });
  });

  const langSwitchEl = document.getElementById('langSwitch');
  const langCurrentBtn = document.getElementById('langCurrent');
  if (langCurrentBtn && langSwitchEl) {
    langCurrentBtn.addEventListener('click', () => langSwitchEl.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!langSwitchEl.contains(e.target)) langSwitchEl.classList.remove('open');
    });
  }

  applyLang(currentLang);

  return {
    getLang: () => currentLang,
    applyLang,
    t: (key) => (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key] !== undefined)
      ? TRANSLATIONS[currentLang][key] : (TRANSLATIONS.uz[key] !== undefined ? TRANSLATIONS.uz[key] : key)
  };
}

function langSwitchHtml() {
  return `
    <div class="lang-switch" id="langSwitch">
      <button type="button" class="lang-current" id="langCurrent">UZ <span>▾</span></button>
      <div class="lang-menu" id="langMenu">
        <button type="button" data-lang="uz">UZ — O'zbekcha</button>
        <button type="button" data-lang="en">EN — English</button>
        <button type="button" data-lang="tr">TR — Türkçe</button>
        <button type="button" data-lang="ru">RU — Русский</button>
        <button type="button" data-lang="ar">AR — العربية</button>
      </div>
    </div>`;
}
