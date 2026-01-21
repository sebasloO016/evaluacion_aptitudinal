const { query } = require('../db/db'); // ✅ Importación correcta

class AdminController {

    static async mostrarDashboard(req, res) {
        try {
            // 1. Obtener estadísticas
            const stats = await AdminController.obtenerEstadisticasGenerales();

            // 2. Renderizar vista
            res.render('admin/dashboard', {
                user: req.session.user,
                stats: stats
            });

        } catch (error) {
            console.error("Error en Dashboard:", error);
            res.status(500).send("Error del servidor");
        }
    }

    static async obtenerEstadisticasGenerales() {
        // ⚠️ CORRECCIÓN CLAVE:
        // mysql2 devuelve [rows, fields].
        // Usamos destructuring para sacar 'rows'.
        // Como es un COUNT(*), siempre devuelve un array de 1 elemento: [{ total: X }]
        // Accedemos a rows[0].total

        const [rowsPostulantes] = await query(
            "SELECT COUNT(*) as total FROM usuarios WHERE id_rol = (SELECT id_rol FROM roles WHERE nombre = 'postulante')"
        );

        const [rowsCompletados] = await query(
            "SELECT COUNT(*) as total FROM intentos_examen WHERE estado = 'ENVIADO'"
        );

        const [rowsCargos] = await query(
            "SELECT COUNT(*) as total FROM cargos WHERE activo_para_examen = 1"
        );

        // Retornamos los valores limpios accediendo a la posición [0]
        return {
            postulantes: rowsPostulantes[0].total,
            completados: rowsCompletados[0].total,
            cargos_activos: rowsCargos[0].total
        };
    }
}

module.exports = AdminController;