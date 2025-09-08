// Expenses Management System
class ExpensesManager {
    constructor() {
        this.currentView = 'overview';
        this.editingId = null;
        this.lastSavedEntry = null;
        this.editingGuideId = null;
        this.init();
    }

    init() {
        console.log('ExpensesManager init called');
        this.loadExpensesSection();
        // Initialize accounting guide
        this.initializeDefaultAccountingGuide();
        console.log('ExpensesManager init completed');
    }

    // Load the expenses section content
    loadExpensesSection() {
        const expensesSection = document.getElementById('expensesSection');
        if (!expensesSection) return;

        const expensesHTML = `
            <div class="expenses-container">
                <!-- Expenses Navigation -->
                <div class="expenses-nav neumorphic-card mb-4">
                    <div class="row">
                        <div class="col-12">
                            <ul class="nav nav-pills justify-content-center">
                                <li class="nav-item">
                                    <a class="nav-link active" href="#" onclick="expensesManager.showView('overview')">
                                        <i class="bi bi-speedometer2 me-2"></i>نظرة عامة
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" onclick="expensesManager.showView('add-expense')">
                                        <i class="bi bi-plus-circle me-2"></i>إضافة مصروف
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" onclick="expensesManager.showView('categories')">
                                        <i class="bi bi-tags me-2"></i>فئات المصروفات
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" onclick="expensesManager.showView('edit-expenses')">
                                        <i class="bi bi-pencil-square me-2"></i>تعديل المصروفات
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" onclick="expensesManager.showView('search')">
                                        <i class="bi bi-search me-2"></i>البحث
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" onclick="expensesManager.showView('accounting-guide')">
                                        <i class="bi bi-book me-2"></i>الدليل المحاسبي
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Expenses Content Views -->
                <div id="expensesContent">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        `;

        expensesSection.innerHTML = expensesHTML;
        this.showView('overview');
    }

    // Show specific view
    showView(viewName) {
        this.currentView = viewName;
        
        // Update navigation
        const navLinks = document.querySelectorAll('.expenses-nav .nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        const activeLink = document.querySelector(`[onclick="expensesManager.showView('${viewName}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Load view content
        switch (viewName) {
            case 'overview':
                this.loadOverviewView();
                break;
            case 'add-expense':
                this.loadAddExpenseView();
                break;
            case 'categories':
                this.loadCategoriesView();
                break;
            case 'edit-expenses':
                this.loadEditExpensesView();
                break;
            case 'search':
                this.loadSearchView();
                break;
            case 'accounting-guide':
                console.log('Loading accounting guide view...');
                this.loadAccountingGuideView();
                break;
        }
    }

    // Helper: render recent expenses list (used in both overview and add views)
    renderRecentExpensesList(expenses) {
        if (!Array.isArray(expenses) || expenses.length === 0) {
            return '<p class="text-center text-muted">لا توجد مصروفات حديثة</p>';
        }
        const sorted = expenses.slice().sort((a, b) => (new Date(b.date)) - (new Date(a.date)));
        return `
            <ul class="list-group">
                ${sorted.slice(0, 5).map(exp => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${exp.description || 'بدون وصف'}<br><small class="text-muted">${new Date(exp.date).toLocaleDateString('ar-IQ')}</small></span>
                        <span class="badge bg-secondary">${this.formatCurrency(exp.amount || exp.amountUSD || exp.amountIQD || 0, exp.currency || (exp.amountUSD ? 'USD' : 'IQD'))}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    // Load overview view
    loadOverviewView() {
        const data = StorageManager.getAllData();
        const expenseStats = this.calculateExpenseStats(data);

        const overviewHTML = `
            <div class="row">
                <!-- Expense Statistics -->
                <div class="col-lg-8 mb-4">
                    <div class="neumorphic-card">
                        <div class="card-header">
                            <h4><i class="bi bi-graph-down me-2"></i>إحصائيات المصروفات</h4>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="stat-item">
                                        <div class="stat-icon bg-danger">
                                            <i class="bi bi-currency-dollar"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>${this.formatCurrency(expenseStats.totalUSD, 'USD')}</h3>
                                            <p>إجمالي المصروفات بالدولار</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="stat-item">
                                        <div class="stat-icon bg-warning">
                                            <i class="bi bi-cash"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>${this.formatCurrency(expenseStats.totalIQD, 'IQD')}</h3>
                                            <p>إجمالي المصروفات بالدينار</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="stat-item">
                                        <div class="stat-icon bg-info">
                                            <i class="bi bi-receipt"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>${expenseStats.totalExpenses}</h3>
                                            <p>عدد المصروفات</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="stat-item">
                                        <div class="stat-icon bg-secondary">
                                            <i class="bi bi-tags"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>${expenseStats.totalCategories}</h3>
                                            <p>فئات المصروفات</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Expenses -->
                <div class="col-lg-4 mb-4">
                    <div class="neumorphic-card">
                        <div class="card-header">
                            <h5><i class="bi bi-clock-history me-2"></i>آخر المصروفات</h5>
                        </div>
                        <div class="card-body">
                            <div id="recentExpenses">
                                ${this.renderRecentExpensesList(data.expenses || [])}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Expenses by Category -->
                <div class="col-12">
                    <div class="neumorphic-card">
                        <div class="card-header">
                            <h4><i class="bi bi-pie-chart me-2"></i>المصروفات حسب الفئة</h4>
                        </div>
                        <div class="card-body">
                            <div id="expensesByCategory">
                                ${this.renderExpensesByCategory(data)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('expensesContent').innerHTML = overviewHTML;
    }

    // Load add expense view
    loadAddExpenseView() {
        const categories = this.getExpenseCategories();

        const addExpenseHTML = `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h4><i class="bi bi-plus-circle me-2"></i>إضافة مصروف جديد</h4>
                </div>
                <div class="card-body">
                    <form id="expenseForm" class="row">
                        <!-- رقم القيد والتاريخ -->
                        <div class="col-md-6 mb-3">
                            <label for="expenseRegistrationNumber" class="form-label">
                                <i class="bi bi-hash me-1"></i>رقم القيد
                            </label>
                            <input type="text" class="form-control neumorphic-input" id="expenseRegistrationNumber"
                                   value="${StorageManager.generateRegistrationNumber()}" readonly>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="expenseDate" class="form-label">
                                <i class="bi bi-calendar me-1"></i>التاريخ
                            </label>
                            <input type="date" class="form-control neumorphic-input" id="expenseDate"
                                   value="${new Date().toISOString().split('T')[0]}" required>
                        </div>

                        <!-- المبالغ وسعر الصرف -->
                        <div class="col-12 mb-3">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle me-2"></i>
                                يمكنك إدخال المبلغ بالدينار العراقي أو الدولار الأمريكي أو كليهما. سعر الصرف قابل للتعديل حسب حاجة المشروع.
                            </div>
                        </div>
                        
                        <div class="col-md-4 mb-3">
                            <label for="expenseAmountIQD" class="form-label">
                                <i class="bi bi-cash me-1"></i>المبلغ بالدينار العراقي <small class="text-muted">(اختياري)</small>
                            </label>
                            <div class="input-group">
                                <input type="number" class="form-control neumorphic-input" id="expenseAmountIQD"
                                       step="1" min="0" placeholder="0">
                                <span class="input-group-text">د.ع</span>
                            </div>
                        </div>
                        
                        <div class="col-md-4 mb-3">
                            <label for="expenseAmountUSD" class="form-label">
                                <i class="bi bi-currency-dollar me-1"></i>المبلغ بالدولار الأمريكي <small class="text-muted">(اختياري)</small>
                            </label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" class="form-control neumorphic-input" id="expenseAmountUSD"
                                       step="0.01" min="0" placeholder="0.00">
                            </div>
                        </div>
                        
                        <div class="col-md-4 mb-3">
                            <label for="expenseExchangeRate" class="form-label">
                                <i class="bi bi-arrow-left-right me-1"></i>سعر الصرف <small class="text-muted">(قابل للتعديل)</small>
                            </label>
                            <div class="input-group">
                                <input type="number" class="form-control neumorphic-input" id="expenseExchangeRate"
                                       step="0.01" min="0" value="1500" placeholder="1500">
                                <span class="input-group-text">د.ع/$</span>
                            </div>
                        </div>
                        
                        <!-- أدوات التحويل السريع -->
                        <div class="col-12 mb-4">
                            <div class="card border-0 bg-light">
                                <div class="card-body p-3">
                                    <h6 class="card-title mb-3">
                                        <i class="bi bi-calculator me-2"></i>أدوات التحويل السريع
                                    </h6>
                                    <div class="row g-2">
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-sm btn-outline-primary w-100" 
                                                    onclick="expensesManager.convertCurrency('IQD_to_USD')">
                                                <i class="bi bi-arrow-left me-1"></i>تحويل دينار إلى دولار
                                            </button>
                                        </div>
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-sm btn-outline-success w-100" 
                                                    onclick="expensesManager.convertCurrency('USD_to_IQD')">
                                                <i class="bi bi-arrow-right me-1"></i>تحويل دولار إلى دينار
                                            </button>
                                        </div>
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-sm btn-outline-secondary w-100" 
                                                    onclick="expensesManager.clearAmounts()">
                                                <i class="bi bi-x-circle me-1"></i>مسح المبالغ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- البيان والدليل المحاسبي -->
                        <div class="col-md-6 mb-3">
                            <label for="expenseDescription" class="form-label">
                                <i class="bi bi-file-text me-1"></i>البيان
                            </label>
                            <input type="text" class="form-control neumorphic-input" id="expenseDescription"
                                   placeholder="بيان المصروف..." required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="expenseAccountingGuide" class="form-label">
                                <i class="bi bi-book me-1"></i>الدليل المحاسبي
                            </label>
                            <select class="form-control neumorphic-input" id="expenseAccountingGuide" required>
                                <option value="">اختر من الدليل المحاسبي</option>
                                ${this.getAccountingGuideOptions()}
                            </select>
                        </div>

                        <!-- المستفيد ومعلومات الوصل -->
                        <div class="col-md-4 mb-3">
                            <label for="expenseBeneficiary" class="form-label">
                                <i class="bi bi-person me-1"></i>المستفيد
                            </label>
                            <input type="text" class="form-control neumorphic-input" id="expenseBeneficiary"
                                   placeholder="اسم المستفيد...">
                        </div>
                        <div class="col-md-4 mb-3">
                            <label for="expenseReceiptNumber" class="form-label">
                                <i class="bi bi-receipt me-1"></i>رقم الوصل
                            </label>
                            <input type="text" class="form-control neumorphic-input" id="expenseReceiptNumber"
                                   placeholder="رقم الوصل...">
                        </div>
                        <div class="col-md-4 mb-3">
                            <label for="expenseReceiptDate" class="form-label">
                                <i class="bi bi-calendar-check me-1"></i>تاريخ الوصل
                            </label>
                            <input type="date" class="form-control neumorphic-input" id="expenseReceiptDate">
                        </div>

                        <!-- معلومات إضافية -->
                        <div class="col-md-6 mb-3">
                            <label for="expenseVendor" class="form-label">
                                <i class="bi bi-building me-1"></i>المورد/الجهة
                            </label>
                            <input type="text" class="form-control neumorphic-input" id="expenseVendor"
                                   placeholder="اسم المورد أو الجهة...">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="expensePaymentMethod" class="form-label">
                                <i class="bi bi-credit-card me-1"></i>طريقة الدفع
                            </label>
                            <select class="form-control neumorphic-input" id="expensePaymentMethod">
                                <option value="">اختر طريقة الدفع</option>
                                <option value="cash">نقداً</option>
                                <option value="bank_transfer">تحويل بنكي</option>
                                <option value="check">شيك</option>
                                <option value="credit_card">بطاقة ائتمان</option>
                                <option value="electronic_payment">دفع إلكتروني</option>
                            </select>
                        </div>

                        <!-- الفئة والمشروع -->
                        <div class="col-md-6 mb-3">
                            <label for="expenseCategory" class="form-label">
                                <i class="bi bi-tags me-1"></i>فئة المصروف
                            </label>
                            <select class="form-control neumorphic-input" id="expenseCategory" required>
                                <option value="">اختر الفئة</option>
                                ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="expenseProject" class="form-label">
                                <i class="bi bi-diagram-3 me-1"></i>المشروع
                            </label>
                            <select class="form-control neumorphic-input" id="expenseProject">
                                <option value="">اختر المشروع</option>
                                <option value="مشروع 1">مشروع البناء الرئيسي</option>
                                <option value="مشروع 2">مشروع التوسعة</option>
                                <option value="مشروع 3">مشروع الصيانة</option>
                                <option value="عام">مصروف عام</option>
                            </select>
                        </div>

                        <!-- الملاحظات -->
                        <div class="col-12 mb-3">
                            <label for="expenseNotes" class="form-label">
                                <i class="bi bi-chat-text me-1"></i>الملاحظات
                            </label>
                            <textarea class="form-control neumorphic-input" id="expenseNotes" rows="3"
                                      placeholder="ملاحظات إضافية حول المصروف..."></textarea>
                        </div>

                        <!-- أزرار التحكم -->
                        <div class="col-12">
                            <div class="d-flex flex-wrap gap-2">
                                <button type="submit" class="btn btn-primary neumorphic-btn">
                                    <i class="bi bi-save me-2"></i>حفظ المصروف
                                </button>
                                <button type="reset" class="btn btn-secondary neumorphic-btn">
                                    <i class="bi bi-arrow-clockwise me-2"></i>إعادة تعيين
                                </button>
                                <button type="button" class="btn btn-info neumorphic-btn" onclick="expensesManager.previewExpense()">
                                    <i class="bi bi-eye me-2"></i>معاينة
                                </button>
                                <button type="button" class="btn btn-warning neumorphic-btn" onclick="expensesManager.printInvoice()">
                                    <i class="bi bi-printer me-2"></i>طباعة الفاتورة
                                </button>
                                <button type="button" class="btn btn-success neumorphic-btn" onclick="expensesManager.fillTestData()">
                                    <i class="bi bi-clipboard-data me-2"></i>بيانات تجريبية
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <!-- معاينة المصروف -->
            <div id="expensePreview" class="neumorphic-card mt-4" style="display: none;">
                <div class="card-header">
                    <h5><i class="bi bi-eye me-2"></i>معاينة المصروف</h5>
                </div>
                <div class="card-body" id="expensePreviewContent">
                    <!-- Preview content will be loaded here -->
                </div>
            </div>

            <!-- Recent Expenses List -->
            <div class="neumorphic-card mt-4">
                <div class="card-header">
                    <h4><i class="bi bi-list me-2"></i>المصروفات الحديثة</h4>
                </div>
                <div class="card-body">
                    <div id="expensesList">
                        ${this.renderRecentExpenses(StorageManager.getAllData().expenses || [])}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('expensesContent').innerHTML = addExpenseHTML;
        this.setupExpenseForm();
    }

    // Load categories view with detailed reports
    loadCategoriesView() {
        const data = StorageManager.getAllData();
        const expenses = data.expenses || [];
        
        // Calculate detailed category statistics
        const categoryStats = this.calculateDetailedCategoryStats(expenses);
        
        const categoriesHTML = `
            <div class="categories-container">
                <!-- Categories Overview -->
                <div class="neumorphic-card mb-4">
                    <div class="card-header">
                        <h4><i class="bi bi-tags me-2"></i>تقرير فئات المصروفات المفصل</h4>
                        <div class="header-actions">
                            <button class="btn btn-success neumorphic-btn btn-sm" onclick="expensesManager.exportCategoriesReport()">
                                <i class="bi bi-file-excel me-1"></i>تصدير
                            </button>
                            <button class="btn btn-info neumorphic-btn btn-sm ms-2" onclick="expensesManager.printCategoriesReport()">
                                <i class="bi bi-printer me-1"></i>طباعة
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Summary Statistics -->
                        <div class="row mb-4">
                            <div class="col-md-3">
                                <div class="stat-card text-center bg-primary text-white rounded p-3">
                                    <h3>${Object.keys(categoryStats).length}</h3>
                                    <p class="mb-0">إجمالي الفئات</p>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-card text-center bg-success text-white rounded p-3">
                                    <h3>${expenses.length}</h3>
                                    <p class="mb-0">إجمالي القيود</p>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-card text-center bg-warning text-white rounded p-3">
                                    <h3>${this.formatCurrency(this.getTotalAmount(expenses, 'USD'), 'USD')}</h3>
                                    <p class="mb-0">إجمالي بالدولار</p>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-card text-center bg-info text-white rounded p-3">
                                    <h3>${this.formatCurrency(this.getTotalAmount(expenses, 'IQD'), 'IQD')}</h3>
                                    <p class="mb-0">إجمالي بالدينار</p>
                                </div>
                            </div>
                        </div>

                        <!-- Search and Filter Controls -->
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                                    <input type="text" class="form-control" id="categoriesSearchInput" 
                                           placeholder="البحث في الفئات..." onkeyup="expensesManager.filterCategories()">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <select class="form-control" id="categoriesSortBy" onchange="expensesManager.sortCategories()">
                                    <option value="name">ترتيب بالاسم</option>
                                    <option value="count">ترتيب بعدد القيود</option>
                                    <option value="amountUSD">ترتيب بالمبلغ (دولار)</option>
                                    <option value="amountIQD">ترتيب بالمبلغ (دينار)</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-control" id="categoriesViewMode" onchange="expensesManager.changeCategoriesViewMode()">
                                    <option value="cards">عرض البطاقات</option>
                                    <option value="table">عرض الجدول</option>
                                    <option value="chart">عرض المخطط</option>
                                </select>
                            </div>
                        </div>

                        <!-- Categories Display Area -->
                        <div id="categoriesDisplayArea">
                            ${this.renderCategoriesCards(categoryStats)}
                        </div>
                    </div>
                </div>

                <!-- Detailed Category View Modal (Will be shown when clicking a category) -->
                <div id="categoryDetailsModal" class="neumorphic-card" style="display: none;">
                    <div class="card-header">
                        <h5 id="categoryDetailsTitle">تفاصيل الفئة</h5>
                        <button class="btn-close" onclick="expensesManager.hideCategoryDetails()"></button>
                    </div>
                    <div class="card-body" id="categoryDetailsContent">
                        <!-- Detailed content will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        document.getElementById('expensesContent').innerHTML = categoriesHTML;
    }

    // Load edit expenses view (placeholder)
    loadEditExpensesView() {
        const editExpensesHTML = `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h4><i class="bi bi-pencil-square me-2"></i>تعديل المصروفات</h4>
                </div>
                <div class="card-body text-center">
                    <i class="bi bi-tools display-1 text-muted"></i>
                    <h4 class="mt-3 text-muted">قيد التطوير</h4>
                    <p class="text-muted">ستتوفر هذه الميزة قريباً</p>
                </div>
            </div>
        `;
        document.getElementById('expensesContent').innerHTML = editExpensesHTML;
    }

    // Load search view (placeholder)
    loadSearchView() {
        const searchHTML = `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h4><i class="bi bi-search me-2"></i>البحث في المصروفات</h4>
                </div>
                <div class="card-body text-center">
                    <i class="bi bi-search display-1 text-muted"></i>
                    <h4 class="mt-3 text-muted">قيد التطوير</h4>
                    <p class="text-muted">ستتوفر ميزة البحث المتقدم قريباً</p>
                </div>
            </div>
        `;
        document.getElementById('expensesContent').innerHTML = searchHTML;
    }

    // Load accounting guide view
    loadAccountingGuideView() {
        console.log('Loading accounting guide view...');

        const expensesContent = document.getElementById('expensesContent');
        if (!expensesContent) {
            console.error('expensesContent element not found!');
            return;
        }

        // Initialize default guide first
        this.initializeDefaultAccountingGuide();

        const accountingGuideHTML = `
            <div class="accounting-guide-container">
                <!-- Guide Navigation -->
                <div class="neumorphic-card mb-4">
                    <div class="card-header">
                        <h4><i class="bi bi-book me-2"></i>الدليل المحاسبي للمصروفات</h4>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <button class="btn btn-primary neumorphic-btn w-100" onclick="expensesManager.showGuideSubView('add')">
                                    <i class="bi bi-plus-circle me-2"></i>إضافة دليل محاسبي
                                </button>
                            </div>
                            <div class="col-md-4 mb-3">
                                <button class="btn btn-warning neumorphic-btn w-100" onclick="expensesManager.showGuideSubView('edit')">
                                    <i class="bi bi-pencil-square me-2"></i>تعديل دليل محاسبي
                                </button>
                            </div>
                            <div class="col-md-4 mb-3">
                                <button class="btn btn-success neumorphic-btn w-100" onclick="expensesManager.showGuideSubView('print')">
                                    <i class="bi bi-printer me-2"></i>طباعة الدليل
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Guide Content -->
                <div id="guideContent">
                    <div class="text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">جاري التحميل...</span>
                        </div>
                        <p class="mt-2">جاري تحميل الدليل المحاسبي...</p>
                    </div>
                </div>
            </div>
        `;

        console.log('Setting accounting guide HTML...');
        expensesContent.innerHTML = accountingGuideHTML;

        // Load content after a short delay to ensure DOM is ready
        setTimeout(() => {
            console.log('Loading guide overview...');
            this.showGuideSubView('overview');
        }, 100);
    }

    // Show guide sub-view
    showGuideSubView(subView) {
        console.log('Showing guide sub-view:', subView);
        const guideContent = document.getElementById('guideContent');
        if (!guideContent) {
            console.error('Guide content element not found');
            return;
        }

        switch (subView) {
            case 'add':
                guideContent.innerHTML = this.renderAddGuideForm();
                this.setupAddGuideForm();
                break;
            case 'edit':
                guideContent.innerHTML = this.renderEditGuideList();
                break;
            case 'print':
                this.printAccountingGuide();
                break;
            case 'overview':
            default:
                guideContent.innerHTML = this.renderAccountingGuideOverview();
                break;
        }
    }

    // Render accounting guide overview
    renderAccountingGuideOverview() {
        console.log('Rendering accounting guide overview...');

        // Get accounting guide data
        let accountingGuide = StorageManager.getData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE) || [];
        console.log('Accounting guide data length:', accountingGuide.length);

        // If no data, try to create default guide
        if (accountingGuide.length === 0) {
            console.log('No accounting guide found, creating default...');

            // Create default guide directly
            const defaultGuide = this.getDefaultAccountingGuide();
            console.log('Default guide created with', defaultGuide.length, 'items');

            // Save it
            const saved = StorageManager.saveData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE, defaultGuide);
            console.log('Default guide saved:', saved);

            if (saved) {
                accountingGuide = defaultGuide;
            }
        }

        // If still no data, show empty state
        if (accountingGuide.length === 0) {
            console.log('Still no accounting guide data, showing empty state');
            return `
                <div class="neumorphic-card">
                    <div class="card-body text-center">
                        <i class="bi bi-book display-1 text-muted"></i>
                        <h4 class="mt-3">لا يوجد دليل محاسبي</h4>
                        <p class="text-muted">ابدأ بإضافة عناصر الدليل المحاسبي للمصروفات</p>
                        <button class="btn btn-primary neumorphic-btn" onclick="expensesManager.createDefaultGuide()">
                            <i class="bi bi-plus-circle me-2"></i>إنشاء الدليل الافتراضي
                        </button>
                        <button class="btn btn-success neumorphic-btn ms-2" onclick="expensesManager.showGuideSubView('add')">
                            <i class="bi bi-plus-circle me-2"></i>إضافة عنصر يدوياً
                        </button>
                    </div>
                </div>
            `;
        }

        console.log('Rendering guide with', accountingGuide.length, 'items');

        // Group by main categories
        const groupedGuide = this.groupAccountingGuideByCategory(accountingGuide);

        let overviewHTML = `
            <div class="neumorphic-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5><i class="bi bi-list-ul me-2"></i>الدليل المحاسبي الحالي</h5>
                    <span class="badge bg-info">${accountingGuide.length} عنصر</span>
                </div>
                <div class="card-body">
        `;

        Object.keys(groupedGuide).forEach(category => {
            overviewHTML += `
                <div class="category-section mb-4">
                    <h6 class="category-title">
                        <i class="bi bi-folder me-2"></i>${category}
                        <span class="badge bg-secondary ms-2">${groupedGuide[category].length}</span>
                    </h6>
                    <div class="row">
            `;

            groupedGuide[category].forEach(item => {
                overviewHTML += `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="guide-item p-3 border rounded">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <strong>${item.code}</strong>
                                    <div class="text-muted small">${item.name}</div>
                                    ${item.description ? `<div class="text-muted small mt-1">${item.description}</div>` : ''}
                                </div>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="expensesManager.editGuideItem('${item.id}')" title="تعديل">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="expensesManager.deleteGuideItem('${item.id}')" title="حذف">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            overviewHTML += `
                    </div>
                </div>
            `;
        });

        overviewHTML += `
                </div>
            </div>
        `;

        return overviewHTML;
    }

    // Render expenses by category (missing function)
    renderExpensesByCategory() {
        const data = StorageManager.getAllData();
        const expenses = data.expenses || [];

        if (expenses.length === 0) {
            return '<p class="text-center text-muted">لا توجد مصروفات لعرضها</p>';
        }

        // Group expenses by category
        const grouped = {};
        expenses.forEach(expense => {
            const category = expense.category || 'غير مصنف';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(expense);
        });

        let html = '<div class="row">';
        Object.keys(grouped).forEach(category => {
            const categoryExpenses = grouped[category];
            const total = categoryExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

            html += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h6 class="mb-0">${category} (${categoryExpenses.length})</h6>
                        </div>
                        <div class="card-body">
                            <p class="mb-2"><strong>الإجمالي:</strong> ${this.formatCurrency(total, 'USD')}</p>
                            <div class="list-group list-group-flush">
                                ${categoryExpenses.slice(0, 3).map(exp => `
                                    <div class="list-group-item">
                                        <small>${exp.description || 'بدون وصف'}</small>
                                        <span class="float-end">${this.formatCurrency(exp.amount, exp.currency)}</span>
                                    </div>
                                `).join('')}
                                ${categoryExpenses.length > 3 ? `<div class="list-group-item text-center"><small>و ${categoryExpenses.length - 3} مصروف آخر...</small></div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        return html;
    }

    // Group accounting guide by category
    groupAccountingGuideByCategory(guide) {
        const grouped = {};
        guide.forEach(item => {
            const category = item.category || 'غير مصنف';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(item);
        });
        return grouped;
    }

    // Render add guide form
    renderAddGuideForm() {
        return `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h5><i class="bi bi-plus-circle me-2"></i>إضافة عنصر جديد للدليل المحاسبي</h5>
                </div>
                <div class="card-body">
                    <form id="addGuideForm" class="row">
                        <div class="col-md-6 mb-3">
                            <label for="guideCode" class="form-label">رمز الحساب</label>
                            <input type="text" class="form-control neumorphic-input" id="guideCode"
                                   placeholder="مثال: 5101" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="guideName" class="form-label">اسم الحساب</label>
                            <input type="text" class="form-control neumorphic-input" id="guideName"
                                   placeholder="مثال: مواد البناء الأساسية" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="guideCategory" class="form-label">الفئة الرئيسية</label>
                            <select class="form-control neumorphic-input" id="guideCategory" required>
                                <option value="">اختر الفئة</option>
                                <option value="مواد البناء">مواد البناء</option>
                                <option value="العمالة">العمالة</option>
                                <option value="المعدات والآلات">المعدات والآلات</option>
                                <option value="النقل والمواصلات">النقل والمواصلات</option>
                                <option value="الوقود والطاقة">الوقود والطاقة</option>
                                <option value="الصيانة والإصلاح">الصيانة والإصلاح</option>
                                <option value="الرواتب والأجور">الرواتب والأجور</option>
                                <option value="التأمين">التأمين</option>
                                <option value="الضرائب والرسوم">الضرائب والرسوم</option>
                                <option value="المكتب والإدارة">المكتب والإدارة</option>
                                <option value="التسويق والإعلان">التسويق والإعلان</option>
                                <option value="الاستشارات المهنية">الاستشارات المهنية</option>
                                <option value="أخرى">أخرى</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="guideType" class="form-label">نوع الحساب</label>
                            <select class="form-control neumorphic-input" id="guideType" required>
                                <option value="">اختر النوع</option>
                                <option value="مصروف مباشر">مصروف مباشر</option>
                                <option value="مصروف غير مباشر">مصروف غير مباشر</option>
                                <option value="مصروف إداري">مصروف إداري</option>
                                <option value="مصروف تشغيلي">مصروف تشغيلي</option>
                            </select>
                        </div>
                        <div class="col-12 mb-3">
                            <label for="guideDescription" class="form-label">وصف الحساب</label>
                            <textarea class="form-control neumorphic-input" id="guideDescription" rows="3"
                                      placeholder="وصف تفصيلي للحساب واستخداماته..."></textarea>
                        </div>
                        <div class="col-12 mb-3">
                            <label for="guideNotes" class="form-label">ملاحظات</label>
                            <textarea class="form-control neumorphic-input" id="guideNotes" rows="2"
                                      placeholder="ملاحظات إضافية..."></textarea>
                        </div>
                        <div class="col-12">
                            <button type="submit" class="btn btn-primary neumorphic-btn">
                                <i class="bi bi-save me-2"></i>حفظ العنصر
                            </button>
                            <button type="button" class="btn btn-secondary neumorphic-btn ms-2" onclick="expensesManager.showGuideSubView('overview')">
                                <i class="bi bi-arrow-right me-2"></i>العودة للعرض العام
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // Render edit guide list
    renderEditGuideList() {
        const accountingGuide = StorageManager.getData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE) || [];

        if (accountingGuide.length === 0) {
            return `
                <div class="neumorphic-card">
                    <div class="card-body text-center">
                        <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
                        <h4 class="mt-3">لا يوجد عناصر للتعديل</h4>
                        <p class="text-muted">يجب إضافة عناصر للدليل المحاسبي أولاً</p>
                        <button class="btn btn-primary neumorphic-btn" onclick="expensesManager.showGuideSubView('add')">
                            <i class="bi bi-plus-circle me-2"></i>إضافة عنصر جديد
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h5><i class="bi bi-pencil-square me-2"></i>تعديل عناصر الدليل المحاسبي</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>رمز الحساب</th>
                                    <th>اسم الحساب</th>
                                    <th>الفئة</th>
                                    <th>النوع</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${accountingGuide.map(item => `
                                    <tr>
                                        <td><strong>${item.code}</strong></td>
                                        <td>${item.name}</td>
                                        <td><span class="badge bg-info">${item.category}</span></td>
                                        <td><span class="badge bg-secondary">${item.type}</span></td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" onclick="expensesManager.editGuideItem('${item.id}')" title="تعديل">
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                                <button class="btn btn-outline-danger" onclick="expensesManager.deleteGuideItem('${item.id}')" title="حذف">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    // Calculate expense statistics
    calculateExpenseStats(data) {
        const stats = {
            totalUSD: 0,
            totalIQD: 0,
            totalExpenses: data.expenses?.length || 0,
            totalCategories: 0
        };

        if (data.expenses) {
            const categories = new Set();
            data.expenses.forEach(expense => {
                // دعم المصروفات المختلطة
                let addedUSD = false, addedIQD = false;
                if (expense.amountUSD !== undefined) {
                    stats.totalUSD += parseFloat(expense.amountUSD) || 0;
                    addedUSD = true;
                }
                if (expense.amountIQD !== undefined) {
                    stats.totalIQD += parseFloat(expense.amountIQD) || 0;
                    addedIQD = true;
                }
                // إذا لم يكن مختلط، استخدم amount/currency
                if (!addedUSD && !addedIQD) {
                    const amount = parseFloat(expense.amount) || 0;
                    if (expense.currency === 'USD') {
                        stats.totalUSD += amount;
                    } else if (expense.currency === 'IQD') {
                        stats.totalIQD += amount;
                    }
                }
                if (expense.category) {
                    categories.add(expense.category);
                }
            });
            stats.totalCategories = categories.size;
        }

        return stats;
    }

    // Get expense categories
    getExpenseCategories() {
        return [
            'مواد البناء',
            'العمالة',
            'المعدات والآلات',
            'النقل والمواصلات',
            'الوقود والطاقة',
            'الصيانة والإصلاح',
            'الرواتب والأجور',
            'التأمين',
            'الضرائب والرسوم',
            'المكتب والإدارة',
            'التسويق والإعلان',
            'الاستشارات المهنية',
            'أخرى'
        ];
    }

    // Render recent expenses
    renderRecentExpenses(expenses) {
        if (!expenses || expenses.length === 0) {
            return '<p class="text-muted text-center">لا توجد مصروفات حديثة</p>';
        }

        const recentExpenses = expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        return recentExpenses.map(expense => `
            <div class="recent-expense mb-3 p-3 border rounded">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${this.formatCurrency(expense.amount, expense.currency)}</h6>
                        <small class="text-muted">${expense.category || 'غير محدد'}</small>
                        <br>
                        <small class="text-muted">${this.formatDate(expense.date)}</small>
                    </div>
                    <span class="badge bg-${expense.currency === 'USD' ? 'danger' : 'warning'}">${expense.currency}</span>
                </div>
            </div>
        `).join('');
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

    // Setup expense form
    setupExpenseForm() {
        const form = document.getElementById('expenseForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExpenseEntry();
        });
    }

    // Save expense entry
    saveExpenseEntry() {
        const formData = this.getExpenseFormData();
        if (!formData) return;

        // Get accounting guide item details
        const accountingGuideSelect = document.getElementById('expenseAccountingGuide');
        const selectedOption = accountingGuideSelect.options[accountingGuideSelect.selectedIndex];
        const accountingGuideCode = selectedOption?.getAttribute('data-code') || '';
        const accountingGuideName = selectedOption?.getAttribute('data-name') || '';

        const expenseData = {
            registrationNumber: formData.registrationNumber,
            date: formData.date,
            amountIQD: formData.amountIQD,
            amountUSD: formData.amountUSD,
            exchangeRate: formData.exchangeRate,
            description: formData.description,
            accountingGuide: formData.accountingGuide,
            accountingGuideCode: accountingGuideCode,
            accountingGuideName: accountingGuideName,
            beneficiary: formData.beneficiary,
            receiptNumber: formData.receiptNumber,
            receiptDate: formData.receiptDate,
            vendor: formData.vendor,
            paymentMethod: formData.paymentMethod,
            category: formData.category,
            project: formData.project,
            notes: formData.notes,
            // Legacy fields for compatibility - determine primary currency based on larger amount
            currency: this.determinePrimaryCurrency(formData.amountIQD, formData.amountUSD, formData.exchangeRate),
            amount: this.calculatePrimaryAmount(formData.amountIQD, formData.amountUSD, formData.exchangeRate),
            
            // Enhanced currency information
            hasBothCurrencies: formData.amountIQD > 0 && formData.amountUSD > 0,
            hasIQDOnly: formData.amountIQD > 0 && formData.amountUSD === 0,
            hasUSDOnly: formData.amountIQD === 0 && formData.amountUSD > 0
        };

        if (this.editingId) {
            // Update existing entry
            if (StorageManager.updateExpenseEntry(this.editingId, expenseData)) {
                this.showNotification('تم تحديث المصروف بنجاح', 'success');
                this.lastSavedEntry = { ...expenseData, id: this.editingId };
                this.showPrintButton();
                this.editingId = null;
            } else {
                this.showNotification('حدث خطأ أثناء تحديث المصروف', 'error');
            }
        } else {
            // Add new entry
            const newEntry = StorageManager.addExpenseEntry(expenseData);
            if (newEntry) {
                this.showNotification('تم إضافة المصروف بنجاح', 'success');
                this.lastSavedEntry = newEntry;
                this.showPrintButton();
            } else {
                this.showNotification('حدث خطأ أثناء إضافة المصروف', 'error');
            }
        }

        // Reset form and refresh view
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseRegistrationNumber').value = StorageManager.generateRegistrationNumber();
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('expenseExchangeRate').value = '1500';

        // Hide preview if shown
        const previewDiv = document.getElementById('expensePreview');
        if (previewDiv) {
            previewDiv.style.display = 'none';
        }

        this.refreshCurrentView();
    }

    // Show print button after successful save
    showPrintButton() {
        const printBtn = document.getElementById('printExpenseReceiptBtn');
        if (printBtn) {
            printBtn.style.display = 'inline-block';
            // Hide button after 30 seconds
            setTimeout(() => {
                printBtn.style.display = 'none';
            }, 30000);
        }
    }

    // Print expense receipt
    printExpenseReceipt() {
        if (!this.lastSavedEntry) {
            this.showNotification('لا يوجد مصروف للطباعة', 'error');
            return;
        }

        const receiptBody = this.generateExpenseReceiptHTML(this.lastSavedEntry);
        const header = (typeof buildBrandedHeaderHTML === 'function') ? buildBrandedHeaderHTML('سند صرف') : '';

                const fullHTML = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>إيصال مصروف - ${this.lastSavedEntry.registrationNumber}</title>
                <link rel="stylesheet" href="css/style.css">
                                <style>
                                    @page { size: A4; margin: 8mm; }
                                    @media print {
                                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 12px; }
                                    }
                                    .receipt-container { max-width: 700px !important; padding: 12px !important; border-width: 1px !important; margin: 0 auto !important; }
                                    .header { margin-bottom: 8px !important; padding-bottom: 8px !important; }
                                    .company-name, .receipt-title { display: none !important; }
                                    .receipt-body { margin: 12px 0 !important; }
                                    .info-row { margin-bottom: 6px !important; padding: 6px !important; }
                                    .info-label { min-width: 120px !important; font-size: 12px !important; }
                                    .info-value { font-size: 12px !important; }
                                    .amount-section { padding: 8px !important; margin: 10px 0 !important; }
                                    .amount-label { font-size: 14px !important; }
                                    .amount-value { font-size: 20px !important; }
                                    .amount-words { font-size: 12px !important; }
                                    .description-section { padding: 8px !important; margin: 10px 0 !important; }
                                    .signatures { margin-top: 20px !important; }
                                    .signature-line { height: 28px !important; }
                                    .print-info { display: none !important; }
                                    .print-header .print-sub { font-size: 10px !important; margin-bottom: 4px !important; }
                                    .print-header .program-name { font-size: 14px !important; }
                                    .print-footer { padding: 6px 10px !important; font-size: 11px !important; }
                                </style>
            </head>
            <body>
                ${header}
                <div class="receipt-body">${receiptBody}</div>
            </body>
            </html>
        `;

        // Create print window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(fullHTML);
        printWindow.document.close();

        // Wait for content to load then print (small delay to let browser compute page counters)
        printWindow.onload = function() {
            setTimeout(() => {
                try { printWindow.print(); } catch (e) { console.error('Print failed', e); }
            }, 300);
        };
    }

    // Print a specific expense by id or fallback to registrationNumber
    printExpenseById(id, registrationNumberFallback = '') {
        try {
            const all = StorageManager.getAllData();
            const list = Array.isArray(all.expenses) ? all.expenses : [];
            let entry = null;
            if (id) {
                entry = list.find(e => e.id === id);
            }
            if (!entry && registrationNumberFallback) {
                entry = list.find(e => e.registrationNumber === registrationNumberFallback);
            }
            if (!entry) {
                this.showNotification('لم يتم العثور على القيد للطباعة', 'error');
                return;
            }

            const bodyHtml = this.generateExpenseReceiptHTML(entry);
            const header = (typeof buildBrandedHeaderHTML === 'function') ? buildBrandedHeaderHTML('سند صرف') : '';
            const footer = (typeof buildPrintFooterHTML === 'function') ? buildPrintFooterHTML() : '';

                        const html = `
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>طباعة قيد - ${entry.registrationNumber || ''}</title>
                    <link rel="stylesheet" href="css/style.css">
                                        <style>
                                            @page { size: A4; margin: 8mm; }
                                            @media print {
                                                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 12px; }
                                            }
                                            .receipt-container { max-width: 700px !important; padding: 12px !important; border-width: 1px !important; margin: 0 auto !important; }
                                            .header { margin-bottom: 8px !important; padding-bottom: 8px !important; }
                                            .company-name, .receipt-title { display: none !important; }
                                            .receipt-body { margin: 12px 0 !important; }
                                            .info-row { margin-bottom: 6px !important; padding: 6px !important; }
                                            .info-label { min-width: 120px !important; font-size: 12px !important; }
                                            .info-value { font-size: 12px !important; }
                                            .amount-section { padding: 8px !important; margin: 10px 0 !important; }
                                            .amount-label { font-size: 14px !important; }
                                            .amount-value { font-size: 20px !important; }
                                            .amount-words { font-size: 12px !important; }
                                            .description-section { padding: 8px !important; margin: 10px 0 !important; }
                                            .signatures { margin-top: 20px !important; }
                                            .signature-line { height: 28px !important; }
                                            .print-info { display: none !important; }
                                            .print-header .print-sub { font-size: 10px !important; margin-bottom: 4px !important; }
                                            .print-header .program-name { font-size: 14px !important; }
                                            .print-footer { padding: 6px 10px !important; font-size: 11px !important; }
                                        </style>
                </head>
                <body>
                    ${header}
                    <div class="receipt-body">${bodyHtml}</div>
                    ${footer}
                </body>
                </html>
            `;

            const win = window.open('', '_blank', 'width=900,height=700');
            win.document.write(html);
            win.document.close();
            win.onload = () => setTimeout(() => { try { win.print(); } catch(_){} }, 300);
        } catch (err) {
            console.error('printExpenseById error', err);
            this.showNotification('حدث خطأ أثناء الطباعة', 'error');
        }
    }

    // Generate expense receipt HTML
    generateExpenseReceiptHTML(entry) {
        const currentDate = new Date().toLocaleDateString('ar-IQ');
        const currentTime = new Date().toLocaleTimeString('ar-IQ');

        // Get payment method in Arabic
        const paymentMethods = {
            'cash': 'نقداً',
            'bank_transfer': 'تحويل بنكي',
            'check': 'شيك',
            'credit_card': 'بطاقة ائتمان'
        };
        const paymentMethodArabic = paymentMethods[entry.paymentMethod] || entry.paymentMethod || 'غير محدد';

        return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>إيصال مصروف - ${entry.registrationNumber}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: #333;
                    direction: rtl;
                    line-height: 1.6;
                }
                .receipt-container {
                    max-width: 800px;
                    margin: 0 auto;
                    border: 2px solid #333;
                    padding: 30px;
                    background: white;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px double #333;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .company-name {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                .receipt-title {
                    font-size: 24px;
                    color: #e74c3c;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .receipt-number {
                    font-size: 18px;
                    color: #7f8c8d;
                }
                .receipt-body {
                    margin: 30px 0;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 5px;
                }
                .info-label {
                    font-weight: bold;
                    color: #2c3e50;
                    min-width: 150px;
                }
                .info-value {
                    color: #34495e;
                    flex: 1;
                    text-align: left;
                }
                .amount-section {
                    background: #ffe8e8;
                    border: 2px solid #e74c3c;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 30px 0;
                    text-align: center;
                }
                .amount-label {
                    font-size: 18px;
                    color: #e74c3c;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .amount-value {
                    font-size: 32px;
                    color: #e74c3c;
                    font-weight: bold;
                }
                .amount-words {
                    font-size: 16px;
                    color: #2c3e50;
                    margin-top: 10px;
                    font-style: italic;
                }
                .description-section {
                    background: #f0f8ff;
                    border: 1px solid #3498db;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                }
                .description-title {
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                .footer {
                    border-top: 2px solid #333;
                    padding-top: 20px;
                    margin-top: 40px;
                }
                .signatures {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 50px;
                }
                .signature-box {
                    text-align: center;
                    width: 200px;
                }
                .signature-line {
                    border-bottom: 2px solid #333;
                    height: 50px;
                    margin-bottom: 10px;
                }
                .signature-label {
                    font-weight: bold;
                    color: #2c3e50;
                }
                .print-info {
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 12px;
                    margin-top: 30px;
                    border-top: 1px solid #ddd;
                    padding-top: 15px;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 10px;
                    }
                    .receipt-container {
                        border: 2px solid #000;
                        box-shadow: none;
                    }
                    .print-info {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <!-- Header -->
                <div class="header">
                    <div class="receipt-number">رقم الإيصال: ${entry.registrationNumber}</div>
                </div>

                <!-- Receipt Body -->
                <div class="receipt-body">
                    <div class="info-row">
                        <span class="info-label">فئة المصروف:</span>
                        <span class="info-value">${entry.category}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">تاريخ المصروف:</span>
                        <span class="info-value">${this.formatDate(entry.date)}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">المورد/الجهة:</span>
                        <span class="info-value">${entry.vendor || 'غير محدد'}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">رقم الإيصال:</span>
                        <span class="info-value">${entry.receiptNumber || 'غير محدد'}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">طريقة الدفع:</span>
                        <span class="info-value">${paymentMethodArabic}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">نوع العملة:</span>
                        <span class="info-value">${entry.currency === 'USD' ? 'دولار أمريكي (USD)' : 'دينار عراقي (IQD)'}</span>
                    </div>

                    <!-- Amount Section -->
                    <div class="amount-section">
                        <div class="amount-label">المبلغ المدفوع</div>
                        <div class="amount-value">${this.formatCurrency(entry.amount, entry.currency)}</div>
                        <div class="amount-words">${this.numberToWords(entry.amount, entry.currency)}</div>
                    </div>

                    <!-- Description Section -->
                    <div class="description-section">
                        <div class="description-title">وصف المصروف:</div>
                        <div>${entry.description}</div>
                    </div>

                    ${entry.notes ? `
                    <div class="info-row">
                        <span class="info-label">ملاحظات إضافية:</span>
                        <span class="info-value">${entry.notes}</span>
                    </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div class="footer">
                    <div class="info-row">
                        <span class="info-label">تاريخ الطباعة:</span>
                        <span class="info-value">${currentDate} - ${currentTime}</span>
                    </div>

                    <div class="signatures">
                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <div class="signature-label">توقيع المحاسب</div>
                        </div>

                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <div class="signature-label">توقيع المدير المالي</div>
                        </div>

                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <div class="signature-label">توقيع المدير العام</div>
                        </div>
                    </div>
                </div>

                <div class="print-info">
                    تم إنشاء هذا الإيصال بواسطة نظام المحاسبة الإلكتروني<br>
                    للاستفسارات يرجى الاتصال بقسم المحاسبة
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Convert number to words (simplified Arabic)
    numberToWords(amount, currency) {
        const num = parseFloat(amount);
        if (isNaN(num)) return '';

        const currencyName = currency === 'USD' ? 'دولار أمريكي' : 'دينار عراقي';

        if (num < 1000) {
            return `${num} ${currencyName}`;
        } else if (num < 1000000) {
            const thousands = Math.floor(num / 1000);
            const remainder = num % 1000;
            return `${thousands} ألف${remainder > 0 ? ' و ' + remainder : ''} ${currencyName}`;
        } else {
            const millions = Math.floor(num / 1000000);
            const remainder = num % 1000000;
            return `${millions} مليون${remainder > 0 ? ' و ' + Math.floor(remainder / 1000) + ' ألف' : ''} ${currencyName}`;
        }
    }

    // Refresh current view
    refreshCurrentView() {
        this.showView(this.currentView);
    }

    // Initialize default accounting guide
    initializeDefaultAccountingGuide() {
        console.log('Initializing default accounting guide...');

        const existingGuide = StorageManager.getData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE);
        console.log('Existing guide:', existingGuide);

        if (!existingGuide || existingGuide.length === 0) {
            console.log('Creating default accounting guide...');
            const defaultGuide = this.getDefaultAccountingGuide();
            const saved = StorageManager.saveData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE, defaultGuide);
            console.log('Default guide saved:', saved);

            if (saved) {
                console.log('Default accounting guide initialized successfully');
            } else {
                console.error('Failed to save default accounting guide');
            }
        } else {
            console.log('Accounting guide already exists with', existingGuide.length, 'items');
        }
    }

    // Get default accounting guide
    getDefaultAccountingGuide() {
        return [
            // مواد البناء
            { id: 'guide001', code: '5101', name: 'الأسمنت', category: 'مواد البناء', type: 'مصروف مباشر', description: 'أسمنت بورتلاندي عادي وخاص', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide002', code: '5102', name: 'الحديد والصلب', category: 'مواد البناء', type: 'مصروف مباشر', description: 'حديد التسليح وقضبان الصلب', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide003', code: '5103', name: 'الرمل والحصى', category: 'مواد البناء', type: 'مصروف مباشر', description: 'رمل البناء والحصى المختلف', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide004', code: '5104', name: 'الطوب والبلوك', category: 'مواد البناء', type: 'مصروف مباشر', description: 'طوب أحمر وبلوك خرساني', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide005', code: '5105', name: 'البلاط والسيراميك', category: 'مواد البناء', type: 'مصروف مباشر', description: 'بلاط أرضيات وسيراميك جدران', notes: '', createdAt: new Date().toISOString() },

            // العمالة
            { id: 'guide006', code: '5201', name: 'أجور العمال المهرة', category: 'العمالة', type: 'مصروف مباشر', description: 'أجور البنائين والحرفيين المهرة', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide007', code: '5202', name: 'أجور العمال العاديين', category: 'العمالة', type: 'مصروف مباشر', description: 'أجور العمال غير المهرة', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide008', code: '5203', name: 'أجور المقاولين الفرعيين', category: 'العمالة', type: 'مصروف مباشر', description: 'مدفوعات للمقاولين الفرعيين', notes: '', createdAt: new Date().toISOString() },

            // المعدات والآلات
            { id: 'guide009', code: '5301', name: 'إيجار المعدات الثقيلة', category: 'المعدات والآلات', type: 'مصروف مباشر', description: 'إيجار الحفارات والرافعات', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide010', code: '5302', name: 'صيانة المعدات', category: 'المعدات والآلات', type: 'مصروف تشغيلي', description: 'صيانة وإصلاح المعدات', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide011', code: '5303', name: 'قطع غيار المعدات', category: 'المعدات والآلات', type: 'مصروف تشغيلي', description: 'قطع غيار للمعدات والآلات', notes: '', createdAt: new Date().toISOString() },

            // النقل والمواصلات
            { id: 'guide012', code: '5401', name: 'نقل المواد', category: 'النقل والمواصلات', type: 'مصروف مباشر', description: 'نقل مواد البناء للموقع', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide013', code: '5402', name: 'مصاريف الشاحنات', category: 'النقل والمواصلات', type: 'مصروف تشغيلي', description: 'وقود وصيانة الشاحنات', notes: '', createdAt: new Date().toISOString() },

            // الوقود والطاقة
            { id: 'guide014', code: '5501', name: 'وقود المعدات', category: 'الوقود والطاقة', type: 'مصروف تشغيلي', description: 'ديزل وبنزين للمعدات', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide015', code: '5502', name: 'الكهرباء', category: 'الوقود والطاقة', type: 'مصروف تشغيلي', description: 'فواتير الكهرباء للموقع', notes: '', createdAt: new Date().toISOString() },

            // الرواتب والأجور
            { id: 'guide016', code: '5601', name: 'رواتب الموظفين', category: 'الرواتب والأجور', type: 'مصروف إداري', description: 'رواتب الموظفين الإداريين', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide017', code: '5602', name: 'مكافآت ومزايا', category: 'الرواتب والأجور', type: 'مصروف إداري', description: 'مكافآت ومزايا الموظفين', notes: '', createdAt: new Date().toISOString() },

            // المكتب والإدارة
            { id: 'guide018', code: '5701', name: 'القرطاسية والمكتبيات', category: 'المكتب والإدارة', type: 'مصروف إداري', description: 'أوراق وأقلام ومستلزمات مكتبية', notes: '', createdAt: new Date().toISOString() },
            { id: 'guide019', code: '5702', name: 'الاتصالات', category: 'المكتب والإدارة', type: 'مصروف إداري', description: 'هاتف وإنترنت وفاكس', notes: '', createdAt: new Date().toISOString() },

            // التأمين
            { id: 'guide020', code: '5801', name: 'تأمين المشروع', category: 'التأمين', type: 'مصروف غير مباشر', description: 'تأمين ضد المخاطر والحوادث', notes: '', createdAt: new Date().toISOString() }
        ];
    }

    // Setup add guide form
    setupAddGuideForm() {
        const form = document.getElementById('addGuideForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGuideItem();
        });
    }

    // Save guide item
    saveGuideItem() {
        const guideData = {
            code: document.getElementById('guideCode').value.trim(),
            name: document.getElementById('guideName').value.trim(),
            category: document.getElementById('guideCategory').value,
            type: document.getElementById('guideType').value,
            description: document.getElementById('guideDescription').value.trim(),
            notes: document.getElementById('guideNotes').value.trim()
        };

        // Validate required fields
        if (!guideData.code || !guideData.name || !guideData.category || !guideData.type) {
            this.showNotification('جميع الحقول المطلوبة يجب ملؤها', 'error');
            return;
        }

        // Check if code already exists
        const existingGuide = StorageManager.getData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE) || [];
        if (existingGuide.some(item => item.code === guideData.code && item.id !== this.editingGuideId)) {
            this.showNotification('رمز الحساب موجود بالفعل', 'error');
            return;
        }

        if (this.editingGuideId) {
            // Update existing item
            const updatedGuide = existingGuide.map(item =>
                item.id === this.editingGuideId
                    ? { ...item, ...guideData, updatedAt: new Date().toISOString() }
                    : item
            );

            if (StorageManager.saveData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE, updatedGuide)) {
                this.showNotification('تم تحديث العنصر بنجاح', 'success');
                this.editingGuideId = null;
            } else {
                this.showNotification('حدث خطأ أثناء التحديث', 'error');
            }
        } else {
            // Add new item
            const newItem = {
                id: StorageManager.generateId(),
                ...guideData,
                createdAt: new Date().toISOString()
            };

            existingGuide.push(newItem);

            if (StorageManager.saveData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE, existingGuide)) {
                this.showNotification('تم إضافة العنصر بنجاح', 'success');
            } else {
                this.showNotification('حدث خطأ أثناء الإضافة', 'error');
            }
        }

        // Reset form and refresh view
        document.getElementById('addGuideForm').reset();
        this.showGuideSubView('overview');
    }

    // Edit guide item
    editGuideItem(id) {
        const accountingGuide = StorageManager.getData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE) || [];
        const item = accountingGuide.find(g => g.id === id);

        if (!item) {
            this.showNotification('العنصر غير موجود', 'error');
            return;
        }

        // Switch to add form for editing
        this.showGuideSubView('add');

        // Fill form with item data
        setTimeout(() => {
            document.getElementById('guideCode').value = item.code;
            document.getElementById('guideName').value = item.name;
            document.getElementById('guideCategory').value = item.category;
            document.getElementById('guideType').value = item.type;
            document.getElementById('guideDescription').value = item.description || '';
            document.getElementById('guideNotes').value = item.notes || '';

            this.editingGuideId = id;
            this.showNotification('جاري تعديل العنصر', 'info');
        }, 100);
    }

    // Delete guide item
    deleteGuideItem(id) {
        if (confirm('هل أنت متأكد من حذف هذا العنصر من الدليل المحاسبي؟')) {
            const accountingGuide = StorageManager.getData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE) || [];
            const updatedGuide = accountingGuide.filter(item => item.id !== id);

            if (StorageManager.saveData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE, updatedGuide)) {
                this.showNotification('تم حذف العنصر بنجاح', 'success');
                this.showGuideSubView('overview');
            } else {
                this.showNotification('حدث خطأ أثناء الحذف', 'error');
            }
        }
    }

    // Print accounting guide
    printAccountingGuide() {
        const accountingGuide = StorageManager.getData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE) || [];

        if (accountingGuide.length === 0) {
            this.showNotification('لا يوجد دليل محاسبي للطباعة', 'error');
            return;
        }

        const groupedGuide = this.groupAccountingGuideByCategory(accountingGuide);
        const printHTML = this.generateAccountingGuidePrintHTML(groupedGuide);

        // Create print window
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        printWindow.document.write(printHTML);
        printWindow.document.close();

        // Wait for content to load then print (small delay to let browser compute page counters)
        printWindow.onload = function() {
            setTimeout(() => {
                try { printWindow.print(); } catch (e) { console.error('Print failed', e); }
            }, 300);
        };
    }

    // Generate accounting guide print HTML
    generateAccountingGuidePrintHTML(groupedGuide) {
        const currentDate = new Date().toLocaleDateString('ar-IQ');
        const currentTime = new Date().toLocaleTimeString('ar-IQ');
    const header = (typeof buildBrandedHeaderHTML === 'function') ? buildBrandedHeaderHTML('الدليل المحاسبي للمصروفات') : '';

        let contentHTML = '';
        Object.keys(groupedGuide).forEach(category => {
            contentHTML += `
                <div class="category-section">
                    <h3 class="category-title">${category}</h3>
                    <table class="guide-table">
                        <thead>
                            <tr>
                                <th>رمز الحساب</th>
                                <th>اسم الحساب</th>
                                <th>نوع الحساب</th>
                                <th>الوصف</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${groupedGuide[category].map(item => `
                                <tr>
                                    <td><strong>${item.code}</strong></td>
                                    <td>${item.name}</td>
                                    <td>${item.type}</td>
                                    <td>${item.description || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>الدليل المحاسبي للمصروفات</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: #333;
                    direction: rtl;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px double #333;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .company-name {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                .guide-title {
                    font-size: 24px;
                    color: #e74c3c;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .print-date {
                    font-size: 14px;
                    color: #7f8c8d;
                }
                .category-section {
                    margin-bottom: 40px;
                    page-break-inside: avoid;
                }
                .category-title {
                    background: #34495e;
                    color: white;
                    padding: 15px;
                    margin-bottom: 20px;
                    border-radius: 5px;
                    font-size: 20px;
                    text-align: center;
                }
                .guide-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .guide-table th,
                .guide-table td {
                    border: 1px solid #333;
                    padding: 12px 8px;
                    text-align: center;
                }
                .guide-table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    font-size: 14px;
                }
                .guide-table td {
                    font-size: 13px;
                }
                .guide-table td:nth-child(4) {
                    text-align: right;
                    max-width: 300px;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 10px;
                    }
                    .category-section {
                        page-break-inside: avoid;
                    }
                    .guide-table {
                        page-break-inside: auto;
                    }
                    .guide-table tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                }
            </style>
        </head>
        <body>
            ${header}

            <div class="print-body">${contentHTML}</div>

            ${buildPrintFooterHTML ? buildPrintFooterHTML() : ''}
        </body>
        </html>
        `;
    }

    // Create default guide manually
    createDefaultGuide() {
        console.log('Creating default guide manually...');

        const defaultGuide = this.getDefaultAccountingGuide();
        const saved = StorageManager.saveData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE, defaultGuide);

        if (saved) {
            console.log('Default guide created successfully');
            this.showNotification('تم إنشاء الدليل المحاسبي الافتراضي بنجاح', 'success');
            // Refresh the view
            this.showGuideSubView('overview');
        } else {
            console.error('Failed to create default guide');
            this.showNotification('فشل في إنشاء الدليل المحاسبي', 'error');
        }
    }

    // Get accounting guide options for dropdown
    getAccountingGuideOptions() {
        const guide = StorageManager.getData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE) || [];

        if (guide.length === 0) {
            return '<option value="">لا يوجد دليل محاسبي - قم بإنشائه أولاً</option>';
        }

        // Group by category
        const grouped = {};
        guide.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category].push(item);
        });

        let options = '';
        Object.keys(grouped).forEach(category => {
            options += `<optgroup label="${category}">`;
            grouped[category].forEach(item => {
                options += `<option value="${item.id}" data-code="${item.code}" data-name="${item.name}">${item.code} - ${item.name}</option>`;
            });
            options += '</optgroup>';
        });

        return options;
    }

    // Convert currency functions
    convertCurrency(direction) {
        const amountIQD = parseFloat(document.getElementById('expenseAmountIQD')?.value) || 0;
        const amountUSD = parseFloat(document.getElementById('expenseAmountUSD')?.value) || 0;
        const exchangeRate = parseFloat(document.getElementById('expenseExchangeRate')?.value) || 1500;

        if (direction === 'IQD_to_USD' && amountIQD > 0) {
            // Convert IQD to USD
            const usdAmount = amountIQD / exchangeRate;
            document.getElementById('expenseAmountUSD').value = usdAmount.toFixed(2);
            this.showNotification(`تم تحويل ${amountIQD.toLocaleString()} د.ع إلى $${usdAmount.toFixed(2)}`, 'success');
        } else if (direction === 'USD_to_IQD' && amountUSD > 0) {
            // Convert USD to IQD
            const iqdAmount = amountUSD * exchangeRate;
            document.getElementById('expenseAmountIQD').value = Math.round(iqdAmount);
            this.showNotification(`تم تحويل $${amountUSD} إلى ${Math.round(iqdAmount).toLocaleString()} د.ع`, 'success');
        } else {
            const currency = direction === 'IQD_to_USD' ? 'الدينار العراقي' : 'الدولار الأمريكي';
            this.showNotification(`يرجى إدخال مبلغ صحيح بعملة ${currency} أولاً`, 'warning');
        }
    }

    // Clear currency amounts
    clearAmounts() {
        document.getElementById('expenseAmountIQD').value = '';
        document.getElementById('expenseAmountUSD').value = '';
        this.showNotification('تم مسح المبالغ', 'info');
    }

    // Legacy function for backward compatibility
    calculateCurrency(changedCurrency = null) {
        // This function is kept for backward compatibility but is no longer used
        // Currency conversion is now handled by convertCurrency function
        return;
    }

    // Helper function to determine primary currency
    determinePrimaryCurrency(amountIQD, amountUSD, exchangeRate) {
        if (amountIQD > 0 && amountUSD === 0) return 'IQD';
        if (amountUSD > 0 && amountIQD === 0) return 'USD';
        if (amountIQD > 0 && amountUSD > 0) {
            // Both currencies present, determine which is larger in USD equivalent
            const iqdInUSD = amountIQD / exchangeRate;
            return amountUSD >= iqdInUSD ? 'USD' : 'IQD';
        }
        return 'USD'; // Default
    }

    // Helper function to calculate primary amount
    calculatePrimaryAmount(amountIQD, amountUSD, exchangeRate) {
        const primaryCurrency = this.determinePrimaryCurrency(amountIQD, amountUSD, exchangeRate);
        return primaryCurrency === 'USD' ? amountUSD : amountIQD;
    }

    // Helper function to get transaction type description
    getTransactionTypeDescription(amountIQD, amountUSD) {
        if (amountIQD > 0 && amountUSD === 0) {
            return '<span class="badge bg-primary">مصروف بالدينار العراقي فقط</span>';
        } else if (amountUSD > 0 && amountIQD === 0) {
            return '<span class="badge bg-success">مصروف بالدولار الأمريكي فقط</span>';
        } else if (amountIQD > 0 && amountUSD > 0) {
            return '<span class="badge bg-warning text-dark">مصروف مختلط (دينار ودولار)</span>';
        } else {
            return '<span class="badge bg-secondary">غير محدد</span>';
        }
    }

    // Preview expense before saving
    previewExpense() {
        const formData = this.getExpenseFormData();
        if (!formData) return;

        const previewDiv = document.getElementById('expensePreview');
        if (!previewDiv) {
            // Create preview div if it doesn't exist
            const previewHTML = `
                <div id="expensePreview" class="neumorphic-card mt-4">
                    <div class="card-header">
                        <h5><i class="bi bi-eye me-2"></i>معاينة المصروف</h5>
                    </div>
                    <div class="card-body" id="expensePreviewContent">
                        <!-- Preview content will be loaded here -->
                    </div>
                </div>
            `;
            document.querySelector('.neumorphic-card').insertAdjacentHTML('afterend', previewHTML);
        }

        const previewContent = `
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-borderless">
                        <tr><td><strong>رقم القيد:</strong></td><td>${formData.registrationNumber}</td></tr>
                        <tr><td><strong>التاريخ:</strong></td><td>${this.formatDate(formData.date)}</td></tr>
                        <tr><td><strong>البيان:</strong></td><td>${formData.description}</td></tr>
                        <tr><td><strong>المستفيد:</strong></td><td>${formData.beneficiary || 'غير محدد'}</td></tr>
                        <tr><td><strong>المورد:</strong></td><td>${formData.vendor || 'غير محدد'}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-borderless">
                        <tr><td><strong>المبلغ بالدينار:</strong></td><td>${formData.amountIQD > 0 ? this.formatCurrency(formData.amountIQD, 'IQD') : '<span class="text-muted">غير محدد</span>'}</td></tr>
                        <tr><td><strong>المبلغ بالدولار:</strong></td><td>${formData.amountUSD > 0 ? this.formatCurrency(formData.amountUSD, 'USD') : '<span class="text-muted">غير محدد</span>'}</td></tr>
                        <tr><td><strong>سعر الصرف:</strong></td><td>${formData.exchangeRate} د.ع لكل دولار</td></tr>
                        <tr><td><strong>رقم الوصل:</strong></td><td>${formData.receiptNumber || 'غير محدد'}</td></tr>
                        <tr><td><strong>طريقة الدفع:</strong></td><td>${this.getPaymentMethodText(formData.paymentMethod)}</td></tr>
                    </table>
                </div>
            </div>
            ${formData.notes ? `<div class="mt-3"><strong>الملاحظات:</strong><br>${formData.notes}</div>` : ''}
            <div class="mt-3 p-3 bg-light rounded">
                <strong>نوع المعاملة:</strong> 
                ${this.getTransactionTypeDescription(formData.amountIQD, formData.amountUSD)}
            </div>
        `;

        document.getElementById('expensePreviewContent').innerHTML = previewContent;
        document.getElementById('expensePreview').style.display = 'block';

        // Scroll to preview
        document.getElementById('expensePreview').scrollIntoView({ behavior: 'smooth' });
    }

    // Get expense form data
    getExpenseFormData() {
        const registrationNumber = document.getElementById('expenseRegistrationNumber')?.value;
        const date = document.getElementById('expenseDate')?.value;
        const amountIQD = parseFloat(document.getElementById('expenseAmountIQD')?.value) || 0;
        const amountUSD = parseFloat(document.getElementById('expenseAmountUSD')?.value) || 0;
        const exchangeRate = parseFloat(document.getElementById('expenseExchangeRate')?.value) || 1500;
        const description = document.getElementById('expenseDescription')?.value;
        const accountingGuide = document.getElementById('expenseAccountingGuide')?.value;
        const beneficiary = document.getElementById('expenseBeneficiary')?.value;
        const receiptNumber = document.getElementById('expenseReceiptNumber')?.value;
        const receiptDate = document.getElementById('expenseReceiptDate')?.value;
        const vendor = document.getElementById('expenseVendor')?.value;
        const paymentMethod = document.getElementById('expensePaymentMethod')?.value;
        const category = document.getElementById('expenseCategory')?.value;
        const project = document.getElementById('expenseProject')?.value;
        const notes = document.getElementById('expenseNotes')?.value;

        // Validation
        if (!registrationNumber || !date || !description || !accountingGuide || !category) {
            this.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return null;
        }

        if (amountIQD === 0 && amountUSD === 0) {
            this.showNotification('يرجى إدخال مبلغ المصروف (بالدينار أو الدولار أو كليهما)', 'error');
            return null;
        }

        // Allow expenses with only one currency
        if (amountIQD > 0 && amountUSD === 0) {
            console.log('Expense with IQD amount only');
        } else if (amountUSD > 0 && amountIQD === 0) {
            console.log('Expense with USD amount only');
        } else if (amountIQD > 0 && amountUSD > 0) {
            console.log('Expense with both currencies');
        }

        return {
            registrationNumber,
            date,
            amountIQD,
            amountUSD,
            exchangeRate,
            description,
            accountingGuide,
            beneficiary,
            receiptNumber,
            receiptDate,
            vendor,
            paymentMethod,
            category,
            project,
            notes
        };
    }

    // Get payment method text
    getPaymentMethodText(method) {
        const methods = {
            'cash': 'نقداً',
            'bank_transfer': 'تحويل بنكي',
            'check': 'شيك',
            'credit_card': 'بطاقة ائتمان',
            'electronic_payment': 'دفع إلكتروني'
        };
        return methods[method] || 'غير محدد';
    }

    // Show notification
    showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Calculate detailed category statistics
    calculateDetailedCategoryStats(expenses) {
        const stats = {};
        
        expenses.forEach(expense => {
            const category = expense.category || 'غير مصنف';
            
            if (!stats[category]) {
                stats[category] = {
                    name: category,
                    count: 0,
                    totalUSD: 0,
                    totalIQD: 0,
                    expenses: [],
                    lastTransaction: null,
                    averageUSD: 0,
                    averageIQD: 0
                };
            }
            
            stats[category].count++;
            stats[category].totalUSD += expense.amountUSD || 0;
            stats[category].totalIQD += expense.amountIQD || 0;
            stats[category].expenses.push(expense);
            
            // Track latest transaction date
            const expenseDate = new Date(expense.date);
            if (!stats[category].lastTransaction || expenseDate > new Date(stats[category].lastTransaction)) {
                stats[category].lastTransaction = expense.date;
            }
        });
        
        // Calculate averages
        Object.keys(stats).forEach(category => {
            const stat = stats[category];
            stat.averageUSD = stat.count > 0 ? stat.totalUSD / stat.count : 0;
            stat.averageIQD = stat.count > 0 ? stat.totalIQD / stat.count : 0;
        });
        
        return stats;
    }

    // Get total amount for specific currency
    getTotalAmount(expenses, currency) {
        return expenses.reduce((total, expense) => {
            if (currency === 'USD') {
                return total + (expense.amountUSD || 0);
            } else if (currency === 'IQD') {
                return total + (expense.amountIQD || 0);
            }
            return total;
        }, 0);
    }

    // Render categories as cards
    renderCategoriesCards(categoryStats) {
        if (Object.keys(categoryStats).length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <h4 class="text-muted mt-3">لا توجد فئات مصروفات</h4>
                    <p class="text-muted">ابدأ بإضافة مصروفات لرؤية الفئات هنا</p>
                </div>
            `;
        }

        let cardsHTML = '<div class="row" id="categoriesCardsContainer">';
        
        Object.values(categoryStats).forEach(stat => {
            const totalValue = stat.totalUSD + stat.totalIQD / 1500;
            const overallTotal = Object.values(categoryStats).reduce((sum, s) => sum + s.totalUSD + s.totalIQD / 1500, 0);
            const percentage = overallTotal > 0 ? (totalValue / overallTotal * 100).toFixed(1) : 0;

            cardsHTML += `
                <div class="col-lg-4 col-md-6 mb-4 category-card" data-category="${stat.name}">
                    <div class="card h-100 shadow-sm category-card-clickable" onclick="expensesManager.showCategoryDetails('${stat.name}')" style="cursor: pointer; transition: transform 0.2s;">
                        <div class="card-header bg-primary text-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <h6 class="mb-0"><i class="bi bi-tag me-2"></i>${stat.name}</h6>
                                <span class="badge bg-light text-primary">${stat.count} قيد</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6 border-end">
                                    <h5 class="text-success mb-1">${this.formatCurrency(stat.totalUSD, 'USD')}</h5>
                                    <small class="text-muted">المجموع بالدولار</small>
                                </div>
                                <div class="col-6">
                                    <h5 class="text-info mb-1">${this.formatCurrency(stat.totalIQD, 'IQD')}</h5>
                                    <small class="text-muted">المجموع بالدينار</small>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <div class="row text-center">
                                <div class="col-6">
                                    <strong>${this.formatCurrency(stat.averageUSD, 'USD')}</strong>
                                    <br><small class="text-muted">متوسط الدولار</small>
                                </div>
                                <div class="col-6">
                                    <strong>${this.formatCurrency(stat.averageIQD, 'IQD')}</strong>
                                    <br><small class="text-muted">متوسط الدينار</small>
                                </div>
                            </div>
                            
                            <div class="mt-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <small class="text-muted">نسبة من الإجمالي</small>
                                    <strong>${percentage}%</strong>
                                </div>
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar bg-gradient-primary" style="width: ${percentage}%"></div>
                                </div>
                            </div>
                            
                            ${stat.lastTransaction ? `
                                <div class="mt-3 pt-2 border-top">
                                    <small class="text-muted">
                                        <i class="bi bi-clock me-1"></i>آخر معاملة: ${this.formatDate(stat.lastTransaction)}
                                    </small>
                                </div>
                            ` : ''}
                        </div>
                        <div class="card-footer bg-light">
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">انقر لعرض التفاصيل</small>
                                <i class="bi bi-arrow-left text-muted"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        cardsHTML += '</div>';
        return cardsHTML;
    }

    // Show detailed category information
    showCategoryDetails(categoryName) {
        const data = StorageManager.getAllData();
        const expenses = data.expenses || [];
        const categoryExpenses = expenses.filter(exp => (exp.category || 'غير مصنف') === categoryName);
        
        if (categoryExpenses.length === 0) {
            this.showNotification('لا توجد مصروفات في هذه الفئة', 'info');
            return;
        }

        // Sort expenses by date (newest first)
        categoryExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate category statistics
        const totalUSD = categoryExpenses.reduce((sum, exp) => sum + (exp.amountUSD || 0), 0);
        const totalIQD = categoryExpenses.reduce((sum, exp) => sum + (exp.amountIQD || 0), 0);
        const averageUSD = totalUSD / categoryExpenses.length;
        const averageIQD = totalIQD / categoryExpenses.length;

        const detailsHTML = `
            <div class="category-details">
                <!-- Category Summary -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="text-center p-3 bg-primary text-white rounded">
                            <h4>${categoryExpenses.length}</h4>
                            <small>عدد القيود</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-3 bg-success text-white rounded">
                            <h4>${this.formatCurrency(totalUSD, 'USD')}</h4>
                            <small>إجمالي الدولار</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-3 bg-info text-white rounded">
                            <h4>${this.formatCurrency(totalIQD, 'IQD')}</h4>
                            <small>إجمالي الدينار</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-3 bg-warning text-dark rounded">
                            <h4>${this.formatCurrency(averageUSD, 'USD')}</h4>
                            <small>متوسط الدولار</small>
                        </div>
                    </div>
                </div>

                <!-- Detailed Transactions Table -->
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>رقم القيد</th>
                                <th>التاريخ</th>
                                <th>البيان</th>
                                <th>المبلغ (دولار)</th>
                                <th>المبلغ (دينار)</th>
                                <th>المستفيد</th>
                                <th>المشروع</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${categoryExpenses.map(expense => `
                                <tr>
                                    <td><strong>${expense.registrationNumber || 'غير محدد'}</strong></td>
                                    <td>${this.formatDate(expense.date)}</td>
                                    <td>${expense.description || 'بدون وصف'}</td>
                                    <td>${expense.amountUSD > 0 ? this.formatCurrency(expense.amountUSD, 'USD') : '<span class="text-muted">-</span>'}</td>
                                    <td>${expense.amountIQD > 0 ? this.formatCurrency(expense.amountIQD, 'IQD') : '<span class="text-muted">-</span>'}</td>
                                    <td>${expense.beneficiary || '<span class="text-muted">غير محدد</span>'}</td>
                                    <td>${expense.project || '<span class="text-muted">غير محدد</span>'}</td>
                                    <td>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-info" title="عرض تفاصيل أكثر">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                            <button class="btn btn-outline-success" title="طباعة هذا القيد" onclick="expensesManager.printExpenseById('${expense.id || ''}', '${expense.registrationNumber || ''}')">
                                                <i class="bi bi-printer"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Export Options -->
                <div class="mt-4 text-center">
                    <button class="btn btn-success neumorphic-btn" onclick="expensesManager.exportCategoryDetails('${categoryName}')">
                        <i class="bi bi-file-excel me-2"></i>تصدير تفاصيل الفئة
                    </button>
                    <button class="btn btn-info neumorphic-btn ms-2" onclick="expensesManager.printCategoryDetails('${categoryName}')">
                        <i class="bi bi-printer me-2"></i>طباعة تفاصيل الفئة
                    </button>
                </div>
            </div>
        `;

        document.getElementById('categoryDetailsTitle').innerHTML = `<i class="bi bi-tag me-2"></i>تفاصيل فئة: ${categoryName}`;
        document.getElementById('categoryDetailsContent').innerHTML = detailsHTML;
        document.getElementById('categoryDetailsModal').style.display = 'block';
        
        // Scroll to the details modal
        document.getElementById('categoryDetailsModal').scrollIntoView({ behavior: 'smooth' });
    }

    // Hide category details
    hideCategoryDetails() {
        document.getElementById('categoryDetailsModal').style.display = 'none';
    }

    // Filter categories
    filterCategories() {
        const searchTerm = document.getElementById('categoriesSearchInput').value.toLowerCase();
        const categoryCards = document.querySelectorAll('.category-card');
        
        categoryCards.forEach(card => {
            const categoryName = card.getAttribute('data-category').toLowerCase();
            if (categoryName.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Sort categories
    sortCategories() {
        const sortBy = document.getElementById('categoriesSortBy').value;
        const data = StorageManager.getAllData();
        const expenses = data.expenses || [];
        const categoryStats = this.calculateDetailedCategoryStats(expenses);
        
        // Sort the statistics
        const sortedStats = Object.values(categoryStats).sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name, 'ar');
                case 'count':
                    return b.count - a.count;
                case 'amountUSD':
                    return b.totalUSD - a.totalUSD;
                case 'amountIQD':
                    return b.totalIQD - a.totalIQD;
                default:
                    return 0;
            }
        });

        // Convert back to object
        const sortedStatsObj = {};
        sortedStats.forEach(stat => {
            sortedStatsObj[stat.name] = stat;
        });

        // Re-render the display area
        document.getElementById('categoriesDisplayArea').innerHTML = this.renderCategoriesCards(sortedStatsObj);
    }

    // Change view mode
    changeCategoriesViewMode() {
        const viewMode = document.getElementById('categoriesViewMode').value;
        const data = StorageManager.getAllData();
        const expenses = data.expenses || [];
        const categoryStats = this.calculateDetailedCategoryStats(expenses);
        
        let content = '';
        switch (viewMode) {
            case 'cards':
                content = this.renderCategoriesCards(categoryStats);
                break;
            case 'table':
                content = this.renderCategoriesTable(categoryStats);
                break;
            case 'chart':
                content = this.renderCategoriesChart(categoryStats);
                break;
        }
        
        document.getElementById('categoriesDisplayArea').innerHTML = content;
    }

    // Render as table
    renderCategoriesTable(categoryStats) {
        if (Object.keys(categoryStats).length === 0) {
            return `<div class="text-center py-5"><i class="bi bi-inbox display-1 text-muted"></i><h4 class="text-muted mt-3">لا توجد فئات مصروفات</h4></div>`;
        }

        let tableHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr><th>الفئة</th><th>عدد القيود</th><th>إجمالي الدولار</th><th>إجمالي الدينار</th><th>متوسط الدولار</th><th>متوسط الدينار</th><th>آخر معاملة</th><th>الإجراءات</th></tr>
                    </thead><tbody>`;

        Object.values(categoryStats).forEach(stat => {
            tableHTML += `
                <tr onclick="expensesManager.showCategoryDetails('${stat.name}')" style="cursor: pointer;">
                    <td><strong><i class="bi bi-tag me-2"></i>${stat.name}</strong></td>
                    <td><span class="badge bg-primary">${stat.count}</span></td>
                    <td class="text-success">${this.formatCurrency(stat.totalUSD, 'USD')}</td>
                    <td class="text-info">${this.formatCurrency(stat.totalIQD, 'IQD')}</td>
                    <td>${this.formatCurrency(stat.averageUSD, 'USD')}</td>
                    <td>${this.formatCurrency(stat.averageIQD, 'IQD')}</td>
                    <td>${stat.lastTransaction ? this.formatDate(stat.lastTransaction) : '<span class="text-muted">-</span>'}</td>
                    <td><button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); expensesManager.showCategoryDetails('${stat.name}')"><i class="bi bi-eye"></i></button></td>
                </tr>`;
        });

        return tableHTML + '</tbody></table></div>';
    }

    // Render as chart
    renderCategoriesChart(categoryStats) {
        if (Object.keys(categoryStats).length === 0) {
            return `<div class="text-center py-5"><i class="bi bi-inbox display-1 text-muted"></i><h4 class="text-muted mt-3">لا توجد فئات مصروفات</h4></div>`;
        }

        const totalUSD = Object.values(categoryStats).reduce((sum, stat) => sum + stat.totalUSD, 0);
        const totalIQD = Object.values(categoryStats).reduce((sum, stat) => sum + stat.totalIQD, 0);

        let chartHTML = `<div class="categories-chart"><h5 class="text-center mb-4">توزيع المصروفات حسب الفئة</h5><div class="row"><div class="col-md-6"><h6 class="text-center text-success"><i class="bi bi-currency-dollar me-1"></i>توزيع بالدولار الأمريكي</h6>`;

        Object.values(categoryStats).forEach(stat => {
            const percentageUSD = totalUSD > 0 ? (stat.totalUSD / totalUSD * 100) : 0;
            chartHTML += `
                <div class="mb-3" onclick="expensesManager.showCategoryDetails('${stat.name}')" style="cursor: pointer;">
                    <div class="d-flex justify-content-between mb-1"><span><i class="bi bi-tag me-1"></i>${stat.name}</span><strong>${percentageUSD.toFixed(1)}%</strong></div>
                    <div class="progress" style="height: 20px;"><div class="progress-bar bg-success" style="width: ${percentageUSD}%"></div></div>
                    <small class="text-muted">${this.formatCurrency(stat.totalUSD, 'USD')}</small>
                </div>`;
        });

        chartHTML += `</div><div class="col-md-6"><h6 class="text-center text-info"><i class="bi bi-cash me-1"></i>توزيع بالدينار العراقي</h6>`;

        Object.values(categoryStats).forEach(stat => {
            const percentageIQD = totalIQD > 0 ? (stat.totalIQD / totalIQD * 100) : 0;
            chartHTML += `
                <div class="mb-3" onclick="expensesManager.showCategoryDetails('${stat.name}')" style="cursor: pointer;">
                    <div class="d-flex justify-content-between mb-1"><span><i class="bi bi-tag me-1"></i>${stat.name}</span><strong>${percentageIQD.toFixed(1)}%</strong></div>
                    <div class="progress" style="height: 20px;"><div class="progress-bar bg-info" style="width: ${percentageIQD}%"></div></div>
                    <small class="text-muted">${this.formatCurrency(stat.totalIQD, 'IQD')}</small>
                </div>`;
        });

        return chartHTML + '</div></div></div>';
    }

    // Export and print methods
    exportCategoriesReport() {
        this.showNotification('ميزة التصدير ستتوفر قريباً', 'info');
    }

    printCategoriesReport() {
        try {
            // Build minimal print page with only the categories display area
            const contentEl = document.getElementById('categoriesDisplayArea');
            if (!contentEl) {
                this.showNotification('لا يوجد محتوى للطباعة', 'error');
                return;
            }

            const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
                .map(node => node.outerHTML)
                .join('\n');

            const headerHTML = (typeof buildBrandedHeaderHTML === 'function') ? buildBrandedHeaderHTML('تقرير فئات المصروفات') : `
                <div style="text-align:center;font-weight:700;">تقرير فئات المصروفات</div>
            `;

            const printHTML = `<!doctype html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <title>تقرير فئات المصروفات - طباعة</title>
                ${styles}
                <style>
                    body { background: #fff; color: #000; direction: rtl; font-family: 'Cairo', sans-serif; }
                    /* Remove any remaining interactive controls */
                    .neumorphic-btn, .header-actions, .input-group, .btn { display: none !important; }
                    .neumorphic-card { box-shadow: none !important; }
                </style>
            </head>
            <body>
                ${headerHTML}
                <div class="print-body">${contentEl.innerHTML}</div>
                ${buildPrintFooterHTML ? buildPrintFooterHTML() : ''}
            </body>
            </html>`;

            const win = window.open('', '_blank', 'width=1200,height=800');
            win.document.open();
            win.document.write(printHTML);
            win.document.close();
            win.onload = () => {
                win.focus();
                win.print();
            };
        } catch (err) {
            console.error('Print error:', err);
            window.print();
        }
    }

    exportCategoryDetails(categoryName) {
        this.showNotification(`ميزة تصدير تفاصيل فئة "${categoryName}" ستتوفر قريباً`, 'info');
    }

    printCategoryDetails(categoryName) {
        const el = document.getElementById('categoryDetailsContent');
        if (!el) return this.showNotification('لا يوجد محتوى للطباعة', 'error');

        const headerHTML = (typeof buildBrandedHeaderHTML === 'function') ? buildBrandedHeaderHTML(`تفاصيل الفئة: ${categoryName}`) : `<h3>تفاصيل الفئة: ${categoryName}</h3>`;
        const printHTML = `
            <!doctype html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <title>تفاصيل الفئة - ${categoryName}</title>
                <link rel="stylesheet" href="css/style.css">
            </head>
            <body>
                ${headerHTML}
                <div class="print-body">${el.innerHTML}</div>
                ${buildPrintFooterHTML ? buildPrintFooterHTML() : ''}
            </body>
            </html>
        `;

        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(printHTML);
        win.document.close();
        win.onload = () => win.print();
    }

    // Fill test data function with multiple currency scenarios
    fillTestData() {
        // Keep current registration number and date
        const currentRegNumber = document.getElementById('expenseRegistrationNumber').value;
        const currentDate = document.getElementById('expenseDate').value;

        // Create test scenarios for different currency combinations
        const scenarios = [
            {
                name: 'مصروف بالدولار فقط',
                amountIQD: '',
                amountUSD: '100',
                description: 'شراء أدوات متخصصة (دولار فقط)'
            },
            {
                name: 'مصروف بالدينار فقط',
                amountIQD: '150000',
                amountUSD: '',
                description: 'رواتب عمال محليين (دينار فقط)'
            },
            {
                name: 'مصروف بالعملتين',
                amountIQD: '75000',
                amountUSD: '50',
                description: 'مصروف مختلط (دينار ودولار)'
            }
        ];

        // Pick random scenario
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        document.getElementById('expenseAmountIQD').value = scenario.amountIQD;
        document.getElementById('expenseAmountUSD').value = scenario.amountUSD;
        document.getElementById('expenseDescription').value = scenario.description;
        document.getElementById('expenseAccountingGuide').value = 'guide001';
        document.getElementById('expenseBeneficiary').value = 'شركة مواد البناء المحدودة';
        document.getElementById('expenseReceiptNumber').value = 'REC-2024-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        document.getElementById('expenseReceiptDate').value = currentDate;
        document.getElementById('expenseVendor').value = 'مؤسسة الإعمار للمواد';
        document.getElementById('expensePaymentMethod').value = 'cash';
        document.getElementById('expenseCategory').value = 'مواد البناء';
        document.getElementById('expenseProject').value = 'مشروع 1';
        document.getElementById('expenseNotes').value = `بيانات تجريبية - ${scenario.name}`;

        // Restore registration number and date
        document.getElementById('expenseRegistrationNumber').value = currentRegNumber;
        document.getElementById('expenseDate').value = currentDate;

        this.showNotification(`تم ملء النموذج ببيانات تجريبية: ${scenario.name}`, 'info');
    }



    // Print invoice function
    printInvoice() {
        const formData = this.getExpenseFormData();
        if (!formData) return;

    // Create new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const header = (typeof buildBrandedHeaderHTML === 'function') ? buildBrandedHeaderHTML('فاتورة مصروف') : '';

        // Get accounting guide details
        const accountingSelect = document.getElementById('expenseAccountingGuide');
        const selectedOption = accountingSelect.options[accountingSelect.selectedIndex];
        const accountingCode = selectedOption.getAttribute('data-code') || '';
        const accountingName = selectedOption.getAttribute('data-name') || selectedOption.text;

        const printContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>فاتورة مصروف - ${formData.registrationNumber}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 20px;
                    background: white;
                    color: #333;
                    line-height: 1.6;
                }
                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    border: 2px solid #2c5aa0;
                }
                .info-table th, .info-table td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: right;
                }
                .info-table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    color: #2c5aa0;
                    width: 25%;
                }
                .amount-cell {
                    font-weight: bold;
                    font-size: 16px;
                }
                .amount-iqd {
                    color: #d63384;
                }
                .amount-usd {
                    color: #198754;
                }
                .signatures {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 60px;
                }
                .signature-box {
                    text-align: center;
                    width: 30%;
                }
                .signature-line {
                    border-top: 2px solid #333;
                    padding-top: 10px;
                    margin-top: 40px;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${header}

            <table class="info-table">
                <tr>
                    <th>رقم القيد</th>
                    <td style="font-weight: bold; color: #2c5aa0; font-size: 16px;">${formData.registrationNumber}</td>
                    <th>التاريخ</th>
                    <td>${new Date(formData.date).toLocaleDateString('ar-EG')}</td>
                </tr>
                <tr>
                    <th>البيان</th>
                    <td colspan="3" style="font-weight: bold; font-size: 16px;">${formData.description}</td>
                </tr>
                <tr>
                    <th>المبلغ بالدينار</th>
                    <td class="amount-cell amount-iqd">${formData.amountIQD.toLocaleString()} د.ع</td>
                    <th>المبلغ بالدولار</th>
                    <td class="amount-cell amount-usd">$${formData.amountUSD.toFixed(2)}</td>
                </tr>
                <tr>
                    <th>سعر الصرف</th>
                    <td>${formData.exchangeRate}</td>
                    <th>طريقة الدفع</th>
                    <td>${this.getPaymentMethodText(formData.paymentMethod)}</td>
                </tr>
                <tr>
                    <th>الدليل المحاسبي</th>
                    <td colspan="3">${accountingCode} - ${accountingName}</td>
                </tr>
                <tr>
                    <th>المستفيد</th>
                    <td>${formData.beneficiary || 'غير محدد'}</td>
                    <th>المورد/الجهة</th>
                    <td>${formData.vendor || 'غير محدد'}</td>
                </tr>
                <tr>
                    <th>رقم الوصل</th>
                    <td>${formData.receiptNumber || 'غير محدد'}</td>
                    <th>تاريخ الوصل</th>
                    <td>${formData.receiptDate ? new Date(formData.receiptDate).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                </tr>
                <tr>
                    <th>فئة المصروف</th>
                    <td>${formData.category}</td>
                    <th>المشروع</th>
                    <td>${formData.project || 'غير محدد'}</td>
                </tr>
                ${formData.notes ? `
                <tr>
                    <th>الملاحظات</th>
                    <td colspan="3">${formData.notes}</td>
                </tr>
                ` : ''}
            </table>

            <div class="signatures">
                <div class="signature-box">
                    <div class="signature-line">المحاسب</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">المدير المالي</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">المدير العام</div>
                </div>
            </div>

            ${buildPrintFooterHTML ? buildPrintFooterHTML() : ''}

            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="background: #2c5aa0; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">طباعة</button>
                <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">إغلاق</button>
            </div>
        </body>
        </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
    }
}

// Initialize expenses manager
let expensesManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ExpensesManager...');
    expensesManager = new ExpensesManager();
    console.log('ExpensesManager initialized:', expensesManager);

    // Test function for debugging
    window.testAccountingGuide = function() {
        console.log('Testing accounting guide...');
        if (expensesManager) {
            expensesManager.loadAccountingGuideView();
        } else {
            console.error('ExpensesManager not initialized');
        }
    };

    // Debug function to check if everything is working
    window.debugExpenses = function() {
        console.log('=== Debug Expenses ===');
        console.log('ExpensesManager:', expensesManager);
        console.log('StorageManager:', typeof StorageManager);
        console.log('Storage Keys:', StorageManager.STORAGE_KEYS);

        // Try to get accounting guide data
        const guide = StorageManager.getData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE);
        console.log('Accounting Guide Data:', guide);

        // Try to initialize default guide
        if (expensesManager) {
            console.log('Calling initializeDefaultAccountingGuide...');
            expensesManager.initializeDefaultAccountingGuide();

            // Check again
            const guideAfter = StorageManager.getData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE);
            console.log('Accounting Guide After Init:', guideAfter);
        }
    };
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExpensesManager;
}
