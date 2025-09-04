// Capital Management System
class CapitalManager {
    constructor() {
        this.currentView = 'overview';
        this.editingId = null;
        this.init();
    }

    init() {
        this.loadCapitalSection();
    }

    // Load the capital section content
    loadCapitalSection() {
        const capitalSection = document.getElementById('capitalSection');
        if (!capitalSection) return;

        const capitalHTML = `
            <div class="capital-container">
                <!-- Capital Navigation -->
                <div class="capital-nav neumorphic-card mb-4">
                    <div class="row">
                        <div class="col-12">
                            <ul class="nav nav-pills justify-content-center">
                                <li class="nav-item">
                                    <a class="nav-link active" href="#" onclick="capitalManager.showView('overview')">
                                        <i class="bi bi-speedometer2 me-2"></i>نظرة عامة
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" onclick="capitalManager.showView('shareholders')">
                                        <i class="bi bi-people me-2"></i>إضافة المساهمين
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" onclick="capitalManager.showView('capital-entry')">
                                        <i class="bi bi-cash-stack me-2"></i>إدخال رأس المال
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" onclick="capitalManager.showView('edit-info')">
                                        <i class="bi bi-pencil-square me-2"></i>تعديل المعلومات
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" onclick="capitalManager.showView('search')">
                                        <i class="bi bi-search me-2"></i>البحث
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Capital Content Views -->
                <div id="capitalContent">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        `;

        capitalSection.innerHTML = capitalHTML;
        this.showView('overview');
    }

    // Show specific view
    showView(viewName) {
        this.currentView = viewName;
        
        // Update navigation
        const navLinks = document.querySelectorAll('.capital-nav .nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        const activeLink = document.querySelector(`[onclick="capitalManager.showView('${viewName}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Load view content
        switch (viewName) {
            case 'overview':
                this.loadOverviewView();
                break;
            case 'shareholders':
                this.loadShareholdersView();
                break;
            case 'capital-entry':
                this.loadCapitalEntryView();
                break;
            case 'edit-info':
                this.loadEditInfoView();
                break;
            case 'search':
                this.loadSearchView();
                break;
        }
    }

    // Load overview view
    loadOverviewView() {
        const data = StorageManager.getAllData();
        const capitalStats = this.calculateCapitalStats(data);

        const overviewHTML = `
            <div class="row">
                <!-- Capital Statistics -->
                <div class="col-lg-8 mb-4">
                    <div class="neumorphic-card">
                        <div class="card-header">
                            <h4><i class="bi bi-graph-up me-2"></i>إحصائيات رأس المال</h4>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="stat-item">
                                        <div class="stat-icon bg-success">
                                            <i class="bi bi-currency-dollar"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>${this.formatCurrency(capitalStats.totalUSD, 'USD')}</h3>
                                            <p>إجمالي رأس المال بالدولار</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="stat-item">
                                        <div class="stat-icon bg-primary">
                                            <i class="bi bi-cash"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>${this.formatCurrency(capitalStats.totalIQD, 'IQD')}</h3>
                                            <p>إجمالي رأس المال بالدينار</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="stat-item">
                                        <div class="stat-icon bg-info">
                                            <i class="bi bi-people"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>${capitalStats.totalShareholders}</h3>
                                            <p>عدد المساهمين</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="stat-item">
                                        <div class="stat-icon bg-warning">
                                            <i class="bi bi-receipt"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>${capitalStats.totalEntries}</h3>
                                            <p>عدد الإدخالات</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Capital Entries -->
                <div class="col-lg-4 mb-4">
                    <div class="neumorphic-card">
                        <div class="card-header">
                            <h5><i class="bi bi-clock-history me-2"></i>آخر الإدخالات</h5>
                        </div>
                        <div class="card-body">
                            <div id="recentCapitalEntries">
                                ${this.renderRecentEntries(data.capital || [])}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Shareholders Distribution -->
                <div class="col-12">
                    <div class="neumorphic-card">
                        <div class="card-header">
                            <h4><i class="bi bi-pie-chart me-2"></i>توزيع المساهمين</h4>
                        </div>
                        <div class="card-body">
                            <div id="shareholdersDistribution">
                                ${this.renderShareholdersDistribution(data)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('capitalContent').innerHTML = overviewHTML;
    }

    // Load shareholders view
    loadShareholdersView() {
        const shareholdersHTML = `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h4><i class="bi bi-person-plus me-2"></i>إضافة مساهم جديد</h4>
                </div>
                <div class="card-body">
                    <form id="shareholderForm" class="row">
                        <div class="col-md-6 mb-3">
                            <label for="shareholderName" class="form-label">اسم المساهم</label>
                            <input type="text" class="form-control neumorphic-input" id="shareholderName" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="shareholderPosition" class="form-label">المنصب في الشركة</label>
                            <input type="text" class="form-control neumorphic-input" id="shareholderPosition" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="shareholderPhone" class="form-label">رقم الهاتف</label>
                            <input type="tel" class="form-control neumorphic-input" id="shareholderPhone" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="shareholderCivilId" class="form-label">رقم الهوية المدنية</label>
                            <input type="text" class="form-control neumorphic-input" id="shareholderCivilId" required>
                        </div>
                        <div class="col-12 mb-3">
                            <label for="shareholderAddress" class="form-label">العنوان</label>
                            <textarea class="form-control neumorphic-input" id="shareholderAddress" rows="3"></textarea>
                        </div>
                        <div class="col-12">
                            <button type="submit" class="btn btn-primary neumorphic-btn">
                                <i class="bi bi-save me-2"></i>حفظ المساهم
                            </button>
                            <button type="reset" class="btn btn-secondary neumorphic-btn ms-2">
                                <i class="bi bi-arrow-clockwise me-2"></i>إعادة تعيين
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Existing Shareholders -->
            <div class="neumorphic-card mt-4">
                <div class="card-header">
                    <h4><i class="bi bi-people me-2"></i>المساهمون الحاليون</h4>
                </div>
                <div class="card-body">
                    <div id="shareholdersList">
                        ${this.renderShareholdersList()}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('capitalContent').innerHTML = shareholdersHTML;
        this.setupShareholderForm();
    }

    // Load capital entry view
    loadCapitalEntryView() {
        const shareholders = StorageManager.getData(StorageManager.STORAGE_KEYS.SHAREHOLDERS) || [];
        
        const capitalEntryHTML = `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h4><i class="bi bi-cash-stack me-2"></i>إدخال رأس المال</h4>
                </div>
                <div class="card-body">
                    <form id="capitalEntryForm" class="row">
                        <div class="col-md-6 mb-3">
                            <label for="registrationNumber" class="form-label">رقم التسجيل</label>
                            <input type="text" class="form-control neumorphic-input" id="registrationNumber" 
                                   value="${StorageManager.generateRegistrationNumber()}" readonly>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="shareholderSelect" class="form-label">اسم المساهم</label>
                            <select class="form-control neumorphic-input" id="shareholderSelect" required>
                                <option value="">اختر المساهم</option>
                                ${shareholders.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="currencyType" class="form-label">نوع العملة</label>
                            <select class="form-control neumorphic-input" id="currencyType" required>
                                <option value="">اختر العملة</option>
                                <option value="USD">دولار أمريكي (USD)</option>
                                <option value="IQD">دينار عراقي (IQD)</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="capitalAmount" class="form-label">المبلغ</label>
                            <input type="number" class="form-control neumorphic-input" id="capitalAmount" 
                                   step="0.01" min="0" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="receiptDate" class="form-label">تاريخ الاستلام</label>
                            <input type="date" class="form-control neumorphic-input" id="receiptDate" 
                                   value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="receiptNumber" class="form-label">رقم الإيصال أو السند</label>
                            <input type="text" class="form-control neumorphic-input" id="receiptNumber" required>
                        </div>
                        <div class="col-12 mb-3">
                            <label for="capitalNotes" class="form-label">ملاحظات</label>
                            <textarea class="form-control neumorphic-input" id="capitalNotes" rows="3"></textarea>
                        </div>
                        <div class="col-12">
                            <button type="submit" class="btn btn-primary neumorphic-btn">
                                <i class="bi bi-save me-2"></i>حفظ الإدخال
                            </button>
                            <button type="reset" class="btn btn-secondary neumorphic-btn ms-2">
                                <i class="bi bi-arrow-clockwise me-2"></i>إعادة تعيين
                            </button>
                            <button type="button" class="btn btn-success neumorphic-btn ms-2" id="printReceiptBtn" style="display: none;" onclick="capitalManager.printCapitalReceipt()">
                                <i class="bi bi-printer me-2"></i>طباعة فاتورة الإيصال
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Recent Capital Entries -->
            <div class="neumorphic-card mt-4">
                <div class="card-header">
                    <h4><i class="bi bi-list me-2"></i>إدخالات رأس المال الحديثة</h4>
                </div>
                <div class="card-body">
                    <div id="capitalEntriesList">
                        ${this.renderCapitalEntriesList()}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('capitalContent').innerHTML = capitalEntryHTML;
        this.setupCapitalEntryForm();
    }

    // Load edit info view
    loadEditInfoView() {
        const editInfoHTML = `
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="neumorphic-card">
                        <div class="card-header">
                            <h4><i class="bi bi-pencil-square me-2"></i>تعديل معلومات المساهمين</h4>
                        </div>
                        <div class="card-body">
                            <div id="editShareholdersList">
                                ${this.renderEditShareholdersList()}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="neumorphic-card">
                        <div class="card-header">
                            <h4><i class="bi bi-cash-stack me-2"></i>تعديل إدخالات رأس المال</h4>
                        </div>
                        <div class="card-body">
                            <div id="editCapitalEntriesList">
                                ${this.renderEditCapitalEntriesList()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Edit Form Modal -->
            <div id="editFormContainer" style="display: none;">
                <!-- Edit form will be loaded here -->
            </div>
        `;

        document.getElementById('capitalContent').innerHTML = editInfoHTML;
    }

    // Load search view
    loadSearchView() {
        const searchHTML = `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h4><i class="bi bi-search me-2"></i>البحث في إدخالات رأس المال</h4>
                </div>
                <div class="card-body">
                    <form id="searchForm" class="row">
                        <div class="col-md-3 mb-3">
                            <label for="searchRegistrationNumber" class="form-label">رقم التسجيل</label>
                            <input type="text" class="form-control neumorphic-input" id="searchRegistrationNumber">
                        </div>
                        <div class="col-md-3 mb-3">
                            <label for="searchDate" class="form-label">التاريخ</label>
                            <input type="date" class="form-control neumorphic-input" id="searchDate">
                        </div>
                        <div class="col-md-3 mb-3">
                            <label for="searchShareholder" class="form-label">اسم المساهم</label>
                            <input type="text" class="form-control neumorphic-input" id="searchShareholder">
                        </div>
                        <div class="col-md-3 mb-3">
                            <label for="searchReceiptNumber" class="form-label">رقم الإيصال</label>
                            <input type="text" class="form-control neumorphic-input" id="searchReceiptNumber">
                        </div>
                        <div class="col-12 mb-3">
                            <button type="submit" class="btn btn-primary neumorphic-btn">
                                <i class="bi bi-search me-2"></i>بحث
                            </button>
                            <button type="button" class="btn btn-secondary neumorphic-btn ms-2" onclick="capitalManager.clearSearch()">
                                <i class="bi bi-x-circle me-2"></i>مسح البحث
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Search Results -->
            <div class="neumorphic-card mt-4">
                <div class="card-header">
                    <h4><i class="bi bi-list-check me-2"></i>نتائج البحث</h4>
                </div>
                <div class="card-body">
                    <div id="searchResults">
                        <p class="text-muted text-center">استخدم نموذج البحث أعلاه للعثور على الإدخالات</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('capitalContent').innerHTML = searchHTML;
        this.setupSearchForm();
    }

    // Set up search form events
    setupSearchForm() {
        const form = document.getElementById('searchForm');
        if (!form) return;

        // Prevent default submit and run search
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.performSearch();
        });

        // Enter key on inputs triggers search consistently
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });
        });
    }

    // Calculate capital statistics
    calculateCapitalStats(data) {
        const stats = {
            totalUSD: 0,
            totalIQD: 0,
            totalShareholders: data.shareholders?.length || 0,
            totalEntries: data.capital?.length || 0
        };

        if (data.capital) {
            data.capital.forEach(entry => {
                const amount = parseFloat(entry.amount) || 0;
                if (entry.currency === 'USD') {
                    stats.totalUSD += amount;
                } else if (entry.currency === 'IQD') {
                    stats.totalIQD += amount;
                }
            });
        }

        return stats;
    }

    // Render recent entries
    renderRecentEntries(entries) {
        if (!entries || entries.length === 0) {
            return '<p class="text-muted text-center">لا توجد إدخالات حديثة</p>';
        }

        const recentEntries = entries
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        return recentEntries.map(entry => `
            <div class="recent-entry mb-3 p-3 border rounded">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${this.formatCurrency(entry.amount, entry.currency)}</h6>
                        <small class="text-muted">${this.formatDate(entry.date)}</small>
                    </div>
                    <span class="badge bg-${entry.currency === 'USD' ? 'success' : 'primary'}">${entry.currency}</span>
                </div>
            </div>
        `).join('');
    }

    // Render shareholders distribution
    renderShareholdersDistribution(data) {
        const shareholders = data.shareholders || [];
        const capital = data.capital || [];

        if (shareholders.length === 0) {
            return '<p class="text-muted text-center">لا يوجد مساهمون مسجلون</p>';
        }

        // Calculate each shareholder's contribution
        const shareholderContributions = shareholders.map(shareholder => {
            const contributions = capital.filter(entry => entry.shareholderId === shareholder.id);
            let totalUSD = 0;
            let totalIQD = 0;

            contributions.forEach(contribution => {
                const amount = parseFloat(contribution.amount) || 0;
                if (contribution.currency === 'USD') {
                    totalUSD += amount;
                } else if (contribution.currency === 'IQD') {
                    totalIQD += amount;
                }
            });

            return {
                ...shareholder,
                totalUSD,
                totalIQD,
                contributionsCount: contributions.length
            };
        });

        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>اسم المساهم</th>
                            <th>المنصب</th>
                            <th>المساهمة بالدولار</th>
                            <th>المساهمة بالدينار</th>
                            <th>عدد الإدخالات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${shareholderContributions.map(shareholder => `
                            <tr>
                                <td>${shareholder.name}</td>
                                <td>${shareholder.position}</td>
                                <td>${this.formatCurrency(shareholder.totalUSD, 'USD')}</td>
                                <td>${this.formatCurrency(shareholder.totalIQD, 'IQD')}</td>
                                <td><span class="badge bg-info">${shareholder.contributionsCount}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Render shareholders list
    renderShareholdersList() {
        const shareholders = StorageManager.getData(StorageManager.STORAGE_KEYS.SHAREHOLDERS) || [];

        if (shareholders.length === 0) {
            return '<p class="text-muted text-center">لا يوجد مساهمون مسجلون</p>';
        }

        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>المنصب</th>
                            <th>الهاتف</th>
                            <th>رقم الهوية</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${shareholders.map(shareholder => `
                            <tr>
                                <td>${shareholder.name}</td>
                                <td>${shareholder.position}</td>
                                <td>${shareholder.phone}</td>
                                <td>${shareholder.civilId}</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="capitalManager.editShareholder('${shareholder.id}')">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="capitalManager.deleteShareholder('${shareholder.id}')">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Render capital entries list
    renderCapitalEntriesList() {
        const capital = StorageManager.getData(StorageManager.STORAGE_KEYS.CAPITAL) || [];
        const shareholders = StorageManager.getData(StorageManager.STORAGE_KEYS.SHAREHOLDERS) || [];

        if (capital.length === 0) {
            return '<p class="text-muted text-center">لا توجد إدخالات رأس مال</p>';
        }

        const recentEntries = capital
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>رقم التسجيل</th>
                            <th>المساهم</th>
                            <th>المبلغ</th>
                            <th>العملة</th>
                            <th>التاريخ</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentEntries.map(entry => {
                            const shareholder = shareholders.find(s => s.id === entry.shareholderId);
                            return `
                                <tr>
                                    <td>${entry.registrationNumber}</td>
                                    <td>${shareholder ? shareholder.name : 'غير محدد'}</td>
                                    <td>${this.formatCurrency(entry.amount, entry.currency)}</td>
                                    <td><span class="badge bg-${entry.currency === 'USD' ? 'success' : 'primary'}">${entry.currency}</span></td>
                                    <td>${this.formatDate(entry.date)}</td>
                                    <td>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-success" onclick="capitalManager.printExistingEntry('${entry.id}')" title="طباعة الإيصال">
                                                <i class="bi bi-printer"></i>
                                            </button>
                                            <button class="btn btn-outline-primary" onclick="capitalManager.editCapitalEntry('${entry.id}')" title="تعديل">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-outline-danger" onclick="capitalManager.deleteCapitalEntry('${entry.id}')" title="حذف">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Render edit shareholders list
    renderEditShareholdersList() {
        const shareholders = StorageManager.getData(StorageManager.STORAGE_KEYS.SHAREHOLDERS) || [];

        if (shareholders.length === 0) {
            return '<p class="text-muted text-center">لا يوجد مساهمون للتعديل</p>';
        }

        return `
            <div class="list-group">
                ${shareholders.map(shareholder => `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${shareholder.name}</h6>
                            <small class="text-muted">${shareholder.position}</small>
                        </div>
                        <button class="btn btn-outline-primary btn-sm" onclick="capitalManager.editShareholder('${shareholder.id}')">
                            <i class="bi bi-pencil me-1"></i>تعديل
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Render edit capital entries list
    renderEditCapitalEntriesList() {
        const capital = StorageManager.getData(StorageManager.STORAGE_KEYS.CAPITAL) || [];
        const shareholders = StorageManager.getData(StorageManager.STORAGE_KEYS.SHAREHOLDERS) || [];

        if (capital.length === 0) {
            return '<p class="text-muted text-center">لا توجد إدخالات للتعديل</p>';
        }

        const recentEntries = capital
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        return `
            <div class="list-group">
                ${recentEntries.map(entry => {
                    const shareholder = shareholders.find(s => s.id === entry.shareholderId);
                    return `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${entry.registrationNumber}</h6>
                                <small class="text-muted">${shareholder ? shareholder.name : 'غير محدد'} - ${this.formatCurrency(entry.amount, entry.currency)}</small>
                            </div>
                            <button class="btn btn-outline-primary btn-sm" onclick="capitalManager.editCapitalEntry('${entry.id}')">
                                <i class="bi bi-pencil me-1"></i>تعديل
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
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

    // Setup shareholder form
    setupShareholderForm() {
        const form = document.getElementById('shareholderForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveShareholder();
        });
    }

    // Setup capital entry form
    setupCapitalEntryForm() {
        const form = document.getElementById('capitalEntryForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCapitalEntry();
        });
    }

    // Setup search form
    setupSearchForm() {
        const form = document.getElementById('searchForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.performSearch();
        });
    }

    // Save shareholder
    saveShareholder() {
        const shareholderData = {
            name: document.getElementById('shareholderName').value,
            position: document.getElementById('shareholderPosition').value,
            phone: document.getElementById('shareholderPhone').value,
            civilId: document.getElementById('shareholderCivilId').value,
            address: document.getElementById('shareholderAddress').value
        };

        if (this.editingId) {
            // Update existing shareholder
            if (StorageManager.updateShareholder(this.editingId, shareholderData)) {
                this.showNotification('تم تحديث المساهم بنجاح', 'success');
                this.editingId = null;
            } else {
                this.showNotification('حدث خطأ أثناء تحديث المساهم', 'error');
            }
        } else {
            // Add new shareholder
            const newShareholder = StorageManager.addShareholder(shareholderData);
            if (newShareholder) {
                this.showNotification('تم إضافة المساهم بنجاح', 'success');
            } else {
                this.showNotification('حدث خطأ أثناء إضافة المساهم', 'error');
            }
        }

        // Reset form and refresh view
        document.getElementById('shareholderForm').reset();
        this.refreshCurrentView();
    }

    // Save capital entry
    saveCapitalEntry() {
        const capitalData = {
            shareholderId: document.getElementById('shareholderSelect').value,
            currency: document.getElementById('currencyType').value,
            amount: document.getElementById('capitalAmount').value,
            date: document.getElementById('receiptDate').value,
            receiptNumber: document.getElementById('receiptNumber').value,
            notes: document.getElementById('capitalNotes').value
        };

        if (this.editingId) {
            // Update existing entry
            if (StorageManager.updateCapitalEntry(this.editingId, capitalData)) {
                this.showNotification('تم تحديث الإدخال بنجاح', 'success');
                this.lastSavedEntry = { ...capitalData, id: this.editingId };
                this.showPrintButton();
                this.editingId = null;
            } else {
                this.showNotification('حدث خطأ أثناء تحديث الإدخال', 'error');
            }
        } else {
            // Add new entry
            const newEntry = StorageManager.addCapitalEntry(capitalData);
            if (newEntry) {
                this.showNotification('تم إضافة الإدخال بنجاح', 'success');
                this.lastSavedEntry = newEntry;
                this.showPrintButton();
            } else {
                this.showNotification('حدث خطأ أثناء إضافة الإدخال', 'error');
            }
        }

        // Reset form and refresh view
        document.getElementById('capitalEntryForm').reset();
        document.getElementById('registrationNumber').value = StorageManager.generateRegistrationNumber();
        this.refreshCurrentView();
    }

    // Show print button after successful save
    showPrintButton() {
        const printBtn = document.getElementById('printReceiptBtn');
        if (printBtn) {
            printBtn.style.display = 'inline-block';
            // Hide button after 30 seconds
            setTimeout(() => {
                printBtn.style.display = 'none';
            }, 30000);
        }
    }

    // Edit shareholder
    editShareholder(id) {
        const shareholders = StorageManager.getData(StorageManager.STORAGE_KEYS.SHAREHOLDERS) || [];
        const shareholder = shareholders.find(s => s.id === id);

        if (!shareholder) {
            this.showNotification('المساهم غير موجود', 'error');
            return;
        }

        // Switch to shareholders view if not already there
        if (this.currentView !== 'shareholders') {
            this.showView('shareholders');
        }

        // Fill form with shareholder data
        setTimeout(() => {
            document.getElementById('shareholderName').value = shareholder.name;
            document.getElementById('shareholderPosition').value = shareholder.position;
            document.getElementById('shareholderPhone').value = shareholder.phone;
            document.getElementById('shareholderCivilId').value = shareholder.civilId;
            document.getElementById('shareholderAddress').value = shareholder.address || '';

            this.editingId = id;
            this.showNotification('جاري تعديل المساهم', 'info');
        }, 100);
    }

    // Delete shareholder
    deleteShareholder(id) {
        if (confirm('هل أنت متأكد من حذف هذا المساهم؟')) {
            if (StorageManager.deleteShareholder(id)) {
                this.showNotification('تم حذف المساهم بنجاح', 'success');
                this.refreshCurrentView();
            } else {
                this.showNotification('حدث خطأ أثناء حذف المساهم', 'error');
            }
        }
    }

    // Edit capital entry
    editCapitalEntry(id) {
        const capital = StorageManager.getData(StorageManager.STORAGE_KEYS.CAPITAL) || [];
        const entry = capital.find(c => c.id === id);

        if (!entry) {
            this.showNotification('الإدخال غير موجود', 'error');
            return;
        }

        // Switch to capital entry view if not already there
        if (this.currentView !== 'capital-entry') {
            this.showView('capital-entry');
        }

        // Fill form with entry data
        setTimeout(() => {
            document.getElementById('registrationNumber').value = entry.registrationNumber;
            document.getElementById('shareholderSelect').value = entry.shareholderId;
            document.getElementById('currencyType').value = entry.currency;
            document.getElementById('capitalAmount').value = entry.amount;
            document.getElementById('receiptDate').value = entry.date;
            document.getElementById('receiptNumber').value = entry.receiptNumber;
            document.getElementById('capitalNotes').value = entry.notes || '';

            this.editingId = id;
            this.showNotification('جاري تعديل الإدخال', 'info');
        }, 100);
    }

    // Delete capital entry
    deleteCapitalEntry(id) {
        if (confirm('هل أنت متأكد من حذف هذا الإدخال؟')) {
            if (StorageManager.deleteCapitalEntry(id)) {
                this.showNotification('تم حذف الإدخال بنجاح', 'success');
                this.refreshCurrentView();
            } else {
                this.showNotification('حدث خطأ أثناء حذف الإدخال', 'error');
            }
        }
    }

    // Perform search
    performSearch() {
        const searchCriteria = {
            registrationNumber: document.getElementById('searchRegistrationNumber').value,
            date: document.getElementById('searchDate').value,
            receiptNumber: document.getElementById('searchReceiptNumber').value
        };

        const shareholderName = document.getElementById('searchShareholder').value;
        if (shareholderName) {
            // Find shareholder by name
            const shareholders = StorageManager.getData(StorageManager.STORAGE_KEYS.SHAREHOLDERS) || [];
            const shareholder = shareholders.find(s =>
                s.name.toLowerCase().includes(shareholderName.toLowerCase())
            );
            if (shareholder) {
                searchCriteria.shareholderId = shareholder.id;
            }
        }

        const results = StorageManager.searchCapital(searchCriteria);
        this.displaySearchResults(results);
    }

    // Display search results
    displaySearchResults(results) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="text-muted text-center">لم يتم العثور على نتائج</p>';
            return;
        }

        const shareholders = StorageManager.getData(StorageManager.STORAGE_KEYS.SHAREHOLDERS) || [];

        const resultsHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>رقم التسجيل</th>
                            <th>المساهم</th>
                            <th>المبلغ</th>
                            <th>العملة</th>
                            <th>التاريخ</th>
                            <th>رقم الإيصال</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(entry => {
                            const shareholder = shareholders.find(s => s.id === entry.shareholderId);
                            return `
                                <tr>
                                    <td>${entry.registrationNumber}</td>
                                    <td>${shareholder ? shareholder.name : 'غير محدد'}</td>
                                    <td>${this.formatCurrency(entry.amount, entry.currency)}</td>
                                    <td><span class="badge bg-${entry.currency === 'USD' ? 'success' : 'primary'}">${entry.currency}</span></td>
                                    <td>${this.formatDate(entry.date)}</td>
                                    <td>${entry.receiptNumber}</td>
                                    <td>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-success" onclick="capitalManager.printExistingEntry('${entry.id}')" title="طباعة الإيصال">
                                                <i class="bi bi-printer"></i>
                                            </button>
                                            <button class="btn btn-outline-primary" onclick="capitalManager.editCapitalEntry('${entry.id}')" title="تعديل">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-outline-info" onclick="capitalManager.viewCapitalEntry('${entry.id}')" title="عرض التفاصيل">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        resultsContainer.innerHTML = resultsHTML;
    }

    // Clear search
    clearSearch() {
        document.getElementById('searchForm').reset();
        document.getElementById('searchResults').innerHTML = '<p class="text-muted text-center">استخدم نموذج البحث أعلاه للعثور على الإدخالات</p>';
    }

    // View capital entry details
    viewCapitalEntry(id) {
        const capital = StorageManager.getData(StorageManager.STORAGE_KEYS.CAPITAL) || [];
        const shareholders = StorageManager.getData(StorageManager.STORAGE_KEYS.SHAREHOLDERS) || [];
        const entry = capital.find(c => c.id === id);

        if (!entry) {
            this.showNotification('الإدخال غير موجود', 'error');
            return;
        }

        const shareholder = shareholders.find(s => s.id === entry.shareholderId);

        const modalHTML = `
            <div class="modal fade" id="entryDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content neumorphic-card">
                        <div class="modal-header">
                            <h5 class="modal-title">تفاصيل إدخال رأس المال</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">رقم التسجيل:</label>
                                    <p>${entry.registrationNumber}</p>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">اسم المساهم:</label>
                                    <p>${shareholder ? shareholder.name : 'غير محدد'}</p>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">المبلغ:</label>
                                    <p>${this.formatCurrency(entry.amount, entry.currency)}</p>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">العملة:</label>
                                    <p><span class="badge bg-${entry.currency === 'USD' ? 'success' : 'primary'}">${entry.currency}</span></p>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">تاريخ الاستلام:</label>
                                    <p>${this.formatDate(entry.date)}</p>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">رقم الإيصال:</label>
                                    <p>${entry.receiptNumber}</p>
                                </div>
                                <div class="col-12 mb-3">
                                    <label class="form-label fw-bold">ملاحظات:</label>
                                    <p>${entry.notes || 'لا توجد ملاحظات'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary neumorphic-btn" data-bs-dismiss="modal">إغلاق</button>
                            <button type="button" class="btn btn-primary neumorphic-btn" onclick="capitalManager.editCapitalEntry('${entry.id}')" data-bs-dismiss="modal">تعديل</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('entryDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('entryDetailsModal'));
        modal.show();
    }

    // Refresh current view
    refreshCurrentView() {
        this.showView(this.currentView);
    }

    // Print capital receipt
    printCapitalReceipt() {
        if (!this.lastSavedEntry) {
            this.showNotification('لا يوجد إدخال للطباعة', 'error');
            return;
        }

        const shareholders = StorageManager.getData(StorageManager.STORAGE_KEYS.SHAREHOLDERS) || [];
        const shareholder = shareholders.find(s => s.id === this.lastSavedEntry.shareholderId);

        const receiptHTML = this.generateReceiptHTML(this.lastSavedEntry, shareholder);

        // Create print window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(receiptHTML);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = function() {
            printWindow.print();
        };
    }

    // Print existing entry
    printExistingEntry(entryId) {
        const capital = StorageManager.getData(StorageManager.STORAGE_KEYS.CAPITAL) || [];
        const entry = capital.find(c => c.id === entryId);

        if (!entry) {
            this.showNotification('الإدخال غير موجود', 'error');
            return;
        }

        const shareholders = StorageManager.getData(StorageManager.STORAGE_KEYS.SHAREHOLDERS) || [];
        const shareholder = shareholders.find(s => s.id === entry.shareholderId);

        const receiptHTML = this.generateReceiptHTML(entry, shareholder);

        // Create print window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(receiptHTML);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = function() {
            printWindow.print();
        };
    }

    // Generate receipt HTML
    generateReceiptHTML(entry, shareholder) {
        const currentDate = new Date().toLocaleDateString('ar-IQ');
        const currentTime = new Date().toLocaleTimeString('ar-IQ');

        return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>إيصال إدخال رأس المال - ${entry.registrationNumber}</title>
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
                    background: #e8f5e8;
                    border: 2px solid #27ae60;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 30px 0;
                    text-align: center;
                }
                .amount-label {
                    font-size: 18px;
                    color: #27ae60;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .amount-value {
                    font-size: 32px;
                    color: #27ae60;
                    font-weight: bold;
                }
                .amount-words {
                    font-size: 16px;
                    color: #2c3e50;
                    margin-top: 10px;
                    font-style: italic;
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
                    <div class="company-name">شركة المقاولات المتقدمة</div>
                    <div class="receipt-title">إيصال إدخال رأس المال</div>
                    <div class="receipt-number">رقم الإيصال: ${entry.registrationNumber}</div>
                </div>

                <!-- Receipt Body -->
                <div class="receipt-body">
                    <div class="info-row">
                        <span class="info-label">اسم المساهم:</span>
                        <span class="info-value">${shareholder ? shareholder.name : 'غير محدد'}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">منصب المساهم:</span>
                        <span class="info-value">${shareholder ? shareholder.position : 'غير محدد'}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">رقم الهاتف:</span>
                        <span class="info-value">${shareholder ? shareholder.phone : 'غير محدد'}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">تاريخ الإيداع:</span>
                        <span class="info-value">${this.formatDate(entry.date)}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">رقم السند/الإيصال:</span>
                        <span class="info-value">${entry.receiptNumber}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">نوع العملة:</span>
                        <span class="info-value">${entry.currency === 'USD' ? 'دولار أمريكي (USD)' : 'دينار عراقي (IQD)'}</span>
                    </div>

                    <!-- Amount Section -->
                    <div class="amount-section">
                        <div class="amount-label">المبلغ المودع</div>
                        <div class="amount-value">${this.formatCurrency(entry.amount, entry.currency)}</div>
                        <div class="amount-words">${this.numberToWords(entry.amount, entry.currency)}</div>
                    </div>

                    ${entry.notes ? `
                    <div class="info-row">
                        <span class="info-label">ملاحظات:</span>
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
                            <div class="signature-label">توقيع المساهم</div>
                        </div>

                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <div class="signature-label">توقيع المحاسب</div>
                        </div>

                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <div class="signature-label">توقيع المدير</div>
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

        // This is a simplified version - you can enhance it for full Arabic number conversion
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

    // Show notification
    showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize capital manager
let capitalManager;
document.addEventListener('DOMContentLoaded', () => {
    capitalManager = new CapitalManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CapitalManager;
}
