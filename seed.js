const bcrypt = require('bcryptjs');
const { writeJsonFile, generateId } = require('./src/utils/fileManager');

/**
 * Script para crear datos de prueba
 */
async function createSeedData() {
    console.log('🌱 Creando datos de prueba...');

    // Crear usuarios de prueba
    const users = [
        {
            id: generateId(),
            email: 'admin@test.com',
            username: 'admin',
            password: await bcrypt.hash('admin123', 12),
            firstName: 'Admin',
            lastName: 'Sistema',
            role: 'admin',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            failedLoginAttempts: 0,
            lockUntil: null
        },
        {
            id: generateId(),
            email: 'user@test.com',
            username: 'usuario',
            password: await bcrypt.hash('user123', 12),
            firstName: 'Usuario',
            lastName: 'Prueba',
            role: 'user',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            failedLoginAttempts: 0,
            lockUntil: null
        },
        {
            id: generateId(),
            email: 'moderator@test.com',
            username: 'moderador',
            password: await bcrypt.hash('mod123', 12),
            firstName: 'Moderador',
            lastName: 'Sistema',
            role: 'moderator',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            failedLoginAttempts: 0,
            lockUntil: null
        },
        {
            id: generateId(),
            email: 'blocked@test.com',
            username: 'bloqueado',
            password: await bcrypt.hash('blocked123', 12),
            firstName: 'Usuario',
            lastName: 'Bloqueado',
            role: 'user',
            isActive: false,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            failedLoginAttempts: 6,
            lockUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Bloqueado por 24h
        }
    ];

    // Guardar usuarios
    writeJsonFile('users.json', users);
    console.log('✅ Usuarios creados:');
    users.forEach(user => {
        console.log(`   📧 ${user.email} | 🔑 Contraseña: ${user.email.split('@')[0]}123 | 👤 Rol: ${user.role}`);
    });

    // Crear algunos logs de ejemplo
    const logs = [
        {
            id: generateId(),
            timestamp: new Date().toISOString(),
            action: 'USER_REGISTER',
            message: 'Usuario registrado: admin@test.com',
            metadata: {
                email: 'admin@test.com',
                ipAddress: '127.0.0.1',
                userAgent: 'Seed Script'
            }
        },
        {
            id: generateId(),
            timestamp: new Date().toISOString(),
            action: 'LOGIN_SUCCESS',
            message: 'Login exitoso: user@test.com',
            metadata: {
                email: 'user@test.com',
                ipAddress: '127.0.0.1',
                userAgent: 'Seed Script'
            }
        }
    ];

    writeJsonFile('logs.json', logs);
    console.log('✅ Logs de ejemplo creados');

    // Crear archivos vacíos iniciales
    writeJsonFile('password_resets.json', {});
    writeJsonFile('blocked_accounts.json', {});

    console.log('🎉 Datos de prueba creados exitosamente!');
    console.log('\n📋 Credenciales de prueba:');
    console.log('┌─────────────────────┬──────────────┬──────────┐');
    console.log('│ Email               │ Contraseña   │ Rol      │');
    console.log('├─────────────────────┼──────────────┼──────────┤');
    console.log('│ admin@test.com      │ admin123     │ admin    │');
    console.log('│ user@test.com       │ user123      │ user     │');
    console.log('│ moderator@test.com  │ mod123       │ moderator│');
    console.log('│ blocked@test.com    │ blocked123   │ user     │');
    console.log('└─────────────────────┴──────────────┴──────────┘');
}

// Ejecutar script si se llama directamente
if (require.main === module) {
    createSeedData().catch(console.error);
}

module.exports = { createSeedData };
