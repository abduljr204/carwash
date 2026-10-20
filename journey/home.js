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
  const { t } = WashI18n;
  const money = (value) => t('priceUsd', { price: value });
  const quoteCopy = {
    exterior: 'quoteCopyExterior',
    full: 'quoteCopyFull',
    interior: 'quoteCopyInterior',
  };
  let quote = 'exterior';
  function renderQuote() {
    document.getElementById('hero-quote-copy').textContent = t(quoteCopy[quote]);
    document.getElementById('hero-quote-price').textContent = money(
      WashConfig.vehicles[0].basePrice + WashConfig.packageSurcharges[quote],
    );
    document.querySelectorAll('[data-home-price]').forEach((element) => {
      element.textContent = t('fromPrice', {
        price: money(
          WashConfig.vehicles[0].basePrice +
            WashConfig.packageSurcharges[element.dataset.homePrice],
        ),
      });
    });
  }
  document.querySelectorAll('[data-quote]').forEach((button) => {
    button.addEventListener('click', () => {
      document
        .querySelectorAll('[data-quote]')
        .forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
      quote = button.dataset.quote;
      renderQuote();
      document.dispatchEvent(new CustomEvent('wash:quote', { detail: button.dataset.quote }));
    });
  });
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
    const vehicleName = vehicle ? t(vehicle.id) : booking.vehicle?.type || t('vehicle');
    detail.append(
      node('p', t('nextWashLabel'), 'eyebrow'),
      node(
        'h2',
        vehicleName.toUpperCase() + (booking.vehicle?.model ? ' · ' + booking.vehicle.model : ''),
      ),
      node(
        'p',
        t('nextWashWhen', {
          date: WashI18n.formatDate(booking.date),
          time: WashI18n.formatTime(booking.time),
          estimate: quote ? t('estimated', { price: money(quote.total) }) : t('estimateAtWash'),
        }),
      ),
    );
    const actions = node('div', '', 'appointment-home-actions');
    for (const [action, text] of [
      ['edit', 'editReschedule'],
      ['cancel', 'cancelWash'],
    ]) {
      const link = node('a', t(text));
      link.href = 'dashboard.html?booking=' + encodeURIComponent(booking.id) + '&action=' + action;
      actions.append(link);
    }
    banner.append(detail, actions);
  }
  window.addEventListener('wash:bookings', renderAppointment);
  window.addEventListener('focus', renderAppointment);
  document.addEventListener('wash:language', () => {
    renderQuote();
    renderAppointment();
  });
  renderQuote();
  renderAppointment();
})();
