const { body, validationResult } = require('express-validator');
const { authenticateUser, generateToken } = require('../services/authService');
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
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email y contraseña son requeridos'
                });
            }

            const user = await authenticateUser(email, password);
            
            if (!user) {
                Logger.log('LOGIN_FAILED', 'Intento de login fallido', {
                    email,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                return res.status(401).json({
                    success: false,
                    message: 'Email o contraseña incorrectos'
                });
            }

            const token = generateToken(user);
            
            // Establecer cookie httpOnly para seguridad
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000, // 24 horas
                sameSite: 'strict'
            });

            Logger.log('LOGIN_SUCCESS', 'Login exitoso', {
                userId: user.id,
                email: user.email,
                role: user.role,
                ipAddress: req.ip
            });

            return res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        role: user.role
                    },
                    token: token
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            Logger.log('LOGIN_ERROR', 'Error en proceso de login', {
                error: error.message,
                ipAddress: req.ip
            });

            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static async register(req, res) {
        const fs = require('fs');
        const path = require('path');
        const bcrypt = require('bcryptjs');
        const usersPath = path.join(__dirname, '../../data/users.json');
        try {
            const { username, email, password, confirmPassword } = req.body;
            if (!username || !email || !password || !confirmPassword) {
                return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
            }
            if (password !== confirmPassword) {
                return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden' });
            }
            if (password.length < 8) {
                return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
            }
            // Validar email simple
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                return res.status(400).json({ success: false, message: 'Email inválido' });
            }
            // Leer usuarios
            let users = [];
            if (fs.existsSync(usersPath)) {
                users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
            }
            // Verificar si ya existe ese email o username
            if (users.some(u => u.email === email)) {
                return res.status(400).json({ success: false, message: 'Ya existe una cuenta con ese email' });
            }
            if (users.some(u => u.username === username)) {
                return res.status(400).json({ success: false, message: 'El nombre de usuario ya está en uso' });
            }
            // Crear usuario
            const hashed = await bcrypt.hash(password, 12);
            const newUser = {
                id: 'user-' + Date.now(),
                email,
                username,
                password: hashed,
                firstName: '',
                lastName: '',
                role: 'user',
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                failedLoginAttempts: 0,
                lockUntil: null
            };
            users.push(newUser);
            fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
            Logger.log('REGISTER_SUCCESS', 'Nuevo usuario registrado', {
                email,
                username,
                ipAddress: req.ip
            });
            return res.status(201).json({ success: true, message: 'Cuenta creada exitosamente' });
        } catch (error) {
            console.error('Error en register:', error);
            Logger.log('REGISTER_ERROR', 'Error en registro', { error: error.message, ipAddress: req.ip });
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async logout(req, res) {
        try {
            Logger.log('LOGOUT', 'Usuario cerró sesión', {
                userId: req.user?.id,
                ipAddress: req.ip
            });

            res.clearCookie('token');
            
            return res.status(200).json({
                success: true,
                message: 'Sesión cerrada exitosamente'
            });

        } catch (error) {
            console.error('Error en logout:', error);
            return res.status(500).json({
                success: false,
                message: 'Error cerrando sesión'
            });
        }
    }

    static async refreshToken(req, res) {
        // TODO: Implementar refresh token
        res.status(501).json({ message: 'Refresh token no implementado aún' });
    }
}

module.exports = {
    AuthController
};
