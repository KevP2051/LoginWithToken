
const path = require('path');
const fs = require('fs');

const dashboardController = {
    // Dashboard principal - muestra contenido basado en el rol

    getDashboard: (req, res) => {
        const userRole = req.user.role;
        const userName = req.user.username;
        const userEmail = req.user.email;

        // Obtener datos específicos por rol
        const dashboardData = {
            username: userName,
            email: userEmail,
            role: userRole,
            adminData: null,
            moderatorData: null,
            userData: null
        };

        // Cargar datos específicos según el rol
        switch (userRole) {
            case 'admin': {
                // Leer logs reales
                let logs = [];
                try {
                    const logsPath = path.join(__dirname, '../../data/logs.json');
                    if (fs.existsSync(logsPath)) {
                        logs = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
                    }
                } catch (e) {
                    logs = [{ error: 'No se pudieron cargar los logs', details: e.message }];
                }

                dashboardData.adminData = {
                    totalUsers: 10,
                    totalModerators: 2,
                    totalLogs: logs.length,
                    logs: logs,
                    systemStatus: 'Activo'
                };
                dashboardData.moderatorData = {
                    pendingReviews: 5,
                    totalReports: 8
                };
                dashboardData.userData = {
                    lastLogin: new Date().toISOString(),
                    notifications: 3
                };
                break;
            }
            case 'moderator':
                dashboardData.moderatorData = {
                    pendingReviews: 5,
                    totalReports: 8
                };
                dashboardData.userData = {
                    lastLogin: new Date().toISOString(),
                    notifications: 2
                };
                break;
            case 'user':
            default:
                dashboardData.userData = {
                    lastLogin: new Date().toISOString(),
                    notifications: 1
                };
                break;
        }

        res.json({
            success: true,
            data: dashboardData
        });
    },

    // Página de dashboard (HTML)
    getDashboardPage: (req, res) => {
        res.sendFile(path.join(__dirname, '../../views/dashboard.html'));
    },

    // Solo para administradores
    getAdminPanel: (req, res) => {
        // Leer usuarios reales
        let users = [];
        try {
            const usersPath = path.join(__dirname, '../../data/users.json');
            if (fs.existsSync(usersPath)) {
                users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
            }
        } catch (e) {
            users = [{ error: 'No se pudieron cargar los usuarios', details: e.message }];
        }

        // Leer logs reales
        let logs = [];
        try {
            const logsPath = path.join(__dirname, '../../data/logs.json');
            if (fs.existsSync(logsPath)) {
                logs = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
            }
        } catch (e) {
            logs = [{ error: 'No se pudieron cargar los logs', details: e.message }];
        }

        const adminData = {
            users: users.map(u => ({
                id: u.id,
                username: u.username,
                email: u.email,
                role: u.role,
                status: u.isActive ? 'active' : 'inactive'
            })),
            systemStats: {
                uptime: '24 horas',
                memory: '512MB',
                cpu: '25%'
            },
            logs: logs
        };

        res.json({
            success: true,
            message: 'Panel de administración',
            data: adminData
        });
    },

    // Solo para moderadores y administradores
    getModeratorPanel: (req, res) => {
        const moderatorData = {
            pendingReports: [
                { id: 1, type: 'spam', user: 'user1', status: 'pending' },
                { id: 2, type: 'abuse', user: 'user2', status: 'pending' }
            ],
            recentActions: [
                { id: 1, action: 'banned_user', target: 'spammer1', date: new Date() }
            ]
        };

        res.json({
            success: true,
            message: 'Panel de moderación',
            data: moderatorData
        });
    },

    // Para todos los usuarios autenticados
    getUserProfile: (req, res) => {
        const userData = {
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            joinDate: req.user.createdAt || '2024-01-01',
            stats: {
                loginCount: 15,
                lastActive: new Date().toISOString()
            }
        };

        res.json({
            success: true,
            message: 'Perfil de usuario',
            data: userData
        });
    }
};

module.exports = dashboardController;
