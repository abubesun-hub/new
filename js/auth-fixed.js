// Fixed Simple Authentication Manager
console.log('بدء تحميل auth-fixed.js');

// Simple Authentication Manager Class
class AuthManager {
    constructor() {
        console.log('AuthManager: إنشاء instance جديد');
        this.currentUser = null;
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
        this.init();
    }

    // Initialize
    init() {
        console.log('AuthManager: تهيئة النظام');
        this.loadSession();
    }

    // Load existing session
    loadSession() {
        try {
            const sessionData = localStorage.getItem('user_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                const now = new Date().getTime();
                
                if (session.expiresAt > now) {
                    this.currentUser = session.user;
                    console.log('AuthManager: تم استرداد الجلسة للمستخدم:', session.user.name);
                } else {
                    localStorage.removeItem('user_session');
                    console.log('AuthManager: انتهت صلاحية الجلسة');
                }
            }
        } catch (error) {
            console.error('AuthManager: خطأ في تحميل الجلسة:', error);
            localStorage.removeItem('user_session');
        }
    }

    // Simple hash function
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // Login user
    async login(username, password) {
        console.log('AuthManager: بدء عملية تسجيل الدخول للمستخدم:', username);
        
        try {
            // Validate input
            if (!username || !password) {
                console.log('AuthManager: بيانات الدخول فارغة');
                return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
            }

            // Get users from storage
            let users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            if (!Array.isArray(users)) users = [];
            console.log('AuthManager: عدد المستخدمين المحفوظين:', users.length);

            // Ensure admin user exists even if users array exists but admin missing
            let adminUser = users.find(u => u.username === 'admin');
            if (!adminUser) {
                console.log('AuthManager: إضافة المستخدم الافتراضي admin لأنه غير موجود');
                const salt = 'default-salt';
                const defaultAdmin = {
                    id: StorageManager.generateId(),
                    username: 'admin',
                    password: this.simpleHash('admin123' + salt),
                    salt: salt,
                    name: 'المدير العام',
                    role: 'admin',
                    permissions: ['all'],
                    isActive: true,
                    createdAt: new Date().toISOString()
                };
                users.push(defaultAdmin);
                StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users);
                adminUser = defaultAdmin;
                console.log('AuthManager: تم إنشاء وحفظ المستخدم الافتراضي admin');
            } else {
                // If admin exists but has no salt or has plain password, normalize it
                if (!adminUser.salt || !adminUser.password || adminUser.password === 'admin123') {
                    console.log('AuthManager: تصحيح بيانات admin (تهيئة salt وhash)');
                    const salt = adminUser.salt || 'default-salt';
                    adminUser.salt = salt;
                    adminUser.password = this.simpleHash('admin123' + salt);
                    adminUser.isActive = true;
                    // save back
                    const idx = users.findIndex(u => u.username === 'admin');
                    if (idx !== -1) {
                        users[idx] = adminUser;
                        StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users);
                    }
                }
            }

            // Find user
            const user = users.find(u => u.username === username && u.isActive);
            console.log('AuthManager: المستخدم موجود:', !!user);

            if (user) {
                // Check password
                let passwordMatch = false;
                
                if (user.salt) {
                    // Hash the input password with the user's salt
                    const hashedInput = this.simpleHash(password + user.salt);
                    passwordMatch = (hashedInput === user.password);
                    console.log('AuthManager: استخدام التشفير مع salt');
                } else {
                    // Fallback for legacy users without salt
                    // 1) Try plain text compare
                    if (password === user.password) {
                        passwordMatch = true;
                        console.log('AuthManager: استخدام كلمة المرور النصية (بدون salt)');
                    } else {
                        // 2) Try legacy hashed (simpleHash(password))
                        const legacyHashed = this.simpleHash(password);
                        if (legacyHashed === user.password) {
                            passwordMatch = true;
                            console.log('AuthManager: تطابق مع تشفير قديم بدون salt - سيتم الترقية');
                            // Migrate to salted hash for future logins
                            try {
                                let users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
                                const idx = users.findIndex(u => u.username === username);
                                if (idx !== -1) {
                                    const newSalt = 'user-salt-' + Math.random().toString(36).slice(2);
                                    users[idx].salt = newSalt;
                                    users[idx].password = this.simpleHash(password + newSalt);
                                    StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users);
                                    console.log('AuthManager: تمت ترقية كلمة المرور إلى صيغة salted');
                                }
                            } catch (mErr) {
                                console.warn('AuthManager: فشل ترقية كلمة المرور:', mErr);
                            }
                        } else {
                            console.log('AuthManager: لا تطابق مع صيغة بدون salt');
                        }
                    }
                }

                console.log('AuthManager: نتيجة مطابقة كلمة المرور:', passwordMatch);

                if (passwordMatch) {
                    // Login successful
                    const { password: _, salt: __, ...userWithoutPassword } = user;
                    const userSession = {
                        ...userWithoutPassword,
                        loginTime: new Date().toISOString()
                    };

                    this.currentUser = userSession;
                    this.saveSession(userSession);

                    console.log('AuthManager: تسجيل الدخول ناجح');
                    return { success: true, user: userSession };
                } else {
                    console.log('AuthManager: كلمة المرور غير صحيحة');
                    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
                }
            } else {
                console.log('AuthManager: المستخدم غير موجود');
                return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
            }

        } catch (error) {
            console.error('AuthManager: خطأ في تسجيل الدخول:', error);
            return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول: ' + error.message };
        }
    }

    // Save user session
    saveSession(user) {
        try {
            const sessionData = {
                user: user,
                createdAt: new Date().getTime(),
                expiresAt: new Date().getTime() + this.sessionTimeout
            };
            localStorage.setItem('user_session', JSON.stringify(sessionData));
            console.log('AuthManager: تم حفظ الجلسة');
        } catch (error) {
            console.error('AuthManager: خطأ في حفظ الجلسة:', error);
        }
    }

    // Check if user is logged in
    checkSession() {
        if (!this.currentUser) return false;
        
        try {
            const sessionData = localStorage.getItem('user_session');
            if (!sessionData) return false;
            
            const session = JSON.parse(sessionData);
            const now = new Date().getTime();
            
            return session.expiresAt > now;
        } catch (error) {
            console.error('AuthManager: خطأ في فحص الجلسة:', error);
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('user_session');
        console.log('AuthManager: تم تسجيل الخروج');
    }

    // Check user permissions
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const userPermissions = this.currentUser.permissions || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }

    // Get user role
    getUserRole() {
        return this.currentUser?.role || 'guest';
    }

    // Return all users (without sensitive fields)
    getAllUsers() {
        try {
            let users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            if (!Array.isArray(users)) users = [];
            // sanitize
            return users.map(u => ({
                id: u.id,
                username: u.username,
                name: u.name,
                role: u.role,
                permissions: u.permissions || [],
                isActive: u.isActive !== false,
                createdAt: u.createdAt
            }));
        } catch (e) {
            console.error('AuthManager.getAllUsers error:', e);
            return [];
        }
    }

    // Get a single user by id (sanitized)
    getUserById(userId) {
        try {
            const users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            const u = users.find(x => x.id === userId);
            if (!u) return null;
            return {
                id: u.id,
                username: u.username,
                name: u.name,
                role: u.role,
                permissions: u.permissions || [],
                isActive: u.isActive !== false,
                createdAt: u.createdAt
            };
        } catch (e) {
            console.error('AuthManager.getUserById error:', e);
            return null;
        }
    }

    // Create user (admin/manager only)
    async createUser(userData) {
        try {
            if (!this.currentUser) {
                return { success: false, message: 'يجب تسجيل الدخول أولاً' };
            }
            const role = this.currentUser.role || this.currentUser.username;
            const isAllowed = (role === 'admin' || role === 'manager' || this.currentUser.username === 'admin' || this.currentUser.username === 'manager');
            if (!isAllowed) {
                return { success: false, message: 'ليس لديك صلاحية لإنشاء مستخدمين' };
            }

            // Basic validation
            const username = (userData.username || '').trim();
            const name = (userData.name || '').trim();
            const password = userData.password || '';
            const roleToSet = userData.role || 'user';
            const permissions = Array.isArray(userData.permissions) ? userData.permissions : [];
            if (!username || !name || !password) {
                return { success: false, message: 'جميع الحقول مطلوبة' };
            }
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                return { success: false, message: 'اسم المستخدم يجب أن يحتوي أحرف إنجليزية وأرقام فقط' };
            }

            let users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            if (!Array.isArray(users)) users = [];
            if (users.some(u => u.username === username)) {
                return { success: false, message: 'اسم المستخدم موجود بالفعل' };
            }

            // Salt + simple hash compatible with login()
            const salt = 'user-salt-' + Math.random().toString(36).slice(2);
            const hashedPassword = this.simpleHash(password + salt);

            const newUser = {
                id: StorageManager.generateId(),
                username,
                password: hashedPassword,
                salt,
                name,
                role: roleToSet,
                permissions,
                isActive: true,
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser.id || this.currentUser.username || 'system'
            };

            users.push(newUser);
            const ok = StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users);
            if (ok) {
                return { success: true, message: 'تم إنشاء المستخدم بنجاح', user: { ...newUser, password: undefined, salt: undefined } };
            }
            return { success: false, message: 'فشل حفظ المستخدم' };
        } catch (e) {
            console.error('AuthManager.createUser error:', e);
            return { success: false, message: 'حدث خطأ أثناء إنشاء المستخدم: ' + e.message };
        }
    }

    // Deactivate user (admin/manager only)
    async deactivateUser(userId) {
        try {
            if (!this.currentUser) {
                return { success: false, message: 'يجب تسجيل الدخول أولاً' };
            }
            const role = this.currentUser.role || this.currentUser.username;
            const isAllowed = (role === 'admin' || role === 'manager' || this.currentUser.username === 'admin' || this.currentUser.username === 'manager');
            if (!isAllowed) {
                return { success: false, message: 'ليس لديك صلاحية لإلغاء التفعيل' };
            }

            let users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            const idx = users.findIndex(u => u.id === userId);
            if (idx === -1) {
                return { success: false, message: 'المستخدم غير موجود' };
            }
            users[idx].isActive = false;
            const ok = StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users);
            return ok ? { success: true, message: 'تم إلغاء تفعيل المستخدم' } : { success: false, message: 'فشل حفظ الحالة' };
        } catch (e) {
            console.error('AuthManager.deactivateUser error:', e);
            return { success: false, message: 'حدث خطأ أثناء العملية: ' + e.message };
        }
    }

    // Activate user (admin/manager only)
    async activateUser(userId) {
        try {
            if (!this.currentUser) {
                return { success: false, message: 'يجب تسجيل الدخول أولاً' };
            }
            const role = this.currentUser.role || this.currentUser.username;
            const isAllowed = (role === 'admin' || role === 'manager' || this.currentUser.username === 'admin' || this.currentUser.username === 'manager');
            if (!isAllowed) {
                return { success: false, message: 'ليس لديك صلاحية للتفعيل' };
            }

            let users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            const idx = users.findIndex(u => u.id === userId);
            if (idx === -1) {
                return { success: false, message: 'المستخدم غير موجود' };
            }
            users[idx].isActive = true;
            const ok = StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users);
            return ok ? { success: true, message: 'تم تفعيل المستخدم' } : { success: false, message: 'فشل حفظ الحالة' };
        } catch (e) {
            console.error('AuthManager.activateUser error:', e);
            return { success: false, message: 'حدث خطأ أثناء العملية: ' + e.message };
        }
    }

    // Update user fields (name, role, permissions, isActive) and optionally reset password
    async updateUser(userId, updateData) {
        try {
            if (!this.currentUser) {
                return { success: false, message: 'يجب تسجيل الدخول أولاً' };
            }
            const role = this.currentUser.role || this.currentUser.username;
            const isAllowed = (role === 'admin' || role === 'manager' || this.currentUser.username === 'admin' || this.currentUser.username === 'manager');
            if (!isAllowed) {
                return { success: false, message: 'ليس لديك صلاحية للتعديل' };
            }

            let users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            const idx = users.findIndex(u => u.id === userId);
            if (idx === -1) {
                return { success: false, message: 'المستخدم غير موجود' };
            }

            // Update safe fields
            if (typeof updateData.name === 'string') users[idx].name = updateData.name.trim();
            if (typeof updateData.role === 'string') users[idx].role = updateData.role;
            if (Array.isArray(updateData.permissions)) users[idx].permissions = updateData.permissions;
            if (typeof updateData.isActive === 'boolean') users[idx].isActive = updateData.isActive;

            // Optional password reset
            if (updateData.newPassword && updateData.newPassword.length >= 6) {
                const salt = 'user-salt-' + Math.random().toString(36).slice(2);
                users[idx].salt = salt;
                users[idx].password = this.simpleHash(updateData.newPassword + salt);
                users[idx].passwordChangedAt = new Date().toISOString();
            }

            const ok = StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users);
            return ok ? { success: true, message: 'تم حفظ التعديلات' } : { success: false, message: 'فشل حفظ البيانات' };
        } catch (e) {
            console.error('AuthManager.updateUser error:', e);
            return { success: false, message: 'حدث خطأ أثناء التعديل: ' + e.message };
        }
    }

    // Delete user (admin/manager only) with safety checks
    async deleteUser(userId) {
        try {
            if (!this.currentUser) {
                return { success: false, message: 'يجب تسجيل الدخول أولاً' };
            }
            const role = this.currentUser.role || this.currentUser.username;
            const isAllowed = (role === 'admin' || role === 'manager' || this.currentUser.username === 'admin' || this.currentUser.username === 'manager');
            if (!isAllowed) {
                return { success: false, message: 'ليس لديك صلاحية للحذف' };
            }

            let users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            const idx = users.findIndex(u => u.id === userId);
            if (idx === -1) return { success: false, message: 'المستخدم غير موجود' };

            // Prevent deleting admin account
            if (users[idx].username === 'admin') {
                return { success: false, message: 'لا يمكن حذف حساب admin' };
            }
            // Prevent deleting self
            if (this.currentUser.id && users[idx].id === this.currentUser.id) {
                return { success: false, message: 'لا يمكن حذف حسابك الحالي' };
            }

            users.splice(idx, 1);
            const ok = StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users);
            return ok ? { success: true, message: 'تم حذف المستخدم' } : { success: false, message: 'فشل حذف المستخدم' };
        } catch (e) {
            console.error('AuthManager.deleteUser error:', e);
            return { success: false, message: 'حدث خطأ أثناء الحذف: ' + e.message };
        }
    }
}

// Create the instance immediately
console.log('AuthManager: إنشاء الـ instance');
const AuthManagerInstance = new AuthManager();

// Export to global scope with multiple names for compatibility
window.AuthManager = AuthManagerInstance;
window.SimpleAuthManager = AuthManagerInstance;
window.authManager = AuthManagerInstance;

console.log('AuthManager: تم تصدير الـ instance');
console.log('window.AuthManager type:', typeof window.AuthManager);
console.log('window.AuthManager.login type:', typeof window.AuthManager.login);
console.log('window.SimpleAuthManager type:', typeof window.SimpleAuthManager);
console.log('window.SimpleAuthManager.login type:', typeof window.SimpleAuthManager.login);

console.log('✅ auth-fixed.js تم تحميله بنجاح');