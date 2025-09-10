// Storage Manager for Local Data Persistence
class StorageManager {
    static STORAGE_KEYS = {
        CAPITAL: 'accounting_capital',
        EXPENSES: 'accounting_expenses',
        SHAREHOLDERS: 'accounting_shareholders',
        USERS: 'accounting_users',
        SETTINGS: 'accounting_settings',
        BACKUP: 'accounting_backup',
    ACCOUNTING_GUIDE: 'accounting_guide',
    CREDIT_PURCHASE_SUPPLIERS: 'credit_purchase_suppliers', // موردو الشراء بالآجل
    CREDIT_PURCHASES: 'credit_purchases' // قيود الشراء بالآجل
    };

    static ENCRYPTION_KEY = 'accounting_system_2024';

    // Initialize storage with default data
    static init() {
        this.createBackup();
        this.initializeDefaultData();
        // Ensure default admin user exists so login works immediately
        try {
            this.ensureAdminUser();
        } catch (err) {
            console.warn('ensureAdminUser failed:', err);
        }
    }

    // Simple hash matching AuthManager.simpleHash to enable creating admin before AuthManager loads
    static simpleHash(str) {
        let hash = 0;
        if (!str || str.length === 0) return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // Ensure admin user exists in storage and has hashed password
    static ensureAdminUser() {
        try {
            let users = this.getData(this.STORAGE_KEYS.USERS) || [];
            if (!Array.isArray(users)) users = [];

            let adminUser = users.find(u => u.username === 'admin');
            const salt = 'default-salt';
            if (!adminUser) {
                adminUser = {
                    id: this.generateId(),
                    username: 'admin',
                    password: this.simpleHash('admin123' + salt),
                    salt: salt,
                    name: 'المدير العام',
                    role: 'admin',
                    permissions: ['all'],
                    isActive: true,
                    createdAt: new Date().toISOString()
                };
                users.push(adminUser);
                this.saveData(this.STORAGE_KEYS.USERS, users);
                console.log('StorageManager: created default admin user');
            } else {
                // normalize admin password and salt if needed
                if (!adminUser.salt || !adminUser.password || adminUser.password === 'admin123') {
                    adminUser.salt = adminUser.salt || salt;
                    adminUser.password = this.simpleHash('admin123' + adminUser.salt);
                    adminUser.isActive = true;
                    const idx = users.findIndex(u => u.username === 'admin');
                    if (idx !== -1) {
                        users[idx] = adminUser;
                        this.saveData(this.STORAGE_KEYS.USERS, users);
                        console.log('StorageManager: normalized admin credentials');
                    }
                }
            }
        } catch (error) {
            console.error('StorageManager.ensureAdminUser error:', error);
        }
    }

    // Create automatic backup
    static createBackup() {
        try {
            const allData = this.getAllData();
            const backup = {
                data: allData,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem(this.STORAGE_KEYS.BACKUP, JSON.stringify(backup));
            console.log('Backup created successfully');
        } catch (error) {
            console.error('Error creating backup:', error);
        }
    }

    // Initialize default data if not exists
    static initializeDefaultData() {
        if (!this.getData(this.STORAGE_KEYS.SHAREHOLDERS)) {
            this.saveData(this.STORAGE_KEYS.SHAREHOLDERS, []);
        }
        
        if (!this.getData(this.STORAGE_KEYS.CAPITAL)) {
            this.saveData(this.STORAGE_KEYS.CAPITAL, []);
        }
        
        if (!this.getData(this.STORAGE_KEYS.EXPENSES)) {
            this.saveData(this.STORAGE_KEYS.EXPENSES, []);
        }
        
        if (!this.getData(this.STORAGE_KEYS.USERS)) {
            // Don't create default user here - let AuthManager handle it
            this.saveData(this.STORAGE_KEYS.USERS, []);
        }
        
        if (!this.getData(this.STORAGE_KEYS.SETTINGS)) {
            const defaultSettings = {
                exchangeRate: 1500,
                currency: 'USD',
                language: 'ar',
                autoBackup: true,
                backupInterval: 3600000, // 1 hour
                programName: 'نظام المحاسبة',
                companyName: 'شركة المقاولات المتقدمة',
                companySubtitle: '',
                printLogoDataUrl: null,
                appFont: 'Cairo',
                // Watermark settings for printed pages
                watermark: {
                    enabled: false,
                    text: '',
                    opacity: 8, // percentage (0-100)
                    fontSize: 96,
                    rotate: -30,
                    mode: 'behind' // 'behind' or 'over'
                },
                // Footer defaults for printed pages
                footer: {
                    address: 'الدولة - المحافظة - بقية العنوان',
                    footerLogoDataUrl: null,
                    email: 'info@example.com',
                    phone1: '',
                    phone2: ''
                }
            };
            this.saveData(this.STORAGE_KEYS.SETTINGS, defaultSettings);
        }
        // مفاتيح الشراء بالآجل الجديدة
        if (!this.getData(this.STORAGE_KEYS.CREDIT_PURCHASE_SUPPLIERS)) {
            this.saveData(this.STORAGE_KEYS.CREDIT_PURCHASE_SUPPLIERS, []);
        }
        if (!this.getData(this.STORAGE_KEYS.CREDIT_PURCHASES)) {
            this.saveData(this.STORAGE_KEYS.CREDIT_PURCHASES, []);
        }
    }

    // Save data to localStorage (simplified without encryption)
    static saveData(key, data) {
        try {
            const jsonString = JSON.stringify(data);
            localStorage.setItem(key, jsonString);
            console.log(`✓ Data saved successfully for key: ${key}`);
            return true;
        } catch (error) {
            console.error('✗ Error saving data:', error);
            return false;
        }
    }

    // Get data from localStorage (simplified without decryption)
    static getData(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) {
                console.log(`ℹ No data found for key: ${key}`);
                return null;
            }

            const parsed = JSON.parse(data);
            console.log(`✓ Data retrieved successfully for key: ${key}, items: ${Array.isArray(parsed) ? parsed.length : 'object'}`);
            return parsed;
        } catch (error) {
            console.error('✗ Error getting data for key:', key, error);
            // Clear corrupted data
            localStorage.removeItem(key);
            console.log(`🗑️ Cleared corrupted data for key: ${key}`);
            return null;
        }
    }

    // Get all data
    static getAllData() {
        return {
            shareholders: this.getData(this.STORAGE_KEYS.SHAREHOLDERS) || [],
            capital: this.getData(this.STORAGE_KEYS.CAPITAL) || [],
            expenses: this.getData(this.STORAGE_KEYS.EXPENSES) || [],
            users: this.getData(this.STORAGE_KEYS.USERS) || [],
            settings: this.getData(this.STORAGE_KEYS.SETTINGS) || {},
            accountingGuide: this.getData(this.STORAGE_KEYS.ACCOUNTING_GUIDE) || [],
            creditPurchaseSuppliers: this.getData(this.STORAGE_KEYS.CREDIT_PURCHASE_SUPPLIERS) || [],
            creditPurchases: this.getData(this.STORAGE_KEYS.CREDIT_PURCHASES) || []
        };
    }

    // حفظ شامل (يُستخدم في بعض الأجزاء القديمة من الواجهة)
    static setAllData(all){
        if(!all || typeof all !== 'object') return false;
        if('shareholders' in all) this.saveData(this.STORAGE_KEYS.SHAREHOLDERS, all.shareholders);
        if('capital' in all) this.saveData(this.STORAGE_KEYS.CAPITAL, all.capital);
        if('expenses' in all) this.saveData(this.STORAGE_KEYS.EXPENSES, all.expenses);
        if('users' in all) this.saveData(this.STORAGE_KEYS.USERS, all.users);
        if('settings' in all) this.saveData(this.STORAGE_KEYS.SETTINGS, all.settings);
        if('accountingGuide' in all) this.saveData(this.STORAGE_KEYS.ACCOUNTING_GUIDE, all.accountingGuide);
        if('creditPurchaseSuppliers' in all) this.saveData(this.STORAGE_KEYS.CREDIT_PURCHASE_SUPPLIERS, all.creditPurchaseSuppliers);
        if('creditPurchases' in all) this.saveData(this.STORAGE_KEYS.CREDIT_PURCHASES, all.creditPurchases);
        // إنشاء نسخة احتياطية بعد الحفظ الشامل
        try { this.createBackup(); } catch(e){}
        return true;
    }

    // Add new shareholder
    static addShareholder(shareholderData) {
        const shareholders = this.getData(this.STORAGE_KEYS.SHAREHOLDERS) || [];
        const newShareholder = {
            id: this.generateId(),
            ...shareholderData,
            createdAt: new Date().toISOString()
        };
        
        shareholders.push(newShareholder);
        return this.saveData(this.STORAGE_KEYS.SHAREHOLDERS, shareholders) ? newShareholder : null;
    }

    // Update shareholder
    static updateShareholder(id, updateData) {
        const shareholders = this.getData(this.STORAGE_KEYS.SHAREHOLDERS) || [];
        const index = shareholders.findIndex(s => s.id === id);
        
        if (index !== -1) {
            shareholders[index] = { ...shareholders[index], ...updateData, updatedAt: new Date().toISOString() };
            return this.saveData(this.STORAGE_KEYS.SHAREHOLDERS, shareholders);
        }
        return false;
    }

    // Delete shareholder
    static deleteShareholder(id) {
        const shareholders = this.getData(this.STORAGE_KEYS.SHAREHOLDERS) || [];
        const filteredShareholders = shareholders.filter(s => s.id !== id);
        return this.saveData(this.STORAGE_KEYS.SHAREHOLDERS, filteredShareholders);
    }

    // Add capital entry
    static addCapitalEntry(capitalData) {
        const capital = this.getData(this.STORAGE_KEYS.CAPITAL) || [];
        const newEntry = {
            id: this.generateId(),
            registrationNumber: this.generateRegistrationNumber(),
            ...capitalData,
            createdAt: new Date().toISOString()
        };
        
        capital.push(newEntry);
        if (this.saveData(this.STORAGE_KEYS.CAPITAL, capital)) {
            this.notifyDataChanged('capital:add');
            return newEntry;
        }
        return null;
    }

    // Update capital entry
    static updateCapitalEntry(id, updateData) {
        const capital = this.getData(this.STORAGE_KEYS.CAPITAL) || [];
        const index = capital.findIndex(c => c.id === id);
        
        if (index !== -1) {
            capital[index] = { ...capital[index], ...updateData, updatedAt: new Date().toISOString() };
            const ok = this.saveData(this.STORAGE_KEYS.CAPITAL, capital);
            if (ok) this.notifyDataChanged('capital:update');
            return ok;
        }
        return false;
    }

    // Delete capital entry
    static deleteCapitalEntry(id) {
        const capital = this.getData(this.STORAGE_KEYS.CAPITAL) || [];
        const filteredCapital = capital.filter(c => c.id !== id);
    const ok = this.saveData(this.STORAGE_KEYS.CAPITAL, filteredCapital);
    if (ok) this.notifyDataChanged('capital:delete');
    return ok;
    }

    // Add expense entry
    static addExpenseEntry(expenseData) {
        const expenses = this.getData(this.STORAGE_KEYS.EXPENSES) || [];
        const newEntry = {
            id: this.generateId(),
            registrationNumber: this.generateRegistrationNumber(),
            ...expenseData,
            createdAt: new Date().toISOString()
        };
        
        expenses.push(newEntry);
        if (this.saveData(this.STORAGE_KEYS.EXPENSES, expenses)) {
            this.notifyDataChanged('expenses:add');
            return newEntry;
        }
        return null;
    }

    // Update expense entry
    static updateExpenseEntry(id, updateData) {
        const expenses = this.getData(this.STORAGE_KEYS.EXPENSES) || [];
        const index = expenses.findIndex(e => e.id === id);
        
        if (index !== -1) {
            expenses[index] = { ...expenses[index], ...updateData, updatedAt: new Date().toISOString() };
            const ok = this.saveData(this.STORAGE_KEYS.EXPENSES, expenses);
            if (ok) this.notifyDataChanged('expenses:update');
            return ok;
        }
        return false;
    }

    // Delete expense entry
    static deleteExpenseEntry(id) {
        const expenses = this.getData(this.STORAGE_KEYS.EXPENSES) || [];
        const filteredExpenses = expenses.filter(e => e.id !== id);
    const ok = this.saveData(this.STORAGE_KEYS.EXPENSES, filteredExpenses);
    if (ok) this.notifyDataChanged('expenses:delete');
    return ok;
    }

    // Accounting Guide Management
    static addAccountingGuideEntry(guideData) {
        const guide = this.getData(this.STORAGE_KEYS.ACCOUNTING_GUIDE) || [];
        const newEntry = {
            id: this.generateId(),
            registrationNumber: this.generateRegistrationNumber(),
            ...guideData,
            createdAt: new Date().toISOString()
        };
        guide.push(newEntry);

        if (this.saveData(this.STORAGE_KEYS.ACCOUNTING_GUIDE, guide)) {
            return newEntry;
        }
        return null;
    }

    // Update accounting guide entry
    static updateAccountingGuideEntry(id, updateData) {
        const guide = this.getData(this.STORAGE_KEYS.ACCOUNTING_GUIDE) || [];
        const entryIndex = guide.findIndex(entry => entry.id === id);

        if (entryIndex !== -1) {
            guide[entryIndex] = {
                ...guide[entryIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            return this.saveData(this.STORAGE_KEYS.ACCOUNTING_GUIDE, guide);
        }
        return false;
    }

    // Delete accounting guide entry
    static deleteAccountingGuideEntry(id) {
        const guide = this.getData(this.STORAGE_KEYS.ACCOUNTING_GUIDE) || [];
        const updatedGuide = guide.filter(entry => entry.id !== id);
        return this.saveData(this.STORAGE_KEYS.ACCOUNTING_GUIDE, updatedGuide);
    }

    // Search functionality
    static searchCapital(searchCriteria) {
        const capital = this.getData(this.STORAGE_KEYS.CAPITAL) || [];
        return capital.filter(entry => {
            return Object.keys(searchCriteria).every(key => {
                if (!searchCriteria[key]) return true;
                const value = entry[key]?.toString().toLowerCase();
                const searchValue = searchCriteria[key].toString().toLowerCase();
                return value?.includes(searchValue);
            });
        });
    }

    // Export data
    static exportData() {
        try {
            const allData = this.getAllData();
            const exportData = {
                ...allData,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `accounting_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    }

    // Import data
    static importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    // Validate data structure
                    if (this.validateImportData(importedData)) {
                        // Create backup before import
                        this.createBackup();
                        // Import data
                        if (importedData.shareholders) {
                            this.saveData(this.STORAGE_KEYS.SHAREHOLDERS, importedData.shareholders);
                        }
                        if (importedData.capital) {
                            this.saveData(this.STORAGE_KEYS.CAPITAL, importedData.capital);
                        }
                        if (importedData.expenses) {
                            this.saveData(this.STORAGE_KEYS.EXPENSES, importedData.expenses);
                        }
                        if (importedData.settings) {
                            this.saveData(this.STORAGE_KEYS.SETTINGS, importedData.settings);
                        }

                        // معالجة المستخدم الافتراضي admin
                        let users = importedData.users || [];
                        // تحقق من وجود مستخدم admin
                        let adminUser = users.find(u => u.username === 'admin');
                        if (!adminUser) {
                            // إذا لم يوجد، أضفه
                            if (typeof window.AuthManager !== 'undefined') {
                                const salt = 'default-salt';
                                const passwordHash = window.AuthManager.simpleHash('admin123' + salt);
                                adminUser = {
                                    id: this.generateId(),
                                    username: 'admin',
                                    password: passwordHash,
                                    salt: salt,
                                    name: 'المدير العام',
                                    role: 'admin',
                                    permissions: ['all'],
                                    isActive: true,
                                    createdAt: new Date().toISOString()
                                };
                                users.push(adminUser);
                            }
                        } else {
                            // إذا وجد، تحقق من وجود salt وتشفير كلمة المرور
                            if (!adminUser.salt || !adminUser.password || adminUser.password === 'admin123') {
                                if (typeof window.AuthManager !== 'undefined') {
                                    const salt = adminUser.salt || 'default-salt';
                                    adminUser.salt = salt;
                                    adminUser.password = window.AuthManager.simpleHash('admin123' + salt);
                                }
                            }
                            adminUser.isActive = true;
                        }
                        this.saveData(this.STORAGE_KEYS.USERS, users);

                        resolve(true);
                    } else {
                        reject(new Error('Invalid data format'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    // Validate import data
    static validateImportData(data) {
        const requiredFields = ['shareholders', 'capital', 'expenses'];
        return requiredFields.every(field => Array.isArray(data[field]));
    }

    // Restore from backup
    static restoreFromBackup() {
        try {
            const backup = this.getData(this.STORAGE_KEYS.BACKUP);
            if (backup && backup.data) {
                const { shareholders, capital, expenses, settings } = backup.data;
                
                this.saveData(this.STORAGE_KEYS.SHAREHOLDERS, shareholders || []);
                this.saveData(this.STORAGE_KEYS.CAPITAL, capital || []);
                this.saveData(this.STORAGE_KEYS.EXPENSES, expenses || []);
                this.saveData(this.STORAGE_KEYS.SETTINGS, settings || {});
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }

    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Generate registration number
    static generateRegistrationNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const time = Date.now().toString().slice(-4);
        
        return `${year}${month}${day}${time}`;
    }

    // Simple encryption (for basic data protection) - Unicode safe
    static encrypt(text) {
        try {
            // Convert to UTF-8 bytes first to handle Arabic text
            const utf8Text = unescape(encodeURIComponent(text));

            // Simple XOR encryption (in production, use proper encryption)
            let result = '';
            for (let i = 0; i < utf8Text.length; i++) {
                result += String.fromCharCode(utf8Text.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length));
            }

            // Convert to base64 safely
            return btoa(result);
        } catch (error) {
            console.error('Encryption error:', error);
            // Fallback: return text as base64 without encryption
            try {
                return btoa(unescape(encodeURIComponent(text)));
            } catch (fallbackError) {
                console.error('Fallback encryption error:', fallbackError);
                return text; // Return as-is if all fails
            }
        }
    }

    // Simple decryption - Unicode safe
    static decrypt(encryptedText) {
        try {
            const text = atob(encryptedText);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(text.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length));
            }

            // Convert back from UTF-8 bytes to Unicode
            return decodeURIComponent(escape(result));
        } catch (error) {
            console.error('Decryption error:', error);
            try {
                // Fallback: try to decode as plain base64
                return decodeURIComponent(escape(atob(encryptedText)));
            } catch (fallbackError) {
                console.error('Fallback decryption error:', fallbackError);
                return encryptedText; // Return as-is if decryption fails
            }
        }
    }

    // Clear all data (with confirmation)
    static clearAllData() {
        if (confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            this.initializeDefaultData();
            this.notifyDataChanged('data:cleared');
            return true;
        }
        return false;
    }

    // Notify listeners that financial data changed
    static notifyDataChanged(action) {
        // تجنّب الإطلاق أثناء التحميل الأولي (اختياري) يمكن التوسّع لاحقاً
        try {
            const event = new CustomEvent('dataChanged', { detail: { action, at: Date.now() } });
            document.dispatchEvent(event);
        } catch (e) {
            console.warn('notifyDataChanged failed', e);
        }
    }

    // Get storage usage
    static getStorageUsage() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
            }
        }
        return {
            used: totalSize,
            usedMB: (totalSize / 1024 / 1024).toFixed(2),
            available: 5 * 1024 * 1024 - totalSize, // Assuming 5MB limit
            availableMB: ((5 * 1024 * 1024 - totalSize) / 1024 / 1024).toFixed(2)
        };
    }
}

// Initialize storage when script loads
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.init();
});

// Auto-backup every hour
setInterval(() => {
    StorageManager.createBackup();
}, 3600000);

// Clear all corrupted data
window.clearAllData = function() {
    console.log('🗑️ Clearing all data...');
    Object.values(StorageManager.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
        console.log(`Cleared: ${key}`);
    });
    console.log('✓ All data cleared. Reinitializing...');
    StorageManager.init();
};

// Test function for debugging
window.testStorage = function() {
    console.log('Testing storage...');
    console.log('All data:', StorageManager.getAllData());
    console.log('Accounting guide:', StorageManager.getData(StorageManager.STORAGE_KEYS.ACCOUNTING_GUIDE));
};

// دالة لإعادة تعيين المستخدم الافتراضي admin
window.resetAdminUser = function() {
    if (typeof window.AuthManager !== 'undefined') {
        const salt = 'default-salt';
        const passwordHash = window.AuthManager.simpleHash('admin123' + salt);
        const adminUser = {
            id: StorageManager.generateId(),
            username: 'admin',
            password: passwordHash,
            salt: salt,
            name: 'المدير العام',
            role: 'admin',
            permissions: ['all'],
            isActive: true,
            createdAt: new Date().toISOString()
        };
        StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, [adminUser]);
        alert('تمت إعادة تعيين المستخدم admin بنجاح! يمكنك الآن الدخول باستخدام admin/admin123');
    } else {
        alert('لم يتم تحميل AuthManager بشكل صحيح');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
