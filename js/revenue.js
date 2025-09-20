class RevenueManager {
    constructor() {
        this.currentView = 'overview'; // overview | sales | advances
        document.addEventListener('dataChanged', (e) => {
            const action = (e && e.detail && e.detail.action) || '';
            if (action.startsWith('revenue:')) {
                this.refreshTotals();
                this.renderRecent();
            }
        });
    }

    // Main loader builds the page structure
    loadRevenueSection() {
        const revenueSection = document.getElementById('revenueSection');
        if (!revenueSection) return;

        const html = `
            <div class="revenue-container">
                <!-- Summary on top -->
                <div class="neumorphic-card mb-4">
                    <div class="card-header">
                        <h4><i class="bi bi-graph-up-arrow me-2"></i>ملخص الإيرادات</h4>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="d-flex align-items-center">
                                    <div class="stat-icon revenue-icon"><i class="bi bi-currency-dollar"></i></div>
                                    <div class="ms-3">
                                        <h3 id="revenueTotalUSD">$0.00</h3>
                                        <p class="mb-0 text-muted">إجمالي الإيرادات (دولار)</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="d-flex align-items-center">
                                    <div class="stat-icon" style="background: linear-gradient(90deg,#ffb02e,#ff8a00);"><i class="bi bi-cash"></i></div>
                                    <div class="ms-3">
                                        <h3 id="revenueTotalIQD">0 د.ع</h3>
                                        <p class="mb-0 text-muted">إجمالي الإيرادات (دينار)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Two main option cards -->
                <div class="row mb-4">
                    <div class="col-md-6 mb-3">
                        <div class="stat-card neumorphic-card selectable" id="cardSales">
                            <div class="stat-icon" style="background: linear-gradient(90deg,#4dabf7,#1971c2);">
                                <i class="bi bi-bag-check text-white"></i>
                            </div>
                            <div class="stat-info">
                                <h5 class="mb-1">إيرادات البيع</h5>
                                <p class="text-muted mb-0">إدارة إيرادات المبيعات</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="stat-card neumorphic-card selectable" id="cardAdvances">
                            <div class="stat-icon" style="background: linear-gradient(90deg,#ffa94d,#fd7e14);">
                                <i class="bi bi-cash-coin text-white"></i>
                            </div>
                            <div class="stat-info">
                                <h5 class="mb-1">السلف</h5>
                                <p class="text-muted mb-0">تسجيل وإدارة السلف</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Content area switches based on selected card -->
                <div id="revenueContentArea"></div>

                <!-- Recent revenue at bottom -->
                <div class="neumorphic-card mt-4">
                    <div class="card-header">
                        <h5><i class="bi bi-list-ul me-2"></i>آخر عمليات الإيراد</h5>
                    </div>
                    <div class="card-body">
                        <div id="recentRevenue" class="text-muted">لا توجد بيانات بعد.</div>
                    </div>
                </div>
            </div>`;

        revenueSection.innerHTML = html;

        // bind main cards
        const salesCard = revenueSection.querySelector('#cardSales');
        const advancesCard = revenueSection.querySelector('#cardAdvances');
        if (salesCard) salesCard.addEventListener('click', () => this.showSales());
        if (advancesCard) advancesCard.addEventListener('click', () => this.showAdvances());

        // default view: show overview prompt (empty state) or keep none selected
        this.refreshTotals();
        this.renderRecent();
        // Optionally pick a default view
        this.showSales(true); // show sales first, as requested order
    }

    // ----- View Renderers -----
    showSales(silent=false) {
        this.currentView = 'sales';
        const area = document.getElementById('revenueContentArea');
        if (!area) return;
        area.innerHTML = `
            <div class="row">
                <div class="col-md-4 mb-3">
                    <div class="neumorphic-card text-center p-4">
                        <div class="mb-2"><i class="bi bi-tags fs-2 text-primary"></i></div>
                        <h6 class="mb-1">نوع المبيعات</h6>
                        <small class="text-muted">قيد التطوير</small>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="neumorphic-card text-center p-4">
                        <div class="mb-2"><i class="bi bi-cash fs-2 text-success"></i></div>
                        <h6 class="mb-1">البيع بالنقد</h6>
                        <small class="text-muted">قيد التطوير</small>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="neumorphic-card text-center p-4">
                        <div class="mb-2"><i class="bi bi-receipt fs-2 text-warning"></i></div>
                        <h6 class="mb-1">البيع بالآجل</h6>
                        <small class="text-muted">قيد التطوير</small>
                    </div>
                </div>
            </div>
        `;
        if (!silent) this.scrollIntoView(area);
    }

    showAdvances() {
        this.currentView = 'advances';
        const area = document.getElementById('revenueContentArea');
        if (!area) return;
        area.innerHTML = `
            <div class="neumorphic-card mb-3">
                <div class="card-header">
                    <h5><i class="bi bi-cash-coin me-2"></i>تسجيل سلفة</h5>
                </div>
                <div class="card-body">
                    <form id="revenueForm" class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">رقم القيد</label>
                            <input type="text" class="form-control neumorphic-input" id="revReg" value="${StorageManager.generateRegistrationNumber()}" readonly>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">نوع العملية</label>
                            <select id="revType" class="form-control neumorphic-input">
                                <option value="income" selected>سلفة</option>
                                <option value="refund">تسوية/إرجاع</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">التاريخ</label>
                            <input type="date" id="revDate" class="form-control neumorphic-input" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">العملة</label>
                            <select id="revCurrency" class="form-control neumorphic-input">
                                <option value="USD">دولار أمريكي (USD)</option>
                                <option value="IQD">دينار عراقي (IQD)</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">المبلغ</label>
                            <input type="number" id="revAmount" class="form-control neumorphic-input" step="0.01" min="0" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">رقم الإيصال/السند/السلفة</label>
                            <input type="text" id="revReceipt" class="form-control neumorphic-input">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">الجهة المانحة</label>
                            <input type="text" id="revGrantor" class="form-control neumorphic-input" placeholder="اسم الجهة أو الشخص">
                        </div>
                        <div class="col-12">
                            <label class="form-label">وصف</label>
                            <textarea id="revNotes" class="form-control neumorphic-input" rows="2"></textarea>
                        </div>
                        <div class="col-12 d-flex gap-2">
                            <button type="submit" class="btn btn-primary neumorphic-btn"><i class="bi bi-save me-2"></i>حفظ السلفة</button>
                            <button type="reset" class="btn btn-secondary neumorphic-btn"><i class="bi bi-arrow-clockwise me-2"></i>إعادة تعيين</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- إدارة السلف: بحث ونتائج -->
            <div class="neumorphic-card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="bi bi-search me-2"></i>بحث ضمن قيود السلف</h5>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary btn-sm" id="advResetBtn"><i class="bi bi-arrow-clockwise me-1"></i>إعادة تعيين</button>
                        <button class="btn btn-outline-success btn-sm" id="advSearchBtn"><i class="bi bi-search me-1"></i>بحث</button>
                        <button class="btn btn-outline-primary btn-sm" id="advPrintAllBtn"><i class="bi bi-printer me-1"></i>طباعة كافة النتائج</button>
                        <button class="btn btn-outline-dark btn-sm" id="advExportAllBtn"><i class="bi bi-download me-1"></i>تصدير كافة النتائج</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row g-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label">رقم القيد / الإيصال</label>
                            <input type="text" class="form-control neumorphic-input" id="advQ" placeholder="بحث نصي">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">العملة</label>
                            <select id="advCurrency" class="form-control neumorphic-input">
                                <option value="">الكل</option>
                                <option value="USD">USD</option>
                                <option value="IQD">IQD</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">من تاريخ</label>
                            <input type="date" id="advFrom" class="form-control neumorphic-input">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">إلى تاريخ</label>
                            <input type="date" id="advTo" class="form-control neumorphic-input">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">الجهة المانحة</label>
                            <input type="text" id="advGrantor" class="form-control neumorphic-input" placeholder="اسم الجهة">
                        </div>
                    </div>
                    <div class="table-responsive mt-3">
                        <table class="table table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>رقم القيد</th>
                                    <th>التاريخ</th>
                                    <th>العملة</th>
                                    <th>المبلغ</th>
                                    <th>الإيصال/السند</th>
                                    <th>الجهة المانحة</th>
                                    <th>وصف</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="advancesResults">
                                <tr><td colspan="8" class="text-center text-muted">لا توجد بيانات</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- نافذة تعديل السلفة -->
            <div class="modal fade" id="advanceEditModal" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">تعديل قيد السلفة</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
                  </div>
                  <div class="modal-body">
                    <form class="row g-3" id="advanceEditForm">
                        <input type="hidden" id="advEditId">
                        <div class="col-md-4">
                            <label class="form-label">رقم القيد</label>
                            <input type="text" class="form-control" id="advEditReg" readonly>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">نوع العملية</label>
                            <select id="advEditType" class="form-control">
                                <option value="income">سلفة</option>
                                <option value="refund">تسوية/إرجاع</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">التاريخ</label>
                            <input type="date" id="advEditDate" class="form-control">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">العملة</label>
                            <select id="advEditCurrency" class="form-control">
                                <option value="USD">USD</option>
                                <option value="IQD">IQD</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">المبلغ</label>
                            <input type="number" id="advEditAmount" class="form-control" step="0.01" min="0">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">رقم الإيصال/السند/السلفة</label>
                            <input type="text" id="advEditReceipt" class="form-control">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">الجهة المانحة</label>
                            <input type="text" id="advEditGrantor" class="form-control">
                        </div>
                        <div class="col-12">
                            <label class="form-label">وصف</label>
                            <textarea id="advEditNotes" class="form-control" rows="2"></textarea>
                        </div>
                    </form>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                    <button type="button" class="btn btn-primary" id="advEditSaveBtn"><i class="bi bi-save me-1"></i>حفظ التعديلات</button>
                  </div>
                </div>
              </div>
            </div>
        `;
        this.bindForm('advance');
        this.scrollIntoView(area);

        // bind search controls
        const btnSearch = document.getElementById('advSearchBtn');
        const btnReset = document.getElementById('advResetBtn');
        const btnPrintAll = document.getElementById('advPrintAllBtn');
        const btnExportAll = document.getElementById('advExportAllBtn');
        if (btnSearch) btnSearch.addEventListener('click', () => this.performAdvancesSearch());
        if (btnReset) btnReset.addEventListener('click', () => this.resetAdvancesSearch());
        if (btnPrintAll) btnPrintAll.addEventListener('click', () => this.printAllAdvances());
        if (btnExportAll) btnExportAll.addEventListener('click', () => this.exportAllAdvances());

        // initial fill
        // ensure default filters show all results
        const advCurr = document.getElementById('advCurrency');
        if (advCurr) advCurr.value = '';
        this.performAdvancesSearch();
    }

    bindForm(category) {
        const form = document.getElementById('revenueForm');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const entry = {
                registrationNumber: document.getElementById('revReg').value,
                type: document.getElementById('revType').value,
                date: document.getElementById('revDate').value,
                currency: document.getElementById('revCurrency').value,
                amount: parseFloat(document.getElementById('revAmount').value) || 0,
                receiptNumber: document.getElementById('revReceipt').value,
                notes: document.getElementById('revNotes').value,
                grantor: (document.getElementById('revGrantor') && document.getElementById('revGrantor').value) || ''
            };
            if (category) entry.category = category; // تمييز قيود السلف
            if (!entry.date || !entry.currency || !entry.amount || entry.amount <= 0) {
                this.notify('الرجاء إدخال بيانات صحيحة للإيراد', 'danger');
                return;
            }
            const res = StorageManager.addRevenueEntry(entry);
            if (res) {
                this.notify('تم الحفظ بنجاح', 'success');
                document.getElementById('revReg').value = StorageManager.generateRegistrationNumber();
                document.getElementById('revAmount').value = '';
                this.refreshTotals();
                this.renderRecent();
                this.performAdvancesSearch();
            } else {
                this.notify('حدث خطأ أثناء الحفظ', 'danger');
            }
        });
    }

    refreshTotals() {
        try {
            const data = StorageManager.getAllData();
            const revenue = data.revenue || [];
            let totalUSD = 0, totalIQD = 0;
            for (const r of revenue) {
                const amt = parseFloat(r.amount) || 0;
                const sign = (r.type || '').toLowerCase() === 'refund' ? -1 : 1;
                if (r.currency === 'USD') totalUSD += sign * amt;
                if (r.currency === 'IQD') totalIQD += sign * amt;
            }
            const usdEl = document.getElementById('revenueTotalUSD');
            const iqdEl = document.getElementById('revenueTotalIQD');
            if (usdEl) usdEl.textContent = this.formatCurrency(totalUSD, 'USD');
            if (iqdEl) iqdEl.textContent = this.formatCurrency(totalIQD, 'IQD');
        } catch (e) {
            console.warn('Failed to refresh revenue totals', e);
        }
    }

    renderRecent() {
        const container = document.getElementById('recentRevenue');
        if (!container) return;
        const data = StorageManager.getAllData();
        const list = (data.revenue || [])
            .slice()
            .sort((a,b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);
        if (list.length === 0) {
            container.innerHTML = '<p class="text-center text-muted mb-0">لا توجد عمليات إيراد حديثة</p>';
            return;
        }
        const rows = list.map(r => {
            const sign = (r.type || '').toLowerCase() === 'refund' ? '-' : '+';
            return `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                        <span class="badge bg-${sign==='+'?'primary':'secondary'} me-2">${sign==='+'?'إيراد':'تسوية'}</span>
                        <small class="text-muted">${this.formatDate(r.date)}</small>
                        ${r.grantor ? `<small class="text-muted ms-2">${r.grantor}</small>` : ''}
                    </div>
                    <div class="fw-bold">${sign==='-'?'-':''}${this.formatCurrency(r.amount, r.currency)}</div>
                </div>`;
        }).join('');
        container.innerHTML = rows;
    }

    // helper to scroll to area
    scrollIntoView(el) {
        try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(_) {}
    }

    // ----- Advances helpers -----
    getAllAdvances() {
        const data = StorageManager.getAllData();
        // Include entries explicitly tagged as 'advance' OR older entries that have a grantor value
        return (data.revenue || []).filter(r => ((r.category || '') === 'advance') || ((r.grantor || '').trim() !== ''));
    }

    resetAdvancesSearch() {
        const ids = ['advQ','advCurrency','advFrom','advTo','advGrantor'];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        this.performAdvancesSearch();
    }

    performAdvancesSearch() {
        const q = (document.getElementById('advQ')?.value || '').trim().toLowerCase();
        const currency = document.getElementById('advCurrency')?.value || '';
        const from = document.getElementById('advFrom')?.value || '';
        const to = document.getElementById('advTo')?.value || '';
        const grantor = (document.getElementById('advGrantor')?.value || '').trim().toLowerCase();

        let list = this.getAllAdvances();
        if (q) {
            list = list.filter(r =>
                (r.registrationNumber && r.registrationNumber.toLowerCase().includes(q)) ||
                (r.receiptNumber && r.receiptNumber.toLowerCase().includes(q))
            );
        }
        if (currency) list = list.filter(r => r.currency === currency);
        if (grantor) list = list.filter(r => (r.grantor || '').toLowerCase().includes(grantor));
        if (from) {
            const f = new Date(from);
            list = list.filter(r => new Date(r.date) >= f);
        }
        if (to) {
            const t = new Date(to);
            // include end day fully
            t.setHours(23,59,59,999);
            list = list.filter(r => new Date(r.date) <= t);
        }
        // sort recent first
        list.sort((a,b) => new Date(b.date) - new Date(a.date));
        this.advLastResults = list;
        this.renderAdvancesResults(list);
        return list;
    }

    renderAdvancesResults(list) {
        const tbody = document.getElementById('advancesResults');
        if (!tbody) return;
        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">لا توجد نتائج مطابقة</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(r => `
            <tr>
                <td>${r.registrationNumber || '-'}</td>
                <td>${this.formatDate(r.date)}</td>
                <td><span class="badge bg-secondary">${r.currency}</span></td>
                <td class="fw-bold">${this.formatCurrency(r.amount, r.currency)}</td>
                <td>${r.receiptNumber || '-'}</td>
                <td>${r.grantor || '-'}</td>
                <td class="text-truncate" style="max-width:220px;" title="${r.notes || ''}">${r.notes || '-'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" data-action="edit" data-id="${r.id}"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-outline-primary" data-action="print" data-id="${r.id}"><i class="bi bi-printer"></i></button>
                        <button class="btn btn-outline-dark" data-action="export" data-id="${r.id}"><i class="bi bi-download"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');

        // attach actions
        tbody.querySelectorAll('button[data-action]')?.forEach(btn => {
            const id = btn.getAttribute('data-id');
            const action = btn.getAttribute('data-action');
            if (action === 'edit') btn.addEventListener('click', () => this.openAdvanceEdit(id));
            if (action === 'print') btn.addEventListener('click', () => this.printAdvance(id));
            if (action === 'export') btn.addEventListener('click', () => this.exportAdvance(id));
        });
    }

    openAdvanceEdit(id) {
        const list = this.getAllAdvances();
        const r = list.find(x => x.id === id);
        if (!r) return this.notify('القيد غير موجود', 'danger');
        // fill modal
        const set = (id,v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
        set('advEditId', r.id);
        set('advEditReg', r.registrationNumber);
        set('advEditType', r.type);
        set('advEditDate', (r.date || '').split('T')[0] || r.date);
        set('advEditCurrency', r.currency);
        set('advEditAmount', r.amount);
        set('advEditReceipt', r.receiptNumber);
        set('advEditGrantor', r.grantor);
        set('advEditNotes', r.notes);

        const modalEl = document.getElementById('advanceEditModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        const saveBtn = document.getElementById('advEditSaveBtn');
        if (saveBtn) {
            // avoid multiple bindings
            saveBtn.onclick = () => {
                const idVal = document.getElementById('advEditId').value;
                const update = {
                    type: document.getElementById('advEditType').value,
                    date: document.getElementById('advEditDate').value,
                    currency: document.getElementById('advEditCurrency').value,
                    amount: parseFloat(document.getElementById('advEditAmount').value) || 0,
                    receiptNumber: document.getElementById('advEditReceipt').value,
                    grantor: document.getElementById('advEditGrantor').value,
                    notes: document.getElementById('advEditNotes').value,
                    category: 'advance'
                };
                if (!update.date || !update.currency || !update.amount || update.amount <= 0) {
                    this.notify('الرجاء إدخال بيانات صحيحة', 'danger');
                    return;
                }
                const ok = StorageManager.updateRevenueEntry(idVal, update);
                if (ok) {
                    this.notify('تم حفظ التعديلات', 'success');
                    this.refreshTotals();
                    this.renderRecent();
                    this.performAdvancesSearch();
                    bootstrap.Modal.getInstance(modalEl)?.hide();
                } else {
                    this.notify('فشل حفظ التعديلات', 'danger');
                }
            };
        }
    }

    buildAdvanceInvoiceBody(r) {
        // Body HTML only; header/footer/styles come from PrintEngine
        const typeText = ((r.type||'income')==='refund') ? 'تسوية/إرجاع' : 'سلفة';
        return `
          <div class="summary-section">
            <div class="summary-title">سند سلفة / Receipt</div>
            <table>
              <tbody>
                <tr><th>رقم القيد</th><td>${r.registrationNumber || '-'}</td><th>نوع العملية</th><td>${typeText}</td></tr>
                <tr><th>التاريخ</th><td>${this.formatDate(r.date)}</td><th>العملة</th><td>${r.currency}</td></tr>
                <tr><th>المبلغ</th><td>${this.formatCurrency(r.amount, r.currency)}</td><th>الإيصال/السند/السلفة</th><td>${r.receiptNumber || '-'}</td></tr>
                <tr><th>الجهة المانحة</th><td colspan="3">${r.grantor || '-'}</td></tr>
                <tr><th>الوصف</th><td colspan="3">${r.notes || '-'}</td></tr>
              </tbody>
            </table>
          </div>
        `;
    }

    printAdvance(id) {
        const list = this.getAllAdvances();
        const r = list.find(x => x.id === id);
        if (!r) return this.notify('القيد غير موجود', 'danger');
        if (window.PrintEngine && typeof PrintEngine.render === 'function') {
            const html = PrintEngine.render({
                title: 'سند سلفة / Receipt',
                headerHTML: (typeof buildBrandedHeaderHTML==='function') ? buildBrandedHeaderHTML('سند سلفة / Receipt') : '',
                footerHTML: (typeof buildPrintFooterHTML==='function') ? buildPrintFooterHTML() : '',
                bodyHTML: this.buildAdvanceInvoiceBody(r),
                orientation: 'landscape'
            });
            return PrintEngine.print(html);
        }
        // Fallback: open minimal window if PrintEngine missing
        const w = window.open('', '_blank');
        w.document.write(`<pre>${JSON.stringify(r, null, 2)}</pre>`);
        w.document.close();
        try { w.focus(); w.print(); } catch(_) {}
    }

    exportAdvance(id) {
        const list = this.getAllAdvances();
        const r = list.find(x => x.id === id);
        if (!r) return this.notify('القيد غير موجود', 'danger');
        this.downloadJSON(r, `advance_${r.registrationNumber || r.id}.json`);
    }

        printAllAdvances() {
                const list = this.advLastResults && this.advLastResults.length ? this.advLastResults : this.getAllAdvances();
                const rows = list.map(r => `
                        <tr>
                                <td>${r.registrationNumber || '-'}</td>
                                <td>${this.formatDate(r.date)}</td>
                                <td>${r.currency}</td>
                                <td>${this.formatCurrency(r.amount, r.currency)}</td>
                                <td>${r.receiptNumber || '-'}</td>
                                <td>${r.grantor || '-'}</td>
                                <td>${r.notes || '-'}</td>
                        </tr>`).join('');
                if (window.PrintEngine && typeof PrintEngine.render === 'function') {
                        const bodyHTML = `
                            <div class="summary-section">
                                <div class="summary-title">قائمة السلف</div>
                                <table>
                                    <thead><tr><th>رقم القيد</th><th>التاريخ</th><th>العملة</th><th>المبلغ</th><th>الإيصال/السند</th><th>الجهة المانحة</th><th>الوصف</th></tr></thead>
                                    <tbody>${rows || '<tr><td colspan="7" class="text-center">لا توجد بيانات</td></tr>'}</tbody>
                                </table>
                            </div>`;
                        const html = PrintEngine.render({
                                title: 'قائمة السلف',
                                headerHTML: (typeof buildBrandedHeaderHTML==='function') ? buildBrandedHeaderHTML('قائمة السلف') : '',
                                footerHTML: (typeof buildPrintFooterHTML==='function') ? buildPrintFooterHTML() : '',
                                bodyHTML,
                                orientation: 'landscape'
                        });
                        return PrintEngine.print(html);
                }
                // Fallback: simple window
                const w = window.open('', '_blank');
                w.document.write(`<pre>${rows}</pre>`);
                w.document.close();
                try { w.focus(); w.print(); } catch(_) {}
        }

    exportAllAdvances() {
        const list = this.advLastResults && this.advLastResults.length ? this.advLastResults : this.getAllAdvances();
        this.downloadJSON(list, `advances_${new Date().toISOString().split('T')[0]}.json`);
    }

    downloadJSON(obj, filename) {
        try {
            const dataStr = JSON.stringify(obj, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            console.error(e);
            this.notify('فشل التصدير', 'danger');
        }
    }

    formatCurrency(amount, currency) {
        const num = parseFloat(amount) || 0;
        if (currency === 'USD') {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
        } else {
            return new Intl.NumberFormat('ar-IQ').format(num) + ' د.ع';
        }
    }

    formatDate(dateString) {
        const d = new Date(dateString);
        return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    notify(message, level = 'info') {
        try {
            if (window.app && window.app.showNotification) {
                window.app.showNotification(message, level);
            } else {
                alert(message);
            }
        } catch (e) {
            alert(message);
        }
    }
}

// Initialize when script loads
let revenueManager;
window.addEventListener('DOMContentLoaded', () => {
    revenueManager = new RevenueManager();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RevenueManager;
}
