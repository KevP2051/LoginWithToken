/**
 * Script para probar la configuración de email
 */
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfig() {
    console.log('🔍 Probando configuración de email...');
    console.log('Email configurado:', process.env.EMAIL_USER);
    
    // Crear transportador
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        // Verificar conexión
        console.log('🔗 Verificando conexión SMTP...');
        await transporter.verify();
        console.log('✅ Configuración de email correcta!');
        
        // Enviar email de prueba
        console.log('📧 Enviando email de prueba...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'kevinpovedaj@gmail.com',
            subject: '🧪 Prueba de Email - Sistema de Recuperación',
            html: `
                <h2>¡Prueba exitosa!</h2>
                <p>Tu sistema de email está funcionando correctamente.</p>
                <p><strong>Hora:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Desde:</strong> ${process.env.EMAIL_USER}</p>
            `
        });
        
        console.log('✅ Email enviado exitosamente!');
        console.log('Message ID:', info.messageId);
        
    } catch (error) {
        console.error('❌ Error en configuración de email:', error.message);
        
        if (error.code === 'EAUTH') {
            console.log('\n🔧 SOLUCIÓN:');
            console.log('1. Ve a: https://myaccount.google.com/security');
            console.log('2. Activa "Verificación en 2 pasos"');
            console.log('3. Ve a "Contraseñas de aplicaciones"');
            console.log('4. Genera una contraseña para "Correo electrónico"');
            console.log('5. Usa esa contraseña en lugar de tu contraseña normal');
            console.log('\nO más fácil:');
            console.log('1. Ve a: https://myaccount.google.com/lesssecureapps');
            console.log('2. Activa "Permitir aplicaciones menos seguras"');
        }
    }
}

testEmailConfig().catch(console.error);
