const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// Rutas de Vistas
router.get('/login', AuthController.verLogin);

// Rutas de Lógica
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

// Redirección raíz
router.get('/', (req, res) => res.redirect('/login'));

module.exports = router;