const express = require('express');
const AuthController = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Recuperación de Contraseña
 *     description: Endpoints para el proceso de recuperación de contraseñas vía email
 *   - name: Administración
 *     description: Endpoints administrativos (requieren rol admin)
 */

// ============= RUTAS DE RECUPERACIÓN DE CONTRASEÑA =============

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un email con enlace de recuperación al usuario. Limitado a 5 intentos por hora.
 *     tags: [Recuperación de Contraseña]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario registrado
 *                 example: usuario@ejemplo.com
 *     responses:
 *       200:
 *         description: Solicitud procesada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Si el email existe en nuestro sistema, recibirás un enlace de recuperación."
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Demasiados intentos
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Demasiados intentos. Intenta de nuevo en 1 hora."
 */
router.post('/forgot-password', 
    rateLimiter.passwordResetLimiter,
    AuthController.forgotPasswordValidation,
    AuthController.forgotPassword
);

/**
 * @swagger
 * /api/auth/validate-reset-token/{token}:
 *   get:
 *     summary: Validar token de recuperación
 *     description: Verifica si un token de recuperación es válido y no ha expirado
 *     tags: [Recuperación de Contraseña]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 64
 *           maxLength: 64
 *         description: Token de recuperación de 64 caracteres hexadecimales
 *         example: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Token válido"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "usuario@ejemplo.com"
 *       400:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Token inválido o expirado"
 */
router.get('/validate-reset-token/:token',
    AuthController.validateResetToken
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     description: Cambia la contraseña del usuario usando un token válido de recuperación
 *     tags: [Recuperación de Contraseña]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 64
 *                 maxLength: 64
 *                 description: Token de recuperación válido
 *                 example: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Nueva contraseña (mínimo 6 caracteres)
 *                 example: "nuevaPassword123"
 *               confirmPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Confirmación de la nueva contraseña
 *                 example: "nuevaPassword123"
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Contraseña actualizada correctamente"
 *       400:
 *         description: Datos inválidos o token expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Demasiados intentos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
