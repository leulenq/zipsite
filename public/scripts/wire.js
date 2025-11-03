(function () {
  const ZipSite = (window.ZipSite = window.ZipSite || {});

  function toast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const note = document.createElement('div');
    note.className = `toast toast-${type}`;
    note.textContent = message;
    container.appendChild(note);
    requestAnimationFrame(() => {
      note.classList.add('show');
    });
    setTimeout(() => {
      note.classList.remove('show');
      note.addEventListener(
        'transitionend',
        () => {
          note.remove();
          if (!container.childElementCount) {
            container.remove();
          }
        },
        { once: true }
      );
    }, 3600);
  }

  ZipSite.toast = toast;

  function setLoading(button, loadingText) {
    if (!button) return () => {};
    const originalText = button.dataset.originalText || button.textContent;
    button.dataset.originalText = originalText;
    button.disabled = true;
    if (loadingText) {
      button.textContent = loadingText;
    }
    button.classList.add('is-loading');
    return () => {
      button.disabled = false;
      button.classList.remove('is-loading');
      button.textContent = originalText;
    };
  }

  ZipSite.setLoading = setLoading;

  function hydrateFlash() {
    const flashes = document.querySelectorAll('[data-flash]');
    flashes.forEach((node) => {
      toast(node.textContent.trim(), node.dataset.flashType || 'info');
      node.remove();
    });
  }

  function handleAsyncForms() {
    document.querySelectorAll('form[data-async]').forEach((form) => {
      form.addEventListener('submit', () => {
        const submitButton = form.querySelector('[type="submit"]');
        const loadingText = submitButton?.dataset.loadingText;
        if (submitButton) {
          setLoading(submitButton, loadingText);
        }
      });
    });
  }

  function handleCopyLinks() {
    document.querySelectorAll('[data-copy-link]').forEach((button) => {
      button.addEventListener('click', async () => {
        const value = button.getAttribute('data-copy-value');
        try {
          await navigator.clipboard.writeText(value);
          toast('Link copied to clipboard', 'success');
        } catch (error) {
          toast('Unable to copy link', 'error');
        }
      });
    });
  }

  function handlePdfButtons() {
    document.querySelectorAll('[data-action="download-pdf"]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        const slug = button.getAttribute('data-slug');
        if (!slug) return;
        const done = setLoading(button, 'Generating…');
        try {
          const response = await fetch(`/pdf/${slug}?download=1`);
          if (!response.ok) {
            throw new Error('Unable to generate PDF');
          }
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ZipSite-${slug}-compcard.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          toast('PDF downloaded', 'success');
        } catch (error) {
          toast(error.message, 'error');
        } finally {
          done();
        }
      });
    });
  }

  function wireMobileNav() {
    const toggle = document.querySelector('.mobile-nav-toggle');
    const panel = document.querySelector('#mobileNav');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    hydrateFlash();
    handleAsyncForms();
    handleCopyLinks();
    handlePdfButtons();
    wireMobileNav();
  });
})();
