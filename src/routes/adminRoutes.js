const express = require('express');
const router = express.Router();
const multer = require('multer');

// Controladores
const AdminController = require('../controllers/AdminController');
const AdminImportController = require('../controllers/AdminImportController');
const AdminReportesController = require('../controllers/AdminReportesController');
const AdminCargosController = require('../controllers/AdminCargosController');
const AdminParametrosController = require('../controllers/AdminParametrosController');
const AdminTiposController = require('../controllers/AdminTiposController'); // Asegúrate de crear este archivo

const { requireAdmin } = require('../controllers/authMiddleware');

// Configuración de Multer
const upload = multer({ dest: 'public/uploads/' });

// Dashboard
router.get('/dashboard', requireAdmin, AdminController.mostrarDashboard);

// Importación
router.get('/importar', requireAdmin, AdminImportController.verImportar);
router.post('/importar/usuarios', requireAdmin, upload.single('archivoExcel'), AdminImportController.importarUsuarios);
router.post('/importar/preguntas', requireAdmin, upload.single('archivoExcel'), AdminImportController.importarPreguntas);

// Cargos
router.get('/cargos', requireAdmin, AdminCargosController.listar);
router.post('/cargos/toggle', requireAdmin, AdminCargosController.toggleEstado);
router.get('/cargos/configurar/:id_cargo', requireAdmin, AdminCargosController.verConfiguracion);
router.post('/cargos/configurar/:id_cargo', requireAdmin, AdminCargosController.guardarConfiguracion);

// Reportes
router.get('/reportes', requireAdmin, AdminReportesController.verReportes);
router.get('/reportes/exportar', requireAdmin, AdminReportesController.exportarExcel);

// Parametros Globales
router.get('/parametros', requireAdmin, AdminParametrosController.verParametros);
router.post('/parametros', requireAdmin, AdminParametrosController.actualizar);

// Tipos y Opciones (Para cambiar los textos "Siempre/Nunca")
router.get('/tipos', requireAdmin, AdminTiposController.listarTipos);
router.get('/tipos/editar/:id_tipo', requireAdmin, AdminTiposController.verEditarOpciones);
router.post('/tipos/editar/:id_tipo', requireAdmin, AdminTiposController.guardarOpciones);
// NUEVAS RUTAS: Crear y Renombrar
router.post('/tipos/crear', requireAdmin, AdminTiposController.crearTipo);
router.post('/tipos/renombrar', requireAdmin, AdminTiposController.renombrarTipo);
module.exports = router;