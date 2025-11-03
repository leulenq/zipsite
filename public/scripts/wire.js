(function () {
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
    setTimeout(() => {
      note.classList.add('show');
    }, 10);
    setTimeout(() => {
      note.classList.remove('show');
      note.addEventListener('transitionend', () => note.remove(), { once: true });
    }, 3200);
  }

  const ctas = document.querySelectorAll('a.button.button-primary');
  ctas.forEach((cta) => {
    if (/Start Free PDF/i.test(cta.textContent || '')) {
      cta.setAttribute('href', '/apply');
    }
    if (/Apply/i.test(cta.textContent || '') && !cta.getAttribute('href')) {
      cta.setAttribute('href', '/apply');
    }
  });

  const uploadForm = document.querySelector('#uploadForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(uploadForm);
      const fileInput = uploadForm.querySelector('input[type="file"]');
      if (!fileInput || !fileInput.files.length) {
        toast('Select a file to upload', 'error');
        return;
      }
      const submitButton = uploadForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Uploading…';
      try {
        const response = await fetch('/upload', {
          method: 'POST',
          body: formData
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Upload failed');
        }
        toast('Upload successful', 'success');
        window.location.reload();
      } catch (error) {
        toast(error.message, 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Upload';
      }
    });
  }

  const pdfButtons = document.querySelectorAll('[data-generate-pdf]');
  pdfButtons.forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const slug = button.getAttribute('data-slug');
      if (!slug) return;
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
      } catch (error) {
        toast(error.message, 'error');
      }
    });
  });
})();
