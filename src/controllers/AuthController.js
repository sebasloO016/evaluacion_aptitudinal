const { query } = require('../db/db');
const bcrypt = require('bcryptjs');

class AuthController {

    // Ver Login
    static verLogin(req, res) {
        if (req.session.user) {
            // Si ya está logueado, redirigir según rol
            return req.session.user.rol === 'admin'
                ? res.redirect('/admin/dashboard')
                : res.redirect('/postulante/estado');
        }
        res.render('auth/login', { msgs: req.flash('error_msg') });
    }

    // Procesar Login (RF-01)
    // Procesar Login (RF-01)
    static async login(req, res) {
        // CORRECCIÓN: El formulario envía 'clave', no 'password'
        const { cedula, clave } = req.body;

        try {
            // 1. Buscar usuario
            const sql = `
                SELECT u.*, r.nombre as rol_nombre 
                FROM usuarios u 
                JOIN roles r ON u.id_rol = r.id_rol 
                WHERE u.cedula = ?`;

            const [users] = await query(sql, [cedula]);

            if (users.length === 0) {
                req.flash('error_msg', 'Usuario no encontrado');
                return res.redirect('/login');
            }

            const user = users[0];

            // 2. Verificar Contraseña (Bcrypt)
            // CORRECCIÓN: Usamos 'clave' para comparar
            const match = await bcrypt.compare(clave, user.password_hash);

            if (!match) {
                req.flash('error_msg', 'Contraseña incorrecta');
                return res.redirect('/login');
            }

            // 3. Crear Sesión
            req.session.user = {
                id: user.id_usuario,
                id_usuario: user.id_usuario,
                cedula: user.cedula,
                nombres: user.nombres,
                rol: user.rol_nombre,
                id_cargo: user.id_cargo,
                id_intento_examen: user.id_intento_examen,
                examen_finalizado: user.examen_finalizado
            };

            // 4. Redirección por Rol (RF-01)
            if (user.rol_nombre === 'admin') {
                res.redirect('/admin/dashboard');
            } else {
                res.redirect('/postulante/estado');
            }

        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error de servidor al iniciar sesión');
            res.redirect('/login');
        }
    }

    // Cerrar Sesión
    static logout(req, res) {
        req.session.destroy(() => {
            res.redirect('/login');
        });
    }
}

module.exports = AuthController;