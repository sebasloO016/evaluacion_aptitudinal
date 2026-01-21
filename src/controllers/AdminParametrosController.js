const { pool } = require('../db/db');

class AdminParametrosController {

    // Ver formulario
    static async verParametros(req, res) {
        try {
            const [rows] = await pool.query("SELECT * FROM parametros_globales WHERE id_parametro_global = 1");
            const data = rows[0] || { puntaje_maximo: 100, timeout_inactividad_min: 30 };

            // CORRECCIÓN: Enviamos 'params' (plural) para que coincida con tu EJS
            res.render('admin/parametros', { params: data });
        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error al cargar parámetros');
            res.redirect('/admin/dashboard');
        }
    }

    // Guardar cambios
    static async actualizar(req, res) {
        // CORRECCIÓN: Aseguramos que los nombres coincidan con el 'name' del input en el EJS
        const { puntaje_maximo, timeout_inactividad_min } = req.body;

        try {
            await pool.query(
                "UPDATE parametros_globales SET puntaje_maximo = ?, timeout_inactividad_min = ? WHERE id_parametro_global = 1",
                [puntaje_maximo, timeout_inactividad_min]
            );

            req.flash('success_msg', 'Parámetros actualizados correctamente.');
            res.redirect('/admin/parametros');
        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error al guardar cambios.');
            res.redirect('/admin/parametros');
        }
    }
}

module.exports = AdminParametrosController;