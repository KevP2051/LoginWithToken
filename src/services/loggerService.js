const { readJsonFile, writeJsonFile, generateId } = require('../utils/fileManager');

class Logger {
    static log(action, message, metadata = {}) {
        try {
            const logs = readJsonFile('logs.json');
            
            const logEntry = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                action,
                message,
                metadata: {
                    ...metadata,
                    userAgent: metadata.userAgent || 'Unknown',
                    ipAddress: metadata.ipAddress || 'Unknown'
                }
            };

            logs.push(logEntry);
            writeJsonFile('logs.json', logs);

            // También log en consola para desarrollo
            console.log(`[${logEntry.timestamp}] ${action}: ${message}`, metadata);

            return logEntry;
        } catch (error) {
            console.error('Error logging action:', error);
        }
    }

    static getLogs(filters = {}) {
        try {
            let logs = readJsonFile('logs.json');

            // Filtros disponibles
            if (filters.action) {
                logs = logs.filter(log => log.action === filters.action);
            }

            if (filters.userId) {
                logs = logs.filter(log => 
                    log.metadata && log.metadata.userId === filters.userId
                );
            }

            if (filters.email) {
                logs = logs.filter(log => 
                    log.metadata && log.metadata.email === filters.email
                );
            }

            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                logs = logs.filter(log => new Date(log.timestamp) >= startDate);
            }

            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                logs = logs.filter(log => new Date(log.timestamp) <= endDate);
            }

            // Ordenar por timestamp descendente (más reciente primero)
            logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Limitar resultados
            const limit = parseInt(filters.limit) || 100;
            return logs.slice(0, limit);

        } catch (error) {
            console.error('Error getting logs:', error);
            return [];
        }
    }
}

module.exports = Logger;
