const { query, pool } = require('../db/db'); // ✅ Importamos pool para las transacciones

class AdminCargosController {

    // 1. Listar todos los cargos (RF-03)
    static async listar(req, res) {
        try {
            const sql = `
                SELECT 
                    c.id_cargo, 
                    c.nombre, 
                    c.activo_para_examen,
                    (SELECT COUNT(*) FROM cargos_competencias cc WHERE cc.id_cargo = c.id_cargo) as total_competencias,
                    (SELECT COUNT(*) FROM usuarios u WHERE u.id_cargo = c.id_cargo) as total_postulantes
                FROM cargos c
                ORDER BY c.nombre ASC
            `;

            // ✅ CORRECCIÓN: Desestructuramos para sacar las filas limpias
            const [cargos] = await query(sql);

            res.render('admin/cargos', { cargos });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error listando cargos");
        }
    }

    // 2. AJAX: Activar/Desactivar Examen (Semáforo RF-03)
    static async toggleEstado(req, res) {
        try {
            const { id_cargo, estado } = req.body;

            // ✅ CORRECCIÓN: await query directo. 
            // No necesitamos leer el retorno (INSERT/UPDATE), así que no desestructuramos nada.
            await query(
                "UPDATE cargos SET activo_para_examen = ? WHERE id_cargo = ?",
                [estado, id_cargo]
            );

            res.json({ ok: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ ok: false, msg: "Error DB" });
        }
    }

    // 3. Ver vista de configuración de competencias (RF-05)
    static async verConfiguracion(req, res) {
        const { id_cargo } = req.params;
        try {
            // ✅ CORRECCIÓN 1: Obtener un solo objeto (Cargo)
            // mysql2 devuelve [[fila], [campos]]. Sacamos 'rows' primero.
            const [rowsCargo] = await query("SELECT * FROM cargos WHERE id_cargo = ?", [id_cargo]);
            const cargo = rowsCargo[0]; // Tomamos el primer elemento

            // ✅ CORRECCIÓN 2: Listas normales
            const [competencias] = await query("SELECT * FROM competencias ORDER BY nombre ASC");

            // ✅ CORRECCIÓN 3: Configuración asignada
            const [asignadas] = await query(
                "SELECT id_competencia, cantidad_preguntas FROM cargos_competencias WHERE id_cargo = ?",
                [id_cargo]
            );

            // Crear un mapa para fácil acceso en la vista
            const configMap = {};
            asignadas.forEach(a => configMap[a.id_competencia] = a.cantidad_preguntas);

            res.render('admin/cargo_config', {
                cargo,
                competencias,
                configMap
            });

        } catch (error) {
            console.error(error);
            res.redirect('/admin/cargos');
        }
    }

    // 4. Guardar configuración (CON TRANSACCIÓN)
    static async guardarConfiguracion(req, res) {
        const { id_cargo } = req.params;
        const { competencias } = req.body;

        console.log("👀 DATOS RECIBIDOS (FIX):", JSON.stringify(competencias, null, 2));

        // ✅ Obtenemos una conexión específica del pool
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            // 1. Borramos configuración previa
            // Nota: conn.query también devuelve [rows, fields], pero en DELETE no nos importa leerlo.
            await conn.query("DELETE FROM cargos_competencias WHERE id_cargo = ?", [id_cargo]);

            // 2. Insertamos las nuevas relaciones
            if (competencias) {
                for (const [key, value] of Object.entries(competencias)) {

                    const idString = key.replace("comp_", "");
                    const id_comp = parseInt(idString);
                    const cantidad = parseInt(value);

                    if (!isNaN(id_comp) && id_comp > 0 && !isNaN(cantidad) && cantidad > 0) {
                        // Usamos la misma conexión 'conn' para mantener la transacción
                        await conn.query(
                            "INSERT INTO cargos_competencias (id_cargo, id_competencia, cantidad_preguntas) VALUES (?, ?, ?)",
                            [id_cargo, id_comp, cantidad]
                        );
                    }
                }
            }

            await conn.commit();
            req.flash('success_msg', 'Configuración actualizada correctamente');
        } catch (error) {
            await conn.rollback();
            console.error("Error guardando configuración:", error);
            req.flash('error_msg', 'Error: ' + error.message);
        } finally {
            conn.release(); // ✅ IMPRESCINDIBLE liberar la conexión al pool
            res.redirect('/admin/cargos');
        }
    }
}

module.exports = AdminCargosController;