function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.rol !== 'admin') {
        return res.redirect('/login');
    }
    next();
}

function requirePostulante(req, res, next) {
    if (!req.session.user || req.session.user.rol !== 'postulante') {
        return res.redirect('/login');
    }
    next();
}

module.exports = {
    requireLogin,
    requireAdmin,
    requirePostulante
};
