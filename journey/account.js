(() => {
  'use strict';
  const copy = {
    en: { results: 'Before & after ↗', login: 'Log in', signup: 'Sign up', logout: 'Log out', before: 'BEFORE', after: 'AFTER', eyebrow: 'A LITTLE DIRT. A BIG DIFFERENCE.', heading: 'See the shine.', description: 'From everyday dust to a fresh finish. See the difference a little care can make.', note: 'Illustrative before-and-after imagery.', back: 'Back to the wash', care: 'A FRESH START.', yourCar: 'Your car.', yourClean: 'Your clean.', story: 'A little care goes a long way. Your next fresh start begins here.', loginTitle: 'Welcome back', signupTitle: 'Create your account', loginIntro: 'Log in with your phone number and password.', signupIntro: 'Sign up with your phone number and a password.', phone: 'Phone number', phoneHint: 'Use your country code, or a Libyan number beginning with 09.', password: 'Password', passwordHint: 'Use 8–128 characters.', confirm: 'Confirm password', show: 'Show', hide: 'Hide', loginSwitch: 'New to Naqa Qurtuba?', signupSwitch: 'Already have an account?', mismatch: 'The passwords do not match.', invalidPhone: 'Enter a valid international phone number or a Libyan mobile number.', pending: 'Please wait…', unavailable: 'Unable to connect. Please try again shortly.', server: 'Sign-in requires the app server. Open this site through its server address.', failed: 'Unable to sign in. Check your details and try again.', duplicate: 'An account already exists for this number. Please log in.', credentials: 'Phone number or password is incorrect.', limited: 'Too many attempts. Please try again in 15 minutes.' },
    ar: { results: 'قبل وبعد ↗', login: 'تسجيل الدخول', signup: 'إنشاء حساب', logout: 'تسجيل الخروج', before: 'قبل الغسيل', after: 'بعد الغسيل', eyebrow: 'قليل من الغبار. فرق كبير.', heading: 'شاهد اللمعان.', description: 'من غبار الطريق إلى نظافة ولمعان. شاهد الفرق مع العناية بسيارتك.', note: 'صور توضيحية قبل الغسيل وبعده.', back: 'العودة إلى الغسيل', care: 'بداية جديدة.', yourCar: 'سيارتك.', yourClean: 'نظافتك.', story: 'القليل من العناية يصنع فرقاً كبيراً. بدايتك الجديدة تبدأ هنا.', loginTitle: 'مرحباً بعودتك', signupTitle: 'أنشئ حسابك', loginIntro: 'سجّل الدخول برقم هاتفك وكلمة المرور.', signupIntro: 'أنشئ حساباً باستخدام رقم هاتفك وكلمة مرور.', phone: 'رقم الهاتف', phoneHint: 'استخدم رمز الدولة أو رقماً ليبياً يبدأ بـ 09.', password: 'كلمة المرور', passwordHint: 'استخدم من 8 إلى 128 حرفاً.', confirm: 'تأكيد كلمة المرور', show: 'إظهار', hide: 'إخفاء', loginSwitch: 'جديد في نقاء قرطبة؟', signupSwitch: 'لديك حساب بالفعل؟', mismatch: 'كلمتا المرور غير متطابقتين.', invalidPhone: 'أدخل رقم هاتف دولياً صحيحاً أو رقم هاتف محمول ليبياً.', pending: 'يرجى الانتظار…', unavailable: 'تعذّر الاتصال. يرجى المحاولة لاحقاً.', server: 'تسجيل الدخول يتطلب خادم التطبيق. افتح الموقع من عنوان الخادم.', failed: 'تعذّر تسجيل الدخول. تحقق من البيانات وحاول مجدداً.', duplicate: 'يوجد حساب بهذا الرقم. يرجى تسجيل الدخول.', credentials: 'رقم الهاتف أو كلمة المرور غير صحيحة.', limited: 'محاولات كثيرة. حاول مجدداً بعد 15 دقيقة.' }
  };
  let language = document.documentElement.lang;
  try { language = localStorage.getItem('naqa-language') || language; } catch {}
  const t = key => copy[language === 'ar' ? 'ar' : 'en'][key];
  const mode = document.body.dataset.auth;
  let busy = false;
  function render() {
    if (mode) {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.title = t(mode + 'Title') + ' | Naqa Qurtuba';
    }
    document.querySelectorAll('[data-account]').forEach(el => { el.textContent = t(el.dataset.account); });
    document.querySelectorAll('[data-auth-language]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.authLanguage === language)));
    if (busy) document.getElementById('auth-submit').textContent = t('pending');
  }
  document.addEventListener('wash:language', () => { language = document.documentElement.lang; render(); });
  document.querySelectorAll('[data-auth-language]').forEach(button => button.addEventListener('click', () => {
    language = button.dataset.authLanguage;
    try { localStorage.setItem('naqa-language', language); } catch {}
    render();
  }));
  render();
  async function request(endpoint, body) {
    if (location.protocol === 'file:') throw new Error(t('server'));
    let response;
    try { response = await fetch('/api/' + endpoint, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) }); }
    catch { throw new Error(t('unavailable')); }
    let data;
    try { data = await response.json(); } catch { throw new Error(t('server')); }
    if (!response.ok) throw new Error(t(({ 401: 'credentials', 409: 'duplicate', 429: 'limited' })[response.status] || 'failed'));
    return data;
  }
  const form = document.getElementById('auth-form');
  if (form) {
    const password = document.getElementById('password');
    const toggle = document.getElementById('toggle-password');
    toggle.addEventListener('click', () => {
      const show = password.type === 'password';
      password.type = show ? 'text' : 'password';
      toggle.dataset.account = show ? 'hide' : 'show';
      toggle.setAttribute('aria-pressed', String(show));
      render();
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      const error = document.getElementById('auth-error');
      error.hidden = true;
      const phone = document.getElementById('phone').value.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[\s()-]/g, '');
      try {
        if (!/^(?:\+[1-9]\d{7,14}|00[1-9]\d{7,14}|09\d{8})$/.test(phone)) throw new Error(t('invalidPhone'));
        if (mode === 'signup' && password.value !== document.getElementById('confirm-password').value) throw new Error(t('mismatch'));
        busy = true;
        document.getElementById('auth-submit').disabled = true;
        form.setAttribute('aria-busy', 'true');
        render();
        await request(mode, { phone, password: password.value });
        location.assign('index.html');
      } catch (err) { error.textContent = err.message; error.hidden = false; }
      finally { busy = false; document.getElementById('auth-submit').disabled = false; form.removeAttribute('aria-busy'); render(); }
    });
  }
  const account = document.querySelector('.account-status');
  if (account && location.protocol !== 'file:') request('session').then(({ user }) => {
    if (!user) return;
    account.replaceChildren();
    const phone = document.createElement('span');
    phone.dir = 'ltr'; phone.textContent = user.phone;
    const logout = document.createElement('button');
    logout.type = 'button'; logout.dataset.account = 'logout';
    const error = document.createElement('span'); error.setAttribute('role', 'alert');
    logout.addEventListener('click', async () => {
      logout.disabled = true;
      try { await request('logout', {}); location.reload(); }
      catch (err) { error.textContent = err.message; logout.disabled = false; }
    });
    account.append(phone, logout, error); render();
  }).catch(() => { /* Keep account links available if the server is offline. */ });
})();
