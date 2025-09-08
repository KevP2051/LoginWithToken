// Middleware de autorización por roles
const roleAuth = {
    // Verificar si el usuario tiene uno de los roles permitidos
    requireRoles: (...allowedRoles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de acceso requerido'
                });
            }

            const userRole = req.user.role;
            
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}. Tu rol: ${userRole}`
                });
            }

            next();
        };
    },

    // Middleware específicos para cada rol
    requireAdmin: (req, res, next) => {
        return roleAuth.requireRoles('admin')(req, res, next);
    },

    requireModerator: (req, res, next) => {
        return roleAuth.requireRoles('admin', 'moderator')(req, res, next);
    },

    requireUser: (req, res, next) => {
        return roleAuth.requireRoles('admin', 'moderator', 'user')(req, res, next);
    }
};

module.exports = roleAuth;
