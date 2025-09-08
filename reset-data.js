const fs = require('fs');
const path = require('path');
const { createSeedData } = require('./seed');

/**
 * Script para limpiar y recrear datos de prueba
 */
async function resetTestData() {
    console.log('🧹 Limpiando datos existentes...');
    
    const dataDir = path.join(__dirname, 'data');
    
    // Crear directorio data si no existe
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Archivos a limpiar
    const files = [
        'users.json',
        'logs.json',
        'password_resets.json',
        'blocked_accounts.json'
    ];
    
    // Eliminar archivos existentes
    files.forEach(file => {
        const filePath = path.join(dataDir, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`   ❌ Eliminado: ${file}`);
        }
    });
    
    console.log('✅ Datos limpiados');
    
    // Recrear datos de prueba
    await createSeedData();
    
    console.log('\n🔄 Reset completo! Los datos de prueba están listos.');
}

// Ejecutar script
resetTestData().catch(console.error);
