const bcrypt = require('bcryptjs');

// Este es el hash que tienes en users.json
const hash = '$2a$12$LrW2fNyn0ypJLtX5glG7Pe1iPE/TXfdtQwfa51qI78po5b94J0D.e';

// Probemos diferentes contraseñas
const contraseñasPrueba = [
    'password123',
    'admin123', 
    '123456',
    'admin',
    'password',
    'test123'
];

console.log('Verificando contraseñas contra el hash...\n');

contraseñasPrueba.forEach(async (pwd) => {
    try {
        const resultado = await bcrypt.compare(pwd, hash);
        console.log(`${pwd}: ${resultado ? '✅ CORRECTO' : '❌ Incorrecto'}`);
    } catch (error) {
        console.log(`${pwd}: Error - ${error.message}`);
    }
});

// También vamos a generar un hash para "admin123" por si necesitas cambiarlo
setTimeout(async () => {
    console.log('\n--- Generando nuevo hash para "admin123" ---');
    try {
        const nuevoHash = await bcrypt.hash('admin123', 12);
        console.log(`Hash para "admin123": ${nuevoHash}`);
    } catch (error) {
        console.error('Error generando hash:', error);
    }
}, 1000);
