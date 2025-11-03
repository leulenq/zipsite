(function () {
  const toast = (window.ZipSite && window.ZipSite.toast) || ((msg) => alert(msg));
  const setLoading = (window.ZipSite && window.ZipSite.setLoading) || (() => () => {});

  function uploadImages(files) {
    if (!files || !files.length) return;
    const trigger = document.querySelector('[data-trigger-upload]');
    const done = setLoading(trigger, 'Uploading…');

    const queue = Array.from(files);

    const next = () => {
      const file = queue.shift();
      if (!file) {
        done();
        toast('Upload complete', 'success');
        window.location.reload();
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      fetch('/upload', {
        method: 'POST',
        body: formData
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              throw new Error(data.error || 'Upload failed');
            });
          }
        })
        .then(() => next())
        .catch((error) => {
          done();
          toast(error.message, 'error');
        });
    };

    next();
  }

  function handleUpload() {
    const input = document.getElementById('mediaUploadInput');
    const trigger = document.querySelector('[data-trigger-upload]');
    if (!input || !trigger) return;
    trigger.addEventListener('click', () => {
      input.click();
    });
    input.addEventListener('change', () => {
      uploadImages(input.files);
    });
  }

  function serializeOrder() {
    return Array.from(document.querySelectorAll('[data-media-grid] [data-media-id]')).map((node) => node.dataset.mediaId);
  }

  function refreshMoveStates() {
    const cards = Array.from(document.querySelectorAll('[data-media-grid] [data-media-id]'));
    cards.forEach((card, index) => {
      const up = card.querySelector('[data-media-move="up"]');
      const down = card.querySelector('[data-media-move="down"]');
      if (up) up.disabled = index === 0;
      if (down) down.disabled = index === cards.length - 1;
    });
  }

  function postOrder(order) {
    return fetch('/media/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order })
    });
  }

  function handleMediaGrid() {
    const grid = document.querySelector('[data-media-grid]');
    if (!grid) return;

    grid.addEventListener('click', async (event) => {
      const target = event.target.closest('[data-media-delete],[data-media-move]');
      if (!target) return;

      const card = event.target.closest('[data-media-id]');
      if (!card) return;
      const mediaId = card.dataset.mediaId;

      if (target.hasAttribute('data-media-delete')) {
        if (!window.confirm('Remove this image from your portfolio?')) return;
        const done = setLoading(target, 'Removing…');
        try {
          const response = await fetch(`/media/${mediaId}/delete`, { method: 'POST' });
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Unable to delete image');
          }
          toast('Image removed', 'success');
          card.remove();
          const order = serializeOrder();
          if (order.length) {
            await postOrder(order);
          }
          refreshMoveStates();
        } catch (error) {
          toast(error.message, 'error');
        } finally {
          done();
        }
        return;
      }

      if (target.dataset.mediaMove) {
        event.preventDefault();
        const direction = target.dataset.mediaMove;
        const sibling = direction === 'up' ? card.previousElementSibling : card.nextElementSibling;
        if (!sibling) return;
        if (direction === 'up') {
          card.parentElement.insertBefore(card, sibling);
        } else {
          sibling.after(card);
        }
        const order = serializeOrder();
        try {
          const response = await postOrder(order);
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Unable to reorder');
          }
          toast('Order updated', 'success');
          refreshMoveStates();
        } catch (error) {
          toast(error.message, 'error');
        }
      }
    });

    grid.addEventListener('change', async (event) => {
      const select = event.target.closest('select');
      if (!select) return;
      const card = event.target.closest('[data-media-id]');
      if (!card) return;
      const mediaId = card.dataset.mediaId;
      try {
        const response = await fetch(`/media/${mediaId}/label`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ label: select.value })
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Unable to update label');
        }
        toast('Label saved', 'success');
      } catch (error) {
        toast(error.message, 'error');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    handleUpload();
    handleMediaGrid();
    refreshMoveStates();
    document.querySelectorAll('form[data-claim-form]').forEach((form) => {
      form.addEventListener('submit', () => {
        const submit = form.querySelector('[type="submit"]');
        setLoading(submit, submit?.dataset.loadingText || 'Claiming…');
      });
    });
  });
})();
