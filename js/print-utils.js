// build-branded header for print windows
function buildBrandedHeaderHTML(title) {
    const appSettings = (typeof StorageManager !== 'undefined') ? StorageManager.getData(StorageManager.STORAGE_KEYS.SETTINGS) || {} : {};
    const programName = appSettings.programName || 'نظام المحاسبة';
    const companyName = appSettings.companyName || 'شركة المقاولات المتقدمة';
    const logoDataUrl = appSettings.printLogoDataUrl || null;

    const styles = `
      <style>
        .print-brand { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px; direction:rtl; }
        .pb-left { display:flex; align-items:center; gap:10px; direction:ltr; }
        .pb-left img { height:48px; width:auto; }
        .program-name { font-weight:700; font-size:18px; color:#2c3e50; }
        .pb-right { font-weight:700; font-size:16px; color:#2c3e50; text-align:right; }
        .print-title { font-size:16px; font-weight:700; margin-top:6px; text-align:center; }
        .print-sub { font-size:12px; color:#666; text-align:center; margin-bottom:8px; }
      </style>
    `;

    const logoHtml = logoDataUrl ? `<img src="${logoDataUrl}" alt="logo"/>` : `
      <svg width="48" height="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="6" y="18" width="52" height="34" rx="4" fill="#2c5aa0"></rect>
        <path d="M10 22h44v6H10z" fill="#fff" opacity="0.15"></path>
        <path d="M20 10h24v8H20z" fill="#ffb02e"></path>
      </svg>
    `;

    const header = `
      ${styles}
      <div class="print-header" role="banner">
        <div class="print-brand">
          <div class="pb-left">
            ${logoHtml}
            <div class="program-name">${programName}</div>
          </div>
          <div class="pb-right">${companyName}</div>
        </div>
        <div class="print-title">${title}</div>
        <div class="print-sub">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-IQ')} ${new Date().toLocaleTimeString('ar-IQ')}</div>
      </div>
    `;

    return header;
}
