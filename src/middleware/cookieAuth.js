const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Logger = require('../services/loggerService');

require('dotenv').config();

/**
 * Middleware de autenticación basado en cookies para páginas web
 */
const verifyCookieToken = (req, res, next) => {
    try {
        // Buscar token en cookies
        const token = req.cookies.token;

        if (!token) {
            Logger.log('UNAUTHORIZED_ACCESS', 'Acceso sin token en cookie', {
                ipAddress: req.ip,
                endpoint: req.originalUrl
            });

            // Para rutas web, redirigir al login
            if (req.originalUrl.includes('/api/')) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de acceso requerido'
                });
            } else {
                return res.redirect('/login');
            }
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el usuario aún existe y está activo
        const user = User.findById(decoded.id);
        if (!user || !user.isActive) {
            Logger.log('INVALID_TOKEN_USER', 'Token válido pero usuario inválido', {
                tokenUserId: decoded.id,
                ipAddress: req.ip,
                endpoint: req.originalUrl
            });

            // Para rutas web, redirigir al login
            if (req.originalUrl.includes('/api/')) {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido - usuario no encontrado'
                });
            } else {
                return res.redirect('/login');
            }
        }

        // Agregar información del usuario al request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            username: user.username
        };

        next();

    } catch (error) {
        Logger.log('TOKEN_VERIFICATION_ERROR', 'Error verificando token de cookie', {
            error: error.message,
            ipAddress: req.ip,
            endpoint: req.originalUrl
        });

        // Para rutas web, redirigir al login
        if (req.originalUrl.includes('/api/')) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error interno verificando autenticación'
            });
        } else {
            return res.redirect('/login');
        }
    }
};

module.exports = {
    verifyCookieToken
};
