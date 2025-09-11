// Expenses Management System
class ExpensesManager {
    constructor() {
        this.currentView = 'overview';
        this.editingId = null;
        this.lastSavedEntry = null;
        this.editingGuideId = null;
    // اختيار نوع قيد الشراء بالآجل (purchase_receipt | measurement)
    this.creditPurchaseType = null;
    this.creditPurchaseSubView = null; // (suppliers | add | settlements)
    this.editingCreditPurchaseSupplierId = null; // حالة تعديل مورد
    // إدارة قيود الشراء بالآجل
    this.editingCreditPurchaseId = null; // عند التعديل
    this.cpSearchQuery = '';
    // فلاتر سجل الشراء بالآجل المتقدمة
    this.cpFilters = { vendorId: '', type: '', dateFrom: '', dateTo: '', dueFrom: '', dueTo: '', reg: '' };
    // للتراجع بعد الحذف
    this._lastDeletedCreditPurchase = null;
    this._cpUndoTimer = null;
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
                                    <a class="nav-link" href="#" onclick="expensesManager.showView('credit-purchase')">
                                        <i class="bi bi-cart-check me-2"></i>الشراء بالآجل
                                    </a>
                                </li>
                                <li class="nav-item">
                                    
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
            case 'accounting-guide':
                console.log('Loading accounting guide view...');
                this.loadAccountingGuideView();
                break;
            case 'credit-purchase':
                this.loadCreditPurchaseView('menu');
                break;
        }
    }

    // View: Credit Purchase (Deferred Purchase)
    loadCreditPurchaseView(subView) {
        // تحديد المشهد الفرعي
        this.creditPurchaseSubView = subView || this.creditPurchaseSubView || 'menu';
        const container = document.getElementById('expensesContent');
        if(!container) return;

        if(this.creditPurchaseSubView === 'menu') {
            container.innerHTML = this.renderCreditPurchaseMenu();
            return; // لا شيء آخر
        }

        // محتوى فرعي + شريط تنقل علوي
        let innerHTML = this.renderCreditPurchaseNavBar();
        switch(this.creditPurchaseSubView){
            case 'suppliers':
                innerHTML += this.renderCreditPurchaseSuppliersSection();
                break;
            case 'add':
                this.creditPurchaseType = null; // reset type when entering add screen
                innerHTML += this.renderCreditPurchaseAddSection();
                break;
            case 'settlements':
            default:
                innerHTML += this.renderCreditPurchaseSettlementSection();
                break;
        }
        container.innerHTML = innerHTML;

        // تهيئة حسب المشهد
        if(this.creditPurchaseSubView==='suppliers'){
            this.setupCreditPurchaseSuppliersHandlers();
            this.refreshCreditPurchaseSuppliersUI();
        } else if(this.creditPurchaseSubView==='add') {
            this.setupCreditPurchaseAddFormHandlers();
            this.refreshCreditPurchaseSuppliersUI(); // لتعبئة القائمة
            this.renderCreditPurchasesTable();
        }
    }

    renderCreditPurchaseMenu(){
        return `
            <div class="row g-4">
                ${['suppliers','add','settlements'].map(key=>{
                    const meta = {suppliers:{icon:'bi-people',title:'بيانات الموردين',desc:'إدارة وإضافة موردين'},add:{icon:'bi-cart-check',title:'إضافة قيد الشراء بالآجل',desc:'تسجيل فاتورة أو ذرعة'},settlements:{icon:'bi-wallet2',title:'تسديد مبالغ الشراء',desc:'إدارة الدفعات (قريباً)'}}[key];
                    return `<div class="col-md-4"><div class="credit-menu-card" onclick=\"expensesManager.loadCreditPurchaseView('${key}')\"><div class='icon-wrap'><i class="bi ${meta.icon}"></i></div><h5>${meta.title}</h5><p>${meta.desc}</p></div></div>`;
                }).join('')}
            </div>
            <style>
            .credit-menu-card{cursor:pointer;background:#f7f9fc;border-radius:18px;padding:32px 24px;box-shadow:7px 7px 14px #d5dae0,-7px -7px 14px #ffffff;transition:.25s; text-align:center; position:relative;}
            .credit-menu-card:hover{transform:translateY(-4px);box-shadow:6px 6px 12px #cfd4da,-6px -6px 12px #ffffff;}
            .credit-menu-card h5{margin-top:12px;font-weight:600;font-size:1.05rem;}
            .credit-menu-card p{margin:6px 0 0;font-size:.8rem;color:#666;}
            .credit-menu-card .icon-wrap{width:54px;height:54px;margin:0 auto;background:linear-gradient(120deg,#5b74ff,#7956de);display:flex;align-items:center;justify-content:center;border-radius:16px;color:#fff;font-size:28px;}
            </style>`;
    }

    renderCreditPurchaseNavBar(){
        const tabs = [
            {key:'suppliers',label:'بيانات الموردين',icon:'bi-people'},
            {key:'add',label:'إضافة قيد الشراء بالآجل',icon:'bi-cart-check'},
            {key:'settlements',label:'تسديد مبالغ الشراء',icon:'bi-wallet2'}
        ];
        return `<div class='cp-subnav mb-4 d-flex gap-3 flex-wrap'>${tabs.map(t=>`<div class="cp-subnav-item ${this.creditPurchaseSubView===t.key?'active':''}" onclick=\"expensesManager.loadCreditPurchaseView('${t.key}')\"><i class='bi ${t.icon}'></i><span>${t.label}</span></div>`).join('')}</div>
        <style>
        .cp-subnav-item{cursor:pointer;display:flex;align-items:center;gap:8px;padding:14px 34px;background:#f5f7fa;border-radius:14px;font-size:.9rem;font-weight:500;color:#203040;box-shadow:6px 6px 12px #d5dae0,-6px -6px 12px #ffffff;transition:.25s;}
        .cp-subnav-item.active{background:linear-gradient(120deg,#5b74ff,#7956de);color:#fff;box-shadow:inset 4px 4px 8px rgba(0,0,0,.15),inset -4px -4px 8px rgba(255,255,255,.2);} 
        .cp-subnav-item:not(.active):hover{transform:translateY(-3px);} 
        .cp-subnav-item i{font-size:1.1rem;} 
        </style>`;
    }

    renderCreditPurchaseSuppliersSection(){
        return `<div class="neumorphic-card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-people me-2"></i>موردو الشراء بالآجل</h5>
                <button class="btn btn-sm btn-outline-primary" type="button" onclick="expensesManager.toggleAddSupplierForm()" id="toggleSupplierFormBtn">إضافة مورد</button>
            </div>
            <div class="card-body">
                <div id="addSupplierFormWrapper" style="display:none;" class="mb-3">
                    <form id="cpSupplierForm" class="row g-2">
                        <div class="col-md-3"><label class="form-label">اسم المورد</label><input type="text" class="form-control" id="cpSupplierName" required placeholder="مثال: شركة البناء" /></div>
                        <div class="col-md-2"><label class="form-label">النوع</label><input type="text" class="form-control" id="cpSupplierType" placeholder="مواد، خدمات.." /></div>
                        <div class="col-md-2"><label class="form-label">الهاتف</label><input type="text" class="form-control" id="cpSupplierPhone" placeholder="07..." /></div>
                        <div class="col-md-4"><label class="form-label">العنوان</label><input type="text" class="form-control" id="cpSupplierAddress" placeholder="المدينة / الشارع" /></div>
                                <div class="col-md-1 d-flex align-items-end">
                                    <button class="btn btn-success w-100" type="submit" id="cpSupplierSubmitBtn"><i class="bi bi-plus-circle"></i></button>
                                </div>
                                <div class="col-12 d-flex gap-2" id="cpSupplierEditActions" style="display:none;">
                                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="expensesManager.cancelEditCreditPurchaseSupplier()"><i class="bi bi-x-circle"></i> إلغاء</button>
                                </div>
                    </form>
                    <div class="small text-muted mt-1">أدخل اسم المورد واضغط حفظ للإضافة. سيتم تحديث قائمة الموردين.</div>
                </div>
                <div id="cpSuppliersTableWrapper" class="table-responsive"></div>
            </div>
        </div>`;
    }

    renderCreditPurchaseAddSection(){
        const suppliers = this.getCreditPurchaseSuppliers();
        return `<div class="neumorphic-card">
            <div class="card-header d-flex justify-content-between align-items-center"><h4 class="mb-0"><i class="bi bi-cart-check me-2"></i>إضافة قيد شراء بالآجل</h4></div>
            <div class="card-body">
            <p class="text-muted mb-2">اختر <strong>نوع القيد</strong> أولاً ثم أكمل البيانات.</p>
            <div class="mb-3" id="cpTypeSelector"><label class="form-label"><i class="bi bi-ui-checks me-1"></i>نوع قيد الشراء بالآجل</label><div class="d-flex gap-2 flex-wrap"><button type="button" class="btn btn-outline-primary cp-type-btn" onclick="expensesManager.selectCreditPurchaseType('purchase_receipt')"><i class="bi bi-receipt"></i> وصل شراء</button><button type="button" class="btn btn-outline-primary cp-type-btn" onclick="expensesManager.selectCreditPurchaseType('measurement')"><i class="bi bi-rulers"></i> ذرعة محتسبة</button><span id="cpTypeSelectedBadge" class="badge bg-secondary align-self-center" style="display:none"></span></div></div>
            <form id="creditPurchaseForm" class="row g-3">
                <div class="col-md-3"><label class="form-label"><i class="bi bi-hash me-1"></i>رقم القيد</label><input type="text" class="form-control neumorphic-input" id="cpRegistrationNumber" value="CP-${Date.now().toString().slice(-6)}" readonly></div>
                <div class="col-md-3"><label class="form-label" id="cpDateLabel"><i class="bi bi-calendar me-1"></i>تاريخ الشراء</label><input type="date" class="form-control neumorphic-input" id="cpDate" value="${new Date().toISOString().split('T')[0]}" required></div>
                <div class="col-md-6"><label class="form-label"><i class="bi bi-building me-1"></i>المورد</label><select class="form-control neumorphic-input" id="cpVendorSelect" required disabled><option value="">اختر المورد</option>${suppliers.map(s=>`<option value='${s.id}'>${s.name}</option>`).join('')}</select></div>
                <div class="col-md-3" id="cpPurchaseReceiptNumberWrapper" style="display:none;"><label class="form-label"><i class="bi bi-receipt me-1"></i>رقم وصل الشراء</label><input type="text" class="form-control neumorphic-input" id="cpPurchaseReceiptNumber" placeholder="رقم الوصل" disabled></div>
                <div class="col-md-3" id="cpMeasurementNumberWrapper" style="display:none;"><label class="form-label"><i class="bi bi-rulers me-1"></i>رقم وصل الشراء/ الذرعة</label><input type="text" class="form-control neumorphic-input" id="cpMeasurementNumber" placeholder="رقم وصل الشراء/ الذرعة" disabled></div>
                <div class="col-md-8"><label class="form-label" id="cpDescriptionLabel"><i class="bi bi-file-text me-1"></i>وصف الشراء</label><input type="text" class="form-control neumorphic-input" id="cpDescription" placeholder="اختر نوع القيد أولاً" required disabled></div>
                <div class="col-md-4"><label class="form-label"><i class="bi bi-calendar-event me-1"></i>تاريخ الاستحقاق</label><input type="date" class="form-control neumorphic-input" id="cpDueDate" disabled></div>
                <!-- مبالغ وصل الشراء -->
                <div class="col-md-4" id="cpAmountUSDWrapper"><label class="form-label"><i class="bi bi-currency-dollar me-1"></i>المبلغ بالدولار</label><input type="number" class="form-control neumorphic-input" id="cpAmountUSD" step="0.01" min="0" placeholder="0.00" disabled></div>
                <div class="col-md-4" id="cpAmountIQDWrapper"><label class="form-label"><i class="bi bi-cash me-1"></i>المبلغ بالدينار</label><input type="number" class="form-control neumorphic-input" id="cpAmountIQD" step="1" min="0" placeholder="0" disabled></div>
                <div class="col-md-4" id="cpExchangeRateWrapper"><label class="form-label"><i class="bi bi-arrow-left-right me-1"></i>سعر الصرف</label><input type="number" class="form-control neumorphic-input" id="cpExchangeRate" value="1500" step="0.01" min="0" disabled></div>
                <!-- حقول الذرعة المحتسبة -->
                <div id="cpMeasurementFields" style="display:none;" class="row g-3 mx-0">
                    <div class="col-md-3"><label class="form-label"><i class="bi bi-currency-exchange me-1"></i>العملة</label><select id="cpMeasCurrency" class="form-control neumorphic-input" disabled onchange="expensesManager.updateMeasurementCurrencySuffix()"><option value="IQD">عراقي</option><option value="USD">دولار</option></select></div>
                    <div class="col-md-3"><label class="form-label">النوع</label><select id="cpMeasUnitType" class="form-control neumorphic-input" disabled><option value="م2">م2</option><option value="م3">م3</option><option value="م.ط">م.ط</option><option value="عدد">عدد</option><option value="طن">طن</option></select></div>
                    <div class="col-md-2"><label class="form-label">الكمية</label><input type="number" id="cpMeasQuantity" class="form-control neumorphic-input" step="0.01" min="0" placeholder="0" disabled oninput="expensesManager.computeMeasurementTotal()"></div>
                    <div class="col-md-2"><label class="form-label">سعر الوحدة</label><input type="number" id="cpMeasUnitPrice" class="form-control neumorphic-input" step="0.01" min="0" placeholder="0.00" disabled oninput="expensesManager.computeMeasurementTotal()"></div>
                    <div class="col-md-2"><label class="form-label">الحجز (%)</label><input type="number" id="cpMeasRetention" class="form-control neumorphic-input" step="0.01" min="0" max="100" value="0" disabled oninput="expensesManager.computeMeasurementTotal()"></div>
                    <div class="col-md-3"><label class="form-label">المبلغ الإجمالي</label><div class="input-group"><input type="text" id="cpMeasTotal" class="form-control neumorphic-input" readonly placeholder="0"><span class="input-group-text" id="cpMeasTotalCurrency">عراقي</span></div></div>
                    <div class="col-md-3"><label class="form-label">مبلغ الحجز</label><div class="input-group"><input type="text" id="cpMeasRetentionAmount" class="form-control neumorphic-input" readonly placeholder="0"><span class="input-group-text" id="cpMeasRetAmountCurrency">عراقي</span></div></div>
                </div>
                <div class="col-md-4"><label class="form-label"><i class="bi bi-flag me-1"></i>الحالة</label><select id="cpStatus" class="form-control neumorphic-input" disabled><option value="open">مفتوح</option><option value="partial">مسدد جزئياً</option><option value="closed">مغلق</option></select></div>
                <div class="col-md-12"><label class="form-label"><i class="bi bi-chat-text me-1"></i>ملاحظات</label><textarea id="cpNotes" class="form-control neumorphic-input" rows="2" placeholder="تفاصيل إضافية..." disabled></textarea></div>
                <div class="col-12 d-flex gap-2 flex-wrap"><button type="submit" class="btn btn-primary neumorphic-btn" id="cpSubmitBtn" disabled><i class="bi bi-save me-1"></i>حفظ</button><button type="reset" class="btn btn-secondary neumorphic-btn" id="cpResetBtn" disabled><i class="bi bi-arrow-counterclockwise me-1"></i>تفريغ</button><button type="button" class="btn btn-info neumorphic-btn" id="cpPreviewBtn" disabled onclick="expensesManager.previewCreditPurchase()"><i class="bi bi-eye me-1"></i>معاينة</button><button type="button" class="btn btn-warning neumorphic-btn" id="cpPrintBtn" disabled onclick="expensesManager.printCreditPurchaseInvoice()"><i class="bi bi-printer me-1"></i>طباعة فوترة</button><button type="button" class="btn btn-outline-success neumorphic-btn" onclick="expensesManager.exportCreditPurchases()"><i class="bi bi-file-earmark-excel me-1"></i>تصدير السجل</button></div>
            </form>
            <div id="creditPurchasePreview" class="mt-4" style="display:none;"><div class="border rounded p-3 bg-light"><h5 class="mb-3"><i class="bi bi-eye me-1"></i>معاينة الشراء بالآجل</h5><div id="creditPurchasePreviewContent"></div></div></div>
            <hr class="my-4"/><h5 class="mb-3"><i class="bi bi-journal-text me-1"></i>سجل القيود</h5><div id="creditPurchasesList" class="table-responsive"></div>
            </div></div>`;
    }

    renderCreditPurchaseSettlementSection(){
        return `<div class="neumorphic-card"><div class="card-header d-flex justify-content-between align-items-center"><h4 class="mb-0"><i class="bi bi-wallet2 me-2"></i>تسديد مبالغ الشراء بالآجل</h4><span class="badge bg-secondary">قيد التطوير</span></div><div class="card-body text-center text-muted"><i class="bi bi-tools display-6 d-block mb-3"></i><p class="mb-1">سيتم لاحقاً إدارة دفعات الموردين لكل قيد (دفعة جزئية / كاملة / رصيد متبق).</p><p class="small">اقترح الحقول المطلوبة: رقم الدفع، تاريخ، مبلغ، عملة، مرجع القيد، ملاحظات.</p></div></div>`;
    }

    setupCreditPurchaseSuppliersHandlers(){
        const supplierForm = document.getElementById('cpSupplierForm');
        if(supplierForm){
            supplierForm.addEventListener('submit',(ev)=>{
                ev.preventDefault();
                const name = document.getElementById('cpSupplierName').value.trim();
                if(!name){ alert('اسم المورد مطلوب'); return; }
                const payload = {
                    name,
                    type: document.getElementById('cpSupplierType').value.trim(),
                    phone: document.getElementById('cpSupplierPhone').value.trim(),
                    address: document.getElementById('cpSupplierAddress').value.trim()
                };
                if(this.editingCreditPurchaseSupplierId){
                    this.updateCreditPurchaseSupplier(this.editingCreditPurchaseSupplierId, payload);
                    this.editingCreditPurchaseSupplierId = null;
                    document.getElementById('cpSupplierSubmitBtn').innerHTML = '<i class="bi bi-plus-circle"></i>';
                    document.getElementById('cpSupplierSubmitBtn').classList.remove('btn-warning');
                    document.getElementById('cpSupplierSubmitBtn').classList.add('btn-success');
                    const actions = document.getElementById('cpSupplierEditActions'); if(actions) actions.style.display='none';
                } else {
                    const newSupplier = { id: 'SUP-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), ...payload, createdAt: new Date().toISOString() };
                    this.addCreditPurchaseSupplier(newSupplier);
                }
                supplierForm.reset();
                this.refreshCreditPurchaseSuppliersUI();
                alert('تم الحفظ');
            });
        }
    }

    setupCreditPurchaseAddFormHandlers(){
        const form = document.getElementById('creditPurchaseForm');
        if(!form) return;
        form.addEventListener('submit',(e)=>{
            e.preventDefault();
            if(!this.creditPurchaseType){
                alert('يرجى اختيار نوع قيد الشراء (وصل شراء أو ذرعة محتسبة)');
                return;
            }
            const list = StorageManager.getData(StorageManager.STORAGE_KEYS.CREDIT_PURCHASES) || [];
            const supplierId = document.getElementById('cpVendorSelect')?.value || '';
            const supplierObj = this.getCreditPurchaseSuppliers().find(s=>s.id===supplierId);
            const isMeas = this.creditPurchaseType === 'measurement';
            const measCurrency = document.getElementById('cpMeasCurrency')?.value || 'IQD';
            const totalMeas = isMeas ? this.computeMeasurementTotal() : 0;
            // Compute retention numerically to avoid localized input parsing
            const _g = (parseFloat(document.getElementById('cpMeasQuantity')?.value)||0) * (parseFloat(document.getElementById('cpMeasUnitPrice')?.value)||0);
            const _rp = Math.min(100, Math.max(0, parseFloat(document.getElementById('cpMeasRetention')?.value)||0));
            const _ra = _g * _rp / 100;
            const entry = {
                type: 'credit_purchase',
                creditType: this.creditPurchaseType,
                purchaseReceiptNumber: this.creditPurchaseType === 'purchase_receipt' ? (document.getElementById('cpPurchaseReceiptNumber').value || '') : '',
                measurementNumber: isMeas ? (document.getElementById('cpMeasurementNumber')?.value || '') : '',
                registrationNumber: document.getElementById('cpRegistrationNumber').value,
                date: document.getElementById('cpDate').value,
                vendor: supplierObj ? supplierObj.name : '',
                vendorId: supplierObj ? supplierObj.id : null,
                description: document.getElementById('cpDescription').value.trim(),
                dueDate: document.getElementById('cpDueDate').value || null,
                amountUSD: isMeas ? (measCurrency==='USD' ? totalMeas : 0) : (parseFloat(document.getElementById('cpAmountUSD').value) || 0),
                amountIQD: isMeas ? (measCurrency==='IQD' ? totalMeas : 0) : (parseFloat(document.getElementById('cpAmountIQD').value) || 0),
                exchangeRate: isMeas ? (parseFloat(document.getElementById('cpExchangeRate')?.value)||1500) : (parseFloat(document.getElementById('cpExchangeRate').value) || 0),
                measDetails: isMeas ? {
                    currency: measCurrency,
                    unitType: document.getElementById('cpMeasUnitType')?.value || '',
                    quantity: parseFloat(document.getElementById('cpMeasQuantity')?.value)||0,
                    unitPrice: parseFloat(document.getElementById('cpMeasUnitPrice')?.value)||0,
                    retentionPct: Math.min(100, Math.max(0, parseFloat(document.getElementById('cpMeasRetention')?.value)||0)),
                    retentionAmount: _ra,
                    total: totalMeas
                } : null,
                status: document.getElementById('cpStatus').value,
                notes: document.getElementById('cpNotes').value.trim(),
                createdAt: new Date().toISOString()
            };
            // إذا كنا في وضع تعديل سجل موجود، حدثه بدلاً من الإضافة
            if(this.editingCreditPurchaseId){
                const idx = list.findIndex(x => x.registrationNumber === this.editingCreditPurchaseId);
                if(idx > -1){ list[idx] = { ...list[idx], ...entry, registrationNumber: this.editingCreditPurchaseId, updatedAt: new Date().toISOString() }; }
            } else {
                list.push(entry);
            }
            StorageManager.saveData(StorageManager.STORAGE_KEYS.CREDIT_PURCHASES, list);
            this.renderCreditPurchasesTable();
            form.reset();
            // regenerate number for next entry
            document.getElementById('cpRegistrationNumber').value = 'CP-' + Date.now().toString().slice(-6);
            this.editingCreditPurchaseId = null;
            this.creditPurchaseType = null;
        });
    }

    // طباعة سجل موجود من القائمة
    printExistingCreditPurchase(regNo){
    // تأكيد قبل الطباعة
    if(!confirm('تأكيد الطباعة؟')) return;
        const all = StorageManager.getData(StorageManager.STORAGE_KEYS.CREDIT_PURCHASES) || [];
        const it = all.find(x => x.registrationNumber === regNo);
        if(!it) return;
        // جهز نفس بنية البيانات المستخدمة في الطباعة الحالية
        const isMeas = it.creditType === 'measurement';
        const data = {
            registrationNumber: it.registrationNumber,
            date: new Date(it.date).toLocaleDateString('ar-IQ'),
            dueDate: it.dueDate ? new Date(it.dueDate).toLocaleDateString('ar-IQ') : '-',
            description: it.description,
            vendor: it.vendor,
            type: isMeas ? 'ذرعة محتسبة' : 'وصل شراء',
            status: it.status || 'open',
            amountUSD: it.amountUSD || 0,
            amountIQD: it.amountIQD || 0,
            exchangeRate: it.exchangeRate || 0,
            receiptNumber: isMeas ? (it.measurementNumber || '-') : (it.purchaseReceiptNumber || '-'),
            creditType: it.creditType,
            measCurrency: it.measDetails?.currency,
            measUnitType: it.measDetails?.unitType,
            measQuantity: it.measDetails?.quantity,
            measUnitPrice: it.measDetails?.unitPrice,
            measRetention: it.measDetails?.retentionPct,
            measRetentionAmount: it.measDetails?.retentionAmount,
            measTotal: it.measDetails?.total,
            notes: it.notes
        };
        const html = this.generateCreditPurchaseInvoiceHTML(data);
        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
        setTimeout(()=>{ w.focus(); w.print(); }, 300);
    }

    // تحرير سجل: تعبئة النموذج بالقيم وإتاحة الحفظ كتحديث
    editCreditPurchase(regNo){
        const all = StorageManager.getData(StorageManager.STORAGE_KEYS.CREDIT_PURCHASES) || [];
        const it = all.find(x => x.registrationNumber === regNo);
        if(!it) return;
        // انتقل لشاشة الإضافة لضبط الحقول
        this.loadCreditPurchaseView('add');
        // اختر النوع
        this.selectCreditPurchaseType(it.creditType === 'measurement' ? 'measurement' : 'purchase_receipt');
        this.editingCreditPurchaseId = regNo;
        // املأ الحقول
        document.getElementById('cpRegistrationNumber').value = regNo;
        document.getElementById('cpDate').value = it.date ? it.date.split('T')[0] || it.date : '';
        // المورد بالاسم فقط حالياً (لدينا vendorId إن وجد)
        const vendorSel = document.getElementById('cpVendorSelect');
        if(vendorSel){ vendorSel.disabled = false; if(it.vendorId){ vendorSel.value = it.vendorId; } }
        document.getElementById('cpDescription').value = it.description || '';
        document.getElementById('cpDueDate').value = it.dueDate ? it.dueDate.split('T')[0] || it.dueDate : '';
        document.getElementById('cpStatus').value = it.status || 'open';
        document.getElementById('cpNotes').value = it.notes || '';
        if(it.creditType === 'measurement'){
            document.getElementById('cpMeasurementNumber').value = it.measurementNumber || '';
            document.getElementById('cpMeasCurrency').value = it.measDetails?.currency || 'IQD';
            ['cpMeasCurrency','cpMeasUnitType','cpMeasQuantity','cpMeasUnitPrice','cpMeasRetention'].forEach(id=>{ const el=document.getElementById(id); if(el) el.disabled=false; });
            document.getElementById('cpMeasUnitType').value = it.measDetails?.unitType || 'م2';
            document.getElementById('cpMeasQuantity').value = it.measDetails?.quantity ?? 0;
            document.getElementById('cpMeasUnitPrice').value = it.measDetails?.unitPrice ?? 0;
            document.getElementById('cpMeasRetention').value = it.measDetails?.retentionPct ?? 0;
            this.computeMeasurementTotal();
        } else {
            document.getElementById('cpPurchaseReceiptNumber').value = it.purchaseReceiptNumber || '';
            document.getElementById('cpAmountUSD').value = it.amountUSD || 0;
            document.getElementById('cpAmountIQD').value = it.amountIQD || 0;
            document.getElementById('cpExchangeRate').value = it.exchangeRate || 0;
        }
        // تفعيل الحفظ والمعاينة والطباعة
        ['cpSubmitBtn','cpPreviewBtn','cpPrintBtn','cpResetBtn'].forEach(id=>{ const el=document.getElementById(id); if(el) el.disabled=false; });
    }

    // حذف سجل
    deleteCreditPurchase(regNo){
        if(!confirm('هل تريد حذف هذا السجل؟')) return;
    const all = StorageManager.getData(StorageManager.STORAGE_KEYS.CREDIT_PURCHASES) || [];
    const found = all.find(x => x.registrationNumber === regNo) || null;
    const next = all.filter(x => x.registrationNumber !== regNo);
        StorageManager.saveData(StorageManager.STORAGE_KEYS.CREDIT_PURCHASES, next);
    // خزّن آخر محذوف لإتاحة التراجع
    this._lastDeletedCreditPurchase = found;
        this.renderCreditPurchasesTable();
    // أظهر شريط التراجع
    if(found){ this.showCreditPurchaseUndoBar(`تم حذف القيد ${found.registrationNumber}`); }
    }

    // تفعيل الحقول حسب اختيار النوع
    selectCreditPurchaseType(type){
        this.creditPurchaseType = type;
        // تحديث مظهر الأزرار
        document.querySelectorAll('.cp-type-btn').forEach(btn => {
            const isSelected = btn.getAttribute('onclick').includes(type);
            btn.classList.toggle('btn-primary', isSelected);
            btn.classList.toggle('btn-outline-primary', !isSelected);
        });
        // تفعيل الحقول العامة
        ['cpDescription','cpDueDate','cpStatus','cpNotes','cpSubmitBtn','cpResetBtn'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.disabled = false;
        });
        const vSel = document.getElementById('cpVendorSelect'); if(vSel) vSel.disabled = false;
        ['cpPreviewBtn','cpPrintBtn'].forEach(id=>{const el=document.getElementById(id); if(el) el.disabled=false;});

        const receiptWrap = document.getElementById('cpPurchaseReceiptNumberWrapper');
        const receiptInput = document.getElementById('cpPurchaseReceiptNumber');
        const measWrap = document.getElementById('cpMeasurementFields');
        const measNumWrap = document.getElementById('cpMeasurementNumberWrapper');
        const measNumInput = document.getElementById('cpMeasurementNumber');
        const dateLabel = document.getElementById('cpDateLabel');
        const amountUSDW = document.getElementById('cpAmountUSDWrapper');
        const amountIQDW = document.getElementById('cpAmountIQDWrapper');
        const exRateW = document.getElementById('cpExchangeRateWrapper');
        // تبديل بين وضع الوصل والذرعة
        if(type === 'purchase_receipt'){
            // وصل شراء
            if(dateLabel) dateLabel.innerHTML = '<i class="bi bi-calendar me-1"></i>تاريخ الشراء';
            if(receiptWrap){ receiptWrap.style.display='block'; }
            if(receiptInput){ receiptInput.disabled=false; }
            if(measWrap) measWrap.style.display='none';
            if(measNumWrap) measNumWrap.style.display='none';
            if(measNumInput){ measNumInput.disabled = true; measNumInput.value=''; }
            // مبالغ مباشرة
            ;[amountUSDW,amountIQDW,exRateW].forEach(w=>{ if(w) w.style.display='block'; });
            // تمكين مدخلات المبالغ
            ['cpAmountUSD','cpAmountIQD','cpExchangeRate'].forEach(id=>{ const el=document.getElementById(id); if(el) el.disabled=false; });
        } else {
            // ذرعة محتسبة
            if(dateLabel) dateLabel.innerHTML = '<i class="bi bi-calendar me-1"></i>تاريخ الاحتساب';
            if(receiptWrap){ receiptWrap.style.display='none'; }
            if(receiptInput){ receiptInput.disabled=true; receiptInput.value=''; }
            if(measWrap) measWrap.style.display='flex';
            if(measNumWrap) measNumWrap.style.display='block';
            if(measNumInput){ measNumInput.disabled = false; }
            ;[amountUSDW,amountIQDW,exRateW].forEach(w=>{ if(w) w.style.display='none'; });
            // تمكين حقول الذرعة
            ['cpMeasCurrency','cpMeasUnitType','cpMeasQuantity','cpMeasUnitPrice','cpMeasRetention'].forEach(id=>{ const el=document.getElementById(id); if(el) el.disabled=false; });
            // ensure currency suffix is correct when toggled
            this.updateMeasurementCurrencySuffix();
        }
        const desc = document.getElementById('cpDescription');
        const label = document.getElementById('cpDescriptionLabel');
        const badge = document.getElementById('cpTypeSelectedBadge');
        if(type === 'measurement'){
            if(label) label.innerHTML = '<i class="bi bi-rulers me-1"></i>وصف الشراء';
            if(desc) desc.placeholder = 'مثال: ذرعة أعمال ...';
            if(badge){ badge.textContent = 'ذرعة محتسبة'; badge.style.display='inline-block'; }
        } else {
            if(label) label.innerHTML = '<i class="bi bi-file-text me-1"></i>وصف الشراء';
            if(desc) desc.placeholder = 'مثال: شراء مواد بناء ...';
            if(badge){ badge.textContent = 'وصل شراء'; badge.style.display='inline-block'; }
        }
        if(desc) desc.focus();
    }

    // حساب إجمالي الذرعة: الكمية * سعر الوحدة - الحجز%
    computeMeasurementTotal(){
        const qty = parseFloat(document.getElementById('cpMeasQuantity')?.value)||0;
        const price = parseFloat(document.getElementById('cpMeasUnitPrice')?.value)||0;
        const ret = Math.min(100, Math.max(0, parseFloat(document.getElementById('cpMeasRetention')?.value)||0));
        const gross = qty * price;
        const retAmount = gross * ret/100;
        const total = gross - retAmount;
        const out = document.getElementById('cpMeasTotal');
        // Localize formatting inside the read-only inputs according to selected currency
        const cur = document.getElementById('cpMeasCurrency')?.value || 'IQD';
        if(out){
            if(cur === 'USD'){
                out.value = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total);
            } else {
                out.value = new Intl.NumberFormat('ar-IQ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(total);
            }
        }
        const retOut = document.getElementById('cpMeasRetentionAmount');
        if(retOut){
            if(cur === 'USD'){
                retOut.value = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(retAmount);
            } else {
                retOut.value = new Intl.NumberFormat('ar-IQ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(retAmount);
            }
        }
        // keep currency suffixes in sync
        this.updateMeasurementCurrencySuffix();
        return total;
    }

    updateMeasurementCurrencySuffix(){
        const cur = document.getElementById('cpMeasCurrency')?.value || 'IQD';
        const totalSuf = document.getElementById('cpMeasTotalCurrency');
        const retSuf = document.getElementById('cpMeasRetAmountCurrency');
        const label = cur==='USD' ? 'دولار' : 'عراقي';
        if(totalSuf) totalSuf.textContent = label;
        if(retSuf) retSuf.textContent = label;
    }

    renderCreditPurchasesTable() {
        const container = document.getElementById('creditPurchasesList');
        if (!container) return;
        const data = StorageManager.getAllData();
        const all = (data.creditPurchases || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));

        // واجهة الفلاتر المتقدمة + منطقة التراجع
        const suppliers = this.getCreditPurchaseSuppliers();
        const vendorOptions = ['<option value="">الكل</option>'].concat(
            suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`) 
        ).join('');

        container.innerHTML = `
            <div id="cpUndoBar" class="alert alert-warning py-2 px-3" style="display:none"></div>
            <div class="row g-2 mb-2 align-items-end">
                <div class="col-md-3">
                    <label class="form-label small"><i class="bi bi-upc-scan me-1"></i>رقم القيد (يدعم الباركود)</label>
                    <input type="text" id="cpFReg" class="form-control form-control-sm" placeholder="أدخل/امسح الباركود" value="${this.cpFilters.reg||''}" oninput="expensesManager.onCPFiltersChange('reg', this.value)">
                </div>
                <div class="col-md-3">
                    <label class="form-label small"><i class="bi bi-building me-1"></i>المورد</label>
                    <select id="cpFVendor" class="form-control form-control-sm" onchange="expensesManager.onCPFiltersChange('vendorId', this.value)">${vendorOptions}</select>
                </div>
                <div class="col-md-2">
                    <label class="form-label small"><i class="bi bi-list-check me-1"></i>نوع القيد</label>
                    <select id="cpFType" class="form-control form-control-sm" onchange="expensesManager.onCPFiltersChange('type', this.value)">
                        <option value="">الكل</option>
                        <option value="purchase_receipt">وصل شراء</option>
                        <option value="measurement">ذرعة محتسبة</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <label class="form-label small"><i class="bi bi-calendar me-1"></i>من تاريخ الشراء</label>
                    <input type="date" id="cpFDateFrom" class="form-control form-control-sm" value="${this.cpFilters.dateFrom||''}" oninput="expensesManager.onCPFiltersChange('dateFrom', this.value)">
                </div>
                <div class="col-md-2">
                    <label class="form-label small"><i class="bi bi-calendar me-1"></i>إلى تاريخ الشراء</label>
                    <input type="date" id="cpFDateTo" class="form-control form-control-sm" value="${this.cpFilters.dateTo||''}" oninput="expensesManager.onCPFiltersChange('dateTo', this.value)">
                </div>
                <div class="col-md-2">
                    <label class="form-label small"><i class="bi bi-calendar-event me-1"></i>من الاستحقاق</label>
                    <input type="date" id="cpFDueFrom" class="form-control form-control-sm" value="${this.cpFilters.dueFrom||''}" oninput="expensesManager.onCPFiltersChange('dueFrom', this.value)">
                </div>
                <div class="col-md-2">
                    <label class="form-label small"><i class="bi bi-calendar-event me-1"></i>إلى الاستحقاق</label>
                    <input type="date" id="cpFDueTo" class="form-control form-control-sm" value="${this.cpFilters.dueTo||''}" oninput="expensesManager.onCPFiltersChange('dueTo', this.value)">
                </div>
                <div class="col-md-2 d-grid">
                    <button class="btn btn-sm btn-secondary" onclick="expensesManager.resetCPFilters()"><i class="bi bi-arrow-counterclockwise me-1"></i>إعادة</button>
                </div>
                <div class="col text-end align-self-center small text-muted">
                    <span id="cpCountBadge"></span>
                </div>
            </div>
            <table class="table table-sm table-striped align-middle">
                <thead>
                    <tr>
                        <th>القيد</th><th>التاريخ/الاحتساب</th><th>النوع</th><th>المورد</th><th>الوصف</th><th>الاستحقاق</th><th>دولار</th><th>دينار</th><th>الحالة</th><th>رقم وصل الشراء/ الذرعة</th><th>إجراءات</th>
                    </tr>
                </thead>
                <tbody id="cpTableBody"></tbody>
            </table>`;

        // اضبط قيم القوائم بعد الحقن
        const vSel = document.getElementById('cpFVendor'); if(vSel) vSel.value = this.cpFilters.vendorId || '';
        const tSel = document.getElementById('cpFType'); if(tSel) tSel.value = this.cpFilters.type || '';

        // ارسم الصفوف فقط (لمنع فقدان الإدخال أثناء الكتابة)
        this.renderCreditPurchasesRows(all);
    }

    onCreditPurchasesSearch(value){
        this.cpSearchQuery = value;
        // لم تعد تستخدم للبحث المباشر، لكن يمكن الحفاظ عليها كبحث نصي إضافي لاحقاً
        const data = StorageManager.getAllData();
        const all = (data.creditPurchases || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));
        this.renderCreditPurchasesRows(all);
    }

    // تطبيق فلاتر متقدمة
    onCPFiltersChange(key, value){
        this.cpFilters[key] = value;
        const data = StorageManager.getAllData();
        const all = (data.creditPurchases || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));
        this.renderCreditPurchasesRows(all);
    }

    resetCPFilters(){
        this.cpFilters = { vendorId: '', type: '', dateFrom: '', dateTo: '', dueFrom: '', dueTo: '', reg: '' };
        const data = StorageManager.getAllData();
        const all = (data.creditPurchases || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));
        this.renderCreditPurchasesRows(all);
        // تحديث واجهة الحقول
        ['cpFReg','cpFDateFrom','cpFDateTo','cpFDueFrom','cpFDueTo'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
        const vSel = document.getElementById('cpFVendor'); if(vSel) vSel.value='';
        const tSel = document.getElementById('cpFType'); if(tSel) tSel.value='';
    }

    getFilteredCreditPurchases(list){
        const f = this.cpFilters || {};
        const txt = (this.cpSearchQuery || '').trim().toLowerCase();
        const toDate = (v)=> v ? new Date(v) : null;
        const df = toDate(f.dateFrom), dt = toDate(f.dateTo), duf = toDate(f.dueFrom), dut = toDate(f.dueTo);
        const norm = (s)=> (s||'').toString().toLowerCase();
        return (list||[]).filter(it => {
            // vendor
            if(f.vendorId && (it.vendorId || '') !== f.vendorId) return false;
            // type
            if(f.type && (it.creditType || '') !== f.type) return false;
            // purchase date range
            const d = new Date(it.date);
            if(df && d < df) return false;
            if(dt && d > dt) return false;
            // due date range
            if(duf || dut){
                if(!it.dueDate) return false;
                const dd = new Date(it.dueDate);
                if(duf && dd < duf) return false;
                if(dut && dd > dut) return false;
            }
            // registration number (supports barcode scan - usually typed fast then Enter)
            if(f.reg){ if(!norm(it.registrationNumber).startsWith(norm(f.reg))) return false; }
            // free text query (legacy single box)
            if(txt){
                const hay = [it.registrationNumber, it.vendor, it.description, it.creditType, it.purchaseReceiptNumber, it.measurementNumber]
                    .map(norm).join(' ');
                if(!hay.includes(txt)) return false;
            }
            return true;
        });
    }

    renderCreditPurchasesRows(all){
        const body = document.getElementById('cpTableBody');
        const countBadge = document.getElementById('cpCountBadge');
        const items = this.getFilteredCreditPurchases(all).sort((a,b)=> new Date(b.date) - new Date(a.date));
        if(!body){ return; }
        if(items.length===0){
            body.innerHTML = `<tr><td colspan="11" class="text-center text-muted py-3"><i class="bi bi-inbox"></i> لا توجد قيود مطابقة</td></tr>`;
            if(countBadge) countBadge.textContent = `0 / ${all.length} سجل`;
            return;
        }
        body.innerHTML = items.map(it => `
            <tr>
                <td>${it.registrationNumber}</td>
                <td>${new Date(it.date).toLocaleDateString('ar-IQ')}</td>
                <td>${it.creditType === 'measurement' ? 'ذرعة' : 'وصل شراء'}</td>
                <td>${it.vendor || '-'}</td>
                <td>${it.description || '-'}</td>
                <td>${it.dueDate ? new Date(it.dueDate).toLocaleDateString('ar-IQ') : '-'}</td>
                <td>${this.formatCurrency(it.amountUSD, 'USD')}</td>
                <td>${this.formatCurrency(it.amountIQD, 'IQD')}</td>
                <td>${it.status}</td>
                <td>${it.creditType==='measurement' ? (it.measurementNumber || '-') : (it.purchaseReceiptNumber || '-')}</td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-warning me-1" title="طباعة" onclick="expensesManager.printExistingCreditPurchase('${it.registrationNumber}')"><i class="bi bi-printer"></i></button>
                    <button class="btn btn-sm btn-primary me-1" title="تعديل" onclick="expensesManager.editCreditPurchase('${it.registrationNumber}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" title="حذف" onclick="expensesManager.deleteCreditPurchase('${it.registrationNumber}')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`).join('');
        if(countBadge) countBadge.textContent = `${items.length} / ${all.length} سجل`;
    }

    // شريط تراجع بعد الحذف
    showCreditPurchaseUndoBar(message){
        const bar = document.getElementById('cpUndoBar');
        if(!bar) return;
        bar.innerHTML = `${message} <button class="btn btn-sm btn-outline-dark ms-2" onclick="expensesManager.undoDeleteCreditPurchase()"><i class="bi bi-arrow-90deg-left"></i> تراجع</button>`;
        bar.style.display = 'block';
        clearTimeout(this._cpUndoTimer);
        this._cpUndoTimer = setTimeout(()=>{ this.hideCreditPurchaseUndoBar(); }, 8000);
    }
    hideCreditPurchaseUndoBar(){
        const bar = document.getElementById('cpUndoBar');
        if(bar){ bar.style.display='none'; bar.innerHTML=''; }
        clearTimeout(this._cpUndoTimer); this._cpUndoTimer = null;
    }
    undoDeleteCreditPurchase(){
        if(!this._lastDeletedCreditPurchase) { this.hideCreditPurchaseUndoBar(); return; }
        const all = StorageManager.getData(StorageManager.STORAGE_KEYS.CREDIT_PURCHASES) || [];
        all.push(this._lastDeletedCreditPurchase);
        StorageManager.saveData(StorageManager.STORAGE_KEYS.CREDIT_PURCHASES, all);
        this._lastDeletedCreditPurchase = null;
        this.hideCreditPurchaseUndoBar();
        // أعد تحميل الصفوف فقط
        const data = StorageManager.getAllData();
        const list = (data.creditPurchases || []).slice();
        this.renderCreditPurchasesRows(list);
    }

    exportCreditPurchases() {
        const data = StorageManager.getAllData();
        const items = data.creditPurchases || [];
        if (items.length === 0) {
            alert('لا توجد بيانات للتصدير');
            return;
        }
    const csvRows = [
            ['Registration','Date','Type','Vendor','Description','DueDate','AmountUSD','AmountIQD','ExchangeRate','Status','ReceiptNumber','Notes','MeasurementNumber','MeasCurrency','MeasUnitType','MeasQuantity','MeasUnitPrice','MeasRetention','MeasRetentionAmount','MeasTotal']
        .join(',')
    ];
        items.forEach(it => {
            csvRows.push([
                it.registrationNumber,
                it.date,
                it.creditType || '',
                it.vendor,
                it.description,
                it.dueDate || '',
                it.amountUSD,
                it.amountIQD,
                it.exchangeRate,
                it.status,
                it.purchaseReceiptNumber || '',
        (it.notes || '').replace(/\n/g,' '),
        it.measurementNumber || '',
        (it.measDetails && it.measDetails.currency) || '',
        (it.measDetails && it.measDetails.unitType) || '',
        (it.measDetails && it.measDetails.quantity) || '',
        (it.measDetails && it.measDetails.unitPrice) || '',
                (it.measDetails && it.measDetails.retentionPct) || '',
                (it.measDetails && it.measDetails.retentionAmount) || '',
        (it.measDetails && it.measDetails.total) || ''
            ].map(v => `"${(v!==undefined && v!==null? v : '').toString().replace(/"/g,'""')}"`).join(','));
        });
        const blob = new Blob([csvRows.join('\n')], {type: 'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'credit_purchases.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    // معاينة عملية الشراء بالآجل
    previewCreditPurchase(){
        if(!this.creditPurchaseType){ alert('اختر نوع القيد أولاً'); return; }
        const vSel = document.getElementById('cpVendorSelect');
        const supplierObj = vSel ? this.getCreditPurchaseSuppliers().find(s=>s.id===vSel.value) : null;
        const isMeas = this.creditPurchaseType==='measurement';
        const totalMeas = isMeas ? this.computeMeasurementTotal() : 0;
        const measCurrency = document.getElementById('cpMeasCurrency')?.value || 'IQD';
            const data = {
            registrationNumber: document.getElementById('cpRegistrationNumber').value,
            type: isMeas ? 'ذرعة محتسبة' : 'وصل شراء',
            vendor: supplierObj ? supplierObj.name : '',
            date: document.getElementById('cpDate').value,
            dueDate: document.getElementById('cpDueDate').value,
            description: document.getElementById('cpDescription').value,
            amountUSD: isMeas ? (measCurrency==='USD'? totalMeas : 0) : document.getElementById('cpAmountUSD').value,
            amountIQD: isMeas ? (measCurrency==='IQD'? totalMeas : 0) : document.getElementById('cpAmountIQD').value,
            exchangeRate: document.getElementById('cpExchangeRate').value,
            status: document.getElementById('cpStatus').value,
            receiptNumber: (!isMeas) ? document.getElementById('cpPurchaseReceiptNumber').value : (document.getElementById('cpMeasurementNumber')?.value || ''),
                notes: document.getElementById('cpNotes').value,
            creditType: this.creditPurchaseType,
            measCurrency: measCurrency,
            measUnitType: document.getElementById('cpMeasUnitType')?.value || '',
            measQuantity: parseFloat(document.getElementById('cpMeasQuantity')?.value)||0,
            measUnitPrice: parseFloat(document.getElementById('cpMeasUnitPrice')?.value)||0,
                measRetention: parseFloat(document.getElementById('cpMeasRetention')?.value)||0,
                measRetentionAmount: parseFloat(document.getElementById('cpMeasRetentionAmount')?.value)||0,
                measTotal: totalMeas
        };
        const container = document.getElementById('creditPurchasePreviewContent');
        if(container){
            const hasUSD = parseFloat(data.amountUSD) > 0;
            const hasIQD = parseFloat(data.amountIQD) > 0;
            const currencyLabel = hasUSD && hasIQD ? 'معاملة مختلطة (دينار ودولار)' : (hasUSD ? 'بالدولار' : (hasIQD ? 'بالدينار' : 'بدون مبلغ'));
            const dateLbl = isMeas ? 'تاريخ الاحتساب' : 'التاريخ';
            const recLbl = 'رقم وصل الشراء/ الذرعة';
            // Ensure retentionAmount is numeric and not taken from localized string
            const _qty = parseFloat(document.getElementById('cpMeasQuantity')?.value)||0;
            const _price = parseFloat(document.getElementById('cpMeasUnitPrice')?.value)||0;
            const _retPct = Math.min(100, Math.max(0, parseFloat(document.getElementById('cpMeasRetention')?.value)||0));
            const _gross = _qty * _price;
            const _retAmount = _gross * _retPct / 100;
            data.measRetentionAmount = _retAmount;
            // Pre-format measurement numbers for display using selected currency
            const measCur = data.measCurrency || 'IQD';
            const measTotalFormatted = this.formatCurrency(data.measTotal || 0, measCur);
            const measRetFormatted = this.formatCurrency(data.measRetentionAmount || 0, measCur);
            const measBlock = isMeas ? `
                <div class="col-12">
                    <div class="p-2 mt-2" style="background:#f7fbff;border:1px solid #d6e9ff;border-radius:4px;">
                        <h6 class="mb-2"><i class="bi bi-rulers me-1"></i>تفاصيل الذرعة</h6>
                        <table class="table table-sm table-borderless mb-0 align-middle" style="direction:rtl;">
                            <tbody>
                                <tr><td class="text-end fw-bold" style="width:140px;">العملة:</td><td>${data.measCurrency}</td>
                                    <td class="text-end fw-bold" style="width:140px;">نوع الوحدة:</td><td>${data.measUnitType || '-'}</td></tr>
                                <tr><td class="text-end fw-bold">الكمية:</td><td>${data.measQuantity}</td>
                                    <td class="text-end fw-bold">سعر الوحدة:</td><td>${data.measUnitPrice}</td></tr>
                                <tr><td class="text-end fw-bold">الحجز (%):</td><td>${data.measRetention}</td>
                                    <td class="text-end fw-bold">مبلغ الحجز:</td><td>${measRetFormatted}</td></tr>
                                <tr><td class="text-end fw-bold">الإجمالي المحتسب:</td><td>${measTotalFormatted}</td>
                                    <td></td><td></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>` : '';
            container.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="p-2" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:4px;">
                            <table class="table table-sm table-borderless mb-0 align-middle" style="direction:rtl;">
                                <tbody>
                                    <tr><td class="text-end fw-bold" style="width:140px;">رقم القيد:</td><td>${data.registrationNumber}</td></tr>
                                    <tr><td class="text-end fw-bold">${dateLbl}:</td><td>${data.date || '-'}</td></tr>
                                    <tr><td class="text-end fw-bold">النوع:</td><td>${data.type}</td></tr>
                                    <tr><td class="text-end fw-bold">الاستحقاق:</td><td>${data.dueDate || '-'}</td></tr>
                                    <tr><td class="text-end fw-bold">المورد:</td><td>${data.vendor || '-'}</td></tr>
                                    ${data.receiptNumber ? `<tr><td class='text-end fw-bold'>${recLbl}:</td><td>${data.receiptNumber}</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-2" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:4px;">
                            <table class="table table-sm table-borderless mb-0 align-middle" style="direction:rtl;">
                                <tbody>
                                    <tr><td class="text-end fw-bold" style="width:140px;">المبلغ بالدينار:</td><td>${hasIQD ? this.formatCurrency(parseFloat(data.amountIQD)||0,'IQD') : '—'}</td></tr>
                                    <tr><td class="text-end fw-bold">المبلغ بالدولار:</td><td>${hasUSD ? this.formatCurrency(parseFloat(data.amountUSD)||0,'USD') : '—'}</td></tr>
                                    <tr><td class="text-end fw-bold">سعر الصرف:</td><td>${data.exchangeRate || (hasUSD && hasIQD ? '—' : (data.exchangeRate||'-'))}</td></tr>
                                    <tr><td class="text-end fw-bold">الحالة:</td><td>${data.status}</td></tr>
                                    <tr><td class="text-end fw-bold">تصنيف العملة:</td><td>${currencyLabel}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    ${measBlock}
                    <div class="col-12">
                        <div class="p-3" style="background:#fff;border:1px solid #eee;border-radius:4px;">
                            <div class="mb-2"><span class="fw-bold">الوصف:</span> ${data.description || '-'}</div>
                            ${data.notes ? `<div><span class='fw-bold'>ملاحظات:</span> ${data.notes}</div>`:''}
                            <div class="mt-3">
                                <span class="badge bg-warning text-dark" style="font-size:0.8rem;">نوع المعاملة: ${data.type} | ${currencyLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            document.getElementById('creditPurchasePreview').style.display='block';
        }
    }

    // طباعة الفوترة
    printCreditPurchaseInvoice(){
        // جمع البيانات (لا نعتمد فقط على المعاينة حتى لو لم تُضغط زر معاينة)
        if(!this.creditPurchaseType){ alert('اختر نوع القيد أولاً'); return; }
    if(!confirm('تأكيد الطباعة؟')) return;
        const vSel2 = document.getElementById('cpVendorSelect');
        const supplierObj2 = vSel2 ? this.getCreditPurchaseSuppliers().find(s=>s.id===vSel2.value) : null;
        const isMeas2 = this.creditPurchaseType==='measurement';
        const totalMeas2 = isMeas2 ? this.computeMeasurementTotal() : 0;
        const measCurrency2 = document.getElementById('cpMeasCurrency')?.value || 'IQD';
        // احسب مبلغ الحجز لضمان ظهوره في الطباعة كما في المعاينة
        const qty2 = parseFloat(document.getElementById('cpMeasQuantity')?.value)||0;
        const unitPrice2 = parseFloat(document.getElementById('cpMeasUnitPrice')?.value)||0;
        const retPct2 = parseFloat(document.getElementById('cpMeasRetention')?.value)||0;
        const gross2 = qty2 * unitPrice2;
        const retAmount2 = gross2 * retPct2/100;
        const data = {
            registrationNumber: document.getElementById('cpRegistrationNumber').value,
            type: isMeas2 ? 'ذرعة محتسبة' : 'وصل شراء',
            vendor: supplierObj2 ? supplierObj2.name : '',
            date: document.getElementById('cpDate').value,
            dueDate: document.getElementById('cpDueDate').value,
            description: document.getElementById('cpDescription').value,
            amountUSD: isMeas2 ? (measCurrency2==='USD'? totalMeas2 : 0) : document.getElementById('cpAmountUSD').value,
            amountIQD: isMeas2 ? (measCurrency2==='IQD'? totalMeas2 : 0) : document.getElementById('cpAmountIQD').value,
            exchangeRate: document.getElementById('cpExchangeRate').value,
            status: document.getElementById('cpStatus').value,
            receiptNumber: (!isMeas2) ? document.getElementById('cpPurchaseReceiptNumber').value : (document.getElementById('cpMeasurementNumber')?.value || ''),
            notes: document.getElementById('cpNotes').value,
            creditType: this.creditPurchaseType,
            measCurrency: measCurrency2,
            measUnitType: document.getElementById('cpMeasUnitType')?.value || '',
            measQuantity: parseFloat(document.getElementById('cpMeasQuantity')?.value)||0,
            measUnitPrice: parseFloat(document.getElementById('cpMeasUnitPrice')?.value)||0,
            measRetention: parseFloat(document.getElementById('cpMeasRetention')?.value)||0,
            measRetentionAmount: parseFloat(document.getElementById('cpMeasRetentionAmount')?.value)||retAmount2,
            measTotal: totalMeas2
        };
        const html = this.generateCreditPurchaseInvoiceHTML(data);
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.focus();
        // تأخير بسيط لضمان تحميل الخطوط قبل الطباعة
        setTimeout(()=>win.print(), 150);
    }

    // ====== إدارة موردين الشراء بالآجل ======
    getCreditPurchaseSuppliers(){
        return StorageManager.getData(StorageManager.STORAGE_KEYS.CREDIT_PURCHASE_SUPPLIERS) || [];
    }
    saveCreditPurchaseSuppliers(list){
        StorageManager.saveData(StorageManager.STORAGE_KEYS.CREDIT_PURCHASE_SUPPLIERS, list || []);
    }
    addCreditPurchaseSupplier(supplier){
        const list = this.getCreditPurchaseSuppliers();
        list.push(supplier);
        this.saveCreditPurchaseSuppliers(list);
        return supplier;
    }
    // إظهار/إخفاء نموذج إضافة مورد (مع دعم forceShow)
    toggleAddSupplierForm(forceShow){
        const wrap = document.getElementById('addSupplierFormWrapper');
        const btn = document.getElementById('toggleSupplierFormBtn');
        if(!wrap) return;
        const isShown = wrap.style.display !== 'none';
        const target = (typeof forceShow === 'boolean') ? forceShow : !isShown;
        wrap.style.display = target ? 'block' : 'none';
        if(btn) btn.textContent = target ? 'إخفاء النموذج' : 'إضافة مورد';
    }
    refreshCreditPurchaseSuppliersUI(){
        const tableWrap = document.getElementById('cpSuppliersTableWrapper');
        const list = this.getCreditPurchaseSuppliers();
        if(tableWrap){
            if(list.length===0){
                tableWrap.innerHTML = '<div class="text-muted small">لا توجد مورّدون مضافون بعد.</div>';
            } else {
                tableWrap.innerHTML = `<table class="table table-sm table-striped align-middle"><thead><tr><th>الاسم</th><th>النوع</th><th>الهاتف</th><th>العنوان</th><th style='width:90px'>إجراءات</th></tr></thead><tbody>${list.map(s=>`<tr><td>${s.name}</td><td>${s.type||'-'}</td><td>${s.phone||'-'}</td><td>${s.address||'-'}</td><td><div class='btn-group btn-group-sm'><button class='btn btn-outline-primary' title='تعديل' onclick="expensesManager.startEditCreditPurchaseSupplier('${s.id}')"><i class='bi bi-pencil'></i></button><button class='btn btn-outline-danger' title='حذف' onclick="expensesManager.deleteCreditPurchaseSupplier('${s.id}')"><i class='bi bi-trash'></i></button></div></td></tr>`).join('')}</tbody></table>`;
            }
        }
        const sel = document.getElementById('cpVendorSelect');
        if(sel){
            const current = sel.value;
            sel.innerHTML = '<option value="">اختر المورد</option>' + list.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
            if(list.some(s=>s.id===current)) sel.value = current;
        }
    }

    startEditCreditPurchaseSupplier(id){
        const supplier = this.getCreditPurchaseSuppliers().find(s=>s.id===id);
        if(!supplier) return;
        this.editingCreditPurchaseSupplierId = id;
        this.toggleAddSupplierForm(true); // تأكد من ظهور النموذج
        document.getElementById('cpSupplierName').value = supplier.name;
        document.getElementById('cpSupplierType').value = supplier.type || '';
        document.getElementById('cpSupplierPhone').value = supplier.phone || '';
        document.getElementById('cpSupplierAddress').value = supplier.address || '';
        const btn = document.getElementById('cpSupplierSubmitBtn');
        if(btn){ btn.innerHTML = '<i class="bi bi-check2-circle"></i>'; btn.classList.remove('btn-success'); btn.classList.add('btn-warning'); }
        const actions = document.getElementById('cpSupplierEditActions'); if(actions) actions.style.display='flex';
    }

    cancelEditCreditPurchaseSupplier(){
        this.editingCreditPurchaseSupplierId = null;
        const form = document.getElementById('cpSupplierForm'); if(form) form.reset();
        const btn = document.getElementById('cpSupplierSubmitBtn');
        if(btn){ btn.innerHTML = '<i class="bi bi-plus-circle"></i>'; btn.classList.remove('btn-warning'); btn.classList.add('btn-success'); }
        const actions = document.getElementById('cpSupplierEditActions'); if(actions) actions.style.display='none';
    }

    updateCreditPurchaseSupplier(id, payload){
        const list = this.getCreditPurchaseSuppliers();
        const idx = list.findIndex(s=>s.id===id);
        if(idx>-1){
            list[idx] = { ...list[idx], ...payload, updatedAt: new Date().toISOString() };
            this.saveCreditPurchaseSuppliers(list);
        }
    }

    deleteCreditPurchaseSupplier(id){
        if(!confirm('هل تريد حذف هذا المورد؟')) return;
        const list = this.getCreditPurchaseSuppliers().filter(s=>s.id!==id);
        this.saveCreditPurchaseSuppliers(list);
        // إذا كان نحنا في وضع تعديل نفس المورد، ألغِ التعديل
        if(this.editingCreditPurchaseSupplierId===id){ this.cancelEditCreditPurchaseSupplier(); }
        this.refreshCreditPurchaseSuppliersUI();
    }

    // دالة مساعدة: توليد HTML للفوترة بتنسيق احترافي مشابه للصورة
    generateCreditPurchaseInvoiceHTML(data){
    const hasUSD = parseFloat(data.amountUSD) > 0;
        const hasIQD = parseFloat(data.amountIQD) > 0;
        const currencyLabel = hasUSD && hasIQD ? 'معاملة مختلطة (دينار ودولار)' : (hasUSD ? 'بالدولار' : (hasIQD ? 'بالدينار' : 'بدون مبلغ')); 
        const fmtUSD = hasUSD ? this.formatCurrency(parseFloat(data.amountUSD)||0,'USD') : '-';
        const fmtIQD = hasIQD ? this.formatCurrency(parseFloat(data.amountIQD)||0,'IQD') : '-';
        const header = (typeof buildBrandedHeaderHTML === 'function') ? buildBrandedHeaderHTML('فــاتــورة شــراء بالآجــل') : '';
        const footer = (typeof buildPrintFooterHTML === 'function') ? buildPrintFooterHTML() : '';
    const dateLbl = (data.creditType==='measurement') ? 'تاريخ الاحتساب' : 'التاريخ';
    const recLbl = 'رقم وصل الشراء/ الذرعة';
        return `<!DOCTYPE html><html lang='ar'>
        <head>
            <meta charset='UTF-8'>
            <title>فــاتــورة شــراء بالآجــل</title>
            <style>
                * { box-sizing: border-box; }
                body { font-family: 'Cairo','Tahoma','Arial',sans-serif; direction: rtl; margin:0; padding:18px 18px 140px; background:#fff; color:#000; }
                table.invoice-table { width:100%; border-collapse:collapse; margin-top:8px; font-size:13px; }
                table.invoice-table th, table.invoice-table td { border:1px solid #d1d5db; padding:6px 8px; vertical-align:middle; }
                table.invoice-table th { background:#f1f5f9; font-weight:600; font-size:12px; }
                .label-cell { width:140px; color:#0d3d6b; font-weight:600; background:#f8fafc; }
                .money-iqd { color:#b80037; font-weight:600; }
                .money-usd { color:#046d1f; font-weight:600; }
                .notes-box { border:1px solid #e2e8f0; background:#fdfdfd; padding:10px 12px; min-height:60px; font-size:12px; }
                .badges { margin-top:10px; }
                .badge { display:inline-block; background:#ffeb99; color:#433800; padding:4px 10px; border-radius:12px; font-size:11px; margin-left:6px; }
                .signatures { display:flex; justify-content:space-between; margin-top:32px; font-size:12px; }
                .sign-col { text-align:center; flex:1; position:relative; padding-top:40px; }
                .sign-col:not(:last-child){ margin-left:25px; }
                .sign-col:before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:#000; opacity:.25; }
                .doc-title-inline { text-align:center; margin:6px 0 2px; font-size:16px; font-weight:700; }
                .doc-sub-inline { text-align:center; font-size:11px; color:#666; }
                @media print { body { padding:12mm 10mm 140px; } }
            </style>
        </head>
        <body>
            ${header}
                        <div class='print-body'>
                            <div class='doc-sub-inline'>نوع المعاملة: ${data.type} - تصنيف العملة: ${currencyLabel}</div>
              <table class='invoice-table'>
                <tr>
                    <td class='label-cell'>رقم القيد</td><td>${data.registrationNumber}</td>
                    <td class='label-cell'>${dateLbl}</td><td>${data.date || '-'}</td>
                    <td class='label-cell'>الاستحقاق</td><td>${data.dueDate || '-'}</td>
                </tr>
                <tr>
                    <td class='label-cell'>البيان</td><td>${data.description || '-'}</td>
                    <td class='label-cell'>المورد</td><td>${data.vendor || '-'}</td>
                    <td class='label-cell'>${recLbl}</td><td>${data.receiptNumber || '-'}</td>
                </tr>
                <tr>
                    <td class='label-cell'>المبلغ بالدينار</td><td class='money-iqd'>${fmtIQD}</td>
                    <td class='label-cell'>المبلغ بالدولار</td><td class='money-usd'>${fmtUSD}</td>
                    <td class='label-cell'>سعر الصرف</td><td>${data.exchangeRate || '-'}</td>
                </tr>
                <tr>
                    <td class='label-cell'>الحالة</td><td>${data.status}</td>
                    <td class='label-cell'>نوع القيد</td><td>${data.type}</td>
                    <td class='label-cell'>تصنيف العملة</td><td>${currencyLabel}</td>
                </tr>
                ${(data.creditType==='measurement') ? `
                <tr>
                    <td class='label-cell'>العملة</td><td>${data.measCurrency || '-'}</td>
                    <td class='label-cell'>نوع الوحدة</td><td>${data.measUnitType || '-'}</td>
                    <td class='label-cell'>الإجمالي المحتسب</td><td>${this.formatCurrency(data.measTotal || 0, data.measCurrency || 'IQD')}</td>
                </tr>
                <tr>
                    <td class='label-cell'>الكمية</td><td>${data.measQuantity || 0}</td>
                    <td class='label-cell'>سعر الوحدة</td><td>${data.measUnitPrice || 0}</td>
                    <td class='label-cell'>الحجز (%)</td><td>${data.measRetention || 0}</td>
                </tr>
                <tr>
                    <td class='label-cell'>مبلغ الحجز</td><td colspan='5'>${this.formatCurrency(data.measRetentionAmount || 0, data.measCurrency || 'IQD')}</td>
                </tr>` : ''}
              </table>
              <div style='margin-top:12px;font-size:13px;font-weight:600;'>الملاحظات</div>
              <div class='notes-box'>${data.notes ? data.notes.replace(/\n/g,'<br>') : '—'}</div>
              <div class='badges'>
                  <span class='badge'>طُبع بواسطة النظام</span>
                  ${data.creditType==='measurement' ? '<span class="badge" style="background:#d1ecf1;color:#0c5460">ذرعة</span>' : '<span class="badge" style="background:#e2e3ff;color:#1b1e63">وصل شراء</span>'}
              </div>
              <div class='signatures'>
                  <div class='sign-col'>المحاسب</div>
                  <div class='sign-col'>المدير المالي</div>
                  <div class='sign-col'>المدير العام</div>
              </div>
            </div>
            <!-- QR moved out to fixed bottom-left above footer -->
            <div id='invoiceQRWrapper' style='position:fixed;left:18px;bottom:150px;width:150px;text-align:center;font-size:10px;color:#555;z-index:50;'>
                <div id='invoiceQRBox' style='width:120px;height:120px;margin:0 auto;background:#fff;border:1px solid #d0d0d0;display:flex;align-items:center;justify-content:center;font-size:9px;color:#888;'>QR</div>
                <div style='margin-top:6px;letter-spacing:.5px;'>رمز الاستجابة السريعة</div>
            </div>
            <script>
            (function(){
               try {
                         // حمولة أوسع: CP|نوع|رقم|تاريخ|مورد|USD|IQD
                         var payload = 'CP|' +
                             '${data.creditType || ''}'+'|' +
                             '${data.registrationNumber}'+'|' +
                             '${data.date || ''}'+'|' +
                             '${(data.vendor||'').replace(/\|/g,' ')}'+'|' +
                             '${data.amountUSD || 0}'+'|' +
                             '${data.amountIQD || 0}';
                   var box = document.getElementById('invoiceQRBox');
                   var script = document.createElement('script');
                   script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
                   script.onload = function(){
                       try { box.innerHTML=''; new QRCode(box,{text:payload,width:110,height:110,correctLevel:QRCode.CorrectLevel.M}); }
                       catch(e){ box.textContent='QR خطأ'; }
                   };
                   script.onerror = function(){
                       try { // توليد نمط احتياطي بسيط
                           var c=document.createElement('canvas');c.width=c.height=110;var ctx=c.getContext('2d');
                           ctx.fillStyle='#fff';ctx.fillRect(0,0,110,110);ctx.fillStyle='#000';
                           for(var y=0;y<25;y++){ for(var x=0;x<25;x++){ var h=(x*73856093)^(y*19349663)^(payload.length*83492791); if(((h>> (x%13)) &1) && ((x+y+payload.length)%3===0)) ctx.fillRect(x*4+1,y*4+1,3,3); }}
                           box.innerHTML=''; box.appendChild(c); box.title='بديل مؤقت';
                       } catch(e2){ box.textContent='تعذر QR'; }
                   };
                   document.body.appendChild(script);
               } catch(err){ console.error('QR generation error',err); }
            })();
            </script>
            ${footer}
        </body></html>`;
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
        const categories = this.getExpenseCategories();
        const data = StorageManager.getAllData();
        const editExpensesHTML = `
            <div class="neumorphic-card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h4 class="mb-0"><i class="bi bi-pencil-square me-2"></i>تعديل المصروفات</h4>
                    <div class="text-muted small">${(data.expenses || []).length} قيد</div>
                </div>
                <div class="card-body">
                    <div class="row g-2 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label"><i class="bi bi-calendar me-1"></i>من تاريخ</label>
                            <input type="date" id="editFilterFrom" class="form-control neumorphic-input">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label"><i class="bi bi-calendar2-week me-1"></i>إلى تاريخ</label>
                            <input type="date" id="editFilterTo" class="form-control neumorphic-input">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label"><i class="bi bi-tags me-1"></i>الفئة</label>
                            <select id="editFilterCategory" class="form-control neumorphic-input">
                                <option value="">الكل</option>
                                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label"><i class="bi bi-currency-exchange me-1"></i>العملة</label>
                            <select id="editFilterCurrency" class="form-control neumorphic-input">
                                <option value="">الكل</option>
                                <option value="USD">دولار</option>
                                <option value="IQD">دينار</option>
                                <option value="MIXED">مختلط</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label"><i class="bi bi-search me-1"></i>بحث (رقم القيد، البيان، المستفيد، المورد)</label>
                            <input type="text" id="editFilterQuery" class="form-control neumorphic-input" placeholder="اكتب للبحث...">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label"><i class="bi bi-hash me-1"></i>رقم القيد</label>
                            <input type="text" id="editFilterReg" class="form-control neumorphic-input" placeholder="مثال: 20250908...">
                        </div>
                        <div class="col-md-3 d-flex gap-2">
                            <button id="editFilterApply" class="btn btn-primary neumorphic-btn flex-grow-1"><i class="bi bi-funnel me-1"></i>تطبيق</button>
                            <button id="editFilterReset" class="btn btn-secondary neumorphic-btn"><i class="bi bi-arrow-counterclockwise me-1"></i>إعادة</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="neumorphic-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="bi bi-list-ul me-2"></i>قائمة القيود</h5>
                    <div class="d-flex gap-2">
                        <button id="editBulkExport" class="btn btn-success btn-sm neumorphic-btn" title="تصدير (قريباً)" disabled>
                            <i class="bi bi-file-earmark-excel me-1"></i>تصدير
                        </button>
                        <button id="editBulkDelete" class="btn btn-danger btn-sm neumorphic-btn" title="حذف المحدد (قريباً)" disabled>
                            <i class="bi bi-trash me-1"></i>حذف المحدد
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="editExpensesTable" class="table-responsive"></div>
                </div>
            </div>
        `;
        document.getElementById('expensesContent').innerHTML = editExpensesHTML;
        this.setupEditFilters();
        this.renderEditTable(data.expenses || []);
    }

    // Setup edit filters and actions
    setupEditFilters() {
        const apply = document.getElementById('editFilterApply');
        const reset = document.getElementById('editFilterReset');
        const q = document.getElementById('editFilterQuery');

        const run = () => {
            const all = StorageManager.getAllData().expenses || [];
            const filtered = this.getFilteredExpenses(all);
            this.renderEditTable(filtered);
        };

        apply?.addEventListener('click', run);
        reset?.addEventListener('click', () => {
            ['editFilterFrom','editFilterTo','editFilterCategory','editFilterCurrency','editFilterQuery','editFilterReg']
                .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            run();
        });
        // instant search on typing
        q?.addEventListener('input', () => {
            // throttle-lite
            clearTimeout(this._editSearchTimer);
            this._editSearchTimer = setTimeout(run, 250);
        });
    }

    // Collect filters and filter list
    getFilteredExpenses(list) {
        const from = document.getElementById('editFilterFrom')?.value;
        const to = document.getElementById('editFilterTo')?.value;
        const cat = document.getElementById('editFilterCategory')?.value || '';
        const cur = document.getElementById('editFilterCurrency')?.value || '';
        const query = (document.getElementById('editFilterQuery')?.value || '').trim().toLowerCase();
        const reg = (document.getElementById('editFilterReg')?.value || '').trim();

        return (list || []).filter(e => {
            // date range
            if (from && new Date(e.date) < new Date(from)) return false;
            if (to && new Date(e.date) > new Date(to)) return false;
            // category
            if (cat && (e.category || '') !== cat) return false;
            // currency mode
            if (cur) {
                if (cur === 'MIXED') {
                    if (!(e.amountIQD > 0 && e.amountUSD > 0)) return false;
                } else {
                    const primary = e.currency || this.determinePrimaryCurrency(e.amountIQD||0, e.amountUSD||0, e.exchangeRate||1500);
                    if (primary !== cur) return false;
                }
            }
            // registration number exact or begins-with
            if (reg && !(e.registrationNumber || '').toString().startsWith(reg)) return false;
            // text query in a few fields
            if (query) {
                const hay = [e.description, e.beneficiary, e.vendor, e.accountingGuideName, e.accountingGuideCode, e.project]
                    .map(v => (v || '').toString().toLowerCase())
                    .join(' | ');
                if (!hay.includes(query)) return false;
            }
            return true;
        }).sort((a,b) => new Date(b.date) - new Date(a.date));
    }

    // Render edit table
    renderEditTable(expenses) {
        const wrap = document.getElementById('editExpensesTable');
        if (!wrap) return;
        if (!expenses || expenses.length === 0) {
            wrap.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-inbox display-6"></i><div class="mt-2">لا توجد قيود مطابقة</div></div>';
            return;
        }

        const rows = expenses.map(e => {
            const usdTxt = (e.amountUSD && e.amountUSD > 0) ? this.formatCurrency(e.amountUSD, 'USD') : '<span class="text-muted">-</span>';
            const iqdTxt = (e.amountIQD && e.amountIQD > 0) ? this.formatCurrency(e.amountIQD, 'IQD') : '<span class="text-muted">-</span>';
            const badge = this.getTransactionTypeDescription(e.amountIQD||0, e.amountUSD||0);
            return `
                <tr>
                    <td><strong>${e.registrationNumber || ''}</strong><br><small class="text-muted">${this.formatDate(e.date)}</small></td>
                    <td>${e.description || 'بدون وصف'}<div class="mt-1">${badge}</div></td>
                    <td class="text-success">${usdTxt}</td>
                    <td class="text-info">${iqdTxt}</td>
                    <td>${e.category || '<span class="text-muted">غير محدد</span>'}</td>
                    <td>${e.beneficiary || '<span class="text-muted">-</span>'}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" title="تعديل" onclick="expensesManager.startEditExpense('${e.id}')"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-outline-success" title="طباعة" onclick="expensesManager.printExpenseById('${e.id}','${e.registrationNumber||''}')"><i class="bi bi-printer"></i></button>
                            <button class="btn btn-outline-secondary" title="تكرار" onclick="expensesManager.duplicateExpense('${e.id}')"><i class="bi bi-copy"></i></button>
                            <button class="btn btn-outline-danger" title="حذف" onclick="expensesManager.deleteExpense('${e.id}')"><i class="bi bi-trash"></i></button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        const html = `
            <table class="table table-striped table-hover align-middle">
                <thead class="table-dark">
                    <tr>
                        <th>القيد/التاريخ</th>
                        <th>البيان</th>
                        <th>دولار</th>
                        <th>دينار</th>
                        <th>الفئة</th>
                        <th>المستفيد</th>
                        <th>إجراءات</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
        wrap.innerHTML = html;
    }

    // Start editing: reuse Add form and prefill
    startEditExpense(id) {
        try {
            const all = StorageManager.getAllData();
            const entry = (all.expenses || []).find(e => e.id === id);
            if(!entry){ this.showNotification('القيد غير موجود','error'); return; }
            this.editingId = id;
            this.showView('add-expense');
            setTimeout(()=>{
                this.fillAddFormFromEntry(entry);
                const form = document.getElementById('expenseForm');
                if(form){
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if(submitBtn) submitBtn.innerHTML = '<i class="bi bi-save me-2"></i>تحديث المصروف';
                    if(!document.getElementById('cancelEditBtn')){
                        const cancelBtn = document.createElement('button');
                        cancelBtn.type='button';
                        cancelBtn.id='cancelEditBtn';
                        cancelBtn.className='btn btn-outline-secondary neumorphic-btn ms-2';
                        cancelBtn.innerHTML='<i class="bi bi-x-circle me-2"></i>إلغاء التعديل';
                        cancelBtn.onclick=()=>{ this.editingId=null; this.showView('edit-expenses'); };
                        submitBtn?.parentElement?.appendChild(cancelBtn);
                    }
                }
                this.showNotification('وضع التعديل مفعل لهذا القيد','info');
            },100);
        } catch(err){
            console.error('startEditExpense error',err);
            this.showNotification('حدث خطأ أثناء فتح القيد للتعديل','error');
        }
    }

    // Prefill Add form with existing entry data
    fillAddFormFromEntry(e) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
        set('expenseRegistrationNumber', e.registrationNumber || '');
        set('expenseDate', e.date ? e.date.split('T')[0] : '');
        set('expenseAmountIQD', e.amountIQD ?? '');
        set('expenseAmountUSD', e.amountUSD ?? '');
        set('expenseExchangeRate', e.exchangeRate ?? '1500');
        set('expenseDescription', e.description || '');
        set('expenseAccountingGuide', e.accountingGuide || '');
        set('expenseBeneficiary', e.beneficiary || '');
        set('expenseReceiptNumber', e.receiptNumber || '');
        set('expenseReceiptDate', e.receiptDate ? e.receiptDate.split('T')[0] : '');
        set('expenseVendor', e.vendor || '');
        set('expensePaymentMethod', e.paymentMethod || '');
        set('expenseCategory', e.category || '');
        set('expenseProject', e.project || '');
        set('expenseNotes', e.notes || '');
        // ensure preview hidden in edit mode
        const preview = document.getElementById('expensePreview');
        if (preview) preview.style.display = 'none';
    }

    // Delete expense with confirm
    deleteExpense(id) {
        if (!confirm('هل أنت متأكد من حذف هذا القيد؟')) return;
        if (StorageManager.deleteExpenseEntry(id)) {
            this.showNotification('تم حذف القيد بنجاح', 'success');
            const all = StorageManager.getAllData();
            const filtered = this.getFilteredExpenses(all.expenses || []);
            this.renderEditTable(filtered);
        } else {
            this.showNotification('فشل حذف القيد', 'error');
        }
    }

    // Duplicate an expense
    duplicateExpense(id) {
        try {
            const all = StorageManager.getAllData();
            const entry = (all.expenses || []).find(e => e.id === id);
            if (!entry) return this.showNotification('القيد غير موجود', 'error');
            // Prepare copy without identifiers/timestamps
            const { id: _id, registrationNumber: _r, createdAt: _c, updatedAt: _u, ...payload } = entry;
            const newEntry = StorageManager.addExpenseEntry(payload);
            if (newEntry) {
                this.showNotification('تم تكرار القيد بنجاح', 'success');
                const refreshed = StorageManager.getAllData().expenses || [];
                this.renderEditTable(this.getFilteredExpenses(refreshed));
            } else {
                this.showNotification('تعذر تكرار القيد', 'error');
            }
        } catch (err) {
            console.error('duplicateExpense error', err);
            this.showNotification('حدث خطأ أثناء تكرار القيد', 'error');
        }
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
        // Normalize inputs
        const num = Number(amount) || 0;
        const curr = (currency || 'IQD').toString().toUpperCase();

        // USD: Western digits, 2 decimals, suffix in Arabic
        if (curr === 'USD' || curr === '$') {
            const abs = Math.abs(num);
            const formatted = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: true
            }).format(abs);
            return (num < 0 ? '-' : '') + formatted + ' دولار';
        }

        // IQD (default): Arabic digits, Arabic thousands separator, no decimals, suffix د.ع
        const abs = Math.abs(num);
        const formatted = new Intl.NumberFormat('ar-IQ', {
            useGrouping: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(abs);
        return (num < 0 ? '-' : '') + formatted + ' د.ع';
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
