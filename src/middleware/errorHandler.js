const Logger = require('../services/loggerService');

/**
 * Middleware de manejo centralizado de errores
 */
const errorHandler = (err, req, res, next) => {
    // Log del error
    Logger.log('ERROR', err.message, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Error de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Datos inválidos',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // Error de JWT
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }

    // Error de rate limiting
    if (err.status === 429) {
        return res.status(429).json({
            success: false,
            message: 'Demasiadas peticiones. Intenta de nuevo más tarde.'
        });
    }

    // Error genérico del servidor
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
};

module.exports = errorHandler;
