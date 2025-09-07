// build-branded header for print windows
function buildBrandedHeaderHTML(title) {
    const appSettings = (typeof StorageManager !== 'undefined') ? StorageManager.getData(StorageManager.STORAGE_KEYS.SETTINGS) || {} : {};
    const programName = appSettings.programName || 'نظام المحاسبة';
    const companyName = appSettings.companyName || 'شركة المقاولات المتقدمة';
    const logoDataUrl = appSettings.printLogoDataUrl || null;

    const fontFamily = appSettings.appFont || 'Cairo';
    const styles = `
      <style>
  body, .print-header, .print-body { font-family: ${fontFamily}, sans-serif; }
  /* Force the brand row to left-to-right so logo+program appear on the left and company on the right */
  .print-brand { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px; direction:ltr; }
  .pb-left { display:flex; align-items:center; gap:10px; direction:ltr; }
        .pb-left img { height:48px; width:auto; }
  .program-name { font-weight:700; font-size:18px; color:#2c3e50; text-align:left; }
  .pb-right { font-weight:700; font-size:16px; color:#2c3e50; text-align:right; }
        .print-title { font-size:16px; font-weight:700; margin-top:6px; text-align:center; }
        .print-sub { font-size:12px; color:#666; text-align:center; margin-bottom:8px; }
  /* Watermark styles (an overlay centered across the page) */
  .print-watermark { position:fixed; left:50%; top:50%; transform-origin:center; pointer-events:none; z-index:0; display:flex; justify-content:center; align-items:center; width:100%; }
  .print-watermark span { white-space:nowrap; }
  /* Ensure header/body appear above the watermark */
  .print-header { position:relative; z-index:3; }
  .print-body { position:relative; z-index:2; }
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

    // Watermark HTML (rendered after header so it overlays content)
    let watermarkHtml = '';
    try {
      const wm = appSettings.watermark || {};
      if (wm.enabled && wm.text) {
    const opacity = (typeof wm.opacity === 'number') ? Math.max(0, Math.min(100, wm.opacity)) : 8;
        const fontSize = wm.fontSize || 96;
        const rotate = (typeof wm.rotate === 'number') ? wm.rotate : -30;
    const alpha = Math.max(0, Math.min(100, opacity)) / 100;
    const rgba = `rgba(0,0,0,${alpha})`;
        watermarkHtml = `
          <div class="print-watermark" style="transform: translate(-50%, -50%) rotate(${rotate}deg);">
            <span style="font-size:${fontSize}px; color:${rgba};">${wm.text}</span>
          </div>
        `;
      }
    } catch (e) {
      // ignore watermark rendering errors
    }

  return header + watermarkHtml;
}

// helper to build footer HTML (used in print pages)
function buildPrintFooterHTML() {
  const appSettings = (typeof StorageManager !== 'undefined') ? StorageManager.getData(StorageManager.STORAGE_KEYS.SETTINGS) || {} : {};
  const ft = appSettings.footer || {};
  const address = ft.address || '';
  const footerLogo = ft.footerLogoDataUrl || null;
  const email = ft.email || '';
  const phone1 = ft.phone1 || '';
  const phone2 = ft.phone2 || '';

  const footerStyles = `
    <style>
  /* Ensure page content leaves space for footer and show a separator line */
  body { padding-bottom: 140px; }
  /* Footer visual container */
  .print-footer { position:fixed; left:0; right:0; bottom:0; background:rgba(255,255,255,0.98); padding:10px 14px; font-size:12px; color:#333; z-index:4; box-shadow: 0 -2px 8px rgba(0,0,0,0.05); }
  .print-footer .row { display:flex; align-items:center; justify-content:space-between; }
      .print-footer .col-right { text-align:right; flex:1; }
      .print-footer .col-center { text-align:center; flex:1; }
      .print-footer .col-left { text-align:left; flex:1; }
  .print-footer .footer-logo { height:36px; display:inline-block; }
  .print-footer .phones { text-align:left; margin-top:4px; display:block; }
  /* Visible separator line */
  .print-footer .separator { width:100%; height:2px; background:#d0d0d0; margin-bottom:8px; border-radius:1px; }
  /* Page number styling - uses CSS counter(page) for current page in print */
  /* Page number as a compact badge */
  .print-footer .page-number { 
    display:inline-block; 
    direction:rtl; 
    font-weight:700; 
    background:#2c5aa0; 
    color:#fff; 
    padding:4px 10px; 
    border-radius:16px; 
    box-shadow:0 1px 4px rgba(0,0,0,0.12);
    font-size:12px;
    min-width:64px;
    text-align:center;
    line-height:1;
    -webkit-print-color-adjust:exact; /* try to preserve background color in print */
    border:1px solid rgba(44,90,160,0.95);
  }
  .print-footer .page-number:before { content: "الصفحة "; margin-right:6px; }
  .print-footer .page-number:after { content: counter(page); }
      @media print { .print-footer { position:fixed; } }
    </style>
  `;

  const logoHtml = footerLogo ? `<img src="${footerLogo}" class="footer-logo" alt="footer-logo"/>` : '';

  const html = `
    ${footerStyles}
    <div class="print-footer" role="contentinfo">
      <div class="separator" aria-hidden="true"></div>
      <div class="row">
        <div class="col-right">${address}</div>
        <div class="col-center">${logoHtml}</div>
        <div class="col-left">
          <div class="email">${email}</div>
          <div class="phones">${phone1 ? phone1 : ''}${phone1 && phone2 ? ' - ' : ''}${phone2 ? phone2 : ''}</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-top:6px;">
        <div class="page-number">&nbsp;</div>
        <div style="width:120px;"></div>
      </div>
    </div>
  `;

  return html;
}
