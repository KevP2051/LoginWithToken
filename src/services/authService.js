// Servicio de autenticación
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const usersFile = path.join(__dirname, '../../data/users.json');

function getUsers() {
  if (!fs.existsSync(usersFile)) return [];
  const data = fs.readFileSync(usersFile);
  return JSON.parse(data);
}

async function authenticateUser (email, password) {
  try {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
  // Usuario no encontrado
      return null;
    }

    if (!user.password) {
  // Usuario sin campo password
      return null;
    }

    if (!password) {
  // Password no proporcionado
      return null;
    }

  // Autenticando usuario
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
  // Password inválido
      return null;
    }

  // Autenticación exitosa
    return user;
  } catch (error) {
  // Error en authenticateUser
    throw error;
  }
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

module.exports = { authenticateUser , generateToken };
