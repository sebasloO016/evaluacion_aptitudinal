const { query } = require('../db/db');

class UsuarioModel {
    static async buscarPorCedula(cedula) {
        const rows = await query(
            `SELECT 
        u.id_usuario,
        u.cedula,
        u.password_hash,
        u.nombres,
        u.apellidos,
        u.email,
        u.examen_finalizado,
        u.id_rol,
        u.id_cargo,
        u.id_intento_examen,
        r.nombre AS rol_nombre
      FROM usuarios u
      INNER JOIN roles r ON r.id_rol = u.id_rol
      WHERE u.cedula = ?
      LIMIT 1`,
            [cedula]
        );

        return rows.length ? rows[0] : null;
    }
}

module.exports = UsuarioModel;
