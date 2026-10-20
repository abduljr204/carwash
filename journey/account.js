(() => {
  'use strict';
  const { t } = WashI18n;
  const form = document.getElementById('auth-form');
  if (form) {
    const password = document.getElementById('password');
    document.getElementById('toggle-password').addEventListener('click', (e) => {
      const show = password.type === 'password';
      password.type = show ? 'text' : 'password';
      e.currentTarget.dataset.t = show ? 'hide' : 'show';
      e.currentTarget.textContent = t(e.currentTarget.dataset.t);
      e.currentTarget.setAttribute('aria-pressed', String(show));
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const accounts = { admin: 'admin123', user: 'user123' };
      if (!Object.hasOwn(accounts, username) || accounts[username] !== password.value) {
        alert(t('loginFailed'));
        return;
      }
      WashDemo.save('account', username);
      location.assign((username === 'admin' ? 'staff.html' : 'dashboard.html') + '#' + username);
    });
  }
  const account = document.querySelector('.account-status');
  function renderAccount() {
    const username = WashDemo.read('account', null);
    if (!account || !username) return;
    account.replaceChildren();
    const link = document.createElement('a');
    link.className = 'account-link';
    link.href = username === 'admin' ? 'staff.html' : 'dashboard.html';
    link.textContent = t(username === 'admin' ? 'adminDashboard' : 'myBookings');
    const logout = document.createElement('button');
    logout.textContent = t('logout');
    logout.addEventListener('click', () => {
      WashDemo.save('account', null);
      location.reload();
    });
    account.append(link, logout);
  }
  document.addEventListener('wash:language', renderAccount);
  renderAccount();
})();
