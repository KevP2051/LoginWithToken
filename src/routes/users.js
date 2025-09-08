// Rutas de usuarios
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// TODO: GET /profile
// TODO: PUT /profile
// TODO: PUT /change-password

router.get('/dashboard', verifyToken, (req, res) => {
  res.render('dashboard', { user: req.user });
});

module.exports = router;
