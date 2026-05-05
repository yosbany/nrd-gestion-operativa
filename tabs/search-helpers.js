// Shared search normalization for all tab scripts (single global; avoids redeclaring const across scripts)
(function initNRDGONormalizeSearchText() {
  if (typeof window.NRDGONormalizeSearchText === 'function') return;
  if (typeof window.normalizeSearchText === 'function') {
    window.NRDGONormalizeSearchText = window.normalizeSearchText;
  } else if (window.NRDCommon && typeof window.NRDCommon.normalizeSearchText === 'function') {
    window.NRDGONormalizeSearchText = window.NRDCommon.normalizeSearchText;
  } else {
    window.NRDGONormalizeSearchText = (t) => (t || '').toString().toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/v/g, 'b')
      .replace(/c([ei])/g, 's$1')
      .replace(/z/g, 's')
      .replace(/ll/g, 'y');
  }
})();
