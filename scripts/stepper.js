(function () {
  const form = document.getElementById('application-form');
  if (!form) return;

  const steps = Array.from(document.querySelectorAll('.step'));
  const panels = Array.from(document.querySelectorAll('[data-step-panel]'));
  const dropzone = document.querySelector('[data-dropzone]');
  const photoPreview = document.querySelector('[data-photo-preview]');
  const photoInput = document.getElementById('photo-input');
  const reviewFields = form.querySelectorAll('[data-review-field]');

  let current = 0;
  const uploads = [];

  function showStep(index) {
    current = index;
    panels.forEach((panel) => {
      const stepIndex = Number(panel.dataset.stepPanel);
      const isActive = stepIndex === index;
      panel.hidden = !isActive;
    });
    steps.forEach((step, i) => {
      if (i === index) {
        step.setAttribute('aria-current', 'step');
      } else {
        step.removeAttribute('aria-current');
      }
    });
    panels[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function collectData() {
    const data = new FormData(form);
    const name = `${data.get('firstName') || ''} ${data.get('lastName') || ''}`.trim();
    const reviewMap = {
      name: name || '—',
      email: data.get('email') || '—',
      height: data.get('height') || '—',
      location: data.get('location') || '—',
      bio: data.get('bio') || '—',
      experience: data.get('experience') || '—',
      instagram: data.get('instagram') || '—',
      portfolio: data.get('portfolio') || '—',
      availability: data.get('availability') || '—',
      photos: uploads.length ? `${uploads.length} files ready` : 'No files uploaded yet.'
    };
    reviewFields.forEach((node) => {
      const key = node.dataset.reviewField;
      if (key in reviewMap) {
        node.textContent = reviewMap[key];
      }
    });
  }

  function validateStep(index) {
    const panel = panels[index];
    const inputs = Array.from(panel.querySelectorAll('input, textarea, select'));
    let valid = true;
    inputs.forEach((input) => {
      if (!input.checkValidity()) {
        input.reportValidity();
        valid = false;
      }
    });
    return valid;
  }

  function goNext() {
    if (!validateStep(current)) return;
    if (current < panels.length - 1) {
      showStep(current + 1);
      if (current + 1 === panels.length - 1) {
        collectData();
      }
    }
  }

  function goPrev() {
    if (current > 0) {
      showStep(current - 1);
    }
  }

  form.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('[data-next]')) {
      event.preventDefault();
      goNext();
    }
    if (target.matches('[data-prev]')) {
      event.preventDefault();
      goPrev();
    }
    if (target.matches('[data-edit-step]')) {
      event.preventDefault();
      const targetStep = Number(target.dataset.editStep || 0);
      showStep(targetStep);
    }
  });

  steps.forEach((step, index) => {
    const button = step.querySelector('button');
    if (!button) return;
    button.addEventListener('click', () => {
      collectData();
      showStep(index);
    });
  });

  function renderPreview() {
    photoPreview.innerHTML = '';
    uploads.forEach((file) => {
      const chip = document.createElement('span');
      chip.className = 'photo-chip';
      chip.textContent = `${file.name} (${Math.round(file.size / 1024)}kb)`;
      photoPreview.appendChild(chip);
    });
    collectData();
  }

  function handleFiles(files) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      uploads.push(file);
    });
    renderPreview();
  }

  if (photoInput) {
    photoInput.addEventListener('change', (event) => {
      handleFiles(event.target.files);
    });
  }

  if (dropzone) {
    ['dragenter', 'dragover'].forEach((evt) => {
      dropzone.addEventListener(evt, (event) => {
        event.preventDefault();
        dropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach((evt) => {
      dropzone.addEventListener(evt, (event) => {
        event.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });
    dropzone.addEventListener('drop', (event) => {
      const files = event.dataTransfer?.files;
      if (files) handleFiles(files);
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    collectData();
    form.reset();
    uploads.length = 0;
    renderPreview();
    alert('Thank you! Our AI curator is processing your submission.');
    showStep(0);
  });

  showStep(0);
})();
