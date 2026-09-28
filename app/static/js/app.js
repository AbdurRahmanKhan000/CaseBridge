/**
 * CaseBridge Client Utilities
 * Vanilla, modular, zero dependencies, accessible
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Copy Tracking Code to Clipboard
  const copyButtons = document.querySelectorAll('[data-copy-target]');
  copyButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const text = targetEl.innerText || targetEl.value;
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerText;
        btn.innerText = 'Copied to Clipboard!';
        btn.classList.add('btn-success');
        setTimeout(() => {
          btn.innerText = originalText;
          btn.classList.remove('btn-success');
        }, 2500);
      });
    });
  });

  // 2. Auto-format tracking code inputs
  const codeInputs = document.querySelectorAll('input.tracking-code-input');
  codeInputs.forEach((input) => {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  });
});
