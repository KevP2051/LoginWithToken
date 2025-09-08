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
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) return null;

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) return null;

  return user;
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

module.exports = { authenticateUser , generateToken };
