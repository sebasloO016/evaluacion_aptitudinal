const { query, pool } = require("../db/db");

class ExamenPostulanteModel {

    // 1) Obtener timeout y puntaje máximo
    static async obtenerParametrosGlobales() {
        // ✅ FIX: Destructuring [rows]
        const [rows] = await query(
            `SELECT puntaje_maximo, timeout_inactividad_min
             FROM parametros_globales
             WHERE id_parametro_global = 1
             LIMIT 1`
        );
        return rows.length ? rows[0] : { puntaje_maximo: 100, timeout_inactividad_min: 30 };
    }

    // 2) Verificar si cargo está activo
    static async cargoActivoParaExamen(id_cargo) {
        // ✅ FIX: Destructuring [rows]
        const [rows] = await query(
            `SELECT activo_para_examen
             FROM cargos
             WHERE id_cargo = ?
             LIMIT 1`,
            [id_cargo]
        );
        return rows.length ? rows[0].activo_para_examen === 1 : false;
    }

    // 3) Traer configuración de cuántas preguntas por competencia para el cargo
    static async obtenerCompetenciasDelCargo(id_cargo) {
        // ✅ FIX: Destructuring [rows] y retornamos rows directamente
        const [rows] = await query(
            `
            SELECT 
                cc.id_competencia,
                cc.cantidad_preguntas,
                c.nombre AS competencia_nombre
            FROM cargos_competencias cc
            INNER JOIN competencias c ON c.id_competencia = cc.id_competencia
            WHERE cc.id_cargo = ?
            ORDER BY c.nombre ASC
            `,
            [id_cargo]
        );
        return rows;
    }

    // 4) Obtener IDs de preguntas activas por competencia
    static async obtenerIdsPreguntasPorCompetencia(id_competencia) {
        // ✅ FIX: Destructuring [rows]
        const [rows] = await query(
            `
            SELECT id_pregunta
            FROM preguntas
            WHERE id_competencia = ?
              AND activo = 1
            `,
            [id_competencia]
        );
        return rows.map(r => r.id_pregunta);
    }

    // ✅ Helper: mezclar array (Fisher-Yates) - NO CAMBIA (Es JS puro)
    static mezclarArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // 5) Crear intento de examen
    static async crearIntento(id_usuario, id_cargo, ip, userAgent) {
        // ✅ FIX: Destructuring [result] para obtener el ResultSetHeader
        const [result] = await query(
            `
            INSERT INTO intentos_examen (id_usuario, id_cargo, ip_inicio, user_agent_inicio)
            VALUES (?, ?, ?, ?)
            `,
            [id_usuario, id_cargo, ip || null, userAgent || null]
        );
        return result.insertId;
    }

    // 6) Guardar intento activo en usuarios
    static async setIntentoActivoUsuario(id_usuario, id_intento_examen) {
        // No necesitamos leer el resultado, así que await directo está bien
        await query(
            `UPDATE usuarios
             SET id_intento_examen = ?
             WHERE id_usuario = ?`,
            [id_intento_examen, id_usuario]
        );
    }

    // 7) Congelar preguntas del intento
    static async insertarIntentoPreguntas(conn, id_intento_examen, preguntasSeleccionadas) {
        // preguntasSeleccionadas: [{id_competencia, id_pregunta, orden}]
        const values = preguntasSeleccionadas.map(p => [id_intento_examen, p.id_competencia, p.id_pregunta, p.orden]);

        if (values.length === 0) return;

        // conn viene de pool.getConnection() en el controller. 
        // conn.query también devuelve [rows, fields], pero aquí no leemos el return.
        await conn.query(
            `
            INSERT INTO intento_preguntas (id_intento_examen, id_competencia, id_pregunta, orden)
            VALUES ?
            `,
            [values]
        );
    }

    // 8) Obtener preguntas congeladas + textos de opciones + respuesta guardada
    static async obtenerExamenCompleto(id_intento_examen) {
        // ✅ FIX: Destructuring [rows]
        const [rows] = await query(
            `
            SELECT 
                ip.orden,
                ip.id_pregunta,
                p.texto AS pregunta_texto,

                comp.nombre AS competencia_nombre,
                tp.nombre AS tipo_nombre,

                -- opciones (texto) por tipo
                o.opcion_num,
                o.texto AS opcion_texto,

                -- porcentaje por pregunta
                ptv.porcentaje,

                -- respuesta guardada (si existe)
                rd.opcion_num AS opcion_elegida

            FROM intento_preguntas ip
            INNER JOIN preguntas p ON p.id_pregunta = ip.id_pregunta
            INNER JOIN competencias comp ON comp.id_competencia = ip.id_competencia
            INNER JOIN tipos_pregunta tp ON tp.id_tipo_pregunta = p.id_tipo_pregunta

            INNER JOIN tipo_opciones o ON o.id_tipo_pregunta = p.id_tipo_pregunta
            INNER JOIN pregunta_tipo_valores ptv ON ptv.id_pregunta = p.id_pregunta AND ptv.opcion_num = o.opcion_num

            LEFT JOIN resultados_detalle rd 
              ON rd.id_intento_examen = ip.id_intento_examen
              AND rd.id_pregunta = ip.id_pregunta

            WHERE ip.id_intento_examen = ?
            ORDER BY ip.orden ASC, o.opcion_num ASC
            `,
            [id_intento_examen]
        );

        // Convertir a formato agrupado por pregunta
        const mapa = new Map();

        for (const r of rows) {
            if (!mapa.has(r.id_pregunta)) {
                mapa.set(r.id_pregunta, {
                    orden: r.orden,
                    id_pregunta: r.id_pregunta,
                    competencia_nombre: r.competencia_nombre,
                    tipo_nombre: r.tipo_nombre,
                    pregunta_texto: r.pregunta_texto,
                    opcion_elegida: r.opcion_elegida || null,
                    opciones: []
                });
            }

            mapa.get(r.id_pregunta).opciones.push({
                opcion_num: r.opcion_num,
                opcion_texto: r.opcion_texto,
                porcentaje: Number(r.porcentaje)
            });
        }

        return Array.from(mapa.values()).sort((a, b) => a.orden - b.orden);
    }

    // 9) Guardar respuesta
    static async guardarRespuesta(id_intento_examen, id_pregunta, opcion_num) {

        const idPreguntaInt = parseInt(id_pregunta);
        const opcionNumInt = parseInt(opcion_num);

        console.log(`Guardando > Pregunta: ${idPreguntaInt}, Opción: ${opcionNumInt}`);

        // 1. Buscamos el porcentaje
        // ✅ FIX: Destructuring [rows]
        const [rows] = await query(
            `SELECT porcentaje FROM pregunta_tipo_valores 
             WHERE id_pregunta = ? AND opcion_num = ?`,
            [idPreguntaInt, opcionNumInt]
        );

        const porcentajeReal = rows.length > 0 ? Number(rows[0].porcentaje) : 0;

        console.log(`>> Porcentaje encontrado: ${porcentajeReal}`);

        // 2. Guardamos (INSERT/UPDATE no requiere leer retorno aquí)
        await query(
            `
            INSERT INTO resultados_detalle (id_intento_examen, id_pregunta, opcion_num, porcentaje, respondido_en)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                opcion_num = VALUES(opcion_num),
                porcentaje = VALUES(porcentaje),
                respondido_en = CURRENT_TIMESTAMP
            `,
            [id_intento_examen, idPreguntaInt, opcionNumInt, porcentajeReal]
        );

        // 3. Actualizar actividad
        await query(
            `UPDATE intentos_examen SET ultima_actividad_en = CURRENT_TIMESTAMP WHERE id_intento_examen = ?`,
            [id_intento_examen]
        );
    }

    // 10) Finalizar examen: calcula nota y guarda en resultados_resumen
    static async finalizarExamen(id_usuario, id_intento_examen) {
        const params = await this.obtenerParametrosGlobales();
        const puntaje_maximo = params.puntaje_maximo;

        // promedio porcentajes (por pregunta): SUM(porcentaje) / COUNT(*)
        // ✅ FIX: Destructuring [rows]
        const [rows] = await query(
            `
            SELECT 
                COUNT(*) AS total_preguntas,
                SUM(porcentaje) AS suma_porcentajes
            FROM resultados_detalle
            WHERE id_intento_examen = ?
            `,
            [id_intento_examen]
        );

        const total = Number(rows[0]?.total_preguntas || 0);
        const suma = Number(rows[0]?.suma_porcentajes || 0);

        if (total === 0) {
            return { ok: false, mensaje: "No hay respuestas guardadas." };
        }

        const promedio = suma / total;
        const puntaje_final = promedio * puntaje_maximo;

        // guardar resumen
        await query(
            `
            INSERT INTO resultados_resumen (id_intento_examen, puntaje_maximo, puntaje_final)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                puntaje_maximo = VALUES(puntaje_maximo),
                puntaje_final = VALUES(puntaje_final)
            `,
            [id_intento_examen, puntaje_maximo, puntaje_final]
        );

        // marcar intento ENVIADO
        await query(
            `
            UPDATE intentos_examen
            SET estado = 'ENVIADO',
                enviado_en = CURRENT_TIMESTAMP
            WHERE id_intento_examen = ?
            `,
            [id_intento_examen]
        );

        // marcar usuario finalizado + quitar intento activo
        await query(
            `
            UPDATE usuarios
            SET examen_finalizado = 1,
                id_intento_examen = NULL
            WHERE id_usuario = ?
            `,
            [id_usuario]
        );

        return {
            ok: true,
            puntaje_final: Number(puntaje_final.toFixed(2)),
            puntaje_maximo
        };
    }

    // 11) Verificar y expirar por inactividad
    static async verificarExpiracion(id_intento_examen) {
        const params = await this.obtenerParametrosGlobales();
        const timeoutMin = params.timeout_inactividad_min;

        // ✅ FIX: Destructuring [rows]
        const [rows] = await query(
            `SELECT ultima_actividad_en, estado FROM intentos_examen WHERE id_intento_examen = ?`,
            [id_intento_examen]
        );

        if (!rows.length) return false;

        const intento = rows[0];
        if (intento.estado !== 'EN_PROGRESO') return false;

        // Cálculo de tiempos
        const ultimaActividad = new Date(intento.ultima_actividad_en).getTime();
        const ahora = new Date().getTime();
        const diffMinutos = (ahora - ultimaActividad) / 1000 / 60;

        if (diffMinutos > timeoutMin) {
            // Expirar examen
            await query(
                `UPDATE intentos_examen SET estado = 'EXPIRADO', enviado_en = NOW() WHERE id_intento_examen = ?`,
                [id_intento_examen]
            );
            // Desvincular usuario
            await query(
                `UPDATE usuarios SET id_intento_examen = NULL, examen_finalizado = 1 WHERE id_intento_examen = ?`,
                [id_intento_examen]
            );
            return true; // Expiró
        }
        return false; // Sigue vivo
    }
}

module.exports = ExamenPostulanteModel;