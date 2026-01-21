const EstadoPostulanteModel = require("../models/EstadoPostulanteModel");

class EstadoPostulanteController {
    static async verEstado(req, res) {
        try {
            if (!req.session.user) {
                return res.redirect("/login");
            }

            if (req.session.user.rol !== "postulante") {
                return res.redirect("/login");
            }

            const id_usuario = req.session.user.id_usuario;

            const data = await EstadoPostulanteModel.obtenerEstadoPorUsuario(id_usuario);

            if (!data) {
                req.flash("error_msg", "❌ No se encontró información del usuario.");
                return res.redirect("/login");
            }

            // ✅ Estado del postulante
            let estadoUI = "INICIAR";
            let mensaje = "✅ Su examen está listo para iniciar.";
            let puntaje = null; // Variable para la nota

            // 1) Si no tiene cargo asignado, no puede dar examen
            if (!data.id_cargo) {
                estadoUI = "ESPERA";
                mensaje = "⚠️ Usted aún no tiene un cargo asignado. Contacte al administrador.";
            }

            // 2) Semáforo por cargo (concurrencia)
            else if (data.activo_para_examen === 0) {
                estadoUI = "ESPERA";
                mensaje = "⏳ Su examen aún no está habilitado. Por favor espere su turno.";
            }

            // 3) Si ya finalizó examen (AQUÍ AGREGAMOS LA NOTA)
            else if (data.examen_finalizado === 1) {
                estadoUI = "FINALIZADO";
                // Mantenemos tu mensaje original:
                mensaje = "✅ Usted ya envió el examen. No puede rendirlo nuevamente.";

                // Buscamos la nota usando el nuevo método del modelo
                puntaje = await EstadoPostulanteModel.obtenerUltimoPuntaje(id_usuario);
            }

            // 4) Si tiene intento activo y está en progreso
            else if (data.id_intento_examen && data.intento_estado === "EN_PROGRESO") {
                estadoUI = "REANUDAR";
                mensaje = "✅ Tiene un examen en progreso. Puede reanudarlo.";
            }

            // Si el intento existe pero ya fue enviado/expirado
            else if (data.id_intento_examen && (data.intento_estado === "ENVIADO" || data.intento_estado === "EXPIRADO")) {
                estadoUI = "INICIAR";
                mensaje = "✅ Puede iniciar un nuevo examen (si el administrador lo permite).";
            }

            // Guardamos algunos datos actualizados en sesión (opcional)
            req.session.user.examen_finalizado = data.examen_finalizado;
            req.session.user.id_intento_examen = data.id_intento_examen;

            return res.render("postulante/estadoPostulante", {
                estadoUI,
                mensaje,
                puntaje, // Pasamos la nota a la vista
                usuario: {
                    cedula: data.cedula,
                    nombres: data.nombres,
                    apellidos: data.apellidos
                },
                cargo: {
                    id_cargo: data.id_cargo,
                    nombre: data.cargo_nombre || "No asignado",
                    activo_para_examen: data.activo_para_examen
                },
                intento: {
                    id_intento_examen: data.id_intento_examen,
                    estado: data.intento_estado,
                    iniciado_en: data.iniciado_en,
                    ultima_actividad_en: data.ultima_actividad_en,
                    enviado_en: data.enviado_en
                }
            });

        } catch (error) {
            console.error(error);
            req.flash("error_msg", "❌ Error interno cargando estado del examen.");
            return res.redirect("/login");
        }
    }
}

module.exports = EstadoPostulanteController;