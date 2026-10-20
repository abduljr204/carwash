(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const { t, formatDate, formatTime, formatList } = WashI18n;
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
  document.querySelector('h1').dataset.t = staff ? 'adminDashboard' : 'userDashboard';
  if ($('scan')) $('scan').hidden = true;
  if ($('today-date')) $('today-date').dataset.t = 'demoBookings';
  const status = () => t('signedInAs', { user: username });
  if ($('search-form')) {
    document.querySelector('label[for="phone-search"]').dataset.t = 'searchUsername';
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
  // Catalog keys; names are looked up at render time so they follow the language.
  const washNames = {
    full: 'serviceFull',
    exterior: 'serviceExterior',
    interior: 'serviceInterior',
  };
  const vehicleNames = { car: 'car', suv: 'suv', pickup: 'pickup', van: 'van', minivan: 'minivan' };
  const addonNames = { tires: 'tires', wax: 'wax' };
  const named = (names, id, fallback) => (Object.hasOwn(names, id) ? t(names[id]) : id || fallback);
  const translated = (names) =>
    Object.fromEntries(Object.entries(names).map(([id, key]) => [id, t(key)]));
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
      if (!current || !allowed(current)) throw new Error(t('errorChanged'));
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
    const title = node('h2', '', t(cancelOnly ? 'cancelTitle' : 'editTitle'));
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
        node('p', '', t('cancelPrompt', { date: formatDate(b.date), time: formatTime(b.time) })),
      );
    } else {
      const date = field('date', t('fieldDate'), b.date);
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
        t('fieldTime'),
        b.time,
        Object.fromEntries(WashConfig.timeSlots.map((time) => [time, formatTime(time)])),
      );
      field('type', t('vehicleType'), b.vehicle?.type, translated(vehicleNames));
      field('model', t('fieldModel'), b.vehicle?.model);
      field('plate', t('fieldPlate'), b.vehicle?.plate);
      field('package', t('fieldService'), b.package, translated(washNames));
      const extras = Array.isArray(b.addons)
        ? b.addons
        : Object.keys(b.addons || {}).filter((key) => b.addons[key]);
      Object.entries(addonNames).forEach(([id, name]) => {
        const label = node('label', '', t(name) + ' ');
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
      t(cancelOnly ? 'confirmCancel' : 'saveChanges'),
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
          error.textContent = t('errorFuture');
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
        t(cancelOnly ? 'canceledMessage' : 'updatedMessage'),
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
      button.textContent = t('tabCount', { label: t(past ? 'tabHistory' : 'tabActive'), count });
      if (button.dataset.tab === tab) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    const bookings = visible.filter((b) => Boolean(historical(b)) === (tab === 'past'));
    $('bookings').replaceChildren();
    if (!bookings.length) {
      $('bookings').append(node('p', 'notice', t(tab === 'past' ? 'noHistory' : 'noActive')));
    }
    bookings.forEach((b) => {
      const completed = b.status === 'completed';
      const washType = named(washNames, b.package, t('fallbackWash'));
      const vehicleType = named(vehicleNames, b.vehicle?.type, t('vehicle'));
      const card = node('article', 'appointment-card');
      const header = node('header', 'appointment-header');
      const heading = node('div', '');
      heading.append(
        node('p', 'appointment-label', t('appointmentLabel')),
        node('h2', '', washType),
      );
      header.append(
        heading,
        node(
          'span',
          'appointment-badge' + (canceled(b) ? ' canceled' : completed ? ' completed' : ''),
          t(canceled(b) ? 'statusCanceled' : completed ? 'statusCompleted' : 'statusUpcoming'),
        ),
      );
      const details = node('dl', 'appointment-details');
      [
        ['username', b.username],
        ['detailDate', b.date && formatDate(b.date)],
        ['detailTime', b.time && formatTime(b.time)],
        ['vehicleType', vehicleType],
        ['makeModel', b.vehicle?.model],
        ['licensePlate', b.vehicle?.plate],
      ].forEach(([label, value]) => {
        const group = node('div', '');
        group.append(node('dt', '', t(label)), node('dd', '', value || t('notSpecified')));
        details.append(group);
      });
      card.append(header, details);
      const extras = Array.isArray(b.addons)
        ? b.addons
        : Object.keys(b.addons || {}).filter((key) => b.addons[key]);
      const extraNames = formatList(extras.map((key) => named(addonNames, key)));
      if (extras.length)
        card.append(node('p', 'appointment-extras', t('extrasList', { list: extraNames })));
      if (isAdmin) {
        const management = node('section', 'appointment-management');
        const summary = node('div', '');
        summary.append(
          node('h3', '', t('adminManagement')),
          node(
            'p',
            '',
            t('adminSummary', {
              wash: washType,
              vehicle: vehicleType,
              extras: extras.length ? t('adminSummaryExtras', { list: extraNames }) : '',
            }),
          ),
        );
        management.append(summary);
        if (canceled(b) && !b.dismissedAt) {
          const dismiss = node('button', 'back-button', t('dismiss'));
          dismiss.type = 'button';
          dismiss.addEventListener('click', () =>
            updateBooking(
              b.id,
              { dismissedAt: new Date().toISOString() },
              (current) => canceled(current) && !current.dismissedAt,
              t('dismissedMessage'),
            ),
          );
          management.append(dismiss);
        }
        if (!completed && !canceled(b)) {
          const complete = node('button', 'primary-button', t('markCompleted'));
          complete.type = 'button';
          complete.addEventListener('click', () => {
            updateBooking(
              b.id,
              { status: 'completed', completedAt: new Date().toISOString() },
              (current) => !canceled(current) && current.status !== 'completed',
              t('completedMessage'),
            );
          });
          management.append(complete);
        }
        card.append(management);
      }
      if (!isAdmin && upcoming(b)) {
        const actions = node('section', 'appointment-management');
        const edit = node('button', 'primary-button', t('editReschedule'));
        const cancel = node('button', 'back-button', t('cancelAppointment'));
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
  document.addEventListener('wash:language', () => {
    $('page-status').textContent = status();
    render();
  });
  WashI18n.translateDocument();
  $('page-status').textContent = status();
  render();
  const requested = new URLSearchParams(location.search);
  if (!isAdmin && ['edit', 'cancel'].includes(requested.get('action'))) {
    const booking = WashDemo.read('bookings', [])
      .map(parseBooking)
      .find((b) => b.id === requested.get('booking') && b.username === username && upcoming(b));
    if (booking) openEditor(booking, requested.get('action') === 'cancel');
  }
})();
