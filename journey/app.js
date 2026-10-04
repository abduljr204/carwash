/* ====================================================================
   BOOKING CONTROLLER
   Owns state, step validation, dates, events and accessible UI rendering.
   Pricing is delegated exclusively to pricing.js.
   Animation is delegated exclusively to motion.js.
   No network requests, online payment, or customer-data persistence.
   ==================================================================== */
(() => {
  'use strict';
  const config = window.WashConfig;
  const pricing = window.WashPricing;
  const motion = window.WashMotion;
  const i18n = window.WashI18n;
  const t = i18n.t;
  const element = id => document.getElementById(id);

  // ------------------------------------------------------------------
  // A. SINGLE SOURCE OF TRUTH
  // Changing language or revisiting a step never replaces this object.
  // ------------------------------------------------------------------
  const state = {
    step: 1,
    furthestStep: 1,
    vehicleId: 'car',
    exterior: true,
    interior: false,
    addons: [],
    date: '',
    time: '',
    reminders: false,
    channel: 'sms',
    contacts: { sms: '', email: '' },
    policyAccepted: false,
    calendarMonth: '',
    errorKey: ''
  };

  // Different body outlines make all five vehicle selections recognizable.
  // The pickup adds an open bed; larger vehicles have broader, longer bodies.
  const bodyPaths = {
    car: 'M113 72Q180 48 247 72Q271 90 273 143L271 469Q266 516 241 533Q180 550 119 533Q94 516 89 469L87 143Q89 90 113 72Z',
    suv: 'M104 64Q180 45 256 64Q281 81 281 126L280 479Q276 536 249 550H111Q84 536 80 479L79 126Q79 81 104 64Z',
    pickup: 'M112 63Q180 47 248 63Q274 79 275 130L275 538Q275 550 262 550H98Q85 550 85 538L85 130Q86 79 112 63Z',
    van: 'M109 47H251Q280 47 280 82V519Q280 553 250 553H110Q80 553 80 519V82Q80 47 109 47Z',
    minivan: 'M118 55Q180 38 242 55Q277 63 278 111L278 491Q273 545 241 546H119Q87 545 82 491L82 111Q83 63 118 55Z'
  };

  // ------------------------------------------------------------------
  // B. FORMATTING / DATE UTILITIES
  // Work with YYYY-MM-DD keys. Use UTC only to do date arithmetic, and
  // Africa/Tripoli to determine today's date / time at the business.
  // ------------------------------------------------------------------
  function formatMoney(value) {
    return new Intl.NumberFormat(i18n.locale(), { style: 'currency', currency: config.currency, maximumFractionDigits: 0 }).format(value);
  }
  function formatNumber(value) { return new Intl.NumberFormat(i18n.locale()).format(value); }
  function getBusinessClock() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: config.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).map(part => [part.type, part.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
  }
  function shiftDate(dateKey, days) {
    const date = new Date(`${dateKey}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }
  function getLastBookingDate() { return shiftDate(getBusinessClock().date, config.bookingHorizonDays); }
  function isTimeAvailable(dateKey, time) {
    const now = getBusinessClock();
    return config.timeSlots.includes(time) && dateKey >= now.date && dateKey <= getLastBookingDate()
      && (dateKey > now.date || time > now.time);
  }
  function isDateAvailable(dateKey) { return config.timeSlots.some(time => isTimeAvailable(dateKey, time)); }
  function formatDate(dateKey, options = {}) {
    return new Intl.DateTimeFormat(i18n.locale(), { day: 'numeric', month: 'short', timeZone: 'UTC', ...options }).format(new Date(`${dateKey}T12:00:00Z`));
  }
  function formatTime(time) {
    return new Intl.DateTimeFormat(i18n.locale(), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }).format(new Date(`2000-01-01T${time}:00Z`));
  }

  // ------------------------------------------------------------------
  // C. STEP 1 — VEHICLE SELECTION
  // ------------------------------------------------------------------
  function selectVehicle(vehicleId) {
    if (!config.vehicles.some(vehicle => vehicle.id === vehicleId)) return;
    state.vehicleId = vehicleId;
    renderVehicleSelector();
    renderVehicleShape();
    renderPackages();
    refreshQuote();
    motion.acknowledgeInteraction('hood');
  }
  function cycleVehicle(direction) {
    const currentIndex = config.vehicles.findIndex(vehicle => vehicle.id === state.vehicleId);
    const nextIndex = (currentIndex + direction + config.vehicles.length) % config.vehicles.length;
    selectVehicle(config.vehicles[nextIndex].id);
  }
  function renderVehicleShape() {
    element('car-body').setAttribute('d', bodyPaths[state.vehicleId]);
    element('pickup-bed').toggleAttribute('hidden', state.vehicleId !== 'pickup');
    element('rear-glass').toggleAttribute('hidden', state.vehicleId === 'pickup');
    element('car-stage').dataset.vehicle = state.vehicleId;
    // Use explicit roof proportions in addition to the outline / pickup bed.
    const roofPaths = {
      pickup: 'M131 262Q180 249 229 262L230 332Q180 347 130 332Z',
      van: 'M127 255H233V440Q180 450 127 440Z',
      minivan: 'M128 256Q180 245 232 256L234 416Q180 435 126 416Z'
    };
    element('car-roof').setAttribute('d', roofPaths[state.vehicleId] || 'M131 262Q180 249 229 262L231 377Q180 392 129 377Z');
    element('vehicle-stage-label').textContent = t(state.vehicleId);
    element('car-svg-title').textContent = `${t('carStage')} — ${t(state.vehicleId)}`;
  }
  function renderVehicleSelector() {
    const index = config.vehicles.findIndex(vehicle => vehicle.id === state.vehicleId);
    element('vehicle-name').textContent = t(state.vehicleId);
    element('vehicle-counter').textContent = `${formatNumber(index + 1)} / ${formatNumber(config.vehicles.length)}`;
    element('base-price').textContent = formatMoney(config.vehicles[index].basePrice);
    element('vehicle-dots').innerHTML = config.vehicles.map(vehicle => `<button type="button" data-vehicle="${vehicle.id}" aria-label="${t(vehicle.id)}" aria-pressed="${state.vehicleId === vehicle.id}"></button>`).join('');
  }

  // ------------------------------------------------------------------
  // D. STEP 2 — WASH COVERAGE
  // Car shell and doors are independent toggles. Both = full wash.
  // Empty coverage is allowed while exploring but blocks continuation.
  // ------------------------------------------------------------------
  function selectPackage(packageId) {
    state.exterior = packageId === 'exterior' || packageId === 'full';
    state.interior = packageId === 'interior' || packageId === 'full';
    clearError();
    renderPackages();
    syncCarControls();
    refreshQuote();
    motion.updatePartHighlights(state);
    motion.acknowledgeInteraction('doors');
  }
  function toggleCoverage(part) {
    state[part] = !state[part];
    clearError();
    renderPackages();
    syncCarControls();
    refreshQuote();
    motion.updatePartHighlights(state);
    motion.acknowledgeInteraction(part);
  }
  function renderPackages() {
    const selectedPackage = pricing.getPackageId(state);
    const vehicle = config.vehicles.find(item => item.id === state.vehicleId);
    element('package-options').innerHTML = ['exterior', 'interior', 'full'].map(id => `
      <button type="button" class="package-button" data-package="${id}" aria-pressed="${selectedPackage === id}">
        <span class="option-indicator" aria-hidden="true"></span>
        <span class="option-copy"><strong>${t(id)}</strong><small>${t(id + 'Desc')}</small></span>
        <span class="option-price">${formatMoney(vehicle.basePrice + config.packageSurcharges[id])}</span>
      </button>`).join('');
  }

  // ------------------------------------------------------------------
  // E. STEP 3 — OPTIONAL FINISHING TREATMENTS
  // ------------------------------------------------------------------
  function toggleAddon(addonId) {
    if (!config.addons.some(addon => addon.id === addonId)) return;
    state.addons = state.addons.includes(addonId) ? state.addons.filter(id => id !== addonId) : [...state.addons, addonId];
    renderAddons();
    syncCarControls();
    refreshQuote();
    motion.updatePartHighlights(state);
    motion.acknowledgeInteraction(addonId);
  }
  function renderAddons() {
    element('addon-options').innerHTML = config.addons.map(addon => `
      <button type="button" class="addon-button" data-addon="${addon.id}" aria-pressed="${state.addons.includes(addon.id)}">
        <span class="option-indicator" aria-hidden="true"></span>
        <span class="option-copy"><strong>${t(addon.id)}</strong><small>${t(addon.id + 'Desc')}</small></span>
        <span class="option-price">+${formatMoney(addon.price)}</span>
      </button>`).join('');
  }

  // ------------------------------------------------------------------
  // F. STEP 4 — CALENDAR / AVAILABLE TIMES / REMINDERS
  // Every date and time is revalidated at confirmation to handle a page
  // left open across a slot boundary or overnight.
  // ------------------------------------------------------------------
  function selectDate(dateKey) {
    if (!isDateAvailable(dateKey)) return;
    state.date = dateKey;
    state.time = '';
    clearError();
    renderCalendar();
    renderTimeSlots();
    refreshQuote();
  }
  function selectTime(time) {
    if (!isTimeAvailable(state.date, time)) return;
    state.time = time;
    clearError();
    renderTimeSlots();
    refreshQuote();
  }
  function changeCalendarMonth(direction) {
    const date = new Date(`${state.calendarMonth}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + direction);
    const month = date.toISOString().slice(0, 7);
    if (month < getBusinessClock().date.slice(0, 7) || month > getLastBookingDate().slice(0, 7)) return;
    state.calendarMonth = month;
    renderCalendar();
  }
  function renderCalendar() {
    const first = new Date(`${state.calendarMonth}-01T12:00:00Z`);
    const year = first.getUTCFullYear();
    const monthIndex = first.getUTCMonth();
    const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const leadingBlanks = (first.getUTCDay() + 6) % 7; // Monday-first grid.
    element('calendar-month').textContent = new Intl.DateTimeFormat(i18n.locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first);
    element('weekdays').innerHTML = Array.from({ length: 7 }, (_, index) => `<span>${formatDate(`2026-06-${String(index + 1).padStart(2, '0')}`, { weekday: 'narrow', day: undefined, month: undefined })}</span>`).join('');
    const blanks = '<span aria-hidden="true"></span>'.repeat(leadingBlanks);
    const days = Array.from({ length: dayCount }, (_, index) => {
      const dateKey = `${state.calendarMonth}-${String(index + 1).padStart(2, '0')}`;
      const isToday = dateKey === getBusinessClock().date;
      return `<button type="button" data-date="${dateKey}" class="${isToday ? 'today' : ''}" aria-label="${formatDate(dateKey, { weekday: 'long', year: 'numeric' })}" aria-pressed="${state.date === dateKey}" ${isToday ? 'aria-current="date"' : ''} ${isDateAvailable(dateKey) ? '' : 'disabled'}>${formatNumber(index + 1)}</button>`;
    }).join('');
    element('calendar-days').innerHTML = blanks + days;
    element('previous-month').disabled = state.calendarMonth <= getBusinessClock().date.slice(0, 7);
    element('next-month').disabled = state.calendarMonth >= getLastBookingDate().slice(0, 7);
  }
  function renderTimeSlots() {
    if (!state.date) { element('time-slots').innerHTML = `<p>${t('chooseDateFirst')}</p>`; return; }
    if (!isDateAvailable(state.date)) { element('time-slots').innerHTML = `<p>${t('noTimes')}</p>`; return; }
    element('time-slots').innerHTML = config.timeSlots.map(time => `<button type="button" data-time="${time}" aria-pressed="${state.time === time}" ${isTimeAvailable(state.date, time) ? '' : 'disabled'}>${formatTime(time)}</button>`).join('');
  }
  function renderReminderSettings() {
    element('reminder').checked = state.reminders;
    element('reminder-settings').hidden = !state.reminders;
    element('contact-label').textContent = t(state.channel === 'sms' ? 'phone' : 'emailAddress');
    element('contact').type = state.channel === 'sms' ? 'tel' : 'email';
    element('contact').autocomplete = state.channel === 'sms' ? 'tel' : 'email';
    element('contact').placeholder = state.channel === 'sms' ? '091 210 3120' : 'you@example.com';
    element('contact').value = state.contacts[state.channel];
    element('contact').disabled = !state.reminders;
    element('contact').required = state.reminders;
    element('accept-policy').checked = state.policyAccepted;
    document.querySelectorAll('[name=channel]').forEach(input => { input.checked = input.value === state.channel; });
  }

  // ------------------------------------------------------------------
  // G. SHARED VIEW RENDERING AND PURE PRICE ENGINE ADAPTER
  // ------------------------------------------------------------------
  function refreshQuote() {
    const quote = pricing.calculateQuote(state, config);
    element('total').textContent = formatMoney(quote.total);
    const packageName = quote.packageId ? t(quote.packageId) : t('noPackage');
    const extras = quote.addons.length ? quote.addons.map(addon => t(addon.id)).join(' + ') : t('noExtras');
    element('selection-recap').innerHTML = `<strong>${t(quote.vehicleId)} · ${packageName}</strong><span>${extras}</span>`;
  }
  function syncCarControls() {
    document.querySelectorAll('[data-part]').forEach(control => {
      const part = control.dataset.part;
      const active = state.step === 2 ? ['exterior', 'interior'].includes(part) : state.step === 3 && ['tires', 'wax'].includes(part);
      const selected = ['exterior', 'interior'].includes(part) ? state[part] : state.addons.includes(part);
      control.setAttribute('tabindex', active ? '0' : '-1');
      control.setAttribute('aria-disabled', String(!active));
      control.setAttribute('aria-pressed', String(selected));
      control.setAttribute('aria-label', t(part + 'Control'));
    });
  }
  function renderStepNavigation() {
    element('step-navigation').innerHTML = [1, 2, 3, 4].map(step => `<li><button type="button" data-step-link="${step}" ${step === state.step ? 'aria-current="step"' : ''} class="${step < state.furthestStep ? 'completed' : ''}" ${step > state.furthestStep ? 'disabled' : ''}><span class="step-index" aria-hidden="true">${step < state.furthestStep ? '✓' : String(step).padStart(2, '0')}</span><span>${t('step' + step)}</span></button></li>`).join('');
  }
  function renderActiveStep() {
    [1, 2, 3, 4].forEach(step => { element(`panel-${step}`).hidden = step !== state.step; });
    element('step-title').textContent = t('title' + state.step);
    element('step-kicker').textContent = t('kicker' + state.step);
    element('step-description').textContent = t('desc' + state.step);
    element('view-label').textContent = t('view' + state.step);
    element('stage-hint').textContent = t('hint' + state.step);
    element('next-step').textContent = t(state.step === 4 ? 'confirm' : 'continue');
    element('back-step').hidden = state.step === 1;
    renderStepNavigation();
    syncCarControls();
    motion.focusStep(state.step);
  }
  function renderAll() {
    renderActiveStep();
    renderVehicleSelector();
    renderVehicleShape();
    renderPackages();
    renderAddons();
    renderCalendar();
    renderTimeSlots();
    renderReminderSettings();
    refreshQuote();
    motion.updatePartHighlights(state);
    if (state.errorKey) showError(state.errorKey, false);
    if (element('confirmation').open) renderConfirmation();
  }

  // ------------------------------------------------------------------
  // H. NAVIGATION AND VALIDATION
  // No step can bypass mandatory package / scheduling requirements.
  // ------------------------------------------------------------------
  function showError(key, focus = true) {
    state.errorKey = key;
    element('step-error').textContent = t(key);
    element('step-error').hidden = false;
    if (focus) { element('step-error').tabIndex = -1; element('step-error').focus(); }
  }
  function clearError() { state.errorKey = ''; element('step-error').hidden = true; }
  function validatePackage() {
    if (pricing.getPackageId(state)) return true;
    showError('errorPackage');
    return false;
  }
  function goToStep(step) {
    if (step < 1 || step > 4 || step > state.furthestStep) return;
    if (step > 2 && !validatePackage()) return;
    state.step = step;
    clearError();
    renderActiveStep();
    if (step === 4) { renderCalendar(); renderTimeSlots(); }
    // Move the viewport to the scene, not to the controls: the car remains
    // the focus of the visual journey, especially on a small phone screen.
    element('step-title').focus({ preventScroll: true });
    element('lab-layout').scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  function advanceStep() {
    if (state.step === 4) { confirmBookingPreview(); return; }
    if (state.step === 2 && !validatePackage()) return;
    state.furthestStep = Math.max(state.furthestStep, state.step + 1);
    goToStep(state.step + 1);
  }
  function validateScheduling() {
    if (!isTimeAvailable(state.date, state.time)) { renderCalendar(); renderTimeSlots(); showError('errorDate'); return false; }
    if (!state.policyAccepted) { showError('errorPolicy'); return false; }
    if (state.reminders) {
      const value = state.contacts[state.channel].trim();
      // Normalize Arabic/Persian digits for validation, preserving the field.
      const normalized = value.replace(/[٠-٩]/g, char => String(char.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, char => String(char.charCodeAt(0) - 1776));
      const digits = normalized.replace(/[^0-9]/g, '');
      const validPhone = /^[+0-9() .-]+$/.test(normalized) && digits.length >= 7 && digits.length <= 15;
      const validEmail = value.length > 0 && element('contact').validity.valid;
      if (state.channel === 'sms' ? !validPhone : !validEmail) { showError(state.channel === 'sms' ? 'errorPhone' : 'errorEmail'); return false; }
    }
    return true;
  }
  function renderConfirmation() {
    const quote = pricing.calculateQuote(state, config);
    const rows = [
      ['vehicle', t(state.vehicleId)], ['wash', t(quote.packageId)],
      ['extras', quote.addons.map(addon => t(addon.id)).join(' + ') || t('none')],
      ['appointment', `${formatDate(state.date, { weekday: 'short' })} · ${formatTime(state.time)}`],
      ['reminders', state.reminders ? `${t(state.channel)} ${t('previewSuffix')}` : t('off')],
      ['total', formatMoney(quote.total)]
    ];
    // Use textContent for every value, including any future user data.
    element('confirmation-details').replaceChildren(...rows.map(([key, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt'); term.textContent = t(key);
      const detail = document.createElement('dd'); detail.textContent = value;
      row.append(term, detail); return row;
    }));
  }
  function confirmBookingPreview() {
    if (!validatePackage() || !validateScheduling()) return;
    clearError();
    renderConfirmation();
    element('confirmation').showModal();
  }

  // ------------------------------------------------------------------
  // I. EVENT WIRING — delegate repeated controls, bind fixed controls once.
  // SVG buttons handle Enter / Space just like native HTML buttons.
  // ------------------------------------------------------------------
  function handleCarPart(part) {
    if (state.step === 2 && ['exterior', 'interior'].includes(part)) toggleCoverage(part);
    if (state.step === 3 && ['tires', 'wax'].includes(part)) toggleAddon(part);
  }
  function bindEvents() {
    element('previous-vehicle').addEventListener('click', () => cycleVehicle(-1));
    element('next-vehicle').addEventListener('click', () => cycleVehicle(1));
    element('vehicle-dots').addEventListener('click', event => { const button = event.target.closest('[data-vehicle]'); if (button) selectVehicle(button.dataset.vehicle); });
    element('package-options').addEventListener('click', event => { const button = event.target.closest('[data-package]'); if (button) selectPackage(button.dataset.package); });
    element('addon-options').addEventListener('click', event => { const button = event.target.closest('[data-addon]'); if (button) toggleAddon(button.dataset.addon); });
    element('interactive-car').addEventListener('click', event => { const control = event.target.closest('[data-part]'); if (control) handleCarPart(control.dataset.part); });
    element('interactive-car').addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      const control = event.target.closest('[data-part]');
      if (control) { event.preventDefault(); handleCarPart(control.dataset.part); }
    });
    element('next-step').addEventListener('click', advanceStep);
    element('back-step').addEventListener('click', () => goToStep(state.step - 1));
    element('step-navigation').addEventListener('click', event => { const button = event.target.closest('[data-step-link]'); if (button && !button.disabled) goToStep(Number(button.dataset.stepLink)); });
    element('previous-month').addEventListener('click', () => changeCalendarMonth(-1));
    element('next-month').addEventListener('click', () => changeCalendarMonth(1));
    element('calendar-days').addEventListener('click', event => { const button = event.target.closest('[data-date]'); if (button && !button.disabled) selectDate(button.dataset.date); });
    element('time-slots').addEventListener('click', event => { const button = event.target.closest('[data-time]'); if (button && !button.disabled) selectTime(button.dataset.time); });
    element('calendar-days').addEventListener('keydown', event => {
      const button = event.target.closest('[data-date]');
      const direction = i18n.language === 'ar' ? -1 : 1;
      const offsets = { ArrowRight: direction, ArrowLeft: -direction, ArrowUp: -7, ArrowDown: 7 };
      if (!button || !offsets[event.key]) return;
      event.preventDefault();
      const target = element('calendar-days').querySelector(`[data-date="${shiftDate(button.dataset.date, offsets[event.key])}"]:not(:disabled)`);
      target?.focus();
    });
    element('reminder').addEventListener('change', event => { state.reminders = event.target.checked; clearError(); renderReminderSettings(); });
    document.querySelectorAll('[name=channel]').forEach(input => input.addEventListener('change', () => { state.channel = input.value; clearError(); renderReminderSettings(); }));
    element('contact').addEventListener('input', event => { state.contacts[state.channel] = event.target.value; clearError(); });
    element('accept-policy').addEventListener('change', event => { state.policyAccepted = event.target.checked; clearError(); });
    document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => i18n.setLanguage(button.dataset.language)));
    document.addEventListener('wash:language', renderAll);
    element('close-confirmation').addEventListener('click', () => element('confirmation').close());
    element('edit-booking').addEventListener('click', () => element('confirmation').close());
  }

  // Initialize only after defer-loaded HTML and dependencies are ready.
  state.calendarMonth = getBusinessClock().date.slice(0, 7);
  bindEvents();
  renderAll();
})();
