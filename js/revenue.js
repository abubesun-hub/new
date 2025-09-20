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
        `;
        this.bindForm();
        this.scrollIntoView(area);
    }

    bindForm() {
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
