/* ====================================================================
   BUSINESS CONFIGURATION — example prices / hours, not verified quotes.
   Contains data only. No DOM access, calculations, or animations.
   ==================================================================== */
const washConfig = Object.freeze({
  currency: 'USD',
  timeZone: 'Africa/Tripoli',
  bookingHorizonDays: 30,
  slotCapacity: 3,
  vehicles: [
    { id: 'car', basePrice: 15 },
    { id: 'suv', basePrice: 20 },
    { id: 'pickup', basePrice: 25 },
    { id: 'van', basePrice: 30 },
    { id: 'minivan', basePrice: 23 },
  ],
  packageSurcharges: { exterior: 0, interior: 5, full: 15 },
  addons: [
    { id: 'tires', price: 5 },
    { id: 'wax', price: 10 },
  ],
  timeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
});
if (typeof module !== 'undefined') module.exports = washConfig;
else window.WashConfig = washConfig;
