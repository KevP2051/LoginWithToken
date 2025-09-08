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
      console.log(`Usuario no encontrado: ${email}`);
      return null;
    }

    if (!user.password) {
      console.log(`Usuario ${email} no tiene campo password`);
      return null;
    }

    if (!password) {
      console.log('Password no proporcionado');
      return null;
    }

    console.log(`Autenticando usuario: ${email}`);
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      console.log(`Password inválido para usuario: ${email}`);
      return null;
    }

    console.log(`Autenticación exitosa para: ${email}`);
    return user;
  } catch (error) {
    console.error('Error en authenticateUser:', error);
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
