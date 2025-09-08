// build-branded header for print windows
function buildBrandedHeaderHTML(title) {
    const appSettings = (typeof StorageManager !== 'undefined') ? StorageManager.getData(StorageManager.STORAGE_KEYS.SETTINGS) || {} : {};
    const programName = appSettings.programName || 'نظام المحاسبة';
    const companyName = appSettings.companyName || 'شركة المقاولات المتقدمة';
  const companySubtitle = appSettings.companySubtitle || '';
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
  /* Company block on the right: nicer, two-line style */
  .pb-right { display:flex; flex-direction:column; align-items:flex-end; text-align:right; }
  .pb-right .company-name-main { font-weight:800; font-size:18px; color:#1f2937; letter-spacing:0.2px; }
  .pb-right .company-name-sub { font-size:12px; color:#6b7280; font-weight:600; margin-top:2px; }
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
          <div class="pb-right"><div class="company-name-main">${companyName}</div><div class="company-name-sub">${companySubtitle}</div></div>
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
  /* Address styling: icon + two-tone text, right-aligned for RTL layouts */
  .print-footer .footer-address { display:inline-flex; align-items:center; gap:8px; justify-content:flex-end; direction:rtl; }
  .print-footer .footer-address svg { width:18px; height:18px; flex-shrink:0; color:#2c5aa0; }
  .print-footer .footer-address .addr-text { display:block; font-weight:700; color:#1f2937; font-size:13px; }
  .print-footer .footer-address .addr-sub { display:block; font-size:11px; color:#6b7280; font-weight:500; }
  .print-footer .footer-logo { height:36px; display:inline-block; }
  /* Email and phone styling */
  /* Force left-to-right layout for contact info so icon and text align left visually */
  .print-footer .footer-contact { display:flex; flex-direction:column; gap:6px; align-items:flex-start; direction:ltr; text-align:left; }
  .print-footer .footer-email { display:inline-flex; align-items:center; gap:8px; color:#2c3e50; font-weight:600; text-decoration:none; justify-content:flex-start; }
  .print-footer .footer-email svg { width:16px; height:16px; flex-shrink:0; }
  .print-footer .phones { display:flex; gap:8px; align-items:center; margin-top:0; justify-content:flex-start; direction:ltr; }
  .print-footer .phone-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 8px; background:#f1f5f9; border-radius:12px; color:#274156; text-decoration:none; border:1px solid rgba(39,65,86,0.06); font-size:12px; }
  .print-footer .phone-badge svg { width:12px; height:12px; flex-shrink:0; }
  /* Visible separator line */
  .print-footer .separator { width:100%; height:2px; background:#d0d0d0; margin-bottom:8px; border-radius:1px; }
  /* Footer visual adjustments for print; page numbers removed globally */
      @media print {
        .print-footer { position:fixed; }
      }
    </style>
  `;

  const logoHtml = footerLogo ? `<img src="${footerLogo}" class="footer-logo" alt="footer-logo"/>` : '';

  const emailHtml = email ? `<a href="mailto:${email}" class="footer-email" aria-label="email"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 6.5L12 13l9-6.5" stroke="#2c3e50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="5" width="18" height="14" rx="2" stroke="#2c3e50" stroke-width="1.2" fill="none"/></svg><span class="email-text">${email}</span></a>` : '';

  const phonesHtml = (phone1 || phone2) ? `
    ${phone1 ? `<a href="tel:${phone1}" class="phone-badge" aria-label="phone">` +
      `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.08 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.12 1.05.38 2.07.78 3.03a2 2 0 0 1-.45 2.11L9.91 12.09a15.05 15.05 0 0 0 6 6l1.23-1.23a2 2 0 0 1 2.11-.45c.96.4 1.98.66 3.03.78A2 2 0 0 1 22 16.92z" stroke="#274156" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${phone1}</span></a>` : ''}
    ${phone2 ? `<a href="tel:${phone2}" class="phone-badge" aria-label="phone">` +
      `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.08 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.12 1.05.38 2.07.78 3.03a2 2 0 0 1-.45 2.11L9.91 12.09a15.05 15.05 0 0 0 6 6l1.23-1.23a2 2 0 0 1 2.11-.45c.96.4 1.98.66 3.03.78A2 2 0 0 1 22 16.92z" stroke="#274156" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${phone2}</span></a>` : ''}
  ` : '';

  const html = `
    ${footerStyles}
    <div class="print-footer" role="contentinfo">
      <div class="separator" aria-hidden="true"></div>
      <div class="row">
        <div class="col-right">
          <div class="footer-address" aria-label="address">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 21s-6.5-4.35-8.5-8.5C2.5 8.36 6.03 4 12 4s9.5 4.36 8.5 8.5C18.5 16.65 12 21 12 21z" stroke="#2c5aa0" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="2" stroke="#2c5aa0" stroke-width="1.2"/></svg>
            <div>
              <span class="addr-text">${address}</span>
              <span class="addr-sub"></span>
            </div>
          </div>
        </div>
        <div class="col-center">${logoHtml}</div>
        <div class="col-left">
          <div class="footer-contact">
            ${emailHtml}
            <div class="phones">${phonesHtml}</div>
          </div>
        </div>
      </div>
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-top:6px;">
        <div style="width:120px;"></div>
        <div></div>
      </div>
  <!-- Third line removed: page numbers disabled in global print footer -->
    </div>
  `;

  return html;
}
