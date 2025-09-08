const rateLimit = require('express-rate-limit');
const Logger = require('../services/loggerService');

/**
 * Rate limiter general para la API
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 peticiones por ventana de tiempo
    message: {
        success: false,
        message: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        Logger.log('RATE_LIMIT_EXCEEDED', 'Límite general de peticiones excedido', {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl
        });
        
        res.status(429).json({
            success: false,
            message: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.',
            retryAfter: '15 minutos'
        });
    }
});

/**
 * Rate limiter específico para recuperación de contraseñas
 * Más restrictivo para prevenir abuso del sistema de email
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // Máximo 5 intentos de recuperación por IP por hora
    message: {
        success: false,
        message: 'Demasiados intentos de recuperación de contraseña. Intenta de nuevo en 1 hora.',
        retryAfter: '1 hora'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Usar IP + email para ser más específico
        const email = req.body.email || 'no-email';
        return `${req.ip}:${email}`;
    },
    handler: (req, res) => {
        Logger.log('PASSWORD_RESET_RATE_LIMIT', 'Límite de recuperación de contraseña excedido', {
            ipAddress: req.ip,
            email: req.body.email,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl
        });
        
        res.status(429).json({
            success: false,
            message: 'Demasiados intentos de recuperación de contraseña. Intenta de nuevo en 1 hora.',
            retryAfter: '1 hora'
        });
    }
});

/**
 * Rate limiter para intentos de login
 * Previene ataques de fuerza bruta
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Máximo 10 intentos de login por IP
    message: {
        success: false,
        message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // No contar requests exitosos
    keyGenerator: (req) => {
        // Combinar IP + email para tracking más preciso
        const email = req.body.email || 'no-email';
        return `login:${req.ip}:${email}`;
    },
    handler: (req, res) => {
        Logger.log('LOGIN_RATE_LIMIT', 'Límite de intentos de login excedido', {
            ipAddress: req.ip,
            email: req.body.email,
            userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
            success: false,
            message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
            retryAfter: '15 minutos'
        });
    }
});

/**
 * Rate limiter para registro de nuevos usuarios
 */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // Máximo 3 registros por IP por hora
    message: {
        success: false,
        message: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.',
        retryAfter: '1 hora'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        Logger.log('REGISTER_RATE_LIMIT', 'Límite de registro excedido', {
            ipAddress: req.ip,
            email: req.body.email,
            userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
            success: false,
            message: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.',
            retryAfter: '1 hora'
        });
    }
});

/**
 * Rate limiter estricto para endpoints administrativos
 */
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // Máximo 50 peticiones para admins
    message: {
        success: false,
        message: 'Límite de peticiones administrativas excedido.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        Logger.log('ADMIN_RATE_LIMIT', 'Límite de peticiones admin excedido', {
            ipAddress: req.ip,
            userId: req.user?.id,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl
        });
        
        res.status(429).json({
            success: false,
            message: 'Límite de peticiones administrativas excedido.',
            retryAfter: '15 minutos'
        });
    }
});

module.exports = {
    generalLimiter,
    passwordResetLimiter,
    loginLimiter,
    registerLimiter,
    adminLimiter
};
