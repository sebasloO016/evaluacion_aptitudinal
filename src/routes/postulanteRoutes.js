const express = require("express");
const { requirePostulante } = require("../controllers/authMiddleware");

const EstadoPostulanteController = require("../controllers/EstadoPostulanteController");
const ExamenPostulanteController = require("../controllers/ExamenPostulanteController");

const router = express.Router();

router.get("/estado", requirePostulante, EstadoPostulanteController.verEstado);

// ✅ Motor del examen
router.get("/examen", requirePostulante, ExamenPostulanteController.verExamen);
router.post("/examen/guardar", requirePostulante, ExamenPostulanteController.guardarRespuesta);
router.post("/examen/enviar", requirePostulante, ExamenPostulanteController.enviarExamen);

module.exports = router;
