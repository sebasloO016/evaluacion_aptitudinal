const { query } = require("../db/db");

class EstadoPostulanteModel {

    static async obtenerEstadoPorUsuario(id_usuario) {
        // ⚠️ CAMBIO OBLIGATORIO: const [rows]
        const [rows] = await query(
            `
            SELECT 
                u.id_usuario,
                u.cedula,
                u.nombres,
                u.apellidos,
                u.examen_finalizado,
                u.id_cargo,
                u.id_intento_examen,

                c.nombre AS cargo_nombre,
                c.activo_para_examen,

                ie.estado AS intento_estado,
                ie.iniciado_en,
                ie.ultima_actividad_en,
                ie.enviado_en

            FROM usuarios u
            LEFT JOIN cargos c ON c.id_cargo = u.id_cargo
            LEFT JOIN intentos_examen ie ON ie.id_intento_examen = u.id_intento_examen
            WHERE u.id_usuario = ?
            LIMIT 1
            `,
            [id_usuario]
        );

        // Ahora 'rows' es el array limpio de resultados.
        // Si hay resultados, devolvemos el primer objeto (rows[0]). Si no, null.
        return rows.length > 0 ? rows[0] : null;
    }

    // ✅ NUEVO MÉTODO: Buscar la calificación final
    static async obtenerUltimoPuntaje(id_usuario) {
        // ⚠️ CAMBIO OBLIGATORIO: const [rows]
        const [rows] = await query(
            `SELECT rr.puntaje_final
             FROM resultados_resumen rr
             INNER JOIN intentos_examen ie ON rr.id_intento_examen = ie.id_intento_examen
             WHERE ie.id_usuario = ?
             ORDER BY ie.id_intento_examen DESC
             LIMIT 1`,
            [id_usuario]
        );

        return rows.length > 0 ? rows[0].puntaje_final : null;
    }
}

module.exports = EstadoPostulanteModel;