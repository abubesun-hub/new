// Authentication and User Management System
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
        this.init();
    }

    init() {
        this.checkSession();
        this.setupSessionTimeout();
    }

    // Check if user session is valid
    checkSession() {
        const savedUser = localStorage.getItem('currentUser');
        const sessionStart = localStorage.getItem('sessionStart');
        
        if (savedUser && sessionStart) {
            const sessionAge = Date.now() - parseInt(sessionStart);
            
            if (sessionAge < this.sessionTimeout) {
                this.currentUser = JSON.parse(savedUser);
                return true;
            } else {
                this.logout();
                return false;
            }
        }
        return false;
    }

    // Login user
    async login(username, password) {
        console.log('AuthManager.login: بدء عملية تسجيل الدخول');
        try {
            // Validate input
            if (!username || !password) {
                console.log('AuthManager.login: بيانات الدخول فارغة');
                return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
            }
            
            console.log('AuthManager.login: استدعاء validateCredentials');
            // Validate credentials
            const user = await this.validateCredentials(username, password);
            console.log('AuthManager.login: نتيجة validateCredentials:', user);
            
            if (user) {
                console.log('AuthManager.login: المستخدم صحيح، حفظ الجلسة');
                this.currentUser = user;
                
                try {
                    this.saveSession(user);
                    console.log('AuthManager.login: تم حفظ الجلسة');
                } catch (sessionError) {
                    console.error('AuthManager.login: خطأ في حفظ الجلسة:', sessionError);
                }
                
                // تسجيل محاولة الدخول الناجحة مع معالجة الأخطاء
                try {
                    this.logLoginAttempt(username, true);
                } catch (logError) {
                    console.error('خطأ في تسجيل محاولة الدخول:', logError);
                }
                
                console.log('AuthManager.login: تسجيل الدخول ناجح');
                return { success: true, user: user };
            } else {
                console.log('AuthManager.login: بيانات المستخدم غير صحيحة');
                // تسجيل محاولة الدخول الفاشلة
                try {
                    this.logLoginAttempt(username, false);
                } catch (logError) {
                    console.error('خطأ في تسجيل محاولة الدخول:', logError);
                }
                return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
            }
        } catch (error) {
            console.error('AuthManager.login: خطأ في تسجيل الدخول:', error);
            console.error('AuthManager.login: تفاصيل الخطأ:', error.stack);
            return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول: ' + error.message };
        }
    }

    // Validate user credentials
    async validateCredentials(username, password) {
        console.log('validateCredentials: بدء التحقق من بيانات المستخدم:', username);
        
        try {
            // Get users from storage
            console.log('validateCredentials: جلب المستخدمين من التخزين');
            const users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            console.log('validateCredentials: عدد المستخدمين:', users.length);
            
            // Default admin user if no users exist
            if (users.length === 0) {
                console.log('validateCredentials: لا يوجد مستخدمين، إنشاء مستخدم افتراضي');
                try {
                    const salt = 'default-salt-' + Math.random().toString(36).substring(2);
                    console.log('validateCredentials: تشفير كلمة المرور الافتراضية');
                    const hashedPassword = await this.hashPassword('admin123', salt);
                    console.log('validateCredentials: تم تشفير كلمة المرور');
                    
                    const defaultAdmin = {
                        id: StorageManager.generateId(),
                        username: 'admin',
                        password: hashedPassword,
                        salt: salt,
                        name: 'المدير العام',
                        role: 'admin',
                        permissions: ['all'],
                        isActive: true,
                        createdAt: new Date().toISOString()
                    };
                    users.push(defaultAdmin);
                    console.log('validateCredentials: حفظ المستخدم الافتراضي');
                    StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users);
                    console.log('validateCredentials: تم حفظ المستخدم الافتراضي');
                } catch (createUserError) {
                    console.error('validateCredentials: خطأ في إنشاء المستخدم الافتراضي:', createUserError);
                    throw createUserError;
                }
            }

            // Find user
            console.log('validateCredentials: البحث عن المستخدم');
            const user = users.find(u => u.username === username && u.isActive);
            console.log('validateCredentials: المستخدم موجود:', !!user);
            
            if (user) {
                console.log('validateCredentials: التحقق من كلمة المرور');
                // Check password using new hashing system
                let passwordMatch = false;
                
                try {
                    if (user.salt) {
                        console.log('validateCredentials: استخدام التشفير مع salt');
                        passwordMatch = await this.verifyPassword(password, user.password, user.salt);
                    } else {
                        console.log('validateCredentials: استخدام كلمة المرور النصية (fallback)');
                        // Fallback for old users without salt (plain text password)
                        passwordMatch = (password === user.password);
                    }
                    console.log('validateCredentials: نتيجة مطابقة كلمة المرور:', passwordMatch);
                } catch (passwordError) {
                    console.error('validateCredentials: خطأ في التحقق من كلمة المرور:', passwordError);
                    throw passwordError;
                }

                if (passwordMatch) {
                    console.log('validateCredentials: كلمة المرور صحيحة، إرجاع بيانات المستخدم');
                    // Return user without password
                    const { password: _, ...userWithoutPassword } = user;
                    return {
                        ...userWithoutPassword,
                        loginTime: new Date().toISOString()
                    };
                }
            }
            
            console.log('validateCredentials: فشل التحقق من البيانات');
            return null;
            
        } catch (error) {
            console.error('validateCredentials: خطأ عام:', error);
            throw error;
        }
    }

    // Save user session
    saveSession(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('sessionStart', Date.now().toString());
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionStart');
        
        // Redirect to login if on dashboard
        if (window.app) {
            window.app.showLogin();
        }
    }

    // Setup session timeout
    setupSessionTimeout() {
        setInterval(() => {
            if (!this.checkSession()) {
                if (this.currentUser) {
                    alert('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
                    this.logout();
                }
            }
        }, 60000); // Check every minute
    }

    // Hash password using SHA-256 with salt (with fallback for non-HTTPS)
    async hashPassword(password, salt) {
        try {
            // Try to use crypto.subtle if available (HTTPS/localhost)
            if (window.crypto && window.crypto.subtle) {
                const encoder = new TextEncoder();
                const data = encoder.encode(password + salt);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } else {
                // Fallback: simple hash function for non-HTTPS environments
                return this.simpleHash(password + salt);
            }
        } catch (error) {
            console.warn('Crypto API not available, using fallback hash:', error);
            // Fallback: simple hash function
            return this.simpleHash(password + salt);
        }
    }
    
    // Simple hash function for fallback (not cryptographically secure, but works)
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    // Verify password
    async verifyPassword(password, hashedPassword, salt) {
        const newHash = await this.hashPassword(password, salt);
        return newHash === hashedPassword;
    }

    // Log login attempts
    logLoginAttempt(username, success) {
        try {
            const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
            attempts.push({
                username,
                success,
                timestamp: new Date().toISOString(),
                ip: 'localhost' // In production, get real IP
            });
            
            // Keep only last 100 attempts
            if (attempts.length > 100) {
                attempts.splice(0, attempts.length - 100);
            }
            
            localStorage.setItem('loginAttempts', JSON.stringify(attempts));
        } catch (error) {
            console.error('خطأ في تسجيل محاولة الدخول:', error);
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user has permission
    hasPermission(permission) {
        if (!this.currentUser) return false;

        // Special case for admin and manager users
        const username = this.currentUser.username;
        if (username === 'admin') return true; // Admin has all permissions
        if (username === 'manager' && ['capital', 'expenses', 'reports', 'users'].includes(permission)) return true;
        if (username === 'accountant' && ['capital', 'expenses', 'reports'].includes(permission)) return true;

        const userPermissions = this.currentUser.permissions || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }

    // Get user role
    getUserRole() {
        return this.currentUser?.role || 'guest';
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, message: 'يجب تسجيل الدخول أولاً' };
        }

        const users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex === -1) {
            return { success: false, message: 'المستخدم غير موجود' };
        }

        // Verify current password
        let currentPasswordValid = false;
        if (users[userIndex].salt) {
            currentPasswordValid = await this.verifyPassword(currentPassword, users[userIndex].password, users[userIndex].salt);
        } else {
            currentPasswordValid = (currentPassword === users[userIndex].password);
        }
        
        if (!currentPasswordValid) {
            return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
        }

        // Validate new password
        const passwordValidation = this.validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return { success: false, message: passwordValidation.message };
        }

        // Update password with new salt
        const newSalt = 'user-salt-' + Math.random().toString(36).substring(2);
        users[userIndex].password = await this.hashPassword(newPassword, newSalt);
        users[userIndex].salt = newSalt;
        users[userIndex].passwordChangedAt = new Date().toISOString();
        
        if (StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users)) {
            return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
        } else {
            return { success: false, message: 'حدث خطأ أثناء تغيير كلمة المرور' };
        }
    }

    // Validate password strength
    validatePassword(password) {
        if (password.length < 6) {
            return { valid: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
        }
        
        if (!/[a-zA-Z]/.test(password)) {
            return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حروف' };
        }
        
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: 'كلمة المرور يجب أن تحتوي على أرقام' };
        }
        
        return { valid: true };
    }

    // Create new user (admin only)
    async createUser(userData) {
        // Check if user is logged in and is admin or manager
        if (!this.currentUser) {
            return { success: false, message: 'يجب تسجيل الدخول أولاً' };
        }

        const username = this.currentUser.username;
        if (username !== 'admin' && username !== 'manager') {
            return { success: false, message: 'ليس لديك صلاحية لإنشاء مستخدمين' };
        }

        const users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
        
        // Check if username already exists
        if (users.some(u => u.username === userData.username)) {
            return { success: false, message: 'اسم المستخدم موجود بالفعل' };
        }

        // Validate password
        const passwordValidation = this.validatePassword(userData.password);
        if (!passwordValidation.valid) {
            return { success: false, message: passwordValidation.message };
        }

        // Create new user with salt
        const salt = 'user-salt-' + Math.random().toString(36).substring(2);
        const newUser = {
            id: StorageManager.generateId(),
            username: userData.username,
            password: await this.hashPassword(userData.password, salt),
            salt: salt,
            name: userData.name,
            role: userData.role || 'user',
            permissions: userData.permissions || [],
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser.id
        };

        users.push(newUser);
        
        if (StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users)) {
            return { success: true, message: 'تم إنشاء المستخدم بنجاح', user: newUser };
        } else {
            return { success: false, message: 'حدث خطأ أثناء إنشاء المستخدم' };
        }
    }

    // Update user (admin only)
    async updateUser(userId, updateData) {
        // Check if user is logged in and is admin or manager
        if (!this.currentUser) {
            return { success: false, message: 'يجب تسجيل الدخول أولاً' };
        }

        const username = this.currentUser.username;
        if (username !== 'admin' && username !== 'manager') {
            return { success: false, message: 'ليس لديك صلاحية لتعديل المستخدمين' };
        }

        const users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return { success: false, message: 'المستخدم غير موجود' };
        }

        // Update user data
        const updatedUser = {
            ...users[userIndex],
            ...updateData,
            updatedAt: new Date().toISOString(),
            updatedBy: this.currentUser.id
        };

        // If password is being updated, hash it
        if (updateData.password) {
            const passwordValidation = this.validatePassword(updateData.password);
            if (!passwordValidation.valid) {
                return { success: false, message: passwordValidation.message };
            }
            const newSalt = 'user-salt-' + Math.random().toString(36).substring(2);
            updatedUser.password = await this.hashPassword(updateData.password, newSalt);
            updatedUser.salt = newSalt;
        }

        users[userIndex] = updatedUser;
        
        if (StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users)) {
            return { success: true, message: 'تم تحديث المستخدم بنجاح' };
        } else {
            return { success: false, message: 'حدث خطأ أثناء تحديث المستخدم' };
        }
    }

    // Deactivate user (admin only)
    async deactivateUser(userId) {
        // Check if user is logged in and is admin or manager
        if (!this.currentUser) {
            return { success: false, message: 'يجب تسجيل الدخول أولاً' };
        }

        const username = this.currentUser.username;
        if (username !== 'admin' && username !== 'manager') {
            return { success: false, message: 'ليس لديك صلاحية لإلغاء تفعيل المستخدمين' };
        }

        if (userId === this.currentUser.id) {
            return { success: false, message: 'لا يمكنك إلغاء تفعيل حسابك الخاص' };
        }

        return this.updateUser(userId, { isActive: false });
    }

    // Get all users (admin only)
    getAllUsers() {
        // Check if user is logged in and is admin or manager
        if (!this.currentUser) {
            return [];
        }

        const username = this.currentUser.username;
        if (username !== 'admin' && username !== 'manager') {
            return [];
        }

        const users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
        return users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }

    // Get login attempts (admin only)
    getLoginAttempts() {
        if (!this.hasPermission('users') && !this.hasPermission('all')) {
            return [];
        }

        return JSON.parse(localStorage.getItem('loginAttempts') || '[]');
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for global use
window.AuthManager = authManager;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authManager;
}
