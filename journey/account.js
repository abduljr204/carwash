(() => {
  'use strict';
  const copy = {
    en: {
      results: 'Before & after ↗',
      login: 'Log in',
      signup: 'Sign up',
      logout: 'Log out',
      before: 'BEFORE',
      after: 'AFTER',
      eyebrow: 'A LITTLE DIRT. A BIG DIFFERENCE.',
      heading: 'See the shine.',
      description:
        'From everyday dust to a fresh finish. See the difference a little care can make.',
      note: 'Illustrative before-and-after imagery.',
      back: 'Back to the wash',
      care: 'A FRESH START.',
      yourCar: 'Your car.',
      yourClean: 'Your clean.',
      story: 'A little care goes a long way. Your next fresh start begins here.',
      loginTitle: 'Welcome back',
      signupTitle: 'Create your account',
      loginIntro: 'Log in with a test username and password.',
      signupIntro: 'Sign up with your phone number and a password.',
      phone: 'Phone number',
      phoneHint: 'Use your country code, or a Libyan number beginning with 09.',
      username: 'Username',
      password: 'Password',
      passwordHint: 'Use 8–128 characters.',
      confirm: 'Confirm password',
      show: 'Show',
      hide: 'Hide',
      loginSwitch: 'New to Naqa Qurtuba?',
      signupSwitch: 'Already have an account?',
      mismatch: 'The passwords do not match.',
      pending: 'Please wait…',
      failed: 'Unable to sign in. Check your details and try again.',
      credentials: 'Phone number or password is incorrect.',
    },
    ar: {
      results: 'قبل وبعد ↗',
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      before: 'قبل الغسيل',
      after: 'بعد الغسيل',
      eyebrow: 'قليل من الغبار. فرق كبير.',
      heading: 'شاهد اللمعان.',
      description: 'من غبار الطريق إلى نظافة ولمعان. شاهد الفرق مع العناية بسيارتك.',
      note: 'صور توضيحية قبل الغسيل وبعده.',
      back: 'العودة إلى الغسيل',
      care: 'بداية جديدة.',
      yourCar: 'سيارتك.',
      yourClean: 'نظافتك.',
      story: 'القليل من العناية يصنع فرقاً كبيراً. بدايتك الجديدة تبدأ هنا.',
      loginTitle: 'مرحباً بعودتك',
      signupTitle: 'أنشئ حسابك',
      loginIntro: 'سجّل الدخول برقم هاتفك وكلمة المرور.',
      signupIntro: 'أنشئ حساباً باستخدام رقم هاتفك وكلمة مرور.',
      phone: 'رقم الهاتف',
      phoneHint: 'استخدم رمز الدولة أو رقماً ليبياً يبدأ بـ 09.',
      password: 'كلمة المرور',
      passwordHint: 'استخدم من 8 إلى 128 حرفاً.',
      confirm: 'تأكيد كلمة المرور',
      show: 'إظهار',
      hide: 'إخفاء',
      loginSwitch: 'جديد في نقاء قرطبة؟',
      signupSwitch: 'لديك حساب بالفعل؟',
      mismatch: 'كلمتا المرور غير متطابقتين.',
      pending: 'يرجى الانتظار…',
      failed: 'تعذّر تسجيل الدخول. تحقق من البيانات وحاول مجدداً.',
      credentials: 'رقم الهاتف أو كلمة المرور غير صحيحة.',
    },
  };
  let language = document.documentElement.lang;
  try {
    language = localStorage.getItem('naqa-language') || language;
  } catch {}
  const t = (key) => copy[language === 'ar' ? 'ar' : 'en'][key];
  const mode = document.body.dataset.auth;
  function render() {
    document.querySelectorAll('[data-account]').forEach((el) => {
      if (t(el.dataset.account)) el.textContent = t(el.dataset.account);
    });
    if (mode) {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document
        .querySelectorAll('[data-auth-language]')
        .forEach((el) =>
          el.setAttribute('aria-pressed', String(el.dataset.authLanguage === language)),
        );
    }
  }
  document.addEventListener('wash:language', () => {
    language = document.documentElement.lang;
    render();
  });
  document.querySelectorAll('[data-auth-language]').forEach((button) =>
    button.addEventListener('click', () => {
      language = button.dataset.authLanguage;
      try {
        localStorage.setItem('naqa-language', language);
      } catch {}
      render();
    }),
  );
  render();
  const form = document.getElementById('auth-form');
  if (form) {
    const password = document.getElementById('password');
    document.getElementById('toggle-password').addEventListener('click', (e) => {
      const show = password.type === 'password';
      password.type = show ? 'text' : 'password';
      e.currentTarget.dataset.account = show ? 'hide' : 'show';
      e.currentTarget.setAttribute('aria-pressed', String(show));
      render();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const accounts = { admin: 'admin123', user: 'user123' };
      if (!Object.hasOwn(accounts, username) || accounts[username] !== password.value) {
        alert('Incorrect username or password.');
        return;
      }
      WashDemo.save('account', username);
      location.assign((username === 'admin' ? 'staff.html' : 'dashboard.html') + '#' + username);
    });
  }
  const account = document.querySelector('.account-status');
  const username = WashDemo.read('account', null);
  if (account && username) {
    account.replaceChildren();
    const link = document.createElement('a');
    link.className = 'account-link';
    link.href = username === 'admin' ? 'staff.html' : 'dashboard.html';
    link.textContent = username === 'admin' ? 'Admin dashboard' : 'My dashboard';
    const logout = document.createElement('button');
    logout.textContent = 'Log out';
    logout.addEventListener('click', () => {
      WashDemo.save('account', null);
      location.reload();
    });
    account.append(link, logout);
  }
})();
