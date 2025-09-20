// Revenue Management (basic placeholder)
class RevenueManager {
    constructor() {
        this.init();
    }

    init() {
        // Any initialization if needed later
    }

    loadRevenueSection() {
        const revenueSection = document.getElementById('revenueSection');
        if (!revenueSection) return;

        const html = `
            <div class="revenue-container">
                <div class="neumorphic-card mb-4">
                    <div class="card-header">
                        <h4><i class="bi bi-graph-up me-2"></i>نظرة عامة على الإيرادات</h4>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">هذه واجهة مبدئية لقسم الإيرادات. يمكن توسيعها لاحقًا لإضافة إدخالات الإيرادات وتقاريرها.</p>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="stat-item d-flex align-items-center">
                                    <div class="stat-icon revenue-icon">
                                        <i class="bi bi-graph-up-arrow"></i>
                                    </div>
                                    <div class="stat-details ms-3">
                                        <h3 id="revenueTotalUSD">$0.00</h3>
                                        <p>إجمالي الإيرادات (دولار)</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="stat-item d-flex align-items-center">
                                    <div class="stat-icon revenue-iqd-icon" style="background: linear-gradient(90deg,#ffb02e,#ff8a00);">
                                        <i class="bi bi-graph-up text-white"></i>
                                    </div>
                                    <div class="stat-details ms-3">
                                        <h3 id="revenueTotalIQD">0 د.ع</h3>
                                        <p>إجمالي الإيرادات (دينار)</p>
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
            </div>
        `;

        revenueSection.innerHTML = html;
        this.refreshTotals();
    }

    refreshTotals() {
        try {
            const data = StorageManager.getAllData();
            // مؤقتًا: نجمع رأس المال كإيرادات (حسب منطق dashboard الحالي)
            const capital = data.capital || [];
            let totalUSD = 0, totalIQD = 0;
            for (const c of capital) {
                const amt = parseFloat(c.amount) || 0;
                if (c.currency === 'USD') totalUSD += (c.type === 'withdrawal' ? -amt : amt);
                if (c.currency === 'IQD') totalIQD += (c.type === 'withdrawal' ? -amt : amt);
            }
            const usdEl = document.getElementById('revenueTotalUSD');
            const iqdEl = document.getElementById('revenueTotalIQD');
            if (usdEl) usdEl.textContent = this.formatCurrency(totalUSD, 'USD');
            if (iqdEl) iqdEl.textContent = this.formatCurrency(totalIQD, 'IQD');
        } catch (e) {
            console.warn('Failed to refresh revenue totals', e);
        }
    }

    formatCurrency(amount, currency) {
        const num = parseFloat(amount) || 0;
        if (currency === 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(num);
        } else {
            return new Intl.NumberFormat('ar-IQ').format(num) + ' د.ع';
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
