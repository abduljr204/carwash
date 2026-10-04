/* ====================================================================
   WASH IT YOURSELF
   Independent of booking/pricing. Three responsibilities are separated:
   photo rendering, erasure/progress, and localized UI/pointer feedback.
   No dependencies, network APIs, timers, or customer data persistence.
   ==================================================================== */
(() => {
  'use strict';
  // Resolve the asset relative to this script (also works on GitHub Pages).
  const imageURL = new URL('../assets/wash-pair.png', document.currentScript.src).href;
  const byId = id => document.getElementById(id);
  const board = byId('wipe-board');
  if (!board) return;
  const dirt = byId('wipe-dirt');
  const dirtyContext = dirt.getContext('2d');
  const cleanContext = byId('wipe-clean').getContext('2d');
  const progress = byId('wipe-progress');
  const resetButton = byId('wipe-reset');
  const revealButton = byId('wipe-reveal');
  const mitt = byId('wipe-mitt');
  const photo = new Image();
  const WIDTH = 1000;
  const HEIGHT = 800;

  // A small, separate alpha mask measures the car area efficiently, without
  // reading photo pixels (which also permits opening the site as a local file).
  const mask = document.createElement('canvas');
  mask.width = 100;
  mask.height = 80;
  const maskContext = mask.getContext('2d', { willReadFrequently: true });
  let percent = 0;
  let loaded = false;
  let pointerId = null;
  let previousPoint = null;
  let progressFrame = 0;
  let lastMilestone = '';

  // ------------------------------------------------------------------
  // 01. TRANSLATION — shares the site's language event, retains wipe state.
  // ------------------------------------------------------------------
  const copy = {
    en: {
      jump:'Try the shine ↗', eyebrow:'A LITTLE DIRT. A BIG REVEAL.', title:"Don't just see it.", titleAccent:'Wash it yourself.',
      description:'Grab an imaginary wash mitt. Drag across the car and uncover the shine, one swipe at a time.',
      instructions:'Click + drag on desktop. Swipe with your finger on mobile.', progress:'SHINE UNLOCKED',
      reset:'Make it dirty again', reveal:'Reveal the finish', note:"Illustrative demo imagery. Your swipes don't change your booking.",
      startHint:'Swipe to shine', completeBadge:'SHINE UNLOCKED', caption:'ONE CAR. TWO VERY DIFFERENT FEELINGS.',
      before:'BEFORE / YOUR TURN', during:'WASH IN PROGRESS', after:'AFTER / LOOK AT THAT SHINE',
      loading:'Getting your car ready…', error:'The photo could not load. Reload the page to try again.',
      start:'Your first swipe starts the transformation.', low:'Keep going. Every swipe brings back the shine.',
      half:'Halfway there. Looking better already.', almost:'Almost spotless. Give it a few more swipes.',
      done:'Spotless. You unlocked the full shine!', image:'Dirty car. Drag or swipe to reveal the clean finish.',
      cleanImage:'The same car, now clean and gleaming.'
    },
    ar: {
      jump:'جرّب اللمعان ↗', eyebrow:'قليل من الغبار. فرق كبير.', title:'لا تكتفِ بالمشاهدة.', titleAccent:'اغسلها بنفسك.',
      description:'تخيّل قفاز الغسيل في يدك. مرّر فوق السيارة واكتشف اللمعان، مسحة بعد مسحة.',
      instructions:'انقر واسحب بالماوس، أو مرّر إصبعك على الهاتف.', progress:'اللمعان المُكتشف',
      reset:'أعد الغبار وجرّب مجدداً', reveal:'اكشف النتيجة', note:'صور توضيحية للتجربة. المسح لا يغيّر اختيارات الحجز.',
      startHint:'امسح لتكشف اللمعان', completeBadge:'اكتمل اللمعان', caption:'نفس السيارة. إحساس مختلف تماماً.',
      before:'قبل الغسيل / دورك الآن', during:'الغسيل جارٍ', after:'بعد الغسيل / تأمّل اللمعان',
      loading:'نجهّز سيارتك…', error:'تعذّر تحميل الصورة. أعد تحميل الصفحة للمحاولة مجدداً.',
      start:'أول مسحة منك تبدأ التحوّل.', low:'واصل المسح. كل لمسة تعيد اللمعان.',
      half:'وصلت إلى المنتصف. الفرق واضح!', almost:'اقتربت من النهاية. بضع مسحات إضافية.',
      done:'نظافة مثالية. اكتشفت اللمعان كاملاً!', image:'سيارة متّسخة. اسحب أو امسح لتكشف السيارة النظيفة.',
      cleanImage:'نفس السيارة، نظيفة ولامعة الآن.'
    }
  };
  const language = () => document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const t = key => copy[language()][key];

  function renderLanguage() {
    document.querySelectorAll('[data-proof]').forEach(node => { node.textContent = t(node.dataset.proof); });
    progress.setAttribute('aria-label', t('progress'));
    renderProgress(true);
  }

  // ------------------------------------------------------------------
  // 02. PHOTO RENDERING — one supplied paired asset, identical crop sizes.
  // Exclude the center divider and crop empty ceiling/floor from both sides.
  // Keep the bitmap dimensions fixed so resizing cannot erase user progress.
  // ------------------------------------------------------------------
  function drawPhoto(context, clean) {
    const half = photo.naturalWidth / 2;
    const cropWidth = half - 4;
    const cropHeight = cropWidth * HEIGHT / WIDTH;
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.drawImage(photo, (clean ? half : 0) + 2, photo.naturalHeight * .1,
      cropWidth, cropHeight, 0, 0, WIDTH, HEIGHT);
  }

  function resetWash() {
    if (!loaded) return;
    endStroke();
    cancelAnimationFrame(progressFrame);
    progressFrame = 0;
    drawPhoto(dirtyContext, false);
    maskContext.globalCompositeOperation = 'source-over';
    maskContext.fillStyle = '#000';
    maskContext.fillRect(0, 0, mask.width, mask.height);
    percent = 0;
    board.dataset.state = 'ready';
    revealButton.disabled = false;
    renderProgress(true);
  }

  // ------------------------------------------------------------------
  // 03. ERASER / PROGRESS — round joined strokes, no reveal slider.
  // The scoring rectangle covers the car, excluding empty ceiling/floor.
  // At 92% cleaned, gently finish the few remaining flecks for the user.
  // ------------------------------------------------------------------
  function eraseSegment(context, from, to, radius, scale = 1) {
    context.save();
    context.scale(scale, scale);
    context.globalCompositeOperation = 'destination-out';
    context.lineWidth = radius * 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    // A circle also handles a simple tap without any pointer movement.
    context.beginPath();
    context.arc(to.x, to.y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function measureProgress() {
    progressFrame = 0;
    const pixels = maskContext.getImageData(4, 20, 92, 47).data;
    let remaining = 0;
    for (let index = 3; index < pixels.length; index += 4) remaining += pixels[index];
    percent = Math.floor((1 - remaining / (pixels.length / 4 * 255)) * 100);
    if (percent >= 92) finishWash();
    else renderProgress();
  }

  function finishWash() {
    if (!loaded) return;
    endStroke();
    cancelAnimationFrame(progressFrame);
    progressFrame = 0;
    percent = 100;
    board.dataset.state = 'complete';
    revealButton.disabled = true;
    renderProgress();
  }

  function renderProgress(force = false) {
    const milestone = board.dataset.state === 'error' ? 'error' : !loaded ? 'loading'
      : percent === 100 ? 'done' : percent >= 75 ? 'almost' : percent >= 50 ? 'half'
      : percent > 0 ? 'low' : 'start';
    progress.value = percent;
    byId('wipe-percent').textContent = new Intl.NumberFormat(language(), { style: 'percent' }).format(percent / 100);
    // Announce milestones only, rather than flooding screen readers per stroke.
    if (force || milestone !== lastMilestone) byId('wipe-status').textContent = t(milestone);
    lastMilestone = milestone;
    byId('wipe-image-tag').textContent = t(percent === 100 ? 'after' : board.dataset.state === 'active' ? 'during' : 'before');
    dirt.setAttribute('aria-label', t(percent === 100 ? 'cleanImage' : 'image'));
  }

  // ------------------------------------------------------------------
  // 04. INPUT AND VISUAL FEEDBACK — unified mouse, pen and touch handling.
  // Pointer capture keeps fast strokes connected when the cursor leaves.
  // Native buttons offer the same complete result without requiring a drag.
  // ------------------------------------------------------------------
  function localPoint(event) {
    const bounds = dirt.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * WIDTH / bounds.width,
      y: (event.clientY - bounds.top) * HEIGHT / bounds.height,
      radius: (event.pointerType === 'touch' ? 36 : 44) * WIDTH / bounds.width };
  }

  function showMitt(point) {
    mitt.style.left = `${point.x / WIDTH * 100}%`;
    mitt.style.top = `${point.y / HEIGHT * 100}%`;
    mitt.style.width = `${point.radius * 2 / WIDTH * 100}%`;
    mitt.style.height = `${point.radius * 2 / HEIGHT * 100}%`;
  }

  function wipeAt(event) {
    const point = localPoint(event);
    eraseSegment(dirtyContext, previousPoint || point, point, point.radius);
    eraseSegment(maskContext, previousPoint || point, point, point.radius, .1);
    previousPoint = point;
    showMitt(point);
    if (!progressFrame) progressFrame = requestAnimationFrame(measureProgress);
  }

  function startStroke(event) {
    if (!loaded || percent === 100 || pointerId !== null || event.button !== 0) return;
    pointerId = event.pointerId;
    dirt.setPointerCapture(pointerId);
    board.dataset.state = 'active';
    board.classList.add('is-wiping');
    wipeAt(event);
  }

  function endStroke(event) {
    if (event && event.pointerId !== pointerId) return;
    if (pointerId !== null && dirt.hasPointerCapture(pointerId)) dirt.releasePointerCapture(pointerId);
    pointerId = null;
    previousPoint = null;
    board.classList.remove('is-wiping');
  }

  dirt.addEventListener('pointerdown', startStroke);
  dirt.addEventListener('pointermove', event => { if (event.pointerId === pointerId) wipeAt(event); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => dirt.addEventListener(type, endStroke));
  resetButton.addEventListener('click', resetWash);
  revealButton.addEventListener('click', finishWash);
  document.addEventListener('wash:language', renderLanguage);
  photo.onload = () => {
    loaded = true;
    board.setAttribute('aria-busy', 'false');
    drawPhoto(cleanContext, true);
    resetButton.disabled = false;
    resetWash();
  };
  photo.onerror = () => {
    board.dataset.state = 'error';
    board.setAttribute('aria-busy', 'false');
    renderProgress(true);
  };
  renderLanguage();
  photo.src = imageURL;
})();
