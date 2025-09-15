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
            type: 'expenses',
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

        // Show modal and setup type-specific interactions when shown
        const modalEl = document.getElementById('reportModal');
        const modal = new bootstrap.Modal(modalEl);
        modalEl.addEventListener('shown.bs.modal', () => {
            try {
                this.afterReportDisplayed();
            } catch (e) {
                console.warn('afterReportDisplayed error', e);
            }
        }, { once: true });
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
        // Route based on report type
        if (report.type === 'expenses') {
            return this.generateExpensesReportContent(report);
        }

        // Generic fallback content
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

    // Specialized: Expenses report content (rebuilt from scratch for accuracy)
    generateExpensesReportContent(report) {
        // Return empty content as requested (delete all contents of Expense Report)
        return '';
    }

    renderExpenseCategoryRow(c) {
        const last = c.lastDate ? new Date(c.lastDate) : null;
        const lastStr = last ? last.toLocaleDateString('ar-IQ') : '-';
        return `
            <tr data-category="${c.name}">
                <td>${c.name}</td>
                <td><span class="excat-badge" title="عدد القيود">${c.count}</span></td>
                <td>${this.formatCurrency(c.totalUSD,'USD')}</td>
                <td>${this.formatCurrency(c.totalIQD,'IQD')}</td>
                <td>${this.formatCurrency(c.avgUSD,'USD')}</td>
                <td>${this.formatCurrency(c.avgIQD,'IQD')}</td>
                <td>${lastStr}</td>
                <td class="text-center excat-actions">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" data-action="view" title="عرض التفاصيل"><i class="bi bi-eye"></i></button>
                        <button class="btn btn-sm btn-outline-success" data-action="export" title="تصدير"><i class="bi bi-download"></i></button>
                        <button class="btn btn-sm btn-outline-warning" data-action="print" title="طباعة"><i class="bi bi-printer"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }

    // After the report modal is displayed, wire up UI for expenses categories
    afterReportDisplayed() {
        if (!this.currentReport || this.currentReport.type !== 'expenses') return;

        // Wire search/sort and actions
        const data = StorageManager.getAllData();
        const allExpenses = Array.isArray(data?.expenses) ? data.expenses : [];

        const tbody = document.getElementById('expenseCatTableBody');
        const searchInput = document.getElementById('expenseCatSearch');
        const sortBySel = document.getElementById('expenseCatSortBy');
        const sortDirSel = document.getElementById('expenseCatSortDir');
        const dateFrom = document.getElementById('expDateFrom');
        const dateTo = document.getElementById('expDateTo');
        const tableWrapper = document.getElementById('expenseCatTableWrapper');

        const updateCards = (list, cats) => {
            const totUSD = list.filter(e=>e.currency==='USD').reduce((s,e)=> s + (parseFloat(e.amount)||0), 0);
            const totIQD = list.filter(e=>e.currency==='IQD').reduce((s,e)=> s + (parseFloat(e.amount)||0), 0);
            const el = (id, val)=>{ const n=document.getElementById(id); if(n) n.textContent=val; };
            el('exTotUSD', this.formatCurrency(totUSD,'USD'));
            el('exTotIQD', this.formatCurrency(totIQD,'IQD'));
            el('exTotCount', list.length.toString());
            el('exTotCats', cats.length.toString());
        };

        const getFiltered = () => {
            const q = (searchInput?.value || '').trim().toLowerCase();
            const from = dateFrom?.value ? new Date(dateFrom.value) : null;
            const to = dateTo?.value ? new Date(dateTo.value) : null;
            return allExpenses.filter(e => {
                // date filter
                if (from || to) {
                    const d = e.date ? new Date(e.date) : null;
                    if (!d) return false;
                    if (from && d < new Date(from.getFullYear(), from.getMonth(), from.getDate())) return false;
                    if (to && d > new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23,59,59,999)) return false;
                }
                if (!q) return true;
                const txt = [e.category, e.description, e.notes, e.project, e.paymentMethod].map(x=> (x||'').toString().toLowerCase()).join(' ');
                return txt.includes(q);
            });
        };

        const applyRender = () => {
            const filtered = getFiltered();
            let cats = this.computeExpenseCategoryStats(filtered);
            const by = sortBySel?.value || 'name';
            const dir = sortDirSel?.value || 'asc';
            cats.sort((a,b)=>{
                let va, vb;
                switch(by){
                    case 'count': va=a.count; vb=b.count; break;
                    case 'totalUSD': va=a.totalUSD; vb=b.totalUSD; break;
                    case 'totalIQD': va=a.totalIQD; vb=b.totalIQD; break;
                    default: va=a.name; vb=b.name; break;
                }
                const cmp = (typeof va === 'string') ? va.localeCompare(vb,'ar') : (va - vb);
                return dir === 'asc' ? cmp : -cmp;
            });
            if (tbody) tbody.innerHTML = cats.map(c => this.renderExpenseCategoryRow(c)).join('');
            updateCards(filtered, cats);
        };

        [searchInput, sortBySel, sortDirSel, dateFrom, dateTo].forEach(el=>{ if(el) el.addEventListener('input', applyRender); });
        document.getElementById('expenseCatShowTableBtn')?.addEventListener('click', ()=>{
            tableWrapper?.scrollIntoView({ behavior:'smooth', block:'start' });
        });

        // Delegated actions on table
        document.getElementById('reportModal')?.addEventListener('click', (ev)=>{
            const btn = ev.target.closest('.excat-actions .btn');
            if(!btn) return;
            const tr = btn.closest('tr');
            const cat = tr?.getAttribute('data-category');
            const action = btn.getAttribute('data-action');
            if(!cat || !action) return;
            const filtered = getFiltered();
            if(action==='view') this.openExpenseCategoryDetails(cat, filtered);
            else if(action==='export') this.exportExpenseCategory(cat, filtered);
            else if(action==='print') this.printExpenseCategory(cat, filtered);
        });

        // Initial render
        applyRender();
    }

    // Compute per-category stats from raw expenses
    computeExpenseCategoryStats(expenses) {
        const map = new Map();
        (expenses||[]).forEach(e => {
            const name = e.category || 'غير محدد';
            if(!map.has(name)) map.set(name, { name, count:0, totalUSD:0, totalIQD:0, countUSD:0, countIQD:0, lastDate:null });
            const obj = map.get(name);
            const amount = parseFloat(e.amount) || 0;
            if (e.currency === 'USD') { obj.totalUSD += amount; obj.countUSD++; }
            else if (e.currency === 'IQD') { obj.totalIQD += amount; obj.countIQD++; }
            obj.count++;
            if(e.date){ const d = new Date(e.date).toISOString(); if(!obj.lastDate || d > obj.lastDate) obj.lastDate = d; }
        });
        return Array.from(map.values()).map(o => ({
            ...o,
            avgUSD: o.countUSD ? (o.totalUSD / o.countUSD) : 0,
            avgIQD: o.countIQD ? (o.totalIQD / o.countIQD) : 0
        }));
    }

    // Drill-down modal with expenses of a category
    openExpenseCategoryDetails(categoryName, allExpenses) {
        const list = (allExpenses||[]).filter(e => (e.category || 'غير محدد') === categoryName);
        const totalUSD = list.filter(e=>e.currency==='USD').reduce((s,e)=> s + (parseFloat(e.amount)||0), 0);
        const totalIQD = list.filter(e=>e.currency==='IQD').reduce((s,e)=> s + (parseFloat(e.amount)||0), 0);
        const rows = list.map(e=>{
            const date = e.date ? new Date(e.date).toLocaleDateString('ar-IQ') : '-';
            const usd = e.currency==='USD' ? this.formatCurrency(e.amount,'USD') : '-';
            const iqd = e.currency==='IQD' ? this.formatCurrency(e.amount,'IQD') : '-';
            const desc = (e.description || e.notes || '').toString();
            const rec = e.receiptNumber || '';
            const reg = e.registrationNumber || '';
            return `<tr><td>${date}</td><td>${desc}</td><td>${usd}</td><td>${iqd}</td><td>${e.paymentMethod||''}</td><td>${e.project||''}</td><td>${rec}</td><td>${reg}</td></tr>`;
        }).join('');

        const modalId = 'categoryDetailsModal';
        document.getElementById(modalId)?.remove();
        const html = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content neumorphic-card">
                        <div class="modal-header">
                            <h5 class="modal-title">تفاصيل الفئة: ${categoryName}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-2">
                                <span class="badge text-bg-warning me-1">إجمالي الدولار: ${this.formatCurrency(totalUSD,'USD')}</span>
                                <span class="badge text-bg-info">إجمالي الدينار: ${this.formatCurrency(totalIQD,'IQD')}</span>
                            </div>
                            <div class="table-responsive" style="max-height:60vh; overflow:auto;">
                                <table class="table table-striped table-sm align-middle">
                                    <thead><tr><th>التاريخ</th><th>الوصف</th><th>$</th><th>د.ع</th><th>طريقة الدفع</th><th>المشروع</th><th>رقم الوصل</th><th>رقم القيد</th></tr></thead>
                                    <tbody>${rows}</tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                            <button type="button" class="btn btn-info" id="printCatDetailsBtn"><i class="bi bi-printer me-1"></i>طباعة</button>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const m = new bootstrap.Modal(document.getElementById(modalId));
        document.getElementById(modalId).addEventListener('shown.bs.modal', ()=>{
            document.getElementById('printCatDetailsBtn')?.addEventListener('click', ()=>{
                this.printExpenseCategory(categoryName, allExpenses);
            });
        }, { once:true });
        m.show();
    }

    exportExpenseCategory(categoryName, allExpenses) {
        const list = (allExpenses||[]).filter(e => (e.category || 'غير محدد') === categoryName);
        const payload = { category: categoryName, count: list.length, items: list };
        const blob = new Blob([JSON.stringify(payload,null,2)], { type:'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `category_${categoryName}_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
    }

    printExpenseCategory(categoryName, allExpenses) {
        const list = (allExpenses||[]).filter(e => (e.category || 'غير محدد') === categoryName);
        const totalUSD = list.filter(e=>e.currency==='USD').reduce((s,e)=> s + (parseFloat(e.amount)||0), 0);
        const totalIQD = list.filter(e=>e.currency==='IQD').reduce((s,e)=> s + (parseFloat(e.amount)||0), 0);
        const rows = list.map((e,idx)=>{
            const date = e.date ? new Date(e.date).toLocaleDateString('ar-IQ') : '-';
            const usd = e.currency==='USD' ? this.formatCurrency(e.amount,'USD') : '-';
            const iqd = e.currency==='IQD' ? this.formatCurrency(e.amount,'IQD') : '-';
            return `<tr><td>${idx+1}</td><td>${date}</td><td>${e.description||''}</td><td>${usd}</td><td>${iqd}</td><td>${e.paymentMethod||''}</td><td>${e.project||''}</td><td>${e.receiptNumber||''}</td><td>${e.registrationNumber||''}</td></tr>`;
        }).join('');

        const title = `تقرير فئة المصروفات: ${categoryName}`;
        const header = (typeof buildBrandedHeaderHTML === 'function') ? buildBrandedHeaderHTML(title) : '';
        const html = `
            <!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${title}</title>
            <link rel="stylesheet" href="css/style.css"></head><body>
            ${header}
            <div class="print-body">
                <div class="mb-2">
                    <strong>إجمالي الدولار:</strong> ${this.formatCurrency(totalUSD,'USD')} &nbsp; | &nbsp;
                    <strong>إجمالي الدينار:</strong> ${this.formatCurrency(totalIQD,'IQD')}
                </div>
                <div class="table-responsive"><table class="table table-bordered table-sm">
                    <thead><tr><th>#</th><th>التاريخ</th><th>الوصف</th><th>$</th><th>د.ع</th><th>طريقة الدفع</th><th>المشروع</th><th>رقم الوصل</th><th>رقم القيد</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table></div>
            </div>
            ${typeof buildPrintFooterHTML==='function'? buildPrintFooterHTML():''}
            </body></html>`;
        const w = window.open('', '_blank', 'width=1100,height=800');
        w.document.open(); w.document.write(html); w.document.close(); w.onload = () => w.print();
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
        if (!this.currentReport) return;

        const content = this.generateReportContent(this.currentReport);
        const header = (typeof buildBrandedHeaderHTML === 'function') ? buildBrandedHeaderHTML(this.currentReport.title || 'تقرير') : '';

        const printHTML = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="utf-8">
                <title>${this.currentReport.title || 'تقرير'}</title>
                <link rel="stylesheet" href="css/style.css">
            </head>
            <body>
                ${header}
                <div class="print-body">${content}</div>
                ${buildPrintFooterHTML ? buildPrintFooterHTML() : ''}
            </body>
            </html>`;

        const win = window.open('', '_blank', 'width=1100,height=800');
        win.document.open();
        win.document.write(printHTML);
        win.document.close();
        win.onload = () => win.print();
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
