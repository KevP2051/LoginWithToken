const { body, validationResult } = require('express-validator');
const AuthService = require('../services/authService');
const EmailService = require('../services/emailService');
const Logger = require('../services/loggerService');

class AuthController {
    /**
     * Validaciones para recuperación de contraseña
     */
    static forgotPasswordValidation = [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Debe proporcionar un email válido')
    ];

    /**
     * Validaciones para reset de contraseña
     */
    static resetPasswordValidation = [
        body('token')
            .notEmpty()
            .isLength({ min: 64, max: 64 })
            .withMessage('Token inválido'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('La contraseña debe tener al menos 8 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial'),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error('Las contraseñas no coinciden');
                }
                return true;
            })
    ];

    /**
     * Iniciar proceso de recuperación de contraseña
     */
    static async forgotPassword(req, res) {
        try {
            // Validar entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: errors.array()
                });
            }

            const { email } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;

            Logger.log('PASSWORD_RESET_REQUEST', `Solicitud de recuperación para: ${email}`, {
                email,
                ipAddress
            });

            const result = await EmailService.initiatePasswordReset(email, ipAddress);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: result.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: result.message
                });
            }

        } catch (error) {
            console.error('Error en forgotPassword:', error);
            
            Logger.log('PASSWORD_RESET_ERROR', `Error en proceso de recuperación`, {
                email: req.body.email,
                error: error.message,
                ipAddress: req.ip
            });

            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor. Inténtalo de nuevo más tarde.'
            });
        }
    }

    /**
     * Validar token de recuperación
     */
    static async validateResetToken(req, res) {
        try {
            const { token } = req.params;

            if (!token || token.length !== 64) {
                return res.status(400).json({
                    success: false,
                    message: 'Token inválido'
                });
            }

            const validation = await EmailService.validateResetToken(token);

            if (validation.valid) {
                return res.status(200).json({
                    success: true,
                    message: 'Token válido',
                    data: {
                        email: validation.email,
                        createdAt: validation.createdAt
                    }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: validation.message
                });
            }

        } catch (error) {
            console.error('Error validando token:', error);
            return res.status(500).json({
                success: false,
                message: 'Error validando token'
            });
        }
    }

    /**
     * Restablecer contraseña con token
     */
    static async resetPassword(req, res) {
        try {
            // Validar entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: errors.array()
                });
            }

            const { token, newPassword } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');

            Logger.log('PASSWORD_RESET_ATTEMPT', `Intento de restablecimiento de contraseña`, {
                tokenPrefix: token.substring(0, 8) + '...',
                ipAddress,
                userAgent
            });

            // Procesar restablecimiento
            const result = await EmailService.resetPassword(token, newPassword, ipAddress);

            return res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            console.error('Error en resetPassword:', error);
            
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Obtener estadísticas de recuperación (solo para admins)
     */
    static async getResetStats(req, res) {
        try {
            // Verificar que el usuario sea admin (esto debería estar en middleware)
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado'
                });
            }

            const stats = EmailService.getPasswordResetStats();
            
            return res.status(200).json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas'
            });
        }
    }

    /**
     * Limpiar tokens expirados (endpoint de mantenimiento)
     */
    static async cleanupExpiredTokens(req, res) {
        try {
            // Verificar que el usuario sea admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado'
                });
            }

            const cleaned = EmailService.cleanupExpiredTokens();
            
            Logger.log('CLEANUP_TOKENS', `Limpieza de tokens ejecutada`, {
                tokensEliminados: cleaned,
                adminId: req.user.id,
                ipAddress: req.ip
            });

            return res.status(200).json({
                success: true,
                message: `${cleaned} tokens expirados eliminados`,
                tokensEliminados: cleaned
            });

        } catch (error) {
            console.error('Error limpiando tokens:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en limpieza de tokens'
            });
        }
    }

    // TODO: Implementar otros métodos (login, register, logout, refreshToken)
    static async login(req, res) {
        // TODO: Implementar login
        res.status(501).json({ message: 'Login no implementado aún' });
    }

    static async register(req, res) {
        // TODO: Implementar registro
        res.status(501).json({ message: 'Registro no implementado aún' });
    }

    static async logout(req, res) {
        // TODO: Implementar logout
        res.status(501).json({ message: 'Logout no implementado aún' });
    }

    static async refreshToken(req, res) {
        // TODO: Implementar refresh token
        res.status(501).json({ message: 'Refresh token no implementado aún' });
    }
}

module.exports = AuthController;
