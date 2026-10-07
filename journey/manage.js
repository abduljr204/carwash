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
    'Signed in as ' + username + '. Booking changes sync automatically across browser tabs.';
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
  const canceled = (b) => ['canceled', 'cancelled'].includes(b.status);
  const historical = (b) =>
    b.status === 'completed' || (canceled(b) && (!isAdmin || b.dismissedAt));
  const upcoming = (b) =>
    !canceled(b) &&
    b.status !== 'completed' &&
    Date.parse(`${b.date}T${b.time}:00+02:00`) > Date.now();
  function updateBooking(id, change, allowed, message) {
    try {
      const all = WashDemo.read('bookings', []).map(parseBooking);
      const current = all.find((b) => b.id === id);
      if (!current || !allowed(current))
        throw new Error('This appointment has changed. Refresh and try again.');
      WashDemo.save(
        'bookings',
        all.map((b) => (b.id === id ? { ...b, ...change } : b)),
      );
      $('booking-dialog').close();
      $('page-error').hidden = true;
      render();
      $('page-status').textContent = message;
    } catch (error) {
      const target = $('dialog-error') || $('page-error');
      target.textContent = error.message;
      target.hidden = false;
    }
  }
  function openEditor(b, cancelOnly = false) {
    const content = $('dialog-content');
    content.replaceChildren();
    const title = node('h2', '', cancelOnly ? 'Cancel appointment?' : 'Edit appointment');
    title.id = 'dialog-title';
    const form = node('form', '');
    const error = node('p', 'error');
    error.id = 'dialog-error';
    error.setAttribute('role', 'alert');
    error.hidden = true;
    content.append(title, form);
    const fields = {};
    function field(key, label, value, options) {
      const caption = node('label', '', label);
      const input = node(options ? 'select' : 'input', '');
      input.id = 'edit-' + key;
      caption.htmlFor = input.id;
      if (options)
        Object.entries(options).forEach(([id, name]) => {
          const option = node('option', '', name);
          option.value = id;
          input.append(option);
        });
      else input.type = key === 'date' ? 'date' : 'text';
      input.value = value || '';
      input.required = ['date', 'time', 'type', 'package'].includes(key);
      input.maxLength = 100;
      fields[key] = input;
      form.append(caption, input);
      return input;
    }
    if (cancelOnly) {
      form.append(
        node(
          'p',
          '',
          `Cancel your appointment on ${b.date} at ${b.time}? The admin will be notified automatically.`,
        ),
      );
    } else {
      const date = field('date', 'Date (Tripoli time)', b.date);
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: WashConfig.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      date.min = today;
      date.max = new Date(
        Date.parse(today + 'T12:00:00Z') + WashConfig.bookingHorizonDays * 86400000,
      )
        .toISOString()
        .slice(0, 10);
      field(
        'time',
        'Time (Tripoli time)',
        b.time,
        Object.fromEntries(WashConfig.timeSlots.map((time) => [time, time])),
      );
      field('type', 'Vehicle type', b.vehicle?.type, vehicleNames);
      field('model', 'Vehicle make / model (optional)', b.vehicle?.model);
      field('plate', 'License plate (optional)', b.vehicle?.plate);
      field('package', 'Wash service', b.package, washNames);
      const extras = Array.isArray(b.addons)
        ? b.addons
        : Object.keys(b.addons || {}).filter((key) => b.addons[key]);
      Object.entries(addonNames).forEach(([id, name]) => {
        const label = node('label', '', name + ' ');
        const input = node('input', '');
        input.type = 'checkbox';
        input.checked = extras.includes(id);
        fields[id] = input;
        label.append(input);
        form.append(label);
      });
    }
    const submit = node(
      'button',
      'primary-button',
      cancelOnly ? 'Confirm cancellation' : 'Save changes',
    );
    submit.type = 'submit';
    form.append(error, submit);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      let change = { status: 'canceled', canceledAt: new Date().toISOString() };
      if (!cancelOnly) {
        const scheduled = Date.parse(`${fields.date.value}T${fields.time.value}:00+02:00`);
        if (
          !Number.isFinite(scheduled) ||
          scheduled <= Date.now() ||
          scheduled > Date.now() + WashConfig.bookingHorizonDays * 86400000
        ) {
          error.textContent = 'Choose a future appointment within the next 30 days.';
          error.hidden = false;
          return;
        }
        change = {
          date: fields.date.value,
          time: fields.time.value,
          vehicle: {
            ...b.vehicle,
            type: fields.type.value,
            model: fields.model.value.trim(),
            plate: fields.plate.value.trim(),
          },
          package: fields.package.value,
          addons: Object.keys(addonNames).filter((id) => fields[id].checked),
          updatedAt: new Date().toISOString(),
        };
      }
      updateBooking(
        b.id,
        change,
        (current) =>
          current.username === username && upcoming(current) && current.updatedAt === b.updatedAt,
        cancelOnly ? 'Appointment canceled.' : 'Appointment updated.',
      );
    });
    $('booking-dialog').showModal();
  }
  $('close-dialog').addEventListener('click', () => $('booking-dialog').close());
  window.addEventListener('wash:bookings', render);
  window.addEventListener('focus', render);
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
      const count = visible.filter((b) => Boolean(historical(b)) === past).length;
      button.textContent = (past ? 'History' : 'Active bookings') + ' (' + count + ')';
      if (button.dataset.tab === tab) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    const bookings = visible.filter((b) => Boolean(historical(b)) === (tab === 'past'));
    $('bookings').replaceChildren();
    if (!bookings.length) {
      $('bookings').append(
        node('p', 'notice', tab === 'past' ? 'No appointment history yet.' : 'No active bookings.'),
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
          'appointment-badge' + (canceled(b) ? ' canceled' : completed ? ' completed' : ''),
          canceled(b) ? 'Canceled' : completed ? 'Completed' : 'Upcoming',
        ),
      );
      const details = node('dl', 'appointment-details');
      [
        ['Username', b.username],
        ['\u{1F4C5} Date', b.date],
        ['\u{1F552} Time', b.time],
        ['Vehicle type', vehicleType],
        ['Make / model', b.vehicle?.model],
        ['License plate', b.vehicle?.plate],
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
        if (canceled(b) && !b.dismissedAt) {
          const dismiss = node('button', 'back-button', 'Dismiss from queue');
          dismiss.type = 'button';
          dismiss.addEventListener('click', () =>
            updateBooking(
              b.id,
              { dismissedAt: new Date().toISOString() },
              (current) => canceled(current) && !current.dismissedAt,
              'Canceled appointment dismissed from the active queue.',
            ),
          );
          management.append(dismiss);
        }
        if (!completed && !canceled(b)) {
          const complete = node('button', 'primary-button', 'Mark as Completed');
          complete.type = 'button';
          complete.addEventListener('click', () => {
            updateBooking(
              b.id,
              { status: 'completed', completedAt: new Date().toISOString() },
              (current) => !canceled(current) && current.status !== 'completed',
              'Appointment completed and moved to History.',
            );
          });
          management.append(complete);
        }
        card.append(management);
      }
      if (!isAdmin && upcoming(b)) {
        const actions = node('section', 'appointment-management');
        const edit = node('button', 'primary-button', 'Edit / reschedule');
        const cancel = node('button', 'back-button', 'Cancel appointment');
        edit.type = cancel.type = 'button';
        edit.addEventListener('click', () => openEditor(b));
        cancel.addEventListener('click', () => openEditor(b, true));
        actions.append(edit, cancel);
        card.append(actions);
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
