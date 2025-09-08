const nodemailer = require('nodemailer');
const { readJsonFile, writeJsonFile, generateResetToken } = require('../utils/fileManager');
const User = require('../models/User');
const Logger = require('./loggerService');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    /**
     * Envía el email de recuperación de contraseña
     */
    async sendPasswordResetEmail(email, resetToken) {
        const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperación de Contraseña - Sistema de Login',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">🔐 Recuperación de Contraseña</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f8f9fa;">
                        <p style="font-size: 16px; color: #333;">Hola,</p>
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en nuestro sistema.
                        </p>
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Para restablecer tu contraseña, haz clic en el siguiente botón:
                        </p>
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${resetUrl}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 25px; 
                                      display: inline-block; 
                                      font-weight: bold; 
                                      font-size: 16px;
                                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                                🔑 Restablecer Contraseña
                            </a>
                        </div>
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0; color: #856404; font-weight: bold;">
                                ⚠️ IMPORTANTE: Este enlace expirará en 1 hora por seguridad.
                            </p>
                        </div>
                        <p style="font-size: 14px; color: #666; line-height: 1.6;">
                            Si no solicitaste este restablecimiento de contraseña, puedes ignorar este email con seguridad. 
                            Tu contraseña no será cambiada.
                        </p>
                        <p style="font-size: 14px; color: #666;">
                            También puedes copiar y pegar este enlace en tu navegador:
                        </p>
                        <p style="font-size: 12px; color: #999; word-break: break-all; background-color: #f1f1f1; padding: 10px; border-radius: 3px;">
                            ${resetUrl}
                        </p>
                        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #eee;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            Este es un mensaje automático del sistema de autenticación.<br>
                            Por favor no respondas a este email.
                        </p>
                    </div>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            throw new Error('Error al enviar el email de recuperación');
        }
    }

    /**
     * Inicia el proceso de recuperación de contraseña
     */
    async initiatePasswordReset(email, ipAddress) {
        try {
            const user = User.findByEmail(email);
            
            if (!user) {
                Logger.log('PASSWORD_RESET_ATTEMPT', `Intento de reset para email inexistente: ${email}`, {
                    email,
                    ipAddress,
                    success: false
                });
                return { 
                    success: true, 
                    message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.' 
                };
            }

            if (!user.isActive) {
                Logger.log('PASSWORD_RESET_INACTIVE', `Intento de reset para cuenta inactiva: ${email}`, {
                    email,
                    ipAddress,
                    userId: user.id
                });
                return { 
                    success: true, 
                    message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.' 
                };
            }

            // Generar token de reset único
            const resetToken = generateResetToken();
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

            // Guardar token de reset en archivo
            const passwordResets = readJsonFile('password_resets.json');
            passwordResets[resetToken] = {
                email: user.email,
                userId: user.id,
                expiresAt,
                createdAt: new Date().toISOString(),
                used: false,
                ipAddress
            };
            writeJsonFile('password_resets.json', passwordResets);

            // Enviar email
            const emailResult = await this.sendPasswordResetEmail(user.email, resetToken);

            Logger.log('PASSWORD_RESET_SENT', `Email de recuperación enviado a: ${email}`, {
                email,
                userId: user.id,
                ipAddress,
                resetTokenPrefix: resetToken.substring(0, 8) + '...',
                emailMessageId: emailResult.messageId
            });

            return {
                success: true,
                message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.',
                tokenGenerated: true // Solo para debugging, no enviar al cliente en producción
            };

        } catch (error) {
            Logger.log('PASSWORD_RESET_ERROR', `Error en proceso de recuperación: ${email}`, {
                email,
                error: error.message,
                ipAddress
            });
            
            // No revelar detalles del error al usuario
            return {
                success: false,
                message: 'Hubo un problema al procesar la solicitud. Inténtalo de nuevo más tarde.'
            };
        }
    }

    /**
     * Valida un token de reset de contraseña
     * @param {string} token - Token a validar
     */
    async validateResetToken(token) {
        try {
            const passwordResets = readJsonFile('password_resets.json');
            const resetData = passwordResets[token];

            if (!resetData) {
                return { valid: false, message: 'Token inválido o no encontrado' };
            }

            if (resetData.used) {
                return { valid: false, message: 'Este token ya ha sido utilizado' };
            }

            const now = new Date();
            const expiresAt = new Date(resetData.expiresAt);

            if (now > expiresAt) {
                return { valid: false, message: 'Token expirado. Solicita un nuevo enlace de recuperación.' };
            }

            // Verificar que el usuario aún existe y está activo
            const user = User.findById(resetData.userId);
            if (!user || !user.isActive) {
                return { valid: false, message: 'Usuario no válido' };
            }

            return {
                valid: true,
                userId: resetData.userId,
                email: resetData.email,
                createdAt: resetData.createdAt
            };

        } catch (error) {
            console.error('Error validando token de reset:', error);
            return { valid: false, message: 'Error interno validando el token' };
        }
    }

    /**
     * Restablece la contraseña usando un token válido
     * @param {string} token - Token de reset
     * @param {string} newPassword - Nueva contraseña
     * @param {string} ipAddress - IP del usuario
     */
    async resetPassword(token, newPassword, ipAddress) {
        try {
            // Validar token
            const validation = await this.validateResetToken(token);
            
            if (!validation.valid) {
                Logger.log('PASSWORD_RESET_INVALID_TOKEN', `Intento con token inválido`, {
                    tokenPrefix: token.substring(0, 8) + '...',
                    error: validation.message,
                    ipAddress
                });
                throw new Error(validation.message);
            }

            const user = User.findById(validation.userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Hashear la nueva contraseña
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

            // Actualizar contraseña del usuario
            User.update(user.id, {
                password: hashedPassword,
                failedLoginAttempts: 0, // Resetear intentos fallidos
                lockUntil: null // Desbloquear cuenta si estaba bloqueada
            });

            // Marcar token como usado
            const passwordResets = readJsonFile('password_resets.json');
            passwordResets[token].used = true;
            passwordResets[token].usedAt = new Date().toISOString();
            passwordResets[token].usedFromIP = ipAddress;
            writeJsonFile('password_resets.json', passwordResets);

            Logger.log('PASSWORD_RESET_SUCCESS', `Contraseña restablecida exitosamente: ${user.email}`, {
                email: user.email,
                userId: user.id,
                ipAddress,
                resetTokenPrefix: token.substring(0, 8) + '...'
            });

            return {
                success: true,
                message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
            };

        } catch (error) {
            Logger.log('PASSWORD_RESET_FAILED', `Fallo en restablecimiento de contraseña`, {
                tokenPrefix: token.substring(0, 8) + '...',
                error: error.message,
                ipAddress
            });
            throw error;
        }
    }

    /**
     * Limpia tokens expirados (ejecutar periódicamente)
     */
    cleanupExpiredTokens() {
        try {
            const passwordResets = readJsonFile('password_resets.json');
            const now = new Date();
            let cleaned = 0;

            Object.keys(passwordResets).forEach(token => {
                const resetData = passwordResets[token];
                const expiresAt = new Date(resetData.expiresAt);
                
                if (now > expiresAt) {
                    delete passwordResets[token];
                    cleaned++;
                }
            });

            if (cleaned > 0) {
                writeJsonFile('password_resets.json', passwordResets);
                console.log(`impiados ${cleaned} tokens de recuperación expirados`);
            }

            return cleaned;
        } catch (error) {
            console.error('Error limpiando tokens expirados:', error);
            return 0;
        }
    }

    /**
     * Obtiene estadísticas de recuperación de contraseñas
     */
    getPasswordResetStats() {
        try {
            const passwordResets = readJsonFile('password_resets.json');
            const now = new Date();
            const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            
            const stats = {
                totalTokens: Object.keys(passwordResets).length,
                usedTokens: 0,
                expiredTokens: 0,
                activeTokens: 0,
                last24Hours: 0
            };

            Object.values(passwordResets).forEach(reset => {
                const createdAt = new Date(reset.createdAt);
                const expiresAt = new Date(reset.expiresAt);
                
                if (reset.used) {
                    stats.usedTokens++;
                } else if (now > expiresAt) {
                    stats.expiredTokens++;
                } else {
                    stats.activeTokens++;
                }
                
                if (createdAt > last24Hours) {
                    stats.last24Hours++;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return null;
        }
    }
}

module.exports = new EmailService();
