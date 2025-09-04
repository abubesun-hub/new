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
            console.log('AuthManager: عدد المستخدمين المحفوظين:', users.length);

            // Create default admin user if no users exist
            if (users.length === 0) {
                console.log('AuthManager: إنشاء مستخدم افتراضي');
                const defaultAdmin = {
                    id: StorageManager.generateId(),
                    username: 'admin',
                    password: this.simpleHash('admin123' + 'default-salt'),
                    salt: 'default-salt',
                    name: 'المدير العام',
                    role: 'admin',
                    permissions: ['all'],
                    isActive: true,
                    createdAt: new Date().toISOString()
                };
                users.push(defaultAdmin);
                StorageManager.saveData(StorageManager.STORAGE_KEYS.USERS, users);
                console.log('AuthManager: تم إنشاء وحفظ المستخدم الافتراضي');
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
                    // Fallback for plain text passwords
                    passwordMatch = (password === user.password);
                    console.log('AuthManager: استخدام كلمة المرور النصية');
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