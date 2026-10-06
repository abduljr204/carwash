(() => {
  const memory = {};
  window.WashDemo = {
    read(key, fallback) {
      try {
        return JSON.parse(sessionStorage.getItem('naqa-demo-' + key)) ?? memory[key] ?? fallback;
      } catch {
        return memory[key] ?? fallback;
      }
    },
    save(key, value) {
      memory[key] = value;
      try {
        sessionStorage.setItem('naqa-demo-' + key, JSON.stringify(value));
      } catch {}
    },
  };
})();
