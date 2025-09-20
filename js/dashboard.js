// Dashboard Management System
class DashboardManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = 10000; // was 30000 (30s) الآن 10 ثواني كتحديث دوري احتياطي
        this.refreshDebounceMs = 300; // منع التحديثات المتتالية السريعة
        this._pendingRefresh = null;
    this._countdownTimer = null;
    this._nextRefreshAt = null;
        // نمط تشغيل العدّ مرة واحدة فقط بعد الدخول / التحديث
        this.oneShotMode = true;
        this._initialCountdownDone = false;
        this.init();
    }

    init() {
        // في نمط المرة الواحدة لا نفعّل مؤقّت متكرر
        if (!this.oneShotMode) {
            this.setupAutoRefresh();
        }
        this.loadDashboardData(); // تحميل أولي
        // ابدأ العدّ التنازلي مرة واحدة فقط
        if (this.oneShotMode) {
            this.restartCountdown();
        }
        // استمع لأي تغيّر في البيانات لتحديث فوري
        document.addEventListener('dataChanged', (e) => {
            // دمج عدة تحديثات متقاربة
            if (this._pendingRefresh) clearTimeout(this._pendingRefresh);
            this._pendingRefresh = setTimeout(() => {
                this.loadDashboardData();
                this._pendingRefresh = null;
            }, this.refreshDebounceMs);
        });
    }

    // Load all dashboard data
    loadDashboardData() {
    this.showLoadingIndicator(true);
        this.updateStatistics();
        this.loadRecentTransactions();
        this.updateCharts();
    // بعد اكتمال التحديث (متزامن حالياً)
    this.showLoadingIndicator(false);
        // لا نعيد تشغيل العدّ في نمط المرة الواحدة أو بعد انتهاء العدّ الأول
        if (!this.oneShotMode && !this._initialCountdownDone) {
            this.restartCountdown();
        }
    }

    // Update statistics cards
    updateStatistics() {
        const data = StorageManager.getAllData();
        const statistics = this.calculateStatistics(data);
        
        this.updateStatisticsCards(statistics);
        this.updateTrends(statistics);
    }

    // Calculate comprehensive statistics
    calculateStatistics(data) {
        const stats = {
            capital: { USD: 0, IQD: 0 },
            expenses: { USD: 0, IQD: 0 },
            revenue: { USD: 0, IQD: 0 },
            remaining: { USD: 0, IQD: 0 },
            shareholders: data.shareholders?.length || 0,
            transactions: 0,
            monthlyGrowth: 0,
            profitMargin: 0
        };

        // Calculate capital totals (withdrawals reduce totals)
        if (data.capital) {
            data.capital.forEach(entry => {
                const raw = parseFloat(entry.amount) || 0;
                const isWithdrawal = (entry.type || '').toLowerCase() === 'withdrawal';
                const amount = isWithdrawal ? -Math.abs(raw) : Math.abs(raw);
                if (entry.currency === 'USD') {
                    stats.capital.USD += amount;
                } else if (entry.currency === 'IQD') {
                    stats.capital.IQD += amount;
                }
            });
            stats.transactions += data.capital.length;
        }

        // Calculate expenses totals
        if (data.expenses) {
            data.expenses.forEach(entry => {
                let addedUSD = false, addedIQD = false;
                if (entry.amountUSD !== undefined) {
                    stats.expenses.USD += parseFloat(entry.amountUSD) || 0;
                    addedUSD = true;
                }
                if (entry.amountIQD !== undefined) {
                    stats.expenses.IQD += parseFloat(entry.amountIQD) || 0;
                    addedIQD = true;
                }
                // إذا لم يكن مختلط، استخدم amount/currency
                if (!addedUSD && !addedIQD) {
                    const amount = parseFloat(entry.amount) || 0;
                    if (entry.currency === 'USD') {
                        stats.expenses.USD += amount;
                    } else if (entry.currency === 'IQD') {
                        stats.expenses.IQD += amount;
                    }
                }
            });
            stats.transactions += data.expenses.length;
        }

            // Calculate revenue totals from dedicated revenue storage
            if (data.revenue) {
                data.revenue.forEach(entry => {
                    const raw = parseFloat(entry.amount) || 0;
                    const isRefund = (entry.type || '').toLowerCase() === 'refund';
                    const amount = isRefund ? -Math.abs(raw) : Math.abs(raw);
                    if (entry.currency === 'USD') {
                        stats.revenue.USD += amount;
                    } else if (entry.currency === 'IQD') {
                        stats.revenue.IQD += amount;
                    }
                });
                stats.transactions += data.revenue.length;
            }

        // Calculate remaining amounts (Cash box): Capital + Revenue - Expenses
        stats.remaining.USD = (stats.capital.USD + stats.revenue.USD) - stats.expenses.USD;
        stats.remaining.IQD = (stats.capital.IQD + stats.revenue.IQD) - stats.expenses.IQD;

        // Calculate profit margin
        if (stats.revenue.USD > 0) {
            stats.profitMargin = ((stats.remaining.USD / stats.revenue.USD) * 100).toFixed(1);
        }

        // Calculate monthly growth (simplified)
        stats.monthlyGrowth = this.calculateMonthlyGrowth(data);

        return stats;
    }

    // Calculate monthly growth
    calculateMonthlyGrowth(data) {
        const currentMonth = new Date().getMonth();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        
        let currentMonthTotal = 0;
        let lastMonthTotal = 0;

        // Base growth on revenue entries
        if (data.revenue) {
            data.revenue.forEach(entry => {
                const entryDate = new Date(entry.date);
                const raw = parseFloat(entry.amount) || 0;
                const isRefund = (entry.type || '').toLowerCase() === 'refund';
                const amount = isRefund ? -Math.abs(raw) : Math.abs(raw);
                if (entryDate.getMonth() === currentMonth) {
                    currentMonthTotal += amount;
                } else if (entryDate.getMonth() === lastMonth) {
                    lastMonthTotal += amount;
                }
            });
        }

        if (lastMonthTotal === 0) return 0;
        return (((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1);
    }

    // Update statistics cards in UI
    updateStatisticsCards(stats) {
        // Update main statistics
        this.updateElement('totalUSD', this.formatCurrency(stats.remaining.USD, 'USD'));
        this.updateElement('totalIQD', this.formatCurrency(stats.remaining.IQD, 'IQD'));

        // Show total inflows (Capital + Revenue) on the "إجمالي الإيرادات" cards as requested
        const inflowsUSD = (stats.capital?.USD || 0) + (stats.revenue?.USD || 0);
        const inflowsIQD = (stats.capital?.IQD || 0) + (stats.revenue?.IQD || 0);
        this.updateElement('totalRevenue', this.formatCurrency(inflowsUSD, 'USD'));
        this.updateElement('totalRevenueIQD', this.formatCurrency(inflowsIQD, 'IQD'));

        // Expenses totals
        this.updateElement('totalExpensesIQD', this.formatCurrency(stats.expenses.IQD, 'IQD'));
        this.updateElement('totalExpenses', this.formatCurrency(stats.expenses.USD, 'USD'));

        // Update additional statistics if elements exist
        this.updateElement('totalShareholders', stats.shareholders);
        this.updateElement('totalTransactions', stats.transactions);
        this.updateElement('monthlyGrowth', stats.monthlyGrowth + '%');
        this.updateElement('profitMargin', stats.profitMargin + '%');
    }

    // Update trends indicators
    updateTrends(stats) {
        const growthElement = document.getElementById('monthlyGrowth');
        if (growthElement) {
            const growth = parseFloat(stats.monthlyGrowth);
            growthElement.className = growth >= 0 ? 'text-success' : 'text-danger';
            growthElement.innerHTML = `
                <i class="bi bi-arrow-${growth >= 0 ? 'up' : 'down'}"></i>
                ${Math.abs(growth)}%
            `;
        }
    }

    // Load recent transactions
    loadRecentTransactions() {
        const data = StorageManager.getAllData();
        let allTransactions = [];

        // Combine all transactions
        if (data.capital) {
            allTransactions = allTransactions.concat(
                data.capital.map(t => ({ 
                    ...t, 
                    type: 'رأس مال',
                    capitalType: t.type, // preserve deposit/withdrawal
                    typeClass: (t.type || '').toLowerCase() === 'withdrawal' ? 'warning' : 'success',
                    icon: 'cash-stack'
                }))
            );
        }

        if (data.expenses) {
            allTransactions = allTransactions.concat(
                data.expenses.map(t => ({ 
                    ...t, 
                    type: 'مصروف',
                    typeClass: 'danger',
                    icon: 'receipt'
                }))
            );
        }

            if (data.revenue) {
                allTransactions = allTransactions.concat(
                    data.revenue.map(t => ({ 
                        ...t, 
                        type: 'إيراد',
                        revenueType: t.type,
                        typeClass: (t.type || '').toLowerCase() === 'refund' ? 'secondary' : 'primary',
                        icon: 'graph-up'
                    }))
                );
            }

        // Sort by date (most recent first)
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Take only the last 10 transactions
        const recentTransactions = allTransactions.slice(0, 10);

        this.renderRecentTransactions(recentTransactions);
    }

    // Render recent transactions table
    renderRecentTransactions(transactions) {
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-inbox display-4 text-muted"></i>
                    <p class="text-muted mt-2">لا توجد عمليات حديثة</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>النوع</th>
                            <th>المبلغ</th>
                            <th>العملة</th>
                            <th>التاريخ</th>
                            <th>الوصف</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactions.map(transaction => `
                            <tr>
                                <td>
                                    <span class="badge bg-${transaction.typeClass}">
                                        <i class="bi bi-${transaction.icon} me-1"></i>
                                        ${transaction.type}
                                    </span>
                                </td>
                                <td class="fw-bold">${(() => {
                                    const hasUSD = transaction.amountUSD !== undefined;
                                    const hasIQD = transaction.amountIQD !== undefined;
                                    const rawAmt = hasUSD ? (parseFloat(transaction.amountUSD) || 0) : (hasIQD ? (parseFloat(transaction.amountIQD) || 0) : (parseFloat(transaction.amount) || 0));
                                    const curr = hasUSD ? 'USD' : (hasIQD ? 'IQD' : transaction.currency);
                                    // Determine sign by type
                                    let sign = 1;
                                    const t = (transaction.type || '').trim();
                                    if (t === 'رأس مال') {
                                        const isWithdrawal = (transaction.capitalType || '').toLowerCase() === 'withdrawal';
                                        if (isWithdrawal) sign = -1;
                                    } else if (t === 'إيراد') {
                                        const isRefund = (transaction.revenueType || '').toLowerCase() === 'refund';
                                        if (isRefund) sign = -1;
                                    } else if (t === 'مصروف') {
                                        sign = -1;
                                    }
                                    const signed = sign * Math.abs(rawAmt);
                                    return this.formatCurrency(signed, curr);
                                })()}</td>
                                <td>
                                    <span class="badge bg-secondary">${transaction.currency}</span>
                                </td>
                                <td>${this.formatDate(transaction.date)}</td>
                                <td class="text-truncate" style="max-width: 200px;" title="${transaction.description || transaction.notes || '-'}">
                                    ${transaction.description || transaction.notes || '-'}
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="viewTransaction('${transaction.id}', '${transaction.type}')">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="editTransaction('${transaction.id}', '${transaction.type}')">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    // Update charts (placeholder for future chart implementation)
    updateCharts() {
        // This can be extended to include Chart.js or other charting libraries
        this.createSimpleChart();
    }

    // Create a simple text-based chart
    createSimpleChart() {
        const chartContainer = document.getElementById('dashboardChart');
        if (!chartContainer) return;

        const data = StorageManager.getAllData();
        const monthlyData = this.getMonthlyData(data);

        const chartHTML = `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h5><i class="bi bi-bar-chart me-2"></i>الإحصائيات الشهرية</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${monthlyData.map(month => `
                            <div class="col-md-3 mb-3">
                                <div class="text-center">
                                    <h6>${month.name}</h6>
                                    <div class="progress mb-2" style="height: 20px;">
                                        <div class="progress-bar bg-primary" style="width: ${month.percentage}%"></div>
                                    </div>
                                    <small class="text-muted">${this.formatCurrency(month.amount, 'USD')}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        chartContainer.innerHTML = chartHTML;
    }

    // Get monthly data for charts
    getMonthlyData(data) {
        const months = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];

        const monthlyTotals = new Array(12).fill(0);
        let maxAmount = 0;

        if (data.capital) {
            data.capital.forEach(entry => {
                const date = new Date(entry.date);
                const month = date.getMonth();
                const raw = parseFloat(entry.amount) || 0;
                const isWithdrawal = (entry.type || '').toLowerCase() === 'withdrawal';
                const amount = isWithdrawal ? -Math.abs(raw) : Math.abs(raw);
                monthlyTotals[month] += amount;
                maxAmount = Math.max(maxAmount, Math.abs(monthlyTotals[month]));
            });
        }

        return months.map((name, index) => ({
            name,
            amount: monthlyTotals[index],
            percentage: maxAmount > 0 ? (Math.abs(monthlyTotals[index]) / maxAmount) * 100 : 0
        }));
    }

    // Setup auto-refresh
    setupAutoRefresh() {
        // مؤقّت احتياطي في حال حدوث تغييرات خارجية لم تلتقط بالحدث (أو فتح التبويب قبل الحدث)
        setInterval(() => {
            this.loadDashboardData();
        }, this.refreshInterval);
    }

    // ------- Refresh Indicator Logic -------
    restartCountdown() {
        if (!this.refreshInterval) return; // لو تم تعطيله
        if (this.oneShotMode && this._initialCountdownDone) return; // لا نعيد العدّ
        this._nextRefreshAt = Date.now() + this.refreshInterval;
        if (this._countdownTimer) clearInterval(this._countdownTimer);
        this.updateIndicatorProgress();
        this._countdownTimer = setInterval(() => {
            const remaining = this._nextRefreshAt - Date.now();
            if (remaining <= 0) {
                clearInterval(this._countdownTimer);
                this._countdownTimer = null;
                // عند اكتمال العد الأول: تحديث آخر (لتأكيد الأرقام) ثم وضع المؤشر على حالة مكتمل وعدم تكرار
                if (!this._initialCountdownDone) {
                    this._initialCountdownDone = true;
                    this.loadDashboardData();
                    this.markCountdownComplete();
                }
            } else {
                this.updateIndicatorProgress(remaining);
            }
        }, 250);
    }

    updateIndicatorProgress(remainingMs) {
        const el = document.getElementById('dashboardRefreshIndicator');
        if (!el) return;
        const barFill = el.querySelector('.bar-fill');
        const timeSpan = el.querySelector('.time');
        if (remainingMs == null) remainingMs = this._nextRefreshAt ? (this._nextRefreshAt - Date.now()) : this.refreshInterval;
        const total = this.refreshInterval || 1;
        const clamped = Math.max(0, Math.min(total, remainingMs));
        const pct = 100 - ((clamped / total) * 100); // يمتلئ مع مرور الوقت
        if (barFill) barFill.style.width = pct.toFixed(1) + '%';
        if (timeSpan) timeSpan.textContent = Math.ceil(clamped / 1000) + 's';
        el.classList.toggle('idle', !el.classList.contains('loading'));
    }

    showLoadingIndicator(isLoading) {
        const el = document.getElementById('dashboardRefreshIndicator');
        if (!el) return;
        el.classList.toggle('loading', isLoading);
        if (isLoading) {
            el.title = 'جاري التحديث...';
        } else {
            el.title = this.oneShotMode ? 'تم التحميل الأول. استخدم زر التحديث اليدوي عند الحاجة.' : 'العدّ التنازلي للتحديث القادم';
        }
    }

    markCountdownComplete() {
        const el = document.getElementById('dashboardRefreshIndicator');
        if (!el) return;
        el.classList.add('complete');
        el.classList.remove('loading');
        const barFill = el.querySelector('.bar-fill');
        const timeSpan = el.querySelector('.time');
        if (barFill) barFill.style.width = '100%';
        if (timeSpan) timeSpan.textContent = 'تم';
        el.title = 'انتهى العدّ الأول - لن يُعاد تلقائياً';
    }

    manualRefresh() {
        // تحديث فوري عند الضغط (لا يعيد العدّ في oneShotMode)
        this.loadDashboardData();
    }

    // Utility functions
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Export dashboard data
    exportDashboardReport() {
        const data = StorageManager.getAllData();
        const statistics = this.calculateStatistics(data);
        
        const report = {
            generatedAt: new Date().toISOString(),
            statistics,
            recentTransactions: this.getRecentTransactions(10),
            monthlyData: this.getMonthlyData(data)
        };

        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dashboard_report_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Get recent transactions for export
    getRecentTransactions(limit = 10) {
        const data = StorageManager.getAllData();
        let allTransactions = [];

        if (data.capital) {
            allTransactions = allTransactions.concat(
                data.capital.map(t => ({ ...t, type: 'capital' }))
            );
        }

        if (data.expenses) {
            allTransactions = allTransactions.concat(
                data.expenses.map(t => ({ ...t, type: 'expense' }))
            );
        }

            if (data.revenue) {
                allTransactions = allTransactions.concat(
                    data.revenue.map(t => ({ ...t, type: 'revenue' }))
                );
            }

        return allTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }
}

// Global functions for HTML onclick events
function viewTransaction(id, type) {
    // Implementation for viewing transaction details
    console.log('View transaction:', id, type);
}

function editTransaction(id, type) {
    // Implementation for editing transaction
    console.log('Edit transaction:', id, type);
}

function exportDashboard() {
    if (window.dashboardManager) {
        window.dashboardManager.exportDashboardReport();
    }
}

// Initialize dashboard manager
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}
