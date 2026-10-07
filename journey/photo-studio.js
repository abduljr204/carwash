(() => {
  const studio = document.querySelector('.photo-studio');
  for (const [id, className] of [
    ['studio-mist', 'mist-active'],
    ['studio-lights', 'lights-active'],
  ]) {
    document.getElementById(id).addEventListener('click', (event) => {
      const enabled = studio.classList.toggle(className);
      event.currentTarget.setAttribute('aria-pressed', String(enabled));
    });
  }
})();
