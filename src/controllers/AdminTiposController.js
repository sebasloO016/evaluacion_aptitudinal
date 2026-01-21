const { pool } = require('../db/db');

class AdminTiposController {

    // 1. Listar
    static async listarTipos(req, res) {
        try {
            const [tipos] = await pool.query("SELECT * FROM tipos_pregunta ORDER BY id_tipo_pregunta ASC");
            res.render('admin/tipos_listar', { tipos });
        } catch (error) {
            console.error(error);
            res.redirect('/admin/dashboard');
        }
    }

    // 2. Ver formulario de opciones
    static async verEditarOpciones(req, res) {
        const { id_tipo } = req.params;
        try {
            const [tipoRows] = await pool.query("SELECT * FROM tipos_pregunta WHERE id_tipo_pregunta = ?", [id_tipo]);
            const [opciones] = await pool.query("SELECT * FROM tipo_opciones WHERE id_tipo_pregunta = ? ORDER BY opcion_num ASC", [id_tipo]);

            res.render('admin/tipos_editar', {
                tipo: tipoRows[0],
                opciones
            });
        } catch (error) {
            console.error(error);
            res.redirect('/admin/tipos');
        }
    }

    // 3. Guardar opciones (VERSIÓN DEFINITIVA)
    static async guardarOpciones(req, res) {
        const { id_tipo } = req.params;

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Iteramos del 1 al 5 buscando los campos texto_1, texto_2, etc.
            for (let i = 1; i <= 5; i++) {
                // Leemos el valor plano directamente del body
                // Esto evita problemas si el body-parser no está configurado para arrays
                const nuevoTexto = req.body['texto_' + i];

                // Solo intentamos guardar si el texto existe (no es undefined)
                if (nuevoTexto !== undefined) {
                    await conn.query(`
                        INSERT INTO tipo_opciones (id_tipo_pregunta, opcion_num, texto)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE texto = ?
                    `, [id_tipo, i, nuevoTexto.trim(), nuevoTexto.trim()]);
                }
            }

            await conn.commit();
            req.flash('success_msg', 'Textos actualizados correctamente.');
            res.redirect('/admin/tipos');
        } catch (error) {
            await conn.rollback();
            console.error("Error al guardar opciones:", error);
            req.flash('error_msg', 'Error al procesar la solicitud.');
            res.redirect('/admin/tipos');
        } finally {
            if (conn) conn.release();
        }
    }

    // --- NUEVO: CREAR TIPO ---
    static async crearTipo(req, res) {
        const { nombre } = req.body;
        try {
            await pool.query("INSERT INTO tipos_pregunta (nombre) VALUES (?)", [nombre.trim()]);
            req.flash('success_msg', 'Nuevo tipo creado exitosamente.');
        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error al crear tipo (posiblemente nombre duplicado).');
        }
        res.redirect('/admin/tipos');
    }

    // --- NUEVO: RENOMBRAR TIPO ---
    static async renombrarTipo(req, res) {
        const { id_tipo_pregunta, nombre } = req.body;
        try {
            await pool.query("UPDATE tipos_pregunta SET nombre = ? WHERE id_tipo_pregunta = ?", [nombre.trim(), id_tipo_pregunta]);
            req.flash('success_msg', 'Nombre actualizado.');
        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error al renombrar.');
        }
        res.redirect('/admin/tipos');
    }
}

module.exports = AdminTiposController;