/* ====================================================================
   PURE PRICING ENGINE — independently testable, no side effects.
   No DOM, animations, localStorage, listeners, or input mutation.
   ==================================================================== */
(() => {
  'use strict';
  /** Convert independent exterior / interior selections to one package. */
  function getPackageId({ exterior, interior }) {
    if (exterior && interior) return 'full';
    if (exterior) return 'exterior';
    if (interior) return 'interior';
    return null;
  }
  /** Charge the vehicle base once, package once, and each unique extra once. */
  function calculateQuote(selection, config) {
    const vehicle = config.vehicles.find(item => item.id === selection.vehicleId);
    if (!vehicle) throw new Error('Unknown vehicle ID');
    const packageId = getPackageId(selection);
    const packagePrice = packageId ? config.packageSurcharges[packageId] : 0;
    const addons = config.addons.filter(item => selection.addons.includes(item.id));
    const extrasPrice = addons.reduce((sum, item) => sum + item.price, 0);
    return { vehicleId: vehicle.id, basePrice: vehicle.basePrice, packageId,
      packagePrice, addons, extrasPrice, total: vehicle.basePrice + packagePrice + extrasPrice };
  }
  window.WashPricing = Object.freeze({ getPackageId, calculateQuote });
})();
