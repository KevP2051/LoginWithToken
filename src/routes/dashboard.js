const express = require('express');
const router = express.Router();
const { verifyCookieToken } = require('../middleware/cookieAuth');
const roleAuth = require('../middleware/roleAuth');
const dashboardController = require('../controllers/dashboardController');


/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Endpoints para paneles de usuario, moderador y administrador
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Obtener datos del dashboard principal
 *     description: Devuelve información general del usuario autenticado y su rol.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del dashboard
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */


router.get('/', verifyCookieToken, dashboardController.getDashboard);

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     summary: Panel de administración
 *     description: Acceso solo para administradores. Devuelve datos y logs del sistema.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Panel admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acceso denegado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Página HTML del dashboard
router.get('/page', verifyCookieToken, dashboardController.getDashboardPage);


router.get('/admin', verifyCookieToken, roleAuth.requireAdmin, dashboardController.getAdminPanel);

/**
 * @swagger
 * /api/dashboard/moderator:
 *   get:
 *     summary: Panel de moderación
 *     description: Acceso para moderadores y administradores. Devuelve datos de moderación.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Panel moderador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acceso denegado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/moderator', verifyCookieToken, roleAuth.requireModerator, dashboardController.getModeratorPanel);

/**
 * @swagger
 * /api/dashboard/profile:
 *   get:
 *     summary: Perfil de usuario
 *     description: Devuelve los datos del perfil del usuario autenticado.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil de usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/profile', verifyCookieToken, roleAuth.requireUser, dashboardController.getUserProfile);

module.exports = router;
