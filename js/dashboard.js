// Dashboard Management System
class DashboardManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = 30000; // 30 seconds
        this.init();
    }

    init() {
        this.setupAutoRefresh();
        this.loadDashboardData();
    }

    // Load all dashboard data
    loadDashboardData() {
        this.updateStatistics();
        this.loadRecentTransactions();
        this.updateCharts();
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

        // Calculate capital totals
        if (data.capital) {
            data.capital.forEach(entry => {
                const amount = parseFloat(entry.amount) || 0;
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

        // Calculate remaining amounts (Capital - Expenses)
        stats.remaining.USD = stats.capital.USD - stats.expenses.USD;
        stats.remaining.IQD = stats.capital.IQD - stats.expenses.IQD;

        // For now, revenue equals capital (can be extended later)
        stats.revenue.USD = stats.capital.USD;
        stats.revenue.IQD = stats.capital.IQD;

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

        if (data.capital) {
            data.capital.forEach(entry => {
                const entryDate = new Date(entry.date);
                const amount = parseFloat(entry.amount) || 0;
                
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
        this.updateElement('totalRevenue', this.formatCurrency(stats.revenue.USD, 'USD'));
    // New IQD revenue card (sum of capital in IQD)
    this.updateElement('totalRevenueIQD', this.formatCurrency(stats.revenue.IQD, 'IQD'));
    // New IQD expenses card (sum of expenses in IQD)
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
                    typeClass: 'success',
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
                                <td class="fw-bold">${this.formatCurrency(transaction.amount, transaction.currency)}</td>
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
                const amount = parseFloat(entry.amount) || 0;
                monthlyTotals[month] += amount;
                maxAmount = Math.max(maxAmount, monthlyTotals[month]);
            });
        }

        return months.map((name, index) => ({
            name,
            amount: monthlyTotals[index],
            percentage: maxAmount > 0 ? (monthlyTotals[index] / maxAmount) * 100 : 0
        }));
    }

    // Setup auto-refresh
    setupAutoRefresh() {
        setInterval(() => {
            this.loadDashboardData();
        }, this.refreshInterval);
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
