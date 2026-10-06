/* ====================================================================
   ANIMATION / PRESENTATION ONLY — never calculates or changes bookings.
   CSS owns transitions and respects prefers-reduced-motion.
   ==================================================================== */
(() => {
  'use strict';
  function focusStep(step) {
    document.getElementById('lab-layout').dataset.step = String(step);
    document.getElementById('car-stage').dataset.focus = ['hood', 'doors', 'finish', 'dashboard'][
      step - 1
    ];
  }
  function updatePartHighlights(selection) {
    const stage = document.getElementById('car-stage');
    stage.classList.toggle('exterior-selected', selection.exterior);
    stage.classList.toggle('interior-selected', selection.interior);
    stage.classList.toggle('tires-selected', selection.addons.includes('tires'));
    stage.classList.toggle('wax-selected', selection.addons.includes('wax'));
  }
  function acknowledgeInteraction(part) {
    const stage = document.getElementById('car-stage');
    stage.dataset.lastPart = part;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    stage.classList.remove('interaction-pulse');
    requestAnimationFrame(() => {
      stage.classList.add('interaction-pulse');
      window.setTimeout(() => stage.classList.remove('interaction-pulse'), 360);
    });
  }
  window.WashMotion = Object.freeze({ focusStep, updatePartHighlights, acknowledgeInteraction });
})();
