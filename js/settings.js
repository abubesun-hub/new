// Simple settings UI for print header customization
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
              <label class="form-label">شعار الطباعة (صغير)</label>
              <input id="settingLogoFile" type="file" accept="image/*" class="form-control" />
              <div class="mt-2" id="settingLogoPreview"></div>
            </div>
            <div class="mb-3">
              <div id="settingsPreviewBox"></div>
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
            document.getElementById('settingCompanyName').value = settings.companyName || '';
            const preview = document.getElementById('settingsPreviewBox');
            preview.innerHTML = buildBrandedHeaderHTML('معاينة');
            document.getElementById('settingLogoPreview').innerHTML = settings.printLogoDataUrl ? `<img src="${settings.printLogoDataUrl}" style="height:48px;"/>` : '';
            modal.show();
        });
    }

    // Handle logo upload
    const logoInput = document.getElementById('settingLogoFile');
    if (logoInput) {
        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 150000) {
                alert('حجم الصورة كبير جداً، الرجاء استخدام صورة أصغر من 150KB');
            }
            const reader = new FileReader();
            reader.onload = function(evt) {
                const dataUrl = evt.target.result;
                document.getElementById('settingLogoPreview').innerHTML = `<img src="${dataUrl}" style="height:48px;"/>`;
                // store temporarily on input element
                logoInput.dataset.dataUrl = dataUrl;
                // update preview box
                const preview = document.getElementById('settingsPreviewBox');
                preview.innerHTML = buildBrandedHeaderHTML('معاينة');
            };
            reader.readAsDataURL(file);
        });
    }

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
        const logoDataUrl = document.getElementById('settingLogoFile').dataset.dataUrl || null;

        const settings = StorageManager.getData(StorageManager.STORAGE_KEYS.SETTINGS) || {};
        settings.programName = programName || settings.programName || 'نظام المحاسبة';
        settings.companyName = companyName || settings.companyName || 'شركة المقاولات المتقدمة';
        if (logoDataUrl) settings.printLogoDataUrl = logoDataUrl;
        else if (!document.getElementById('settingLogoPreview').innerHTML) settings.printLogoDataUrl = null;

        const saved = StorageManager.saveData(StorageManager.STORAGE_KEYS.SETTINGS, settings);
        if (saved) {
            alert('تم حفظ الإعدادات');
            bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
        } else {
            alert('فشل حفظ الإعدادات');
        }
    });
});
