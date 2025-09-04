// Reports and Analytics System
class ReportsManager {
    constructor() {
        this.currentReport = null;
        this.reportData = null;
        this.init();
    }

    init() {
        // Initialize reports system
        console.log('Reports Manager initialized');
    }

    // Generate comprehensive financial report
    generateFinancialReport() {
        const data = StorageManager.getAllData();
        const reportData = this.calculateFinancialData(data);
        
        const report = {
            title: 'التقرير المالي الشامل',
            generatedAt: new Date().toISOString(),
            period: this.getCurrentPeriod(),
            data: reportData,
            summary: this.generateFinancialSummary(reportData)
        };

        this.displayReport(report);
        return report;
    }

    // Generate capital report
    generateCapitalReport() {
        const data = StorageManager.getAllData();
        const capitalData = this.calculateCapitalData(data);
        
        const report = {
            title: 'تقرير رأس المال',
            generatedAt: new Date().toISOString(),
            period: this.getCurrentPeriod(),
            data: capitalData,
            summary: this.generateCapitalSummary(capitalData)
        };

        this.displayReport(report);
        return report;
    }

    // Generate expenses report
    generateExpensesReport() {
        const data = StorageManager.getAllData();
        const expensesData = this.calculateExpensesData(data);
        
        const report = {
            title: 'تقرير المصروفات',
            generatedAt: new Date().toISOString(),
            period: this.getCurrentPeriod(),
            data: expensesData,
            summary: this.generateExpensesSummary(expensesData)
        };

        this.displayReport(report);
        return report;
    }

    // Calculate financial data
    calculateFinancialData(data) {
        const financial = {
            capital: { USD: 0, IQD: 0, entries: 0 },
            expenses: { USD: 0, IQD: 0, entries: 0 },
            balance: { USD: 0, IQD: 0 },
            shareholders: data.shareholders?.length || 0,
            monthlyBreakdown: this.getMonthlyBreakdown(data),
            categoryBreakdown: this.getCategoryBreakdown(data),
            trends: this.calculateTrends(data)
        };

        // Calculate capital totals
        if (data.capital) {
            data.capital.forEach(entry => {
                const amount = parseFloat(entry.amount) || 0;
                if (entry.currency === 'USD') {
                    financial.capital.USD += amount;
                } else if (entry.currency === 'IQD') {
                    financial.capital.IQD += amount;
                }
                financial.capital.entries++;
            });
        }

        // Calculate expenses totals
        if (data.expenses) {
            data.expenses.forEach(entry => {
                const amount = parseFloat(entry.amount) || 0;
                if (entry.currency === 'USD') {
                    financial.expenses.USD += amount;
                } else if (entry.currency === 'IQD') {
                    financial.expenses.IQD += amount;
                }
                financial.expenses.entries++;
            });
        }

        // Calculate balance
        financial.balance.USD = financial.capital.USD - financial.expenses.USD;
        financial.balance.IQD = financial.capital.IQD - financial.expenses.IQD;

        return financial;
    }

    // Calculate capital data
    calculateCapitalData(data) {
        const capitalData = {
            totalUSD: 0,
            totalIQD: 0,
            shareholderContributions: [],
            monthlyContributions: this.getMonthlyCapitalData(data),
            averageContribution: { USD: 0, IQD: 0 },
            largestContribution: { USD: 0, IQD: 0 },
            contributionTrends: this.getCapitalTrends(data)
        };

        if (data.capital && data.shareholders) {
            // Calculate shareholder contributions
            const shareholderMap = new Map();
            
            data.capital.forEach(entry => {
                const amount = parseFloat(entry.amount) || 0;
                const shareholderId = entry.shareholderId;
                
                if (!shareholderMap.has(shareholderId)) {
                    const shareholder = data.shareholders.find(s => s.id === shareholderId);
                    shareholderMap.set(shareholderId, {
                        name: shareholder ? shareholder.name : 'غير محدد',
                        USD: 0,
                        IQD: 0,
                        entries: 0
                    });
                }
                
                const contribution = shareholderMap.get(shareholderId);
                if (entry.currency === 'USD') {
                    contribution.USD += amount;
                    capitalData.totalUSD += amount;
                    capitalData.largestContribution.USD = Math.max(capitalData.largestContribution.USD, amount);
                } else if (entry.currency === 'IQD') {
                    contribution.IQD += amount;
                    capitalData.totalIQD += amount;
                    capitalData.largestContribution.IQD = Math.max(capitalData.largestContribution.IQD, amount);
                }
                contribution.entries++;
            });

            capitalData.shareholderContributions = Array.from(shareholderMap.values());
            
            // Calculate averages
            if (data.capital.length > 0) {
                capitalData.averageContribution.USD = capitalData.totalUSD / data.capital.filter(e => e.currency === 'USD').length || 0;
                capitalData.averageContribution.IQD = capitalData.totalIQD / data.capital.filter(e => e.currency === 'IQD').length || 0;
            }
        }

        return capitalData;
    }

    // Calculate expenses data
    calculateExpensesData(data) {
        const expensesData = {
            totalUSD: 0,
            totalIQD: 0,
            categoryBreakdown: new Map(),
            monthlyExpenses: this.getMonthlyExpensesData(data),
            averageExpense: { USD: 0, IQD: 0 },
            largestExpense: { USD: 0, IQD: 0 },
            expenseTrends: this.getExpensesTrends(data),
            paymentMethods: new Map()
        };

        if (data.expenses) {
            data.expenses.forEach(entry => {
                const amount = parseFloat(entry.amount) || 0;
                const category = entry.category || 'غير محدد';
                const paymentMethod = entry.paymentMethod || 'غير محدد';
                
                // Total calculations
                if (entry.currency === 'USD') {
                    expensesData.totalUSD += amount;
                    expensesData.largestExpense.USD = Math.max(expensesData.largestExpense.USD, amount);
                } else if (entry.currency === 'IQD') {
                    expensesData.totalIQD += amount;
                    expensesData.largestExpense.IQD = Math.max(expensesData.largestExpense.IQD, amount);
                }

                // Category breakdown
                if (!expensesData.categoryBreakdown.has(category)) {
                    expensesData.categoryBreakdown.set(category, { USD: 0, IQD: 0, count: 0 });
                }
                const categoryData = expensesData.categoryBreakdown.get(category);
                if (entry.currency === 'USD') {
                    categoryData.USD += amount;
                } else if (entry.currency === 'IQD') {
                    categoryData.IQD += amount;
                }
                categoryData.count++;

                // Payment methods
                if (!expensesData.paymentMethods.has(paymentMethod)) {
                    expensesData.paymentMethods.set(paymentMethod, { USD: 0, IQD: 0, count: 0 });
                }
                const paymentData = expensesData.paymentMethods.get(paymentMethod);
                if (entry.currency === 'USD') {
                    paymentData.USD += amount;
                } else if (entry.currency === 'IQD') {
                    paymentData.IQD += amount;
                }
                paymentData.count++;
            });

            // Calculate averages
            if (data.expenses.length > 0) {
                expensesData.averageExpense.USD = expensesData.totalUSD / data.expenses.filter(e => e.currency === 'USD').length || 0;
                expensesData.averageExpense.IQD = expensesData.totalIQD / data.expenses.filter(e => e.currency === 'IQD').length || 0;
            }
        }

        return expensesData;
    }

    // Get monthly breakdown
    getMonthlyBreakdown(data) {
        const months = {};
        const currentYear = new Date().getFullYear();

        // Initialize months
        for (let i = 0; i < 12; i++) {
            const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
            months[monthKey] = {
                capital: { USD: 0, IQD: 0 },
                expenses: { USD: 0, IQD: 0 },
                balance: { USD: 0, IQD: 0 }
            };
        }

        // Process capital
        if (data.capital) {
            data.capital.forEach(entry => {
                const date = new Date(entry.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (months[monthKey]) {
                    const amount = parseFloat(entry.amount) || 0;
                    if (entry.currency === 'USD') {
                        months[monthKey].capital.USD += amount;
                    } else if (entry.currency === 'IQD') {
                        months[monthKey].capital.IQD += amount;
                    }
                }
            });
        }

        // Process expenses
        if (data.expenses) {
            data.expenses.forEach(entry => {
                const date = new Date(entry.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (months[monthKey]) {
                    const amount = parseFloat(entry.amount) || 0;
                    if (entry.currency === 'USD') {
                        months[monthKey].expenses.USD += amount;
                    } else if (entry.currency === 'IQD') {
                        months[monthKey].expenses.IQD += amount;
                    }
                }
            });
        }

        // Calculate balances
        Object.keys(months).forEach(monthKey => {
            months[monthKey].balance.USD = months[monthKey].capital.USD - months[monthKey].expenses.USD;
            months[monthKey].balance.IQD = months[monthKey].capital.IQD - months[monthKey].expenses.IQD;
        });

        return months;
    }

    // Get category breakdown
    getCategoryBreakdown(data) {
        const categories = new Map();

        if (data.expenses) {
            data.expenses.forEach(entry => {
                const category = entry.category || 'غير محدد';
                const amount = parseFloat(entry.amount) || 0;

                if (!categories.has(category)) {
                    categories.set(category, { USD: 0, IQD: 0, count: 0 });
                }

                const categoryData = categories.get(category);
                if (entry.currency === 'USD') {
                    categoryData.USD += amount;
                } else if (entry.currency === 'IQD') {
                    categoryData.IQD += amount;
                }
                categoryData.count++;
            });
        }

        return categories;
    }

    // Calculate trends
    calculateTrends(data) {
        const trends = {
            capitalGrowth: 0,
            expenseGrowth: 0,
            monthlyGrowthRate: 0,
            projectedBalance: { USD: 0, IQD: 0 }
        };

        // Implementation for trend calculations
        // This is a simplified version - can be enhanced with more sophisticated algorithms

        return trends;
    }

    // Get monthly capital data
    getMonthlyCapitalData(data) {
        // Implementation for monthly capital breakdown
        return {};
    }

    // Get capital trends
    getCapitalTrends(data) {
        // Implementation for capital trends
        return {};
    }

    // Get monthly expenses data
    getMonthlyExpensesData(data) {
        // Implementation for monthly expenses breakdown
        return {};
    }

    // Get expenses trends
    getExpensesTrends(data) {
        // Implementation for expenses trends
        return {};
    }

    // Generate summaries
    generateFinancialSummary(data) {
        return {
            totalAssets: data.capital.USD + data.capital.IQD,
            totalLiabilities: data.expenses.USD + data.expenses.IQD,
            netWorth: data.balance.USD + data.balance.IQD,
            profitMargin: data.capital.USD > 0 ? ((data.balance.USD / data.capital.USD) * 100).toFixed(2) : 0
        };
    }

    generateCapitalSummary(data) {
        return {
            totalContributions: data.totalUSD + data.totalIQD,
            averageContribution: (data.averageContribution.USD + data.averageContribution.IQD) / 2,
            topContributor: data.shareholderContributions.reduce((max, current) => 
                (current.USD + current.IQD) > (max.USD + max.IQD) ? current : max, 
                { USD: 0, IQD: 0, name: 'لا يوجد' }
            )
        };
    }

    generateExpensesSummary(data) {
        return {
            totalExpenses: data.totalUSD + data.totalIQD,
            averageExpense: (data.averageExpense.USD + data.averageExpense.IQD) / 2,
            topCategory: Array.from(data.categoryBreakdown.entries()).reduce((max, [category, data]) => 
                (data.USD + data.IQD) > max.total ? { name: category, total: data.USD + data.IQD } : max,
                { name: 'لا يوجد', total: 0 }
            )
        };
    }

    // Get current period
    getCurrentPeriod() {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            quarter: Math.ceil((now.getMonth() + 1) / 3),
            startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
            endDate: now.toISOString()
        };
    }

    // Display report
    displayReport(report) {
        this.currentReport = report;
        
        // Create modal for report display
        const modalHTML = this.generateReportModal(report);
        
        // Remove existing modal if any
        const existingModal = document.getElementById('reportModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('reportModal'));
        modal.show();
    }

    // Generate report modal HTML
    generateReportModal(report) {
        return `
            <div class="modal fade" id="reportModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content neumorphic-card">
                        <div class="modal-header">
                            <h5 class="modal-title">${report.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="report-content">
                                ${this.generateReportContent(report)}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary neumorphic-btn" data-bs-dismiss="modal">إغلاق</button>
                            <button type="button" class="btn btn-primary neumorphic-btn" onclick="reportsManager.exportReport()">
                                <i class="bi bi-download me-2"></i>تصدير التقرير
                            </button>
                            <button type="button" class="btn btn-info neumorphic-btn" onclick="reportsManager.printReport()">
                                <i class="bi bi-printer me-2"></i>طباعة
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate report content
    generateReportContent(report) {
        // This will be implemented based on the report type
        return `
            <div class="report-header mb-4">
                <h3>${report.title}</h3>
                <p class="text-muted">تم إنشاؤه في: ${this.formatDate(report.generatedAt)}</p>
            </div>
            <div class="report-summary">
                <h4>ملخص التقرير</h4>
                <pre>${JSON.stringify(report.summary, null, 2)}</pre>
            </div>
        `;
    }

    // Export report
    exportReport() {
        if (!this.currentReport) return;

        const dataStr = JSON.stringify(this.currentReport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${this.currentReport.title}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Print report
    printReport() {
        window.print();
    }

    // Utility functions
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
        return date.toLocaleDateString('ar-IQ');
    }
}

// Initialize reports manager
let reportsManager;
document.addEventListener('DOMContentLoaded', () => {
    reportsManager = new ReportsManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportsManager;
}
