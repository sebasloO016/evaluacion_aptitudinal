const { query } = require('../db/db');

class AdminReportesModel {

    // Aceptamos limit y offset (opcionales para el Excel)
    static async obtenerResultados({ cargo, estado, busqueda, limit, offset }) {
        // 1. Construcción dinámica del WHERE
        let whereClause = "WHERE u.id_rol = (SELECT id_rol FROM roles WHERE nombre = 'postulante')";
        const params = [];

        if (cargo) {
            whereClause += " AND c.id_cargo = ?";
            params.push(cargo);
        }

        if (estado) {
            whereClause += " AND ie.estado = ?";
            params.push(estado);
        }

        if (busqueda) {
            whereClause += " AND (u.cedula LIKE ? OR u.nombres LIKE ? OR u.apellidos LIKE ?)";
            const term = `%${busqueda}%`;
            params.push(term, term, term);
        }

        // 2. Consulta de DATOS (Paginada)
        let sqlData = `
            SELECT 
                u.cedula, 
                CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
                c.nombre as cargo,
                ie.estado,
                ie.iniciado_en,
                ie.enviado_en,
                rr.puntaje_final,
                rr.puntaje_maximo
            FROM usuarios u
            LEFT JOIN intentos_examen ie ON u.id_intento_examen = ie.id_intento_examen OR (u.examen_finalizado = 1 AND ie.id_usuario = u.id_usuario)
            LEFT JOIN cargos c ON u.id_cargo = c.id_cargo
            LEFT JOIN resultados_resumen rr ON ie.id_intento_examen = rr.id_intento_examen
            ${whereClause}
            ORDER BY ie.enviado_en DESC, u.apellidos ASC
        `;

        // Si hay paginación, agregamos LIMIT y OFFSET
        const paramsData = [...params]; // Copia para la data
        if (limit && offset !== undefined) {
            sqlData += " LIMIT ? OFFSET ?";
            paramsData.push(parseInt(limit), parseInt(offset));
        }

        // 3. Consulta de CONTEO (Total de registros con los filtros actuales)
        const sqlCount = `
            SELECT COUNT(*) as total
            FROM usuarios u
            LEFT JOIN intentos_examen ie ON u.id_intento_examen = ie.id_intento_examen OR (u.examen_finalizado = 1 AND ie.id_usuario = u.id_usuario)
            LEFT JOIN cargos c ON u.id_cargo = c.id_cargo
            ${whereClause}
        `;

        // Ejecutamos en paralelo para mayor velocidad
        const [dataRows] = await query(sqlData, paramsData);

        // Solo contamos si estamos paginando, si es para Excel (sin limit) no hace falta contar
        let total = dataRows.length;
        if (limit) {
            const [countRows] = await query(sqlCount, params);
            total = countRows[0].total;
        }

        return { rows: dataRows, total };
    }

    static async obtenerCargos() {
        const [rows] = await query("SELECT id_cargo, nombre FROM cargos ORDER BY nombre ASC");
        return rows;
    }
}

module.exports = AdminReportesModel;