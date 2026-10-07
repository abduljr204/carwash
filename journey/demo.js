(() => {
  const memory = {};
  // Bookings are shared across tabs; account sessions remain tab-local.
  const storage = (key) => (key === 'bookings' ? localStorage : sessionStorage);
  try {
    const legacy = JSON.parse(sessionStorage.getItem('naqa-demo-bookings') || '[]');
    const shared = JSON.parse(localStorage.getItem('naqa-demo-bookings') || '[]');
    if (legacy.length) {
      const additions = legacy.filter(
        (item) =>
          !shared.some((saved) =>
            item.id ? saved.id === item.id : JSON.stringify(saved) === JSON.stringify(item),
          ),
      );
      localStorage.setItem('naqa-demo-bookings', JSON.stringify([...shared, ...additions]));
      sessionStorage.removeItem('naqa-demo-bookings');
    }
  } catch {}
  window.WashDemo = {
    read(key, fallback) {
      try {
        return JSON.parse(storage(key).getItem('naqa-demo-' + key)) ?? memory[key] ?? fallback;
      } catch {
        return memory[key] ?? fallback;
      }
    },
    save(key, value) {
      if (key === 'bookings') {
        storage(key).setItem('naqa-demo-' + key, JSON.stringify(value));
        window.dispatchEvent(new Event('wash:bookings'));
        return;
      }
      memory[key] = value;
      try {
        sessionStorage.setItem('naqa-demo-' + key, JSON.stringify(value));
      } catch {}
    },
  };
  window.addEventListener('storage', (event) => {
    if (event.key === 'naqa-demo-bookings' || event.key === null)
      window.dispatchEvent(new Event('wash:bookings'));
  });
})();
