const xlsx = require('xlsx');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/db');

class AdminImportController {

    static verImportar(req, res) {
        res.render('admin/importar', {
            msgs: req.flash('msgs') || [] // Para mostrar errores/éxitos
        });
    }

    // --- IMPORTAR USUARIOS (RF-02) ---
    static async importarUsuarios(req, res) {
        const filePath = req.file.path;
        const connection = await pool.getConnection();

        try {
            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = xlsx.utils.sheet_to_json(sheet); // Convierte Excel a JSON

            await connection.beginTransaction();

            let insertados = 0;
            let errores = 0;

            // Obtenemos Rol de 'postulante'
            const [roles] = await connection.query("SELECT id_rol FROM roles WHERE nombre = 'postulante'");
            const idRolPostulante = roles[0].id_rol;

            for (const row of data) {
                // Columnas esperadas: cedula, nombres, apellidos, cargo, email (opcional)
                if (!row.cedula || !row.nombres || !row.cargo) {
                    errores++; continue;
                }

                // 1. Resolver ID del Cargo (buscar por nombre)
                const [cargos] = await connection.query("SELECT id_cargo FROM cargos WHERE nombre = ?", [row.cargo.trim()]);
                let idCargo = null;

                if (cargos.length > 0) {
                    idCargo = cargos[0].id_cargo;
                } else {
                    // Opcional: Crear cargo si no existe. Por ahora, lo dejamos null o saltamos
                    // errores++; continue; 
                    // O creamos uno rápido:
                    const [resCargo] = await connection.query("INSERT INTO cargos (nombre) VALUES (?)", [row.cargo.trim()]);
                    idCargo = resCargo.insertId;
                }

                // 2. Hashear password (si no viene, usa la cédula)
                const rawPass = row.password ? row.password.toString() : row.cedula.toString();
                const hash = await bcrypt.hash(rawPass, 10);

                // 3. Insertar Usuario
                try {
                    await connection.query(`
                        INSERT INTO usuarios (cedula, password_hash, nombres, apellidos, email, id_rol, id_cargo)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                        nombres = VALUES(nombres), apellidos = VALUES(apellidos), id_cargo = VALUES(id_cargo)
                    `, [row.cedula, hash, row.nombres, row.apellidos, row.email || null, idRolPostulante, idCargo]);
                    insertados++;
                } catch (e) {
                    console.error("Error fila usuario:", e);
                    errores++;
                }
            }

            await connection.commit();
            req.flash('success_msg', `Proceso terminado. Insertados/Actualizados: ${insertados}. Errores/Omitidos: ${errores}`);

        } catch (error) {
            await connection.rollback();
            console.error(error);
            req.flash('error_msg', 'Error crítico procesando el archivo.');
        } finally {
            connection.release();
            fs.unlinkSync(filePath); // Borrar archivo temporal
            res.redirect('/admin/importar');
        }
    }

    // --- IMPORTAR PREGUNTAS (RF-07) ---
    static async importarPreguntas(req, res) {
        const filePath = req.file.path;
        const connection = await pool.getConnection();

        try {
            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = xlsx.utils.sheet_to_json(sheet);

            await connection.beginTransaction();
            let count = 0;

            for (const row of data) {
                // Columnas esperadas: competencia, tipo, pregunta, val1, val2, val3, val4, val5
                // (val1 = porcentaje para opcion 1, etc.)

                // 1. Resolver Competencia
                let idCompetencia;
                const [compRows] = await connection.query("SELECT id_competencia FROM competencias WHERE nombre = ?", [row.competencia]);
                if (compRows.length > 0) {
                    idCompetencia = compRows[0].id_competencia;
                } else {
                    const [resC] = await connection.query("INSERT INTO competencias (nombre) VALUES (?)", [row.competencia]);
                    idCompetencia = resC.insertId;
                }

                // 2. Resolver Tipo de Pregunta (Cognitivo, Situacional, etc.)
                let idTipo;
                const [tipoRows] = await connection.query("SELECT id_tipo_pregunta FROM tipos_pregunta WHERE nombre = ?", [row.tipo]);
                if (tipoRows.length > 0) idTipo = tipoRows[0].id_tipo_pregunta;
                else continue; // Si el tipo no existe (ej. error de dedo), saltamos

                // 3. Insertar la Pregunta
                const [resP] = await connection.query(`
                    INSERT INTO preguntas (id_competencia, id_tipo_pregunta, texto, activo)
                    VALUES (?, ?, ?, 1)
                `, [idCompetencia, idTipo, row.pregunta]);

                const idPregunta = resP.insertId;

                // 4. Insertar los porcentajes (Valores 1..5) [RF-07]
                // Asumimos que existen 5 opciones fijas por tipo
                const valores = [row.val1, row.val2, row.val3, row.val4, row.val5];

                for (let i = 0; i < 5; i++) {
                    const porcentaje = valores[i] || 0; // Si viene vacío, es 0
                    await connection.query(`
                        INSERT INTO pregunta_tipo_valores (id_pregunta, opcion_num, porcentaje)
                        VALUES (?, ?, ?)
                    `, [idPregunta, i + 1, porcentaje]);
                }
                count++;
            }

            await connection.commit();
            req.flash('success_msg', `Se importaron ${count} preguntas correctamente.`);

        } catch (error) {
            await connection.rollback();
            console.error(error);
            req.flash('error_msg', 'Error en el formato del Excel o base de datos.');
        } finally {
            connection.release();
            fs.unlinkSync(filePath);
            res.redirect('/admin/importar');
        }
    }
}

module.exports = AdminImportController;