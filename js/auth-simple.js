// Simple Authentication Manager (without crypto.subtle dependency)
class SimpleAuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
        this.init();
    }

    // Initialize auth manager
    init() {
        console.log('SimpleAuthManager: تهيئة نظام المصادقة');
        this.loadSession();
        this.setupSessionTimeout();
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
                    console.log('SimpleAuthManager: تم استرداد الجلسة للمستخدم:', session.user.name);
                } else {
                    localStorage.removeItem('user_session');
                    console.log('SimpleAuthManager: انتهت صلاحية الجلسة');
                }
            }
        } catch (error) {
            console.error('SimpleAuthManager: خطأ في تحميل الجلسة:', error);
            localStorage.removeItem('user_session');
        }
    }

    // Simple hash function (not cryptographically secure, but works for demo)
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

    // Login user
    async login(username, password) {
        console.log('SimpleAuthManager: بدء عملية تسجيل الدخول للمستخدم:', username);
        
        try {
            // Validate input
            if (!username || !password) {
                console.log('SimpleAuthManager: بيانات الدخول فارغة');
                return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
            }

            // Get users from storage
            let users = StorageManager.getData(StorageManager.STORAGE_KEYS.USERS) || [];
            console.log('SimpleAuthManager: عدد المستخدمين المحفوظين:', users.length);

            // Create default admin user if no users exist
            if (users.length === 0) {
                console.log('SimpleAuthManager: إنشاء مستخدم افتراضي');
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
                console.log('SimpleAuthManager: تم إنشاء وحفظ المستخدم الافتراضي');
            }

            // Find user
            const user = users.find(u => u.username === username && u.isActive);
            console.log('SimpleAuthManager: المستخدم موجود:', !!user);

            if (user) {
                // Check password
                let passwordMatch = false;
                
                if (user.salt) {
                    // Hash the input password with the user's salt
                    const hashedInput = this.simpleHash(password + user.salt);
                    passwordMatch = (hashedInput === user.password);
                    console.log('SimpleAuthManager: استخدام التشفير مع salt');
                } else {
                    // Fallback for plain text passwords
                    passwordMatch = (password === user.password);
                    console.log('SimpleAuthManager: استخدام كلمة المرور النصية');
                }

                console.log('SimpleAuthManager: نتيجة مطابقة كلمة المرور:', passwordMatch);

                if (passwordMatch) {
                    // Login successful
                    const { password: _, salt: __, ...userWithoutPassword } = user;
                    const userSession = {
                        ...userWithoutPassword,
                        loginTime: new Date().toISOString()
                    };

                    this.currentUser = userSession;
                    this.saveSession(userSession);

                    console.log('SimpleAuthManager: تسجيل الدخول ناجح');
                    return { success: true, user: userSession };
                } else {
                    console.log('SimpleAuthManager: كلمة المرور غير صحيحة');
                    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
                }
            } else {
                console.log('SimpleAuthManager: المستخدم غير موجود');
                return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
            }

        } catch (error) {
            console.error('SimpleAuthManager: خطأ في تسجيل الدخول:', error);
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
            console.log('SimpleAuthManager: تم حفظ الجلسة');
        } catch (error) {
            console.error('SimpleAuthManager: خطأ في حفظ الجلسة:', error);
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
            console.error('SimpleAuthManager: خطأ في فحص الجلسة:', error);
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
        console.log('SimpleAuthManager: تم تسجيل الخروج');
    }

    // Setup session timeout check
    setupSessionTimeout() {
        setInterval(() => {
            if (!this.checkSession() && this.currentUser) {
                console.log('SimpleAuthManager: انتهت صلاحية الجلسة');
                this.logout();
                // You can add UI notification here
            }
        }, 60000); // Check every minute
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

// Create and initialize the auth manager instance
let authManagerInstance;

try {
    authManagerInstance = new SimpleAuthManager();
    console.log('SimpleAuthManager: تم إنشاء الـ instance بنجاح');
} catch (error) {
    console.error('SimpleAuthManager: خطأ في إنشاء الـ instance:', error);
}

// Export the instance to global scope
if (authManagerInstance) {
    window.SimpleAuthManager = authManagerInstance;
    window.simpleAuthManager = authManagerInstance;
    console.log('SimpleAuthManager: تم تصدير الـ instance بنجاح');
    console.log('SimpleAuthManager type:', typeof window.SimpleAuthManager);
    console.log('SimpleAuthManager has login:', typeof window.SimpleAuthManager.login);
} else {
    console.error('SimpleAuthManager: فشل في تصدير الـ instance');
}