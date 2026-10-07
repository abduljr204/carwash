(() => {
  'use strict';
  const preview = document.getElementById('interactive-car').cloneNode(true);
  // Prefix SVG IDs and references so the illustration never interferes with the live builder.
  preview.querySelectorAll('[id]').forEach((element) => {
    const old = element.id;
    element.id = 'hero-' + old;
    preview.querySelectorAll('*').forEach((child) => {
      for (const attribute of [...child.attributes]) {
        if (attribute.value.includes('url(#' + old + ')'))
          child.setAttribute(
            attribute.name,
            attribute.value.replaceAll('url(#' + old + ')', 'url(#hero-' + old + ')'),
          );
      }
    });
  });
  preview.removeAttribute('id');
  preview.removeAttribute('aria-labelledby');
  preview.querySelectorAll('[tabindex], [role="button"]').forEach((element) => {
    element.removeAttribute('tabindex');
    element.removeAttribute('role');
    element.removeAttribute('data-part');
  });
  document.getElementById('hero-car')?.append(preview);
  const money = (value) => '$' + value + ' USD';
  const quoteCopy = {
    exterior: 'A fresh finish for your everyday drive.',
    full: 'The complete reset. A little care, inside and out.',
    interior: 'A cleaner cabin. A better place to be.',
  };
  document.querySelectorAll('[data-quote]').forEach((button) => {
    button.addEventListener('click', () => {
      document
        .querySelectorAll('[data-quote]')
        .forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
      document.getElementById('hero-quote-copy').textContent = quoteCopy[button.dataset.quote];
      document.getElementById('hero-quote-price').textContent = money(
        WashConfig.vehicles[0].basePrice + WashConfig.packageSurcharges[button.dataset.quote],
      );
      document.dispatchEvent(new CustomEvent('wash:quote', { detail: button.dataset.quote }));
    });
  });
  document.querySelectorAll('[data-home-price]').forEach((element) => {
    element.textContent =
      'From ' +
      money(
        WashConfig.vehicles[0].basePrice + WashConfig.packageSurcharges[element.dataset.homePrice],
      );
  });
  const link = document.querySelector('.account-status .account-link');
  if (link && WashDemo.read('account', null) !== 'admin') link.textContent = 'My Bookings ↗';
  function node(tag, text, className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    element.className = className;
    return element;
  }
  function renderAppointment() {
    const banner = document.getElementById('active-appointment');
    const username = WashDemo.read('account', null);
    const bookings = WashDemo.read('bookings', []).filter(
      (b) =>
        b &&
        typeof b === 'object' &&
        b.username === username &&
        !['completed', 'canceled', 'cancelled'].includes(b.status) &&
        Date.parse(`${b.date}T${b.time}:00+02:00`) > Date.now(),
    );
    bookings.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const booking = bookings[0];
    banner.hidden = !booking || !username || username === 'admin';
    banner.replaceChildren();
    if (banner.hidden) return;
    const detail = node('div', '');
    const vehicle = WashConfig.vehicles.find((v) => v.id === booking.vehicle?.type);
    const extras = Array.isArray(booking.addons)
      ? booking.addons
      : Object.keys(booking.addons || {}).filter((key) => booking.addons[key]);
    const quote =
      vehicle && Object.hasOwn(WashConfig.packageSurcharges, booking.package)
        ? WashPricing.calculateQuote(
            {
              vehicleId: vehicle.id,
              exterior: ['full', 'exterior'].includes(booking.package),
              interior: ['full', 'interior'].includes(booking.package),
              addons: extras,
            },
            WashConfig,
          )
        : null;
    const vehicleName = booking.vehicle?.type || 'Vehicle';
    detail.append(
      node('p', '● CONFIRMED / YOUR NEXT WASH', 'eyebrow'),
      node(
        'h2',
        vehicleName.toUpperCase() + (booking.vehicle?.model ? ' · ' + booking.vehicle.model : ''),
      ),
      node(
        'p',
        `${booking.date} · ${booking.time} (Tripoli) · ${quote ? money(quote.total) + ' estimated' : 'Estimate at wash'}`,
      ),
    );
    const actions = node('div', '', 'appointment-home-actions');
    for (const [action, text] of [
      ['edit', 'Edit / Reschedule'],
      ['cancel', 'Cancel Wash'],
    ]) {
      const link = node('a', text);
      link.href = 'dashboard.html?booking=' + encodeURIComponent(booking.id) + '&action=' + action;
      actions.append(link);
    }
    banner.append(detail, actions);
  }
  window.addEventListener('wash:bookings', renderAppointment);
  window.addEventListener('focus', renderAppointment);
  renderAppointment();
})();
