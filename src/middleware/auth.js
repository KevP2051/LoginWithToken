const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Logger = require('../services/loggerService');

require('dotenv').config();

const verifyToken = (req, res, next) => {
    try {
        // Buscar token en header Authorization
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : null;

        if (!token) {
            Logger.log('UNAUTHORIZED_ACCESS', 'Acceso sin token', {
                ipAddress: req.ip,
                endpoint: req.originalUrl
            });

            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
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

            return res.status(401).json({
                success: false,
                message: 'Token inválido - usuario no encontrado'
            });
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
        Logger.log('TOKEN_VERIFICATION_ERROR', 'Error verificando token', {
            error: error.message,
            ipAddress: req.ip,
            endpoint: req.originalUrl
        });

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
    }
};

/**
 * Middleware para verificar rol de administrador
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Autenticación requerida'
        });
    }

    if (req.user.role !== 'admin') {
        Logger.log('UNAUTHORIZED_ADMIN_ACCESS', 'Intento de acceso admin sin permisos', {
            userId: req.user.id,
            userRole: req.user.role,
            ipAddress: req.ip,
            endpoint: req.originalUrl
        });

        return res.status(403).json({
            success: false,
            message: 'Acceso denegado - Se requieren privilegios de administrador'
        });
    }

    next();
};

/**
 * Middleware para verificar rol de moderador o superior
 */
const requireModerator = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Autenticación requerida'
        });
    }

    const allowedRoles = ['admin', 'moderator'];
    if (!allowedRoles.includes(req.user.role)) {
        Logger.log('UNAUTHORIZED_MODERATOR_ACCESS', 'Intento de acceso moderador sin permisos', {
            userId: req.user.id,
            userRole: req.user.role,
            ipAddress: req.ip,
            endpoint: req.originalUrl
        });

        return res.status(403).json({
            success: false,
            message: 'Acceso denegado - Se requieren privilegios de moderador o superior'
        });
    }

    next();
};

/**
 * Middleware opcional - verificar token si existe, pero permitir acceso sin él
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : null;

        if (!token) {
            // No hay token, continuar sin autenticación
            req.user = null;
            return next();
        }

        // Hay token, verificarlo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = User.findById(decoded.id);
        
        if (user && user.isActive) {
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                username: user.username
            };
        } else {
            req.user = null;
        }

        next();

    } catch (error) {
        // Error verificando token opcional, continuar sin autenticación
        req.user = null;
        next();
    }
};

module.exports = {
    verifyToken,
    requireAdmin,
    requireModerator,
    optionalAuth
};
