// Main Application Controller
class AccountingApp {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.exchangeRate = 1500; // USD to IQD exchange rate
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.loadExchangeRate();
        this.checkAuthStatus();
    }

    initializeEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link') || e.target.closest('.nav-link')) {
                e.preventDefault();
                const link = e.target.matches('.nav-link') ? e.target : e.target.closest('.nav-link');
                const section = link.getAttribute('onclick')?.match(/showSection\('(.+)'\)/)?.[1];
                if (section) {
                    this.showSection(section);
                }
            }
        });

        // Auto-save functionality
        setInterval(() => {
            this.autoSave();
        }, 60000); // Auto-save every minute

        // Handle offline/online status
        window.addEventListener('online', () => {
            this.showNotification('تم الاتصال بالإنترنت', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('تم قطع الاتصال - العمل في وضع عدم الاتصال', 'warning');
        });
    }

    checkAuthStatus() {
        // Check AuthManager first
        if (window.AuthManager && window.AuthManager.checkSession && window.AuthManager.checkSession()) {
            this.currentUser = window.AuthManager.getCurrentUser();
            this.showDashboard();
            return;
        }

        // Fallback: check localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            // Also update AuthManager if available
            if (window.AuthManager) {
                window.AuthManager.currentUser = this.currentUser;
            }
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Use AuthManager for authentication
        if (window.AuthManager) {
            const result = await window.AuthManager.login(username, password);
            if (result.success) {
                this.currentUser = result.user;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showDashboard();
                this.showNotification('تم تسجيل الدخول بنجاح', 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        } else {
            // Fallback authentication
            if (this.validateCredentials(username, password)) {
                this.currentUser = {
                    username: username,
                    loginTime: new Date().toISOString(),
                    permissions: this.getUserPermissions(username)
                };

                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showDashboard();
                this.showNotification('تم تسجيل الدخول بنجاح', 'success');
            } else {
                this.showNotification('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
            }
        }
    }

    validateCredentials(username, password) {
        // Default credentials (in production, this should be stored securely)
        const defaultCredentials = [
            { username: 'admin', password: 'admin123' },
            { username: 'manager', password: 'manager123' },
            { username: 'accountant', password: 'acc123' }
        ];

        return defaultCredentials.some(cred => 
            cred.username === username && cred.password === password
        );
    }

    getUserPermissions(username) {
        const permissions = {
            'admin': ['all'],
            'manager': ['capital', 'expenses', 'reports', 'users'],
            'accountant': ['capital', 'expenses', 'reports']
        };

        return permissions[username] || ['capital', 'expenses'];
    }

    showLogin() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainDashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainDashboard').style.display = 'block';
        
        // Update user display
        const currentUserElement = document.getElementById('currentUser');
        if (currentUserElement && this.currentUser) {
            currentUserElement.textContent = this.currentUser.username;
        }

        // Load dashboard data
        this.loadDashboardData();
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // Remove active class from all nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName + 'Section');
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('fade-in');
        }

        // Add active class to current nav link
        const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentSection = sectionName;

        // Load section-specific data
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'capital':
                this.loadCapitalSection();
                break;
            case 'expenses':
                this.loadExpensesSection();
                break;
            case 'reports':
                this.loadReportsSection();
                break;
            case 'users':
                this.loadUsersSection();
                break;
        }
    }

    loadCapitalSection() {
        // Ensure CapitalManager exists then load section
        if (!window.capitalManager) {
            try {
                window.capitalManager = new CapitalManager();
            } catch (error) {
                console.error('Error creating CapitalManager:', error);
                return;
            }
        }
        window.capitalManager.loadCapitalSection();
    }

    loadExpensesSection() {
        console.log('Loading expenses section from app.js...');

        // Ensure ExpensesManager is available
        if (!window.expensesManager) {
            console.log('Creating new ExpensesManager...');
            try {
                window.expensesManager = new ExpensesManager();
                console.log('ExpensesManager created successfully');
            } catch (error) {
                console.error('Error creating ExpensesManager:', error);
                return;
            }
        }

        // Load expenses section
        if (window.expensesManager) {
            console.log('ExpensesManager found, loading section...');
            window.expensesManager.loadExpensesSection();
        } else {
            console.error('ExpensesManager still not available!');
        }
    }

    // Test function for accounting guide
    testAccountingGuide() {
        console.log('Testing accounting guide from app.js...');
        this.showSection('expenses');

        setTimeout(() => {
            if (window.expensesManager) {
                console.log('Loading accounting guide view...');
                window.expensesManager.showView('accounting-guide');
            } else {
                console.error('ExpensesManager not available');
            }
        }, 500);
    }

    loadReportsSection() {
        // Reports section implementation
        const reportsSection = document.getElementById('reportsSection');
        if (!reportsSection) return;

        const reportsHTML = `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h4><i class="bi bi-graph-up me-2"></i>التقارير والإحصائيات</h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <button class="btn btn-primary neumorphic-btn w-100" onclick="app.generateFinancialReport()">
                                <i class="bi bi-file-earmark-text me-2"></i>
                                تقرير مالي شامل
                            </button>
                        </div>
                        <div class="col-md-4 mb-3">
                            <button class="btn btn-success neumorphic-btn w-100" onclick="app.generateCapitalReport()">
                                <i class="bi bi-cash-stack me-2"></i>
                                تقرير رأس المال
                            </button>
                        </div>
                        <div class="col-md-4 mb-3">
                            <button class="btn btn-danger neumorphic-btn w-100" onclick="app.generateExpensesReport()">
                                <i class="bi bi-receipt me-2"></i>
                                تقرير المصروفات
                            </button>
                        </div>
                    </div>
                    <div class="mt-4">
                        <h5>تقارير سريعة</h5>
                        <div id="quickReports">
                            <!-- Quick reports will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        reportsSection.innerHTML = reportsHTML;
        this.loadQuickReports();
    }

    loadUsersSection() {
        // Users section implementation
        const usersSection = document.getElementById('usersSection');
        if (!usersSection) return;

        const usersHTML = `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h4><i class="bi bi-people me-2"></i>إدارة المستخدمين والصلاحيات</h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <button class="btn btn-primary neumorphic-btn w-100" onclick="app.showAddUserForm()">
                                <i class="bi bi-person-plus me-2"></i>
                                إضافة مستخدم جديد
                            </button>
                        </div>
                        <div class="col-md-6 mb-3">
                            <button class="btn btn-secondary neumorphic-btn w-100" onclick="app.showUsersList()">
                                <i class="bi bi-list me-2"></i>
                                قائمة المستخدمين
                            </button>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div id="usersContent">
                            <!-- Users content will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        usersSection.innerHTML = usersHTML;
        this.showUsersList();
    }

    loadQuickReports() {
        const data = StorageManager.getAllData();
        const totals = this.calculateTotals(data);

        const quickReportsHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6>الملخص المالي</h6>
                            <p>رأس المال: ${this.formatCurrency(totals.totalUSD, 'USD')} | ${this.formatCurrency(totals.totalIQD, 'IQD')}</p>
                            <p>المصروفات: ${this.formatCurrency(totals.expensesUSD, 'USD')} | ${this.formatCurrency(totals.expensesIQD, 'IQD')}</p>
                            <p>المتبقي: ${this.formatCurrency(totals.totalUSD - totals.expensesUSD, 'USD')} | ${this.formatCurrency(totals.totalIQD - totals.expensesIQD, 'IQD')}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6>إحصائيات العمليات</h6>
                            <p>عدد المساهمين: ${data.shareholders?.length || 0}</p>
                            <p>إدخالات رأس المال: ${data.capital?.length || 0}</p>
                            <p>المصروفات: ${data.expenses?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const quickReportsElement = document.getElementById('quickReports');
        if (quickReportsElement) {
            quickReportsElement.innerHTML = quickReportsHTML;
        }
    }

    showUsersList() {
        // Check if user is logged in using this.currentUser
        if (!this.currentUser) {
            document.getElementById('usersContent').innerHTML = '<p class="text-danger">يجب تسجيل الدخول أولاً</p>';
            return;
        }

        // Allow admin and manager users
        const username = this.currentUser.username;
        if (username !== 'admin' && username !== 'manager') {
            document.getElementById('usersContent').innerHTML = '<p class="text-danger">ليس لديك صلاحية لعرض المستخدمين</p>';
            return;
        }

        // Get users from AuthManager or fallback
        let users = [];
        if (window.AuthManager && window.AuthManager.getAllUsers) {
            users = window.AuthManager.getAllUsers();
        } else {
            // Fallback: get users from storage directly
            users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            users = users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
        }
        const usersListHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>اسم المستخدم</th>
                            <th>الاسم</th>
                            <th>الدور</th>
                            <th>الحالة</th>
                            <th>تاريخ الإنشاء</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.username}</td>
                                <td>${user.name}</td>
                                <td><span class="badge bg-info">${user.role}</span></td>
                                <td><span class="badge bg-${user.isActive ? 'success' : 'danger'}">${user.isActive ? 'نشط' : 'معطل'}</span></td>
                                <td>${this.formatDate(user.createdAt)}</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="app.editUser('${user.id}')">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="app.deactivateUser('${user.id}')">
                                            <i class="bi bi-person-x"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('usersContent').innerHTML = usersListHTML;
    }

    // Generate Capital Report HTML
    generateCapitalReportHTML() {
        return `
            <div class="capital-report-container">
                <!-- Report Header -->
                <div class="neumorphic-card mb-4">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h4><i class="bi bi-cash-stack me-2"></i>تقرير رأس المال الشامل</h4>
                        <div class="report-actions">
                            <button class="btn btn-success neumorphic-btn btn-sm" onclick="app.printCapitalReport()">
                                <i class="bi bi-printer me-1"></i>طباعة
                            </button>
                            <button class="btn btn-primary neumorphic-btn btn-sm ms-2" onclick="app.exportCapitalReport()">
                                <i class="bi bi-download me-1"></i>تصدير
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Search Section -->
                <div class="neumorphic-card mb-4">
                    <div class="card-header">
                        <h5><i class="bi bi-search me-2"></i>البحث والتصفية</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label for="searchShareholder" class="form-label">البحث عن مساهم</label>
                                <input type="text" class="form-control neumorphic-input" id="searchShareholder"
                                       placeholder="اكتب اسم المساهم...">
                            </div>
                            <div class="col-md-3 mb-3">
                                <label for="searchDateFrom" class="form-label">من تاريخ</label>
                                <input type="date" class="form-control neumorphic-input" id="searchDateFrom">
                            </div>
                            <div class="col-md-3 mb-3">
                                <label for="searchDateTo" class="form-label">إلى تاريخ</label>
                                <input type="date" class="form-control neumorphic-input" id="searchDateTo">
                            </div>
                            <div class="col-md-2 mb-3">
                                <label for="searchCurrency" class="form-label">العملة</label>
                                <select class="form-control neumorphic-input" id="searchCurrency">
                                    <option value="">جميع العملات</option>
                                    <option value="USD">دولار أمريكي</option>
                                    <option value="IQD">دينار عراقي</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-12">
                                <button class="btn btn-primary neumorphic-btn" onclick="app.searchCapitalReport()">
                                    <i class="bi bi-search me-2"></i>بحث
                                </button>
                                <button class="btn btn-secondary neumorphic-btn ms-2" onclick="app.clearCapitalSearch()">
                                    <i class="bi bi-x-circle me-2"></i>مسح البحث
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="row mb-4">
                    <div class="col-md-3 mb-3">
                        <div class="neumorphic-card text-center">
                            <div class="card-body">
                                <h5 class="text-success">إجمالي الدولار</h5>
                                <h3 id="totalUSDSummary" class="text-success">$0.00</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="neumorphic-card text-center">
                            <div class="card-body">
                                <h5 class="text-primary">إجمالي الدينار</h5>
                                <h3 id="totalIQDSummary" class="text-primary">0 د.ع</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="neumorphic-card text-center">
                            <div class="card-body">
                                <h5 class="text-info">عدد المساهمين</h5>
                                <h3 id="totalShareholdersSummary" class="text-info">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="neumorphic-card text-center">
                            <div class="card-body">
                                <h5 class="text-warning">عدد الإدخالات</h5>
                                <h3 id="totalEntriesSummary" class="text-warning">0</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Report Table -->
                <div class="neumorphic-card">
                    <div class="card-header">
                        <h5><i class="bi bi-table me-2"></i>تفاصيل إدخالات رأس المال</h5>
                    </div>
                    <div class="card-body">
                        <div id="capitalReportTable" class="table-responsive">
                            <!-- Table will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Load Capital Report Data
    loadCapitalReportData(searchCriteria = null) {
        const data = StorageManager.getAllData();
        const capital = data.capital || [];
        const shareholders = data.shareholders || [];

        // Filter data based on search criteria
        let filteredCapital = capital;
        if (searchCriteria) {
            filteredCapital = this.filterCapitalData(capital, shareholders, searchCriteria);
        }

        // Calculate totals
        const totals = this.calculateCapitalTotals(filteredCapital);

        // Update summary cards
        this.updateCapitalSummary(totals, filteredCapital, shareholders);

        // Generate table
        this.generateCapitalTable(filteredCapital, shareholders);
    }

    // Filter capital data based on search criteria
    filterCapitalData(capital, shareholders, criteria) {
        return capital.filter(entry => {
            // Filter by shareholder name
            if (criteria.shareholder) {
                const shareholder = shareholders.find(s => s.id === entry.shareholderId);
                const shareholderName = shareholder ? shareholder.name.toLowerCase() : '';
                if (!shareholderName.includes(criteria.shareholder.toLowerCase())) {
                    return false;
                }
            }

            // Filter by date range
            if (criteria.dateFrom && entry.date < criteria.dateFrom) {
                return false;
            }
            if (criteria.dateTo && entry.date > criteria.dateTo) {
                return false;
            }

            // Filter by currency
            if (criteria.currency && entry.currency !== criteria.currency) {
                return false;
            }

            return true;
        });
    }

    // Calculate capital totals
    calculateCapitalTotals(capital) {
        const totals = {
            USD: 0,
            IQD: 0,
            entries: capital.length
        };

        capital.forEach(entry => {
            const amount = parseFloat(entry.amount) || 0;
            if (entry.currency === 'USD') {
                totals.USD += amount;
            } else if (entry.currency === 'IQD') {
                totals.IQD += amount;
            }
        });

        return totals;
    }

    // Update capital summary cards
    updateCapitalSummary(totals, capital, shareholders) {
        // Update total amounts
        const totalUSDElement = document.getElementById('totalUSDSummary');
        const totalIQDElement = document.getElementById('totalIQDSummary');
        const totalShareholdersElement = document.getElementById('totalShareholdersSummary');
        const totalEntriesElement = document.getElementById('totalEntriesSummary');

        if (totalUSDElement) {
            totalUSDElement.textContent = this.formatCurrency(totals.USD, 'USD');
        }
        if (totalIQDElement) {
            totalIQDElement.textContent = this.formatCurrency(totals.IQD, 'IQD');
        }
        if (totalEntriesElement) {
            totalEntriesElement.textContent = totals.entries;
        }

        // Count unique shareholders
        const uniqueShareholders = new Set(capital.map(entry => entry.shareholderId));
        if (totalShareholdersElement) {
            totalShareholdersElement.textContent = uniqueShareholders.size;
        }
    }

    // Generate capital table
    generateCapitalTable(capital, shareholders) {
        const tableContainer = document.getElementById('capitalReportTable');
        if (!tableContainer) return;

        if (capital.length === 0) {
            tableContainer.innerHTML = '<p class="text-center text-muted">لا توجد بيانات لعرضها</p>';
            return;
        }

        // Sort by date (newest first)
        const sortedCapital = capital.sort((a, b) => new Date(b.date) - new Date(a.date));

        let tableHTML = `
            <table class="table table-hover table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>رقم القيد</th>
                        <th>التاريخ</th>
                        <th>اسم المساهم</th>
                        <th>مبلغ الدولار</th>
                        <th>مبلغ الدينار</th>
                        <th>رقم الإيصال</th>
                        <th>الملاحظات</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalUSD = 0;
        let totalIQD = 0;

        sortedCapital.forEach((entry, index) => {
            const shareholder = shareholders.find(s => s.id === entry.shareholderId);
            const shareholderName = shareholder ? shareholder.name : 'غير محدد';

            const usdAmount = entry.currency === 'USD' ? parseFloat(entry.amount) : 0;
            const iqdAmount = entry.currency === 'IQD' ? parseFloat(entry.amount) : 0;

            totalUSD += usdAmount;
            totalIQD += iqdAmount;

            tableHTML += `
                <tr>
                    <td><strong>${entry.registrationNumber}</strong></td>
                    <td>${this.formatDate(entry.date)}</td>
                    <td>${shareholderName}</td>
                    <td class="text-success fw-bold">${usdAmount > 0 ? this.formatCurrency(usdAmount, 'USD') : '-'}</td>
                    <td class="text-primary fw-bold">${iqdAmount > 0 ? this.formatCurrency(iqdAmount, 'IQD') : '-'}</td>
                    <td>${entry.receiptNumber || '-'}</td>
                    <td>${entry.notes || '-'}</td>
                </tr>
            `;
        });

        // Add totals row
        tableHTML += `
                </tbody>
                <tfoot class="table-success">
                    <tr class="fw-bold">
                        <td colspan="3" class="text-center"><strong>الإجمالي</strong></td>
                        <td class="text-success"><strong>${this.formatCurrency(totalUSD, 'USD')}</strong></td>
                        <td class="text-primary"><strong>${this.formatCurrency(totalIQD, 'IQD')}</strong></td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
        `;

        tableContainer.innerHTML = tableHTML;
    }

    // Setup capital report search
    setupCapitalReportSearch() {
        const searchShareholder = document.getElementById('searchShareholder');
        const searchDateFrom = document.getElementById('searchDateFrom');
        const searchDateTo = document.getElementById('searchDateTo');
        const searchCurrency = document.getElementById('searchCurrency');

        // Add event listeners for real-time search
        [searchShareholder, searchDateFrom, searchDateTo, searchCurrency].forEach(element => {
            if (element) {
                element.addEventListener('input', () => {
                    this.searchCapitalReport();
                });
            }
        });
    }

    // Search capital report
    searchCapitalReport() {
        const criteria = {
            shareholder: document.getElementById('searchShareholder')?.value || '',
            dateFrom: document.getElementById('searchDateFrom')?.value || '',
            dateTo: document.getElementById('searchDateTo')?.value || '',
            currency: document.getElementById('searchCurrency')?.value || ''
        };

        this.loadCapitalReportData(criteria);
    }

    // Clear capital search
    clearCapitalSearch() {
        document.getElementById('searchShareholder').value = '';
        document.getElementById('searchDateFrom').value = '';
        document.getElementById('searchDateTo').value = '';
        document.getElementById('searchCurrency').value = '';

        this.loadCapitalReportData();
    }

    // Print capital report
    printCapitalReport() {
        const tableContent = document.getElementById('capitalReportTable');
        if (!tableContent) return;

        // Get current totals
        const totalUSD = document.getElementById('totalUSDSummary')?.textContent || '$0.00';
        const totalIQD = document.getElementById('totalIQDSummary')?.textContent || '0 د.ع';
        const totalEntries = document.getElementById('totalEntriesSummary')?.textContent || '0';

    const headerHTML = (typeof buildBrandedHeaderHTML === 'function') ? buildBrandedHeaderHTML('تقرير رأس المال الشامل') : '';
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    const printHTML = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>تقرير رأس المال</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        margin: 20px;
                        direction: rtl;
                        color: #333;
                        line-height: 1.6;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        border-bottom: 3px double #333;
                        padding-bottom: 20px;
                    }
                    .company-name {
                        font-size: 28px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #2c3e50;
                    }
                    .report-title {
                        font-size: 22px;
                        color: #e74c3c;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .print-date {
                        font-size: 14px;
                        color: #7f8c8d;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        font-size: 14px;
                    }
                    th, td {
                        border: 1px solid #333;
                        padding: 12px 8px;
                        text-align: center;
                    }
                    th {
                        background-color: #34495e;
                        color: white;
                        font-weight: bold;
                        font-size: 15px;
                    }
                    .table-success {
                        background-color: #d4edda !important;
                        font-weight: bold;
                    }
                    .text-success {
                        color: #28a745 !important;
                        font-weight: bold;
                    }
                    .text-primary {
                        color: #007bff !important;
                        font-weight: bold;
                    }
                    .summary-section {
                        margin: 30px 0;
                        padding: 20px;
                        border: 2px solid #333;
                        border-radius: 10px;
                        background-color: #f8f9fa;
                    }
                    .summary-title {
                        font-size: 18px;
                        font-weight: bold;
                        text-align: center;
                        margin-bottom: 15px;
                        color: #2c3e50;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 20px;
                        text-align: center;
                    }
                    .summary-item {
                        padding: 15px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        background: white;
                    }
                    .summary-label {
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 5px;
                    }
                    .summary-value {
                        font-size: 18px;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    @media print {
                        body { margin: 10px; }
                        .no-print { display: none; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                    }
                </style>
            </head>
            <body>
                ${headerHTML}

                <div class="summary-section">
                    <div class="summary-title">ملخص التقرير</div>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-label">إجمالي الدولار</div>
                            <div class="summary-value text-success">${totalUSD}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">إجمالي الدينار</div>
                            <div class="summary-value text-primary">${totalIQD}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">عدد الإدخالات</div>
                            <div class="summary-value">${totalEntries}</div>
                        </div>
                    </div>
                </div>

                <div style="margin: 30px 0;">
                    ${tableContent.innerHTML}
                </div>

                <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
                    تم إنشاء هذا التقرير بواسطة نظام المحاسبة الإلكتروني - شركة المقاولات المتقدمة
                </div>
                ${buildPrintFooterHTML ? buildPrintFooterHTML() : ''}
            </body>
            </html>
        `;

        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
    }

    // Export capital report
    exportCapitalReport() {
        const data = StorageManager.getAllData();
        const capital = data.capital || [];
        const shareholders = data.shareholders || [];

        const reportData = {
            title: 'تقرير رأس المال',
            generatedAt: new Date().toISOString(),
            data: capital.map(entry => {
                const shareholder = shareholders.find(s => s.id === entry.shareholderId);
                return {
                    registrationNumber: entry.registrationNumber,
                    date: entry.date,
                    shareholderName: shareholder ? shareholder.name : 'غير محدد',
                    amount: entry.amount,
                    currency: entry.currency,
                    receiptNumber: entry.receiptNumber,
                    notes: entry.notes
                };
            }),
            totals: this.calculateCapitalTotals(capital)
        };

        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `capital_report_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Load Expenses Report Data
    loadExpensesReportData(searchCriteria = null) {
        const data = StorageManager.getAllData();
        const expenses = data.expenses || [];

        // Filter data based on search criteria
        let filteredExpenses = expenses;
        if (searchCriteria) {
            filteredExpenses = this.filterExpensesData(expenses, searchCriteria);
        }

        // Calculate totals
        const totals = this.calculateExpensesTotals(filteredExpenses);

        // Update summary cards
        this.updateExpensesSummary(totals, filteredExpenses);

        // Generate table
        this.generateExpensesTable(filteredExpenses);
    }

    // Filter expenses data based on search criteria
    filterExpensesData(expenses, criteria) {
        return expenses.filter(entry => {
            // Filter by category
            if (criteria.category && entry.category !== criteria.category) {
                return false;
            }

            // Filter by vendor
            if (criteria.vendor) {
                const vendor = (entry.vendor || '').toLowerCase();
                if (!vendor.includes(criteria.vendor.toLowerCase())) {
                    return false;
                }
            }

            // Filter by date range
            if (criteria.dateFrom && entry.date < criteria.dateFrom) {
                return false;
            }
            if (criteria.dateTo && entry.date > criteria.dateTo) {
                return false;
            }

            // Filter by currency
            if (criteria.currency && entry.currency !== criteria.currency) {
                return false;
            }

            return true;
        });
    }

    // Calculate expenses totals
    calculateExpensesTotals(expenses) {
        const totals = {
            USD: 0,
            IQD: 0,
            entries: expenses.length,
            categories: new Set()
        };

        expenses.forEach(entry => {
            const amount = parseFloat(entry.amount) || 0;
            if (entry.currency === 'USD') {
                totals.USD += amount;
            } else if (entry.currency === 'IQD') {
                totals.IQD += amount;
            }
            if (entry.category) {
                totals.categories.add(entry.category);
            }
        });

        return totals;
    }

    // Update expenses summary cards
    updateExpensesSummary(totals, expenses) {
        // Update total amounts
        const totalUSDElement = document.getElementById('totalExpenseUSDSummary');
        const totalIQDElement = document.getElementById('totalExpenseIQDSummary');
        const totalCategoriesElement = document.getElementById('totalCategoriesSummary');
        const totalExpensesElement = document.getElementById('totalExpensesSummary');

        if (totalUSDElement) {
            totalUSDElement.textContent = this.formatCurrency(totals.USD, 'USD');
        }
        if (totalIQDElement) {
            totalIQDElement.textContent = this.formatCurrency(totals.IQD, 'IQD');
        }
        if (totalExpensesElement) {
            totalExpensesElement.textContent = totals.entries;
        }
        if (totalCategoriesElement) {
            totalCategoriesElement.textContent = totals.categories.size;
        }
    }

    // Generate expenses table
    generateExpensesTable(expenses) {
        const tableContainer = document.getElementById('expensesReportTable');
        if (!tableContainer) return;

        if (expenses.length === 0) {
            tableContainer.innerHTML = '<p class="text-center text-muted">لا توجد بيانات لعرضها</p>';
            return;
        }

        // Sort by date (newest first)
        const sortedExpenses = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        let tableHTML = `
            <table class="table table-hover table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>رقم القيد</th>
                        <th>التاريخ</th>
                        <th>فئة المصروف</th>
                        <th>المورد/الجهة</th>
                        <th>مبلغ الدولار</th>
                        <th>مبلغ الدينار</th>
                        <th>طريقة الدفع</th>
                        <th>الوصف</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalUSD = 0;
        let totalIQD = 0;

        sortedExpenses.forEach((entry, index) => {
            const usdAmount = entry.currency === 'USD' ? parseFloat(entry.amount) : 0;
            const iqdAmount = entry.currency === 'IQD' ? parseFloat(entry.amount) : 0;

            totalUSD += usdAmount;
            totalIQD += iqdAmount;

            // Get payment method in Arabic
            const paymentMethods = {
                'cash': 'نقداً',
                'bank_transfer': 'تحويل بنكي',
                'check': 'شيك',
                'credit_card': 'بطاقة ائتمان'
            };
            const paymentMethodArabic = paymentMethods[entry.paymentMethod] || entry.paymentMethod || 'غير محدد';

            tableHTML += `
                <tr>
                    <td><strong>${entry.registrationNumber}</strong></td>
                    <td>${this.formatDate(entry.date)}</td>
                    <td><span class="badge bg-info">${entry.category || 'غير محدد'}</span></td>
                    <td>${entry.vendor || 'غير محدد'}</td>
                    <td class="text-danger fw-bold">${usdAmount > 0 ? this.formatCurrency(usdAmount, 'USD') : '-'}</td>
                    <td class="text-warning fw-bold">${iqdAmount > 0 ? this.formatCurrency(iqdAmount, 'IQD') : '-'}</td>
                    <td>${paymentMethodArabic}</td>
                    <td class="text-truncate" style="max-width: 200px;" title="${entry.description || '-'}">${entry.description || '-'}</td>
                </tr>
            `;
        });

        // Add totals row
        tableHTML += `
                </tbody>
                <tfoot class="table-danger">
                    <tr class="fw-bold">
                        <td colspan="4" class="text-center"><strong>الإجمالي</strong></td>
                        <td class="text-danger"><strong>${this.formatCurrency(totalUSD, 'USD')}</strong></td>
                        <td class="text-warning"><strong>${this.formatCurrency(totalIQD, 'IQD')}</strong></td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
        `;

        tableContainer.innerHTML = tableHTML;
    }

    // Setup expenses report search
    setupExpensesReportSearch() {
        const searchCategory = document.getElementById('searchExpenseCategory');
        const searchVendor = document.getElementById('searchExpenseVendor');
        const searchDateFrom = document.getElementById('searchExpenseDateFrom');
        const searchDateTo = document.getElementById('searchExpenseDateTo');
        const searchCurrency = document.getElementById('searchExpenseCurrency');

        // Add event listeners for real-time search
        [searchCategory, searchVendor, searchDateFrom, searchDateTo, searchCurrency].forEach(element => {
            if (element) {
                element.addEventListener('input', () => {
                    this.searchExpensesReport();
                });
            }
        });
    }

    // Search expenses report
    searchExpensesReport() {
        const criteria = {
            category: document.getElementById('searchExpenseCategory')?.value || '',
            vendor: document.getElementById('searchExpenseVendor')?.value || '',
            dateFrom: document.getElementById('searchExpenseDateFrom')?.value || '',
            dateTo: document.getElementById('searchExpenseDateTo')?.value || '',
            currency: document.getElementById('searchExpenseCurrency')?.value || ''
        };

        this.loadExpensesReportData(criteria);
    }

    // Clear expenses search
    clearExpensesSearch() {
        document.getElementById('searchExpenseCategory').value = '';
        document.getElementById('searchExpenseVendor').value = '';
        document.getElementById('searchExpenseDateFrom').value = '';
        document.getElementById('searchExpenseDateTo').value = '';
        document.getElementById('searchExpenseCurrency').value = '';

        this.loadExpensesReportData();
    }

    // Print expenses report
    printExpensesReport() {
        const tableContent = document.getElementById('expensesReportTable');
        if (!tableContent) return;

        // Get current totals
        const totalUSD = document.getElementById('totalExpenseUSDSummary')?.textContent || '$0.00';
        const totalIQD = document.getElementById('totalExpenseIQDSummary')?.textContent || '0 د.ع';
        const totalExpenses = document.getElementById('totalExpensesSummary')?.textContent || '0';
        const totalCategories = document.getElementById('totalCategoriesSummary')?.textContent || '0';

        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        const printHTML = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>تقرير المصروفات</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        margin: 20px;
                        direction: rtl;
                        color: #333;
                        line-height: 1.6;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        border-bottom: 3px double #333;
                        padding-bottom: 20px;
                    }
                    .company-name {
                        font-size: 28px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #2c3e50;
                    }
                    .report-title {
                        font-size: 22px;
                        color: #e74c3c;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .print-date {
                        font-size: 14px;
                        color: #7f8c8d;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        font-size: 12px;
                    }
                    th, td {
                        border: 1px solid #333;
                        padding: 8px 6px;
                        text-align: center;
                    }
                    th {
                        background-color: #34495e;
                        color: white;
                        font-weight: bold;
                        font-size: 13px;
                    }
                    .table-danger {
                        background-color: #f8d7da !important;
                        font-weight: bold;
                    }
                    .text-danger {
                        color: #dc3545 !important;
                        font-weight: bold;
                    }
                    .text-warning {
                        color: #ffc107 !important;
                        font-weight: bold;
                    }
                    .summary-section {
                        margin: 30px 0;
                        padding: 20px;
                        border: 2px solid #333;
                        border-radius: 10px;
                        background-color: #f8f9fa;
                    }
                    .summary-title {
                        font-size: 18px;
                        font-weight: bold;
                        text-align: center;
                        margin-bottom: 15px;
                        color: #2c3e50;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr 1fr;
                        gap: 15px;
                        text-align: center;
                    }
                    .summary-item {
                        padding: 15px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        background: white;
                    }
                    .summary-label {
                        font-size: 12px;
                        color: #666;
                        margin-bottom: 5px;
                    }
                    .summary-value {
                        font-size: 16px;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    @media print {
                        body { margin: 10px; }
                        .no-print { display: none; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">شركة المقاولات المتقدمة</div>
                    <div class="report-title">تقرير المصروفات الشامل</div>
                    <div class="print-date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-IQ')} - ${new Date().toLocaleTimeString('ar-IQ')}</div>
                </div>

                <div class="summary-section">
                    <div class="summary-title">ملخص التقرير</div>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-label">إجمالي الدولار</div>
                            <div class="summary-value text-danger">${totalUSD}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">إجمالي الدينار</div>
                            <div class="summary-value text-warning">${totalIQD}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">عدد الفئات</div>
                            <div class="summary-value">${totalCategories}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">عدد المصروفات</div>
                            <div class="summary-value">${totalExpenses}</div>
                        </div>
                    </div>
                </div>

                <div style="margin: 30px 0;">
                    ${tableContent.innerHTML}
                </div>

                <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
                    تم إنشاء هذا التقرير بواسطة نظام المحاسبة الإلكتروني - شركة المقاولات المتقدمة
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
    }

    // Export expenses report
    exportExpensesReport() {
        const data = StorageManager.getAllData();
        const expenses = data.expenses || [];

        const reportData = {
            title: 'تقرير المصروفات',
            generatedAt: new Date().toISOString(),
            data: expenses.map(entry => ({
                registrationNumber: entry.registrationNumber,
                date: entry.date,
                category: entry.category,
                vendor: entry.vendor,
                amount: entry.amount,
                currency: entry.currency,
                paymentMethod: entry.paymentMethod,
                description: entry.description,
                notes: entry.notes
            })),
            totals: this.calculateExpensesTotals(expenses)
        };

        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `expenses_report_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Report generation methods
    generateFinancialReport() {
        if (window.reportsManager) {
            window.reportsManager.generateFinancialReport();
        }
    }

    generateCapitalReport() {
        this.showCapitalReportPage();
    }

    showCapitalReportPage() {
        // Switch to reports section first
        this.showSection('reports');

        // Then load capital report content
        setTimeout(() => {
            const reportsSection = document.getElementById('reportsSection');
            if (reportsSection) {
                reportsSection.innerHTML = this.generateCapitalReportHTML();
                this.loadCapitalReportData();
                this.setupCapitalReportSearch();
            }
        }, 100);
    }

    generateExpensesReport() {
        this.showExpensesReportPage();
    }

    showExpensesReportPage() {
        // Switch to reports section first
        this.showSection('reports');

        // Then load expenses report content
        setTimeout(() => {
            const reportsSection = document.getElementById('reportsSection');
            if (reportsSection) {
                reportsSection.innerHTML = this.generateExpensesReportHTML();
                this.loadExpensesReportData();
                this.setupExpensesReportSearch();
            }
        }, 100);
    }

    // Generate Expenses Report HTML
    generateExpensesReportHTML() {
        return `
            <div class="expenses-report-container">
                <!-- Report Header -->
                <div class="neumorphic-card mb-4">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h4><i class="bi bi-receipt me-2"></i>تقرير المصروفات الشامل</h4>
                        <div class="report-actions">
                            <button class="btn btn-success neumorphic-btn btn-sm" onclick="app.printExpensesReport()">
                                <i class="bi bi-printer me-1"></i>طباعة
                            </button>
                            <button class="btn btn-primary neumorphic-btn btn-sm ms-2" onclick="app.exportExpensesReport()">
                                <i class="bi bi-download me-1"></i>تصدير
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Search Section -->
                <div class="neumorphic-card mb-4">
                    <div class="card-header">
                        <h5><i class="bi bi-search me-2"></i>البحث والتصفية</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <label for="searchExpenseCategory" class="form-label">فئة المصروف</label>
                                <select class="form-control neumorphic-input" id="searchExpenseCategory">
                                    <option value="">جميع الفئات</option>
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
                            <div class="col-md-3 mb-3">
                                <label for="searchExpenseVendor" class="form-label">المورد/الجهة</label>
                                <input type="text" class="form-control neumorphic-input" id="searchExpenseVendor"
                                       placeholder="اكتب اسم المورد...">
                            </div>
                            <div class="col-md-2 mb-3">
                                <label for="searchExpenseDateFrom" class="form-label">من تاريخ</label>
                                <input type="date" class="form-control neumorphic-input" id="searchExpenseDateFrom">
                            </div>
                            <div class="col-md-2 mb-3">
                                <label for="searchExpenseDateTo" class="form-label">إلى تاريخ</label>
                                <input type="date" class="form-control neumorphic-input" id="searchExpenseDateTo">
                            </div>
                            <div class="col-md-2 mb-3">
                                <label for="searchExpenseCurrency" class="form-label">العملة</label>
                                <select class="form-control neumorphic-input" id="searchExpenseCurrency">
                                    <option value="">جميع العملات</option>
                                    <option value="USD">دولار أمريكي</option>
                                    <option value="IQD">دينار عراقي</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-12">
                                <button class="btn btn-primary neumorphic-btn" onclick="app.searchExpensesReport()">
                                    <i class="bi bi-search me-2"></i>بحث
                                </button>
                                <button class="btn btn-secondary neumorphic-btn ms-2" onclick="app.clearExpensesSearch()">
                                    <i class="bi bi-x-circle me-2"></i>مسح البحث
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="row mb-4">
                    <div class="col-md-3 mb-3">
                        <div class="neumorphic-card text-center">
                            <div class="card-body">
                                <h5 class="text-danger">إجمالي الدولار</h5>
                                <h3 id="totalExpenseUSDSummary" class="text-danger">$0.00</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="neumorphic-card text-center">
                            <div class="card-body">
                                <h5 class="text-warning">إجمالي الدينار</h5>
                                <h3 id="totalExpenseIQDSummary" class="text-warning">0 د.ع</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="neumorphic-card text-center">
                            <div class="card-body">
                                <h5 class="text-info">عدد الفئات</h5>
                                <h3 id="totalCategoriesSummary" class="text-info">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="neumorphic-card text-center">
                            <div class="card-body">
                                <h5 class="text-secondary">عدد المصروفات</h5>
                                <h3 id="totalExpensesSummary" class="text-secondary">0</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Report Table -->
                <div class="neumorphic-card">
                    <div class="card-header">
                        <h5><i class="bi bi-table me-2"></i>تفاصيل المصروفات</h5>
                    </div>
                    <div class="card-body">
                        <div id="expensesReportTable" class="table-responsive">
                            <!-- Table will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showAddUserForm() {
        // Check if user is logged in using this.currentUser
        if (!this.currentUser) {
            this.showNotification('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

        // Debug: Check current user and permissions
        console.log('Current user in app.js:', this.currentUser);
        console.log('AuthManager current user:', window.AuthManager ? window.AuthManager.getCurrentUser() : 'AuthManager not available');

        // Sync AuthManager with app currentUser
        if (window.AuthManager && this.currentUser) {
            window.AuthManager.currentUser = this.currentUser;
            console.log('Synced AuthManager currentUser');
        }

        // Allow admin and manager users
        const username = this.currentUser.username;
        if (username !== 'admin' && username !== 'manager') {
            this.showNotification('ليس لديك صلاحية لإضافة مستخدمين. يجب أن تكون مدير أو مدير قسم.', 'error');
            return;
        }

        const addUserFormHTML = `
            <div class="neumorphic-card">
                <div class="card-header">
                    <h5><i class="bi bi-person-plus me-2"></i>إضافة مستخدم جديد</h5>
                </div>
                <div class="card-body">
                    <form id="addUserForm" class="row">
                        <div class="col-md-6 mb-3">
                            <label for="newUsername" class="form-label">اسم المستخدم (إنجليزي)</label>
                            <input type="text" class="form-control neumorphic-input" id="newUsername"
                                   placeholder="admin, user123, etc."
                                   pattern="[a-zA-Z0-9_]+"
                                   title="يجب أن يحتوي على أحرف إنجليزية وأرقام فقط"
                                   required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="newUserName" class="form-label">الاسم الكامل (عربي أو إنجليزي)</label>
                            <input type="text" class="form-control neumorphic-input" id="newUserName"
                                   placeholder="أحمد محمد أو Ahmed Mohamed"
                                   required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="newUserPassword" class="form-label">كلمة المرور</label>
                            <input type="password" class="form-control neumorphic-input" id="newUserPassword" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="newUserRole" class="form-label">الدور</label>
                            <select class="form-control neumorphic-input" id="newUserRole" required>
                                <option value="">اختر الدور</option>
                                <option value="admin">مدير</option>
                                <option value="manager">مدير قسم</option>
                                <option value="accountant">محاسب</option>
                                <option value="user">مستخدم</option>
                            </select>
                        </div>
                        <div class="col-12 mb-3">
                            <label class="form-label">الصلاحيات</label>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="permCapital" value="capital">
                                        <label class="form-check-label" for="permCapital">رأس المال</label>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="permExpenses" value="expenses">
                                        <label class="form-check-label" for="permExpenses">المصروفات</label>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="permReports" value="reports">
                                        <label class="form-check-label" for="permReports">التقارير</label>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="permUsers" value="users">
                                        <label class="form-check-label" for="permUsers">المستخدمون</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12">
                            <button type="submit" class="btn btn-primary neumorphic-btn">
                                <i class="bi bi-save me-2"></i>حفظ المستخدم
                            </button>
                            <button type="button" class="btn btn-secondary neumorphic-btn ms-2" onclick="app.showUsersList()">
                                <i class="bi bi-arrow-right me-2"></i>العودة للقائمة
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('usersContent').innerHTML = addUserFormHTML;
        this.setupAddUserForm();
    }

    setupAddUserForm() {
        const form = document.getElementById('addUserForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form data with trimming and validation
            const username = document.getElementById('newUsername').value.trim();
            const name = document.getElementById('newUserName').value.trim();
            const password = document.getElementById('newUserPassword').value;
            const role = document.getElementById('newUserRole').value;

            // Validate required fields
            if (!username || !name || !password || !role) {
                this.showNotification('جميع الحقول مطلوبة', 'error');
                return;
            }

            // Validate username (English only)
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                this.showNotification('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط', 'error');
                return;
            }

            // Validate name (allow Arabic and English)
            if (name.length < 2) {
                this.showNotification('الاسم يجب أن يكون أكثر من حرفين', 'error');
                return;
            }

            const userData = {
                username: username,
                name: name,
                password: password,
                role: role,
                permissions: []
            };

            // Collect permissions
            const permissionCheckboxes = form.querySelectorAll('input[type="checkbox"]:checked');
            permissionCheckboxes.forEach(checkbox => {
                userData.permissions.push(checkbox.value);
            });

            console.log('Form data collected:', userData);

            // Create user directly using StorageManager
            let result;
            if (window.AuthManager && window.AuthManager.createUser) {
                result = await window.AuthManager.createUser(userData);
            } else {
                // Fallback: create user directly
                result = this.createUserDirectly(userData);
            }

            if (result.success) {
                this.showNotification(result.message, 'success');
                this.showUsersList();
            } else {
                this.showNotification(result.message, 'error');
            }
        });
    }

    // Create user directly using StorageManager
    createUserDirectly(userData) {
        try {
            console.log('Creating user with data:', userData);

            // Validate input data
            if (!userData.username || !userData.name || !userData.password) {
                return { success: false, message: 'جميع الحقول مطلوبة' };
            }

            // Validate Arabic text support
            if (userData.name.length === 0 || userData.username.length === 0) {
                return { success: false, message: 'الاسم واسم المستخدم لا يمكن أن يكونا فارغين' };
            }

            const users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            console.log('Current users:', users);

            // Check if username already exists
            if (users.some(u => u.username === userData.username)) {
                return { success: false, message: 'اسم المستخدم موجود بالفعل' };
            }

            // Hash password (simple implementation)
            const hashedPassword = this.hashPassword(userData.password);
            console.log('Password hashed successfully');

            // Create new user with Arabic support
            const newUser = {
                id: StorageManager.generateId(),
                username: userData.username.trim(),
                password: hashedPassword,
                name: userData.name.trim(),
                role: userData.role || 'user',
                permissions: userData.permissions || [],
                isActive: true,
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser ? this.currentUser.id : 'system'
            };

            console.log('New user object:', newUser);

            users.push(newUser);
            console.log('User added to array, attempting to save...');

            const saveResult = StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users);
            console.log('Save result:', saveResult);

            if (saveResult) {
                console.log('User created successfully');
                return { success: true, message: 'تم إنشاء المستخدم بنجاح' };
            } else {
                console.error('Failed to save user data');
                return { success: false, message: 'فشل في حفظ بيانات المستخدم' };
            }
        } catch (error) {
            console.error('Error creating user:', error);
            console.error('Error details:', error.message, error.stack);
            return { success: false, message: `حدث خطأ أثناء إنشاء المستخدم: ${error.message}` };
        }
    }

    // Simple password hashing
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    editUser(userId) {
        // Implementation for editing user
        this.showNotification('تعديل المستخدم - قيد التطوير', 'info');
    }

    deactivateUser(userId) {
        if (confirm('هل أنت متأكد من إلغاء تفعيل هذا المستخدم؟')) {
            window.AuthManager.deactivateUser(userId).then(result => {
                if (result.success) {
                    this.showNotification(result.message, 'success');
                    this.showUsersList();
                } else {
                    this.showNotification(result.message, 'error');
                }
            });
        }
    }

    loadDashboardData() {
        const data = StorageManager.getAllData();

        // Calculate totals
        const totals = this.calculateTotals(data);

        // Update statistics cards
        this.updateStatisticsCards(totals);

        // Load recent transactions
        this.loadRecentTransactions(data);
    }

    calculateTotals(data) {
        let totalUSD = 0;
        let totalIQD = 0;
        let revenueUSD = 0;
        let revenueIQD = 0;
        let expensesUSD = 0;
        let expensesIQD = 0;

        // Calculate capital totals
        if (data.capital) {
            data.capital.forEach(entry => {
                if (entry.currency === 'USD') {
                    totalUSD += parseFloat(entry.amount) || 0;
                } else if (entry.currency === 'IQD') {
                    totalIQD += parseFloat(entry.amount) || 0;
                }
            });
        }

        // Calculate expenses totals
        if (data.expenses) {
            data.expenses.forEach(entry => {
                if (entry.currency === 'USD') {
                    expensesUSD += parseFloat(entry.amount) || 0;
                } else if (entry.currency === 'IQD') {
                    expensesIQD += parseFloat(entry.amount) || 0;
                }
            });
        }

        // Calculate revenues (for now, same as capital - can be extended)
        revenueUSD = totalUSD;
        revenueIQD = totalIQD;

        // Calculate remaining amounts
        const remainingUSD = totalUSD - expensesUSD;
        const remainingIQD = totalIQD - expensesIQD;

        return {
            totalUSD: remainingUSD,
            totalIQD: remainingIQD,
            revenueUSD,
            revenueIQD,
            expensesUSD,
            expensesIQD
        };
    }

    updateStatisticsCards(totals) {
        const totalUSDElement = document.getElementById('totalUSD');
        const totalIQDElement = document.getElementById('totalIQD');
        const totalRevenueElement = document.getElementById('totalRevenue');
        const totalExpensesElement = document.getElementById('totalExpenses');

        if (totalUSDElement) {
            totalUSDElement.textContent = this.formatCurrency(totals.totalUSD, 'USD');
        }
        if (totalIQDElement) {
            totalIQDElement.textContent = this.formatCurrency(totals.totalIQD, 'IQD');
        }
        if (totalRevenueElement) {
            totalRevenueElement.textContent = this.formatCurrency(totals.revenueUSD, 'USD');
        }
        if (totalExpensesElement) {
            totalExpensesElement.textContent = this.formatCurrency(totals.expensesUSD, 'USD');
        }
    }

    loadRecentTransactions(data) {
        const recentTransactionsElement = document.getElementById('recentTransactions');
        if (!recentTransactionsElement) return;

        let allTransactions = [];

        // Combine all transactions
        if (data.capital) {
            allTransactions = allTransactions.concat(
                data.capital.map(t => ({ ...t, type: 'رأس مال' }))
            );
        }
        if (data.expenses) {
            allTransactions = allTransactions.concat(
                data.expenses.map(t => ({ ...t, type: 'مصروف' }))
            );
        }

        // Sort by date (most recent first)
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Take only the last 5 transactions
        const recentTransactions = allTransactions.slice(0, 5);

        if (recentTransactions.length === 0) {
            recentTransactionsElement.innerHTML = '<p class="text-muted text-center">لا توجد عمليات حديثة</p>';
            return;
        }

        const tableHTML = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>النوع</th>
                        <th>المبلغ</th>
                        <th>العملة</th>
                        <th>التاريخ</th>
                        <th>الوصف</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentTransactions.map(transaction => `
                        <tr>
                            <td><span class="badge bg-${transaction.type === 'رأس مال' ? 'success' : 'danger'}">${transaction.type}</span></td>
                            <td>${this.formatCurrency(transaction.amount, transaction.currency)}</td>
                            <td>${transaction.currency}</td>
                            <td>${this.formatDate(transaction.date)}</td>
                            <td>${transaction.description || transaction.notes || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        recentTransactionsElement.innerHTML = tableHTML;
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
        return date.toLocaleDateString('ar-IQ');
    }

    loadExchangeRate() {
        const savedRate = localStorage.getItem('exchangeRate');
        if (savedRate) {
            this.exchangeRate = parseFloat(savedRate);
        }
    }

    autoSave() {
        // Auto-save current state
        if (this.currentUser) {
            const timestamp = new Date().toISOString();
            localStorage.setItem('lastAutoSave', timestamp);
            console.log('Auto-save completed at:', timestamp);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; left: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.showLogin();
        this.showNotification('تم تسجيل الخروج بنجاح', 'info');
    }
}

// Global functions for HTML onclick events
function showSection(sectionName) {
    if (window.app) {
        window.app.showSection(sectionName);
    }
}

function logout() {
    if (window.app) {
        window.app.logout();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AccountingApp();

    // Add global test functions
    window.testAccountingGuideGlobal = function() {
        console.log('Testing accounting guide globally...');
        if (window.app) {
            window.app.testAccountingGuide();
        } else {
            console.error('App not initialized');
        }
    };

    window.debugSystem = function() {
        console.log('=== System Debug ===');
        console.log('App:', window.app);
        console.log('ExpensesManager:', window.expensesManager);
        console.log('StorageManager:', typeof StorageManager);

        if (window.expensesManager) {
            console.log('Testing expenses manager...');
            window.expensesManager.showView('accounting-guide');
        }
    };

    // Force create accounting guide
    window.forceCreateGuide = function() {
        console.log('Force creating accounting guide...');

        if (window.expensesManager) {
            window.expensesManager.createDefaultGuide();
        } else {
            console.error('ExpensesManager not available');
        }
    };

    // Test accounting guide directly
    window.testGuideInSystem = function() {
        console.log('Testing guide in system...');

        // Go to expenses section
        if (window.app) {
            window.app.showSection('expenses');

            setTimeout(() => {
                if (window.expensesManager) {
                    console.log('Loading accounting guide...');
                    window.expensesManager.showView('accounting-guide');
                } else {
                    console.error('ExpensesManager not ready');
                }
            }, 1000);
        }
    };
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccountingApp;
}
