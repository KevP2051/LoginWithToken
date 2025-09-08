const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Configurar directorios necesarios para el proyecto
 */
const setupDirectories = () => {
    const dataDir = path.join(__dirname, '../../data');
    
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    // Directorio data creado
    }

    // Inicializar archivos de datos si no existen
    const files = [
        { path: path.join(dataDir, 'users.json'), content: '[]' },
        { path: path.join(dataDir, 'logs.json'), content: '[]' },
        { path: path.join(dataDir, 'blocked_accounts.json'), content: '{}' },
        { path: path.join(dataDir, 'password_resets.json'), content: '{}' }
    ];

    files.forEach(file => {
        if (!fs.existsSync(file.path)) {
            fs.writeFileSync(file.path, file.content, 'utf8');
            // Archivo inicializado
        }
    });
};

/**
 * Leer datos de un archivo JSON
 * @param {string} fileName - Nombre del archivo
 * @returns {Object|Array} Datos parseados
 */
const readJsonFile = (fileName) => {
    try {
        const filePath = path.join(__dirname, '../../data', fileName);
        if (!fs.existsSync(filePath)) {
            // Si el archivo no existe, devolver estructura por defecto
            const defaultContent = fileName.includes('blocked_accounts') || fileName.includes('password_resets') ? {} : [];
            writeJsonFile(fileName, defaultContent);
            return defaultContent;
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
    // Error leyendo archivo
        // Devolver estructura por defecto en caso de error
        return fileName.includes('blocked_accounts') || fileName.includes('password_resets') ? {} : [];
    }
};

/**
 * Escribir datos a un archivo JSON
 * @param {string} fileName - Nombre del archivo
 * @param {Object|Array} data - Datos a escribir
 * @returns {boolean} Éxito de la operación
 */
const writeJsonFile = (fileName, data) => {
    try {
        const filePath = path.join(__dirname, '../../data', fileName);
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonData, 'utf8');
        return true;
    } catch (error) {
    // Error escribiendo archivo
        return false;
    }
};

/**
 * Generar un ID único usando UUID v4
 * @returns {string} ID único
 */
const generateId = () => {
    return crypto.randomUUID();
};

/**
 * Generar token de reset de contraseña seguro
 * @returns {string} Token hexadecimal de 64 caracteres
 */
const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Encriptar datos sensibles usando AES-256-GCM
 * @param {string} text - Texto a encriptar
 * @param {string} key - Clave de encriptación
 * @returns {string} Texto encriptado con formato iv:authTag:encrypted
 */
const encrypt = (text, key = process.env.JWT_SECRET) => {
    try {
        const algorithm = 'aes-256-gcm';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
    // Error encriptando datos
        throw new Error('Error en proceso de encriptación');
    }
};

/**
 * Desencriptar datos
 * @param {string} encryptedData - Datos encriptados con formato iv:authTag:encrypted
 * @param {string} key - Clave de desencriptación
 * @returns {string} Texto desencriptado
 */
const decrypt = (encryptedData, key = process.env.JWT_SECRET) => {
    try {
        const algorithm = 'aes-256-gcm';
        const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
        
        if (!ivHex || !authTagHex || !encrypted) {
            throw new Error('Formato de datos encriptados inválido');
        }
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipher(algorithm, key);
        
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
    // Error desencriptando datos
        throw new Error('Error en proceso de desencriptación');
    }
};

/**
 * Crear backup de archivos de datos
 * @returns {string} Ruta del archivo de backup
 */
const createBackup = () => {
    try {
        const dataDir = path.join(__dirname, '../../data');
        const backupDir = path.join(__dirname, '../../backups');
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup-${timestamp}.tar`);
        
        // Crear backup simple copiando archivos
        const files = fs.readdirSync(dataDir);
        const backupData = {};
        
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const content = readJsonFile(file);
                backupData[file] = content;
            }
        });
        
        fs.writeFileSync(backupPath + '.json', JSON.stringify(backupData, null, 2));
        
    // Backup creado
        return backupPath + '.json';
    } catch (error) {
    // Error creando backup
        throw error;
    }
};

/**
 * Validar integridad de archivos de datos
 * @returns {Object} Resultado de la validación
 */
const validateDataIntegrity = () => {
    try {
        const results = {
            valid: true,
            errors: [],
            files: {}
        };
        
        const files = ['users.json', 'logs.json', 'blocked_accounts.json', 'password_resets.json'];
        
        files.forEach(fileName => {
            try {
                const data = readJsonFile(fileName);
                results.files[fileName] = {
                    exists: true,
                    valid: true,
                    recordCount: Array.isArray(data) ? data.length : Object.keys(data).length
                };
            } catch (error) {
                results.valid = false;
                results.errors.push(`Error en ${fileName}: ${error.message}`);
                results.files[fileName] = {
                    exists: false,
                    valid: false,
                    error: error.message
                };
            }
        });
        
        return results;
    } catch (error) {
    // Error validando integridad
        return {
            valid: false,
            errors: ['Error general de validación'],
            files: {}
        };
    }
};

module.exports = {
    setupDirectories,
    readJsonFile,
    writeJsonFile,
    generateId,
    generateResetToken,
    encrypt,
    decrypt,
    createBackup,
    validateDataIntegrity
};
