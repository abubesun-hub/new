// Printable Forms Management System
class FormManager {
    constructor() {
        this.currentFormData = {};
        this.init();
    }

    init() {
        console.log('FormManager initialized');
    }

    loadFormSection() {
        const formSection = document.getElementById('formSection');
        if (!formSection) return;

        const formHTML = `
            <div class="neumorphic-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h4><i class="bi bi-file-earmark-text me-2"></i>النموذج القابل للطباعة</h4>
                    <div>
                        <button class="btn btn-success neumorphic-btn" onclick="formManager.printForm()">
                            <i class="bi bi-printer me-2"></i>طباعة النموذج
                        </button>
                        <button class="btn btn-secondary neumorphic-btn ms-2" onclick="formManager.clearForm()">
                            <i class="bi bi-arrow-clockwise me-2"></i>مسح النموذج
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <form id="printableForm" class="printable-form">
                        <!-- Header Information -->
                        <div class="form-section mb-4">
                            <h5 class="section-title">معلومات الرأس</h5>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="formTitle" class="form-label">عنوان الوثيقة</label>
                                    <input type="text" class="form-control neumorphic-input" id="formTitle" 
                                           placeholder="مثال: كتاب رسمي، طلب، تقرير">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="formNumber" class="form-label">رقم الكتاب/الوثيقة</label>
                                    <input type="text" class="form-control neumorphic-input" id="formNumber" 
                                           placeholder="مثال: ك/123/2024">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="formDate" class="form-label">التاريخ</label>
                                    <input type="date" class="form-control neumorphic-input" id="formDate">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="formReference" class="form-label">المرجع</label>
                                    <input type="text" class="form-control neumorphic-input" id="formReference" 
                                           placeholder="مثال: القانون رقم 123 لسنة 2024">
                                </div>
                            </div>
                        </div>

                        <!-- Addressee Information -->
                        <div class="form-section mb-4">
                            <h5 class="section-title">معلومات المرسل إليه</h5>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="addresseeTitle" class="form-label">المنصب/اللقب</label>
                                    <input type="text" class="form-control neumorphic-input" id="addresseeTitle" 
                                           placeholder="مثال: السيد المحترم، معالي الوزير">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="addresseeName" class="form-label">الاسم</label>
                                    <input type="text" class="form-control neumorphic-input" id="addresseeName" 
                                           placeholder="اسم المرسل إليه">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="addresseePosition" class="form-label">المنصب</label>
                                    <input type="text" class="form-control neumorphic-input" id="addresseePosition" 
                                           placeholder="مثال: مدير عام، رئيس قسم">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="addresseeOrganization" class="form-label">الجهة/المؤسسة</label>
                                    <input type="text" class="form-control neumorphic-input" id="addresseeOrganization" 
                                           placeholder="اسم الجهة أو المؤسسة">
                                </div>
                            </div>
                        </div>

                        <!-- Subject and Content -->
                        <div class="form-section mb-4">
                            <h5 class="section-title">المحتوى</h5>
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <label for="formSubject" class="form-label">الموضوع</label>
                                    <input type="text" class="form-control neumorphic-input" id="formSubject" 
                                           placeholder="موضوع الكتاب أو الطلب">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <label for="formGreeting" class="form-label">التحية</label>
                                    <input type="text" class="form-control neumorphic-input" id="formGreeting" 
                                           placeholder="مثال: تحية طيبة وبعد، السلام عليكم ورحمة الله وبركاته"
                                           value="تحية طيبة وبعد،">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <label for="formContent" class="form-label">المحتوى الرئيسي</label>
                                    <textarea class="form-control neumorphic-input" id="formContent" rows="8" 
                                              placeholder="اكتب هنا محتوى الكتاب أو الطلب..."></textarea>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <label for="formClosing" class="form-label">الخاتمة</label>
                                    <textarea class="form-control neumorphic-input" id="formClosing" rows="3" 
                                              placeholder="مثال: وتقبلوا فائق الاحترام والتقدير"
                                              value="وتقبلوا فائق الاحترام والتقدير"></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Sender Information -->
                        <div class="form-section mb-4">
                            <h5 class="section-title">معلومات المرسل</h5>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="senderName" class="form-label">اسم المرسل</label>
                                    <input type="text" class="form-control neumorphic-input" id="senderName" 
                                           placeholder="الاسم الكامل للمرسل">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="senderTitle" class="form-label">المنصب</label>
                                    <input type="text" class="form-control neumorphic-input" id="senderTitle" 
                                           placeholder="مثال: المدير العام، رئيس القسم">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="senderSignature" class="form-label">التوقيع</label>
                                    <input type="text" class="form-control neumorphic-input" id="senderSignature" 
                                           placeholder="نص التوقيع (اختياري)">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="senderStamp" class="form-label">الختم</label>
                                    <input type="text" class="form-control neumorphic-input" id="senderStamp" 
                                           placeholder="نص الختم (اختياري)">
                                </div>
                            </div>
                        </div>

                        <!-- Additional Fields -->
                        <div class="form-section mb-4">
                            <h5 class="section-title">معلومات إضافية</h5>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="copyTo" class="form-label">صورة إلى</label>
                                    <textarea class="form-control neumorphic-input" id="copyTo" rows="3" 
                                              placeholder="قائمة الجهات التي ستحصل على صورة من الكتاب"></textarea>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="attachments" class="form-label">المرفقات</label>
                                    <textarea class="form-control neumorphic-input" id="attachments" rows="3" 
                                              placeholder="قائمة المستندات المرفقة"></textarea>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <label for="additionalNotes" class="form-label">ملاحظات إضافية</label>
                                    <textarea class="form-control neumorphic-input" id="additionalNotes" rows="3" 
                                              placeholder="أي ملاحظات أو معلومات إضافية"></textarea>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        formSection.innerHTML = formHTML;
        this.setupFormEvents();
        this.setDefaultDate();
    }

    setupFormEvents() {
        // Auto-save form data as user types
        const formInputs = document.querySelectorAll('#printableForm input, #printableForm textarea');
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.saveFormData();
            });
        });

        // Load existing data
        this.loadFormData();
    }

    setDefaultDate() {
        const dateInput = document.getElementById('formDate');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    saveFormData() {
        const formData = {};
        const formInputs = document.querySelectorAll('#printableForm input, #printableForm textarea');
        
        formInputs.forEach(input => {
            formData[input.id] = input.value;
        });

        this.currentFormData = formData;
        localStorage.setItem('printableFormData', JSON.stringify(formData));
    }

    loadFormData() {
        const savedData = localStorage.getItem('printableFormData');
        if (savedData) {
            const formData = JSON.parse(savedData);
            
            Object.keys(formData).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = formData[key];
                }
            });
            
            this.currentFormData = formData;
        }
    }

    clearForm() {
        if (confirm('هل أنت متأكد من مسح جميع البيانات المدخلة؟')) {
            const formInputs = document.querySelectorAll('#printableForm input, #printableForm textarea');
            formInputs.forEach(input => {
                if (input.type !== 'date') {
                    input.value = '';
                } else if (input.id === 'formDate') {
                    input.value = new Date().toISOString().split('T')[0];
                }
            });
            
            // Restore default values
            document.getElementById('formGreeting').value = 'تحية طيبة وبعد،';
            document.getElementById('formClosing').value = 'وتقبلوا فائق الاحترام والتقدير';
            
            this.currentFormData = {};
            localStorage.removeItem('printableFormData');
        }
    }

    printForm() {
        // Save current form data
        this.saveFormData();
        
        // Get form data
        const formData = this.currentFormData;
        
        // Generate print content
        const printContent = this.generatePrintHTML(formData);
        
        // Open print window
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        printWindow.onload = () => {
            setTimeout(() => {
                try {
                    printWindow.print();
                } catch (e) {
                    console.error('Print failed', e);
                }
            }, 300);
        };
    }

    generatePrintHTML(formData) {
        // Get header HTML with branding
        const headerHTML = (typeof buildBrandedHeaderHTML === 'function') 
            ? buildBrandedHeaderHTML(formData.formTitle || 'وثيقة رسمية') 
            : this.getDefaultHeaderHTML();
            
        // Get footer HTML
        const footerHTML = (typeof buildPrintFooterHTML === 'function') 
            ? buildPrintFooterHTML() 
            : '';

        return `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${formData.formTitle || 'وثيقة رسمية'}</title>
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 2cm;
                    }
                    
                    body {
                        font-family: 'Cairo', 'Arial', sans-serif;
                        direction: rtl;
                        text-align: right;
                        line-height: 1.8;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                        background: #fff;
                    }
                    
                    .document-container {
                        max-width: 100%;
                        margin: 0 auto;
                        background: white;
                        position: relative;
                    }
                    
                    .document-header {
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                    }
                    
                    .document-number {
                        text-align: left;
                        font-weight: bold;
                        margin-bottom: 10px;
                        direction: ltr;
                    }
                    
                    .document-title {
                        font-size: 24px;
                        font-weight: bold;
                        text-align: center;
                        margin: 20px 0;
                        text-decoration: underline;
                        color: #2c3e50;
                    }
                    
                    .document-info {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                        flex-wrap: wrap;
                    }
                    
                    .info-item {
                        margin: 5px 0;
                    }
                    
                    .addressee-section {
                        margin: 30px 0;
                        text-align: right;
                    }
                    
                    .subject-line {
                        font-weight: bold;
                        margin: 20px 0;
                        text-decoration: underline;
                    }
                    
                    .content-section {
                        margin: 30px 0;
                        text-align: justify;
                        text-justify: inter-word;
                    }
                    
                    .greeting {
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    
                    .main-content {
                        margin: 20px 0;
                        text-indent: 2em;
                    }
                    
                    .closing {
                        margin: 30px 0 20px 0;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .sender-section {
                        margin-top: 50px;
                        text-align: center;
                    }
                    
                    .sender-name {
                        font-weight: bold;
                        margin: 10px 0;
                        font-size: 18px;
                    }
                    
                    .sender-title {
                        font-weight: bold;
                        margin: 5px 0;
                    }
                    
                    .signature-area {
                        margin: 30px 0;
                        text-align: center;
                    }
                    
                    .additional-info {
                        margin-top: 40px;
                        border-top: 1px solid #ddd;
                        padding-top: 20px;
                    }
                    
                    .copy-to, .attachments {
                        margin: 15px 0;
                        text-align: right;
                    }
                    
                    .section-label {
                        font-weight: bold;
                        text-decoration: underline;
                        margin-bottom: 5px;
                    }
                    
                    .notes {
                        font-style: italic;
                        color: #666;
                        margin-top: 20px;
                        font-size: 14px;
                    }
                    
                    @media print {
                        body { 
                            margin: 0; 
                            padding: 15px;
                        }
                        .no-print { 
                            display: none !important; 
                        }
                        .document-container {
                            box-shadow: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="document-container">
                    ${headerHTML}
                    
                    <div class="document-header">
                        ${formData.formNumber ? `<div class="document-number">رقم: ${formData.formNumber}</div>` : ''}
                        ${formData.formTitle ? `<div class="document-title">${formData.formTitle}</div>` : ''}
                        
                        <div class="document-info">
                            ${formData.formDate ? `<div class="info-item">التاريخ: ${this.formatDateForPrint(formData.formDate)}</div>` : ''}
                            ${formData.formReference ? `<div class="info-item">المرجع: ${formData.formReference}</div>` : ''}
                        </div>
                    </div>
                    
                    ${this.generateAddresseeSection(formData)}
                    
                    ${formData.formSubject ? `<div class="subject-line">الموضوع: ${formData.formSubject}</div>` : ''}
                    
                    <div class="content-section">
                        ${formData.formGreeting ? `<div class="greeting">${formData.formGreeting}</div>` : ''}
                        
                        ${formData.formContent ? `<div class="main-content">${this.formatContent(formData.formContent)}</div>` : ''}
                        
                        ${formData.formClosing ? `<div class="closing">${formData.formClosing}</div>` : ''}
                    </div>
                    
                    ${this.generateSenderSection(formData)}
                    
                    ${this.generateAdditionalInfo(formData)}
                </div>
                
                ${footerHTML}
            </body>
            </html>
        `;
    }

    generateAddresseeSection(formData) {
        if (!formData.addresseeTitle && !formData.addresseeName && !formData.addresseePosition && !formData.addresseeOrganization) {
            return '';
        }
        
        return `
            <div class="addressee-section">
                ${formData.addresseeTitle ? `${formData.addresseeTitle} ` : ''}
                ${formData.addresseeName ? `${formData.addresseeName}<br>` : ''}
                ${formData.addresseePosition ? `${formData.addresseePosition}<br>` : ''}
                ${formData.addresseeOrganization ? `${formData.addresseeOrganization}` : ''}
            </div>
        `;
    }

    generateSenderSection(formData) {
        if (!formData.senderName && !formData.senderTitle && !formData.senderSignature && !formData.senderStamp) {
            return '';
        }
        
        return `
            <div class="sender-section">
                ${formData.senderName ? `<div class="sender-name">${formData.senderName}</div>` : ''}
                ${formData.senderTitle ? `<div class="sender-title">${formData.senderTitle}</div>` : ''}
                
                <div class="signature-area">
                    ${formData.senderSignature ? `<div>التوقيع: ${formData.senderSignature}</div>` : ''}
                    ${formData.senderStamp ? `<div>الختم: ${formData.senderStamp}</div>` : ''}
                </div>
            </div>
        `;
    }

    generateAdditionalInfo(formData) {
        let additionalHTML = '';
        
        if (formData.copyTo || formData.attachments || formData.additionalNotes) {
            additionalHTML = '<div class="additional-info">';
            
            if (formData.copyTo) {
                additionalHTML += `
                    <div class="copy-to">
                        <div class="section-label">صورة إلى:</div>
                        <div>${this.formatContent(formData.copyTo)}</div>
                    </div>
                `;
            }
            
            if (formData.attachments) {
                additionalHTML += `
                    <div class="attachments">
                        <div class="section-label">المرفقات:</div>
                        <div>${this.formatContent(formData.attachments)}</div>
                    </div>
                `;
            }
            
            if (formData.additionalNotes) {
                additionalHTML += `
                    <div class="notes">
                        <div class="section-label">ملاحظات:</div>
                        <div>${this.formatContent(formData.additionalNotes)}</div>
                    </div>
                `;
            }
            
            additionalHTML += '</div>';
        }
        
        return additionalHTML;
    }

    formatContent(content) {
        if (!content) return '';
        return content.replace(/\n/g, '<br>');
    }

    formatDateForPrint(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getDefaultHeaderHTML() {
        return `
            <div class="print-header" style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #333; padding-bottom: 20px;">
                <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px; color: #2c3e50;">شركة المقاولات المتقدمة</div>
                <div style="font-size: 18px; color: #666; margin-bottom: 10px;">نظام المحاسبة للشركات المقاولة</div>
                <div style="font-size: 14px; color: #7f8c8d;">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-IQ')} ${new Date().toLocaleTimeString('ar-IQ')}</div>
            </div>
        `;
    }
}

// Initialize FormManager when loaded
if (typeof window !== 'undefined') {
    window.FormManager = FormManager;
}