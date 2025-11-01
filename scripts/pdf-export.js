(function () {
  const exportButton = document.querySelector('[data-export]');
  if (!exportButton) return;

  const card = document.querySelector('.comp-card');
  const nameField = card?.querySelector('[data-field="name"]').textContent.trim() || 'Talent';
  const watermark = card?.dataset.watermark || '';

  async function exportPDF() {
    if (!card) return;
    exportButton.disabled = true;
    exportButton.textContent = 'Rendering…';
    try {
      const canvas = await html2canvas(card, {
        useCORS: true,
        scale: window.devicePixelRatio > 1 ? window.devicePixelRatio : 2,
        backgroundColor: '#ffffff'
      });
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [5.5, 8.5]
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      pdf.setProperties({
        title: `ZipSite Comp Card — ${nameField}`,
        subject: watermark ? 'Free Comp Card' : 'Pro Comp Card',
        author: 'ZipSite',
        creator: 'ZipSite AI Curation'
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, 5.5, 8.5);
      const safeName = nameField.replace(/[^a-z0-9]+/gi, '_');
      pdf.save(`ZipSite_CompCard_${safeName}.pdf`);
    } catch (error) {
      console.error('PDF export failed', error);
      alert('We could not generate the PDF. Please retry.');
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = 'Export PDF';
    }
  }

  exportButton.addEventListener('click', exportPDF);
})();
