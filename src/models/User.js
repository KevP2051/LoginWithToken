const { readJsonFile, writeJsonFile, generateId } = require('../utils/fileManager');

class User {
    constructor({ id, email, username, password, firstName, lastName, role = 'user', isActive = true }) {
        this.id = id || generateId();
        this.email = email;
        this.username = username;
        this.password = password; // Ya debe venir hasheado
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role; // 'admin', 'moderator', 'user'
        this.isActive = isActive;
        this.createdAt = new Date().toISOString();
        this.lastLogin = null;
        this.failedLoginAttempts = 0;
        this.lockUntil = null;
    }

    // Métodos estáticos para manejo de datos
    static getAll() {
        return readJsonFile('users.json');
    }

    static save(users) {
        return writeJsonFile('users.json', users);
    }

    static findById(id) {
        const users = this.getAll();
        return users.find(user => user.id === id);
    }

    static findByEmail(email) {
        const users = this.getAll();
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    }

    static findByUsername(username) {
        const users = this.getAll();
        return users.find(user => user.username.toLowerCase() === username.toLowerCase());
    }

    static create(userData) {
        const users = this.getAll();
        const newUser = new User(userData);
        users.push(newUser);
        this.save(users);
        return newUser;
    }

    static update(id, updateData) {
        const users = this.getAll();
        const userIndex = users.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
            return null;
        }

        users[userIndex] = { ...users[userIndex], ...updateData };
        this.save(users);
        return users[userIndex];
    }

    static delete(id) {
        const users = this.getAll();
        const userIndex = users.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
            return false;
        }

        users.splice(userIndex, 1);
        this.save(users);
        return true;
    }

    static incrementFailedAttempts(email) {
        const users = this.getAll();
        const userIndex = users.findIndex(user => user.email === email);
        
        if (userIndex !== -1) {
            users[userIndex].failedLoginAttempts += 1;
            
            // Bloquear cuenta después de 5 intentos fallidos
            if (users[userIndex].failedLoginAttempts >= 5) {
                users[userIndex].lockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutos
            }
            
            this.save(users);
            return users[userIndex];
        }
        return null;
    }

    static resetFailedAttempts(email) {
        const users = this.getAll();
        const userIndex = users.findIndex(user => user.email === email);
        
        if (userIndex !== -1) {
            users[userIndex].failedLoginAttempts = 0;
            users[userIndex].lockUntil = null;
            users[userIndex].lastLogin = new Date().toISOString();
            this.save(users);
            return users[userIndex];
        }
        return null;
    }

    static isAccountLocked(user) {
        if (!user.lockUntil) return false;
        
        const lockTime = new Date(user.lockUntil);
        const now = new Date();
        
        if (now < lockTime) {
            return true;
        }
        
        // Desbloquear cuenta si el tiempo ha pasado
        this.update(user.id, {
            failedLoginAttempts: 0,
            lockUntil: null
        });
        
        return false;
    }

    // Método para obtener datos seguros del usuario (sin contraseña)
    static getSafeUserData(user) {
        const { password, ...safeUser } = user;
        return safeUser;
    }
}

module.exports = User;
