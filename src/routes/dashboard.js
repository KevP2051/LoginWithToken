const express = require('express');
const router = express.Router();
const { verifyCookieToken } = require('../middleware/cookieAuth');
const roleAuth = require('../middleware/roleAuth');
const dashboardController = require('../controllers/dashboardController');

// Ruta de prueba simple
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Dashboard routes funcionando correctamente'
    });
});

// Dashboard principal - requiere autenticación
router.get('/', verifyCookieToken, dashboardController.getDashboard);

// Página HTML del dashboard
router.get('/page', verifyCookieToken, dashboardController.getDashboardPage);

// Panel de administración - solo administradores
router.get('/admin', verifyCookieToken, roleAuth.requireAdmin, dashboardController.getAdminPanel);

// Panel de moderación - moderadores y administradores
router.get('/moderator', verifyCookieToken, roleAuth.requireModerator, dashboardController.getModeratorPanel);

// Perfil de usuario - todos los usuarios autenticados
router.get('/profile', verifyCookieToken, roleAuth.requireUser, dashboardController.getUserProfile);

module.exports = router;
