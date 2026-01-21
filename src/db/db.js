// src/db/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración del Pool para Alta Concurrencia
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 50, // ✅ AUMENTADO para aguantar 800 usuarios en cola
    queueLimit: 0
});

// Helper simple para consultas rápidas
const query = (sql, params) => pool.query(sql, params);

// ✅ EXPORTACIÓN ESTÁNDAR: Todos los controladores deben leer esto
module.exports = { pool, query };