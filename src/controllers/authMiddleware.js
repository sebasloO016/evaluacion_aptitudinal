const requireLogin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.rol === 'postulante') {
        return next();
    }
    req.flash('error_msg', 'Acceso denegado. Área restringida a administradores.');
    return res.redirect('/login');
};

const requirePostulante = (req, res, next) => {
    // Verificar si existe sesión y si el rol es el correcto
    if (req.session && req.session.user && req.session.user.rol === 'postulante') {
        return next();
    }
    // Si no, destruir sesión por seguridad y mandar al login
    req.flash('error_msg', 'Acceso denegado. Inicie sesión como postulante.');
    return res.redirect('/login');
};

const requireAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.rol === 'admin') {
        return next();
    }
    req.flash('error_msg', 'Acceso denegado. Área restringida a administradores.');
    return res.redirect('/login');
};

module.exports = {
    requireLogin,
    requireAdmin,
    requirePostulante
};
