// Simple settings UI for print header customization
// Apply branding texts (only data, no style changes) to visible UI from saved settings
function applyBrandingFromSettings() {
  try {
    const settings = (typeof StorageManager !== 'undefined')
      ? (StorageManager.getData(StorageManager.STORAGE_KEYS.SETTINGS) || {})
      : {};
    const programName = settings.programName || 'نظام المحاسبة';
    const companyName = settings.companyName || 'شركة المقاولات المتقدمة';
    const companySubtitle = settings.companySubtitle || 'للشركات المقاولة';

    // Header (dashboard) block
    const headerTitleEl = document.querySelector('.dashboard-title');
    if (headerTitleEl) headerTitleEl.textContent = programName;

  const headerProgramLineEl = document.querySelector('header .program-name');
    if (headerProgramLineEl) headerProgramLineEl.textContent = companySubtitle;

    const headerCompanyEl = document.querySelector('header .company-name');
    if (headerCompanyEl) headerCompanyEl.textContent = companyName;

    // Login page block
    const loginTitleEl = document.querySelector('.login-title');
    if (loginTitleEl) loginTitleEl.textContent = programName;

    const loginSubtitleEl = document.querySelector('.login-subtitle');
    if (loginSubtitleEl) loginSubtitleEl.textContent = companySubtitle;

    const loginCompanyEl = document.querySelector('#loginPage .company-name');
    if (loginCompanyEl) loginCompanyEl.textContent = companyName;
  } catch (e) {
    // swallow errors to avoid impacting UX if elements/StorageManager not ready
    console.warn('applyBrandingFromSettings skipped:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
    // Create modal HTML
    const modalHtml = `
    <div class="modal fade" id="settingsModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">إعدادات الطباعة</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">اسم البرنامج</label>
              <input id="settingProgramName" class="form-control" maxlength="40" />
            </div>
            <div class="mb-3">
              <label class="form-label">اسم الشركة</label>
              <input id="settingCompanyName" class="form-control" maxlength="60" />
            </div>
            <div class="mb-3">
              <label class="form-label">سطر وصف الشركة (سطرٌ ثانٍ)</label>
              <input id="settingCompanySubtitle" class="form-control" maxlength="80" />
            </div>
            <div class="mb-3">
              <label class="form-label">خط العرض (التطبيق والطباعة)</label>
              <!-- options are populated dynamically based on font detection -->
              <select id="settingAppFont" class="form-select">
                <option value="">تحميل الخطوط المثبتة...</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">شعار الطباعة (صغير)</label>
              <input id="settingLogoFile" type="file" accept="image/*" class="form-control" />
              <div class="mt-2" id="settingLogoPreview"></div>
            </div>
            <div class="mb-3">
              <label class="form-label">علامة مائية (Watermark) للصفحات المطبوعة</label>
              <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" id="settingWatermarkEnabled">
                <label class="form-check-label" for="settingWatermarkEnabled">تفعيل العلامة المائية عند الطباعة</label>
              </div>
              <div class="mb-2">
                <input id="settingWatermarkText" class="form-control" placeholder="نص العلامة المائية (مثال: مسودة)" />
              </div>
              <div class="mb-2">
                <label class="form-label small">مظهر العلامة المائية</label>
                <select id="settingWatermarkMode" class="form-select">
                  <option value="behind">خلف المحتوى (خفيفة)</option>
                  <option value="over">فوق المحتوى (تغطي)</option>
                </select>
              </div>
              <div class="row">
                <div class="col-4">
                  <label class="form-label small">شفافية %</label>
                  <input id="settingWatermarkOpacity" type="number" min="0" max="100" class="form-control" />
                </div>
                <div class="col-4">
                  <label class="form-label small">حجم خط</label>
                  <input id="settingWatermarkSize" type="number" min="20" max="300" class="form-control" />
                </div>
                <div class="col-4">
                  <label class="form-label small">زاوية (deg)</label>
                  <input id="settingWatermarkRotate" type="number" min="-180" max="180" class="form-control" />
                </div>
              </div>
            </div>
            <div class="mb-3">
              <div id="settingsPreviewBox"></div>
            </div>
            <hr />
            <h6>إعدادات التذييل (Footer) للطباعة</h6>
            <div class="mb-3">
              <label class="form-label">عنوان الشركة (الدولة - المحافظة - بقية العنوان)</label>
              <input id="settingFooterAddress" class="form-control" maxlength="120" />
            </div>
            <div class="mb-3">
              <label class="form-label">شعار التذييل (وسط، صغير)</label>
              <input id="settingFooterLogoFile" type="file" accept="image/*" class="form-control" />
              <div class="mt-2" id="settingFooterLogoPreview"></div>
            </div>
            <div class="mb-3">
              <label class="form-label">الإيميل</label>
              <input id="settingFooterEmail" class="form-control" />
            </div>
            <div class="row">
              <div class="col-4">
                <label class="form-label">هاتف 1 (وسط)</label>
                <input id="settingFooterPhone1" class="form-control" />
              </div>
              <div class="col-4">
                <label class="form-label">هاتف 2 (وسط)</label>
                <input id="settingFooterPhone2" class="form-control" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
            <button type="button" class="btn btn-danger" id="clearLogoBtn">حذف الشعار</button>
            <button type="button" class="btn btn-primary" id="saveSettingsBtn">حفظ</button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // --- Font detection utilities ---
    // Browser privacy prevents enumerating every installed font, so we use a
    // curated list of common fonts and check which are available by measuring
    // rendered widths against generic fallback fonts.
    const FONT_CANDIDATES = [
      // Arabic / Arabic-friendly fonts
      'Cairo','Amiri','Noto Naskh Arabic','Noto Sans Arabic','Almarai','Tajawal','Scheherazade','Lateef','Droid Arabic Kufi','Droid Arabic Naskh',
      // Common system fonts (Windows/Mac/Linux)
      'Arial','Arial Black','Verdana','Tahoma','Trebuchet MS','Times New Roman','Georgia','Palatino','Garamond','Bookman','Courier New','Lucida Console',
      'Segoe UI','Segoe UI Emoji','Segoe UI Historic','Helvetica','Impact','Comic Sans MS','Candara','Calibri','Cambria','Constantia','Consolas',
      // Some other widely-distributed fonts
      'Roboto','Open Sans','Lato','Montserrat','PT Sans','Merriweather','Source Sans Pro','Fira Sans','Ubuntu','Noto Sans','Noto Serif',
      // Arabic web fonts that may be installed
      'KufiStandardGK','DIN Next Arabic','Hacen Tunisia','Hacen Liner Kondensed','Scheherazade New','Sakkal Majalla'
    ];

    function isFontAvailable(font) {
      // Create two span elements and compare widths using fallback fonts
      const testString = 'mmmmmmmmmmlliI0O';
      const baseFonts = ['monospace', 'serif', 'sans-serif'];

      const body = document.body;
      const defaultWidths = {};
      const span = document.createElement('span');
      span.style.fontSize = '72px';
      span.style.position = 'absolute';
      span.style.left = '-9999px';
      span.textContent = testString;
      body.appendChild(span);

      // measure default widths
      for (let i = 0; i < baseFonts.length; i++) {
        span.style.fontFamily = baseFonts[i];
        defaultWidths[baseFonts[i]] = span.offsetWidth;
      }

      let available = false;
      for (let i = 0; i < baseFonts.length; i++) {
        span.style.fontFamily = `${font},${baseFonts[i]}`;
        const matched = span.offsetWidth !== defaultWidths[baseFonts[i]];
        if (matched) { available = true; break; }
      }

      body.removeChild(span);
      return available;
    }

    function getAvailableFonts(candidates) {
      const available = [];
      for (let i = 0; i < candidates.length; i++) {
        try {
          if (isFontAvailable(candidates[i])) available.push(candidates[i]);
        } catch (e) {
          // ignore exceptions and continue
        }
      }
      return available;
    }

    function populateFontSelect(selectedFont) {
      const sel = document.getElementById('settingAppFont');
      if (!sel) return;
      sel.innerHTML = '';
      // Add an explicit default option
      const defaultOpt = document.createElement('option');
      defaultOpt.value = 'Cairo';
      defaultOpt.textContent = 'Cairo (افتراضي)';
      sel.appendChild(defaultOpt);

      // Detect available fonts from candidates
      const available = getAvailableFonts(FONT_CANDIDATES);

      // If detection failed or returned nothing, fall back to a short list
      const listToUse = available.length ? available : ['Arial','Tahoma','Segoe UI','Cairo'];

      listToUse.forEach(f => {
        // avoid duplicate Cairo option
        if (f === 'Cairo') return;
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        sel.appendChild(opt);
      });

      // If previously selected font exists but wasn't in the list, add it
      if (selectedFont && !Array.from(sel.options).some(o => o.value === selectedFont)) {
        const opt = document.createElement('option');
        opt.value = selectedFont;
        opt.textContent = selectedFont + ' (محفوظ)';
        sel.appendChild(opt);
      }

      // Try to set the select to the desired value
      try { sel.value = selectedFont || 'Cairo'; } catch (e) { sel.selectedIndex = 0; }
    }

    // Image resize helper: returns Promise resolving to dataURL
    function resizeImageFileToDataURL(file, maxWidth = 800, maxHeight = 800, quality = 0.85) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = function(e) {
          img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
              height = Math.round((maxWidth / width) * height);
              width = maxWidth;
            }
            if (height > maxHeight) {
              width = Math.round((maxHeight / height) * width);
              height = maxHeight;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            try {
              const dataUrl = canvas.toDataURL('image/png', quality);
              resolve(dataUrl);
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = function(err) { reject(err); };
          img.src = e.target.result;
        };
        reader.onerror = function(err) { reject(err); };
        reader.readAsDataURL(file);
      });
    }

    // Add Settings button to header actions
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-secondary neumorphic-btn ms-3';
        btn.type = 'button';
        btn.id = 'openSettingsBtn';
        btn.innerHTML = '<i class="bi bi-gear me-1"></i>إعدادات';
        headerActions.prepend(btn);

  btn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
            // Load current settings
            const settings = StorageManager.getData(StorageManager.STORAGE_KEYS.SETTINGS) || {};
            document.getElementById('settingProgramName').value = settings.programName || '';
            // Populate the font select with detected installed fonts and select saved font
            populateFontSelect(settings.appFont || 'Cairo');
            document.getElementById('settingCompanyName').value = settings.companyName || '';
            document.getElementById('settingCompanySubtitle').value = settings.companySubtitle || '';
            const preview = document.getElementById('settingsPreviewBox');
            preview.innerHTML = buildBrandedHeaderHTML('معاينة');
            // Watermark inputs
            const wm = settings.watermark || { enabled: false, text: '', opacity: 8, fontSize: 96, rotate: -30 };
            document.getElementById('settingWatermarkEnabled').checked = !!wm.enabled;
            document.getElementById('settingWatermarkText').value = wm.text || '';
            document.getElementById('settingWatermarkOpacity').value = wm.opacity || 8;
            document.getElementById('settingWatermarkSize').value = wm.fontSize || 96;
            document.getElementById('settingWatermarkRotate').value = wm.rotate || -30;
            document.getElementById('settingWatermarkMode').value = wm.mode || 'behind';
            // Footer inputs
            const ft = settings.footer || { address: '', footerLogoDataUrl: null, email: '', phone1: '', phone2: '' };
            document.getElementById('settingFooterAddress').value = ft.address || '';
            document.getElementById('settingFooterLogoPreview').innerHTML = ft.footerLogoDataUrl ? `<img src="${ft.footerLogoDataUrl}" style="height:36px; display:block; margin:0 auto;"/>` : '';
            document.getElementById('settingFooterEmail').value = ft.email || '';
            document.getElementById('settingFooterPhone1').value = ft.phone1 || '';
            document.getElementById('settingFooterPhone2').value = ft.phone2 || '';
            document.getElementById('settingLogoPreview').innerHTML = settings.printLogoDataUrl ? `<img src="${settings.printLogoDataUrl}" style="height:48px;"/>` : '';
            // Apply font to document for live preview
            document.documentElement.style.setProperty('--app-font', settings.appFont || 'Cairo');
            modal.show();
        });
    }

    // Handle logo upload
    const logoInput = document.getElementById('settingLogoFile');
    if (logoInput) {
        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
      // Resize image to reasonable bounds before storing to reduce localStorage usage
      resizeImageFileToDataURL(file, 300, 300, 0.9).then(dataUrl => {
        document.getElementById('settingLogoPreview').innerHTML = `<img src="${dataUrl}" style="height:48px;"/>`;
        logoInput.dataset.dataUrl = dataUrl;
        const preview = document.getElementById('settingsPreviewBox');
        preview.innerHTML = buildBrandedHeaderHTML('معاينة');
      }).catch(err => {
        // fallback to original file if resize fails
        const reader = new FileReader();
        reader.onload = function(evt) {
          const dataUrl = evt.target.result;
          document.getElementById('settingLogoPreview').innerHTML = `<img src="${dataUrl}" style="height:48px;"/>`;
          logoInput.dataset.dataUrl = dataUrl;
          const preview = document.getElementById('settingsPreviewBox');
          preview.innerHTML = buildBrandedHeaderHTML('معاينة');
        };
        reader.readAsDataURL(file);
      });
        });
    }

    // Footer logo upload
    const footerLogoInput = document.getElementById('settingFooterLogoFile');
    if (footerLogoInput) {
      footerLogoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // resize footer logo to small size
        resizeImageFileToDataURL(file, 200, 80, 0.9).then(dataUrl => {
          document.getElementById('settingFooterLogoPreview').innerHTML = `<img src="${dataUrl}" style="height:36px; display:block; margin:0 auto;"/>`;
          footerLogoInput.dataset.dataUrl = dataUrl;
        }).catch(err => {
          const reader = new FileReader();
          reader.onload = function(evt) {
            const dataUrl = evt.target.result;
            document.getElementById('settingFooterLogoPreview').innerHTML = `<img src="${dataUrl}" style="height:36px; display:block; margin:0 auto;"/>`;
            footerLogoInput.dataset.dataUrl = dataUrl;
          };
          reader.readAsDataURL(file);
        });
      });
    }

    // Live preview updates when watermark or footer inputs change
    ['settingWatermarkEnabled','settingWatermarkText','settingWatermarkOpacity','settingWatermarkSize','settingWatermarkRotate','settingFooterAddress','settingFooterEmail','settingFooterPhone1','settingFooterPhone2'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const preview = document.getElementById('settingsPreviewBox');
        preview.innerHTML = buildBrandedHeaderHTML('معاينة');
      });
      el.addEventListener('change', () => {
        const preview = document.getElementById('settingsPreviewBox');
        preview.innerHTML = buildBrandedHeaderHTML('معاينة');
      });
    });

    // Clear logo
    document.getElementById('clearLogoBtn')?.addEventListener('click', () => {
        document.getElementById('settingLogoPreview').innerHTML = '';
        document.getElementById('settingLogoFile').value = '';
        delete document.getElementById('settingLogoFile').dataset.dataUrl;
    });

    // Save settings
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
        const programName = document.getElementById('settingProgramName').value.trim();
        const companyName = document.getElementById('settingCompanyName').value.trim();
        const companySubtitle = document.getElementById('settingCompanySubtitle')?.value.trim() || '';
  const logoDataUrl = document.getElementById('settingLogoFile').dataset.dataUrl || null;
  const appFont = document.getElementById('settingAppFont').value || 'Cairo';
  // Watermark values
  const wmEnabled = !!document.getElementById('settingWatermarkEnabled').checked;
  const wmText = document.getElementById('settingWatermarkText').value || '';
  const wmOpacity = parseInt(document.getElementById('settingWatermarkOpacity').value || '8', 10);
  const wmSize = parseInt(document.getElementById('settingWatermarkSize').value || '96', 10);
  const wmRotate = parseInt(document.getElementById('settingWatermarkRotate').value || '-30', 10);
  const wmMode = document.getElementById('settingWatermarkMode')?.value || 'behind';

        const settings = StorageManager.getData(StorageManager.STORAGE_KEYS.SETTINGS) || {};
        settings.programName = programName || settings.programName || 'نظام المحاسبة';
  settings.companyName = companyName || settings.companyName || 'شركة المقاولات المتقدمة';
  settings.companySubtitle = companySubtitle || settings.companySubtitle || '';
    settings.appFont = appFont || settings.appFont || 'Cairo';
  settings.watermark = settings.watermark || {};
  settings.watermark.enabled = wmEnabled;
  settings.watermark.text = wmText;
  settings.watermark.opacity = isNaN(wmOpacity) ? (settings.watermark.opacity || 8) : Math.max(0, Math.min(100, wmOpacity));
  settings.watermark.fontSize = isNaN(wmSize) ? (settings.watermark.fontSize || 96) : Math.max(20, Math.min(300, wmSize));
  settings.watermark.rotate = isNaN(wmRotate) ? (settings.watermark.rotate || -30) : Math.max(-180, Math.min(180, wmRotate));
  settings.watermark.mode = wmMode || settings.watermark.mode || 'behind';
        if (logoDataUrl) settings.printLogoDataUrl = logoDataUrl;
        else if (!document.getElementById('settingLogoPreview').innerHTML) settings.printLogoDataUrl = null;
  // footer
  settings.footer = settings.footer || {};
  const footerLogoDataUrl = document.getElementById('settingFooterLogoFile')?.dataset?.dataUrl || null;
  settings.footer.address = document.getElementById('settingFooterAddress').value || settings.footer.address || '';
  settings.footer.footerLogoDataUrl = footerLogoDataUrl || settings.footer.footerLogoDataUrl || null;
  settings.footer.email = document.getElementById('settingFooterEmail').value || settings.footer.email || '';
  settings.footer.phone1 = document.getElementById('settingFooterPhone1').value || settings.footer.phone1 || '';
  settings.footer.phone2 = document.getElementById('settingFooterPhone2').value || settings.footer.phone2 || '';

        const saved = StorageManager.saveData(StorageManager.STORAGE_KEYS.SETTINGS, settings);
        if (saved) {
      // Apply font globally (CSS variable) so app uses it immediately
      document.documentElement.style.setProperty('--app-font', settings.appFont || 'Cairo');
      // Update on-screen branding texts (no style changes)
      applyBrandingFromSettings();
            alert('تم حفظ الإعدادات');
            bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
        } else {
            alert('فشل حفظ الإعدادات');
        }
    });
    // Initial apply on load
    applyBrandingFromSettings();
});
