class RevenueManager {
    constructor() {
        this.currentView = 'overview';
        document.addEventListener('dataChanged', (e) => {
            const action = (e && e.detail && e.detail.action) || '';
            if (action.startsWith('revenue:')) {
                this.refreshTotals();
                this.renderRecent();
            }
        });
    }

    loadRevenueSection() {
        const revenueSection = document.getElementById('revenueSection');
        if (!revenueSection) return;

        const html = `
            <div class="revenue-container">
                <div class="neumorphic-card mb-4">
                    <div class="card-header">
                        <h4><i class="bi bi-graph-up me-2"></i>إدارة الإيرادات</h4>
                    </div>
                    <div class="card-body">
                        <form id="revenueForm" class="row g-3">
                            <div class="col-md-4">
                                <label class="form-label">رقم التسجيل</label>
                                <input type="text" class="form-control neumorphic-input" id="revReg" value="${StorageManager.generateRegistrationNumber()}" readonly>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">نوع العملية</label>
                                <select id="revType" class="form-control neumorphic-input">
                                    <option value="income" selected>إيراد</option>
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
                                <label class="form-label">رقم الإيصال/السند</label>
                                <input type="text" id="revReceipt" class="form-control neumorphic-input">
                            </div>
                            <div class="col-12">
                                <label class="form-label">وصف</label>
                                <textarea id="revNotes" class="form-control neumorphic-input" rows="2"></textarea>
                            </div>
                            <div class="col-12 d-flex gap-2">
                                <button type="submit" class="btn btn-primary neumorphic-btn"><i class="bi bi-save me-2"></i>حفظ الإيراد</button>
                                <button type="reset" class="btn btn-secondary neumorphic-btn"><i class="bi bi-arrow-clockwise me-2"></i>إعادة تعيين</button>
                            </div>
                        </form>
                    </div>
                </div>

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

                <div class="neumorphic-card">
                    <div class="card-header">
                        <h5><i class="bi bi-list-ul me-2"></i>آخر عمليات الإيراد</h5>
                    </div>
                    <div class="card-body">
                        <div id="recentRevenue" class="text-muted">لا توجد بيانات بعد.</div>
                    </div>
                </div>
            </div>`;

        revenueSection.innerHTML = html;
        this.bindForm();
        this.refreshTotals();
        this.renderRecent();
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
                notes: document.getElementById('revNotes').value
            };
            if (!entry.date || !entry.currency || !entry.amount || entry.amount <= 0) {
                this.notify('الرجاء إدخال بيانات صحيحة للإيراد', 'danger');
                return;
            }
            const res = StorageManager.addRevenueEntry(entry);
            if (res) {
                this.notify('تم حفظ الإيراد بنجاح', 'success');
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
                    </div>
                    <div class="fw-bold">${sign==='-'?'-':''}${this.formatCurrency(r.amount, r.currency)}</div>
                </div>`;
        }).join('');
        container.innerHTML = rows;
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
