(function () {
  const filters = document.querySelectorAll('[data-component="board-filter"]');
  filters.forEach((filter) => {
    const targetGrid = filter.nextElementSibling && filter.nextElementSibling.matches('[data-component="board-grid"]')
      ? filter.nextElementSibling
      : document.querySelector(filter.dataset.target);

    filter.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        const letter = button.dataset.letter;
        filter.querySelectorAll('button').forEach((btn) => btn.classList.toggle('is-active', btn === button));
        if (!targetGrid) return;
        targetGrid.querySelectorAll('.board-card').forEach((card) => {
          const cardLetter = (card.dataset.letter || '').toLowerCase();
          const show = letter === 'all' || cardLetter === letter;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  });
})();
