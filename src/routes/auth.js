const express = require('express');
const AuthController = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

const router = express.Router();

// ============= RUTAS DE RECUPERACIÓN DE CONTRASEÑA =============

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperación de contraseña
 * @access  Public
 * @body    { email: string }
 */
router.post('/forgot-password', 
    rateLimiter.passwordResetLimiter, // Limitar intentos
    AuthController.forgotPasswordValidation,
    AuthController.forgotPassword
);

/**
 * @route   GET /api/auth/validate-reset-token/:token
 * @desc    Validar token de recuperación
 * @access  Public
 * @params  token: string (64 chars hex)
 */
router.get('/validate-reset-token/:token',
    AuthController.validateResetToken
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña con token
 * @access  Public
 * @body    { token: string, newPassword: string, confirmPassword: string }
 */
router.post('/reset-password',
    rateLimiter.passwordResetLimiter,
    AuthController.resetPasswordValidation,
    AuthController.resetPassword
);

// ============= RUTAS ADMINISTRATIVAS =============

/**
 * @route   GET /api/auth/reset-stats
 * @desc    Obtener estadísticas de recuperación (solo admins)
 * @access  Private (Admin only)
 */
router.get('/reset-stats',
    auth.verifyToken,
    auth.requireAdmin,
    AuthController.getResetStats
);

/**
 * @route   POST /api/auth/cleanup-tokens
 * @desc    Limpiar tokens expirados (solo admins)
 * @access  Private (Admin only)
 */
router.post('/cleanup-tokens',
    auth.verifyToken,
    auth.requireAdmin,
    AuthController.cleanupExpiredTokens
);

// ============= OTRAS RUTAS DE AUTH (TODO) =============

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', AuthController.login);

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', AuthController.register);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout', auth.verifyToken, AuthController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refrescar token de acceso
 * @access  Public
 */
router.post('/refresh', AuthController.refreshToken);

module.exports = router;
