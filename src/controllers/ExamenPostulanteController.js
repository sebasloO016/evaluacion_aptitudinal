const ExamenPostulanteModel = require("../models/ExamenPostulanteModel");
const EstadoPostulanteModel = require("../models/EstadoPostulanteModel");
const { pool } = require("../db/db"); // ✅ Importación correcta del Pool

class ExamenPostulanteController {

    // ✅ GET /postulante/examen
    static async verExamen(req, res) {
        let conn; // Declaramos conn afuera para el finally
        try {
            const user = req.session.user;

            if (!user || user.rol !== "postulante") {
                return res.redirect("/login");
            }

            // Nota: EstadoPostulanteModel ahora devuelve un objeto limpio (gracias al fix anterior)
            const estado = await EstadoPostulanteModel.obtenerEstadoPorUsuario(user.id_usuario);

            if (!estado) {
                req.flash("error_msg", "❌ No se encontró información del usuario.");
                return res.redirect("/login");
            }

            // Validaciones importantes
            if (!estado.id_cargo) {
                req.flash("error_msg", "⚠️ No tiene cargo asignado.");
                return res.redirect("/postulante/estado");
            }

            const activo = await ExamenPostulanteModel.cargoActivoParaExamen(estado.id_cargo);
            if (!activo) {
                req.flash("error_msg", "⏳ Su cargo aún no está habilitado para examen.");
                return res.redirect("/postulante/estado");
            }

            if (estado.examen_finalizado === 1) {
                req.flash("error_msg", "✅ Usted ya envió el examen.");
                return res.redirect("/postulante/estado");
            }

            // ---------------------------------------------------------
            // LÓGICA DE INTENTO Y GENERACIÓN DE EXAMEN
            // ---------------------------------------------------------
            let id_intento_examen = estado.id_intento_examen;

            // Validación de Timeout (Si ya existía intento)
            if (id_intento_examen) {
                const expirado = await ExamenPostulanteModel.verificarExpiracion(id_intento_examen);
                if (expirado) {
                    req.flash("error_msg", "⌛ Su sesión ha expirado por inactividad.");
                    req.session.user.id_intento_examen = null;
                    req.session.user.examen_finalizado = 1;
                    return res.redirect("/postulante/estado");
                }
            }

            // Si NO existe intento -> LO CREAMOS
            if (!id_intento_examen) {
                const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
                const ua = req.headers["user-agent"];

                // 1. Crear la cabecera del intento
                id_intento_examen = await ExamenPostulanteModel.crearIntento(
                    user.id_usuario,
                    estado.id_cargo,
                    ip,
                    ua
                );

                // 2. Vincular usuario con intento
                await ExamenPostulanteModel.setIntentoActivoUsuario(user.id_usuario, id_intento_examen);

                // 3. Selección y mezcla de preguntas (Lógica de Negocio)
                const competenciasCargo = await ExamenPostulanteModel.obtenerCompetenciasDelCargo(estado.id_cargo);
                let preguntasSeleccionadas = [];
                let ordenGlobal = 1;

                for (const comp of competenciasCargo) {
                    // Obtiene IDs limpios (asumiendo que el modelo ya se arregló)
                    const ids = await ExamenPostulanteModel.obtenerIdsPreguntasPorCompetencia(comp.id_competencia);

                    // Mezclar
                    const mezcladas = ExamenPostulanteModel.mezclarArray(ids);

                    // Cortar según cantidad configurada
                    const seleccion = mezcladas.slice(0, comp.cantidad_preguntas);

                    for (const id_pregunta of seleccion) {
                        preguntasSeleccionadas.push({
                            id_competencia: comp.id_competencia,
                            id_pregunta,
                            orden: ordenGlobal++
                        });
                    }
                }

                // 4. TRANSACCIÓN: Insertar preguntas congeladas
                // Obtenemos conexión específica del pool
                conn = await pool.getConnection();
                try {
                    await conn.beginTransaction();

                    // Pasamos 'conn' para que el modelo use ESTA conexión y no el pool genérico
                    await ExamenPostulanteModel.insertarIntentoPreguntas(conn, id_intento_examen, preguntasSeleccionadas);

                    await conn.commit();
                } catch (err) {
                    await conn.rollback();
                    throw err; // Re-lanzamos para que lo capture el catch general
                } finally {
                    if (conn) conn.release(); // ✅ Liberamos conexión siempre
                }

                // Actualizar sesión
                req.session.user.id_intento_examen = id_intento_examen;
            }

            // ✅ Cargar examen completo para la vista
            const preguntas = await ExamenPostulanteModel.obtenerExamenCompleto(id_intento_examen);

            return res.render("postulante/examenPostulante", {
                id_intento_examen,
                preguntas
            });

        } catch (error) {
            console.error("Error en verExamen:", error);
            req.flash("error_msg", "❌ Error cargando el examen.");
            return res.redirect("/postulante/estado");
        }
    }

    // ✅ POST /postulante/examen/guardar
    static async guardarRespuesta(req, res) {
        try {
            const user = req.session.user;
            if (!user || user.rol !== "postulante") {
                return res.status(401).json({ ok: false, mensaje: "No autorizado" });
            }

            const { id_pregunta, opcion_num } = req.body;

            if (!user.id_intento_examen) {
                return res.status(400).json({ ok: false, mensaje: "No hay intento activo." });
            }

            if (!id_pregunta || !opcion_num) {
                return res.status(400).json({ ok: false, mensaje: "Datos incompletos." });
            }

            await ExamenPostulanteModel.guardarRespuesta(
                user.id_intento_examen,
                Number(id_pregunta),
                Number(opcion_num)
            );

            return res.json({ ok: true });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ ok: false, mensaje: "Error guardando respuesta." });
        }
    }

    // ✅ POST /postulante/examen/enviar
    static async enviarExamen(req, res) {
        try {
            const user = req.session.user;

            if (!user || user.rol !== "postulante") {
                return res.redirect("/login");
            }

            if (!user.id_intento_examen) {
                req.flash("error_msg", "⚠️ No hay intento activo.");
                return res.redirect("/postulante/estado");
            }

            const result = await ExamenPostulanteModel.finalizarExamen(user.id_usuario, user.id_intento_examen);

            if (!result.ok) {
                req.flash("error_msg", "⚠️ No se pudo finalizar: " + result.mensaje);
                return res.redirect("/postulante/examen");
            }

            // Limpiar sesión
            req.session.user.id_intento_examen = null;
            req.session.user.examen_finalizado = 1;

            req.flash("success_msg", `✅ Examen enviado. Nota: ${result.puntaje_final}/${result.puntaje_maximo}`);
            return res.redirect("/postulante/estado");

        } catch (error) {
            console.error(error);
            req.flash("error_msg", "❌ Error enviando examen.");
            return res.redirect("/postulante/examen");
        }
    }
}

module.exports = ExamenPostulanteController;