(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const staff = document.body.dataset.dashboard === 'staff';
  const isAdmin = staff;
  const hashUser = location.hash.slice(1);
  if (['admin', 'user'].includes(hashUser)) WashDemo.save('account', hashUser);
  const username = WashDemo.read('account', null);
  if (!username) {
    location.replace('login.html');
    return;
  }
  if (staff !== (username === 'admin')) {
    location.replace(username === 'admin' ? 'staff.html' : 'dashboard.html');
    return;
  }
  $('signed-in-phone').textContent = username;
  document.querySelector('h1').textContent = staff ? 'Admin dashboard' : 'User dashboard';
  $('page-status').textContent =
    'Browser demo: signed in as ' + username + '. Bookings are stored for this tab only.';
  $('language').hidden = true;
  if ($('scan')) $('scan').hidden = true;
  if ($('today-date')) $('today-date').textContent = 'Demo bookings';
  if ($('search-form')) {
    document.querySelector('label[for="phone-search"]').textContent = 'Find a customer by username';
    $('phone-search').type = 'text';
    $('phone-search').placeholder = 'user';
    $('search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      render();
    });
    $('clear-search').addEventListener('click', () => {
      $('phone-search').value = '';
      render();
    });
  }
  let tab = 'active';
  // Accept legacy question-mark-delimited records as well as current booking objects.
  function parseBooking(raw, index) {
    if (typeof raw === 'string') {
      const [username = '', date = '', time = '', washType = '', vehicleType = ''] = raw
        .split('?')
        .map((value) => value.trim());
      return {
        username,
        date,
        time,
        package: washType,
        vehicle: { type: vehicleType },
        id: 'legacy-' + index,
      };
    }
    return { ...raw, id: raw.id || 'legacy-' + index };
  }
  const washNames = {
    full: 'Full detail wash',
    exterior: 'Exterior wash',
    interior: 'Interior wash',
  };
  const vehicleNames = { car: 'Car', suv: 'SUV', pickup: 'Pickup', van: 'Van', minivan: 'Minivan' };
  const addonNames = { tires: 'Tire shine', wax: 'Premium wax' };
  function node(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function render() {
    const all = WashDemo.read('bookings', []).map(parseBooking);
    const visible = all.filter(
      (b) =>
        (isAdmin || b.username === username) &&
        (!isAdmin ||
          !$('phone-search').value.trim() ||
          b.username === $('phone-search').value.trim()),
    );
    document.querySelectorAll('[data-tab]').forEach((button) => {
      const past = button.dataset.tab === 'past';
      const count = visible.filter((b) => (b.status === 'completed') === past).length;
      button.textContent = (past ? 'Past washes' : 'Active bookings') + ' (' + count + ')';
      if (button.dataset.tab === tab) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    const bookings = visible.filter((b) => (b.status === 'completed') === (tab === 'past'));
    $('bookings').replaceChildren();
    if (!bookings.length) {
      $('bookings').append(
        node('p', 'notice', tab === 'past' ? 'No completed washes yet.' : 'No active bookings.'),
      );
    }
    bookings.forEach((b) => {
      const completed = b.status === 'completed';
      const washType = washNames[b.package] || b.package || 'Wash';
      const vehicleType = vehicleNames[b.vehicle?.type] || b.vehicle?.type || 'Vehicle';
      const card = node('article', 'appointment-card');
      const header = node('header', 'appointment-header');
      const heading = node('div', '');
      heading.append(
        node('p', 'appointment-label', 'CAR CARE APPOINTMENT'),
        node('h2', '', washType),
      );
      header.append(
        heading,
        node(
          'span',
          'appointment-badge' + (completed ? ' completed' : ''),
          completed ? 'Completed' : 'Upcoming',
        ),
      );
      const details = node('dl', 'appointment-details');
      [
        ['Username', b.username],
        ['\u{1F4C5} Date', b.date],
        ['\u{1F552} Time', b.time],
        ['Vehicle type', vehicleType],
      ].forEach(([label, value]) => {
        const group = node('div', '');
        group.append(node('dt', '', label), node('dd', '', value || 'Not specified'));
        details.append(group);
      });
      card.append(header, details);
      const extras = Array.isArray(b.addons)
        ? b.addons
        : Object.keys(b.addons || {}).filter((key) => b.addons[key]);
      if (extras.length)
        card.append(
          node(
            'p',
            'appointment-extras',
            'Extras: ' + extras.map((key) => addonNames[key] || key).join(', '),
          ),
        );
      if (isAdmin) {
        const management = node('section', 'appointment-management');
        const summary = node('div', '');
        summary.append(
          node('h3', '', 'Admin Management'),
          node(
            'p',
            '',
            washType +
              ' package for a ' +
              vehicleType +
              (extras.length
                ? ' with ' + extras.map((key) => addonNames[key] || key).join(' and ')
                : '') +
              '.',
          ),
        );
        management.append(summary);
        if (!completed) {
          const complete = node('button', 'primary-button', 'Mark as Completed');
          complete.type = 'button';
          complete.addEventListener('click', () => {
            const updated = WashDemo.read('bookings', [])
              .map(parseBooking)
              .map((item) =>
                item.id === b.id
                  ? { ...item, status: 'completed', completedAt: new Date().toISOString() }
                  : item,
              );
            WashDemo.save('bookings', updated);
            tab = 'past';
            render();
            $('page-status').textContent = 'Appointment completed and moved to Past washes.';
            document.querySelector('[data-tab="past"]').focus();
          });
          management.append(complete);
        }
        card.append(management);
      }
      $('bookings').append(card);
    });
  }
  document.querySelectorAll('[data-tab]').forEach((button) =>
    button.addEventListener('click', () => {
      tab = button.dataset.tab;
      render();
    }),
  );
  $('refresh').addEventListener('click', render);
  $('logout').addEventListener('click', () => {
    WashDemo.save('account', null);
    location.replace('login.html');
  });
  render();
})();
