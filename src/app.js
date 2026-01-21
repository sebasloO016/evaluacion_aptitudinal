const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const postulanteRoutes = require('./routes/postulanteRoutes');

// Inicializar Express
const app = express();

// ==========================================
// 1. Configuración de Middlewares Básicos
// ==========================================

// Parsear cuerpos de solicitudes (formularios y JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Archivos Estáticos (CSS, Imágenes, JS del lado cliente)
// Asegúrate de que la carpeta 'public' exista en la raíz
app.use(express.static(path.join(__dirname, '../public')));

// Motor de Vistas (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ==========================================
// 2. Configuración de Sesión y Seguridad
// ==========================================
app.use(session({
    secret: process.env.SESSION_SECRET || 'clave_secreta_super_segura_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Pon en true si usas HTTPS en producción
        maxAge: 1000 * 60 * 60 * 2 // La sesión dura 2 horas
    }
}));

// Inicializar Flash (para mensajes temporales como "Usuario incorrecto")
app.use(flash());

// Variables Globales (disponibles en todas las vistas .ejs)
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.user = req.session.user || null; // Para mostrar nombre en navbar, etc.
    next();
});

// ==========================================
// 3. Definición de Rutas
// ==========================================

// Rutas de Autenticación (Login/Logout)
app.use('/', authRoutes);

// Rutas de Administrador (Importación, Cargos, Reportes)
app.use('/admin', adminRoutes);

// Rutas de Postulante (Examen)
app.use('/postulante', postulanteRoutes);

// Manejo de Error 404 (Página no encontrada)
app.use((req, res) => {
    // Asegúrate de tener un archivo views/404.ejs o cambia esto por un res.send
    res.status(404).render('404', { url: req.originalUrl });
});

// ==========================================
// 4. Iniciar Servidor
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});