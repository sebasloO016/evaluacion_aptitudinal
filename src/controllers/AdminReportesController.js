const AdminReportesModel = require('../models/AdminReportesModel');
const xlsx = require('xlsx');

class AdminReportesController {

    static async verReportes(req, res) {
        try {
            const { cargo, estado, busqueda } = req.query;

            // --- LÓGICA DE PAGINACIÓN ---
            const page = parseInt(req.query.page) || 1; // Página actual (por defecto 1)
            const limit = 20; // Registros por página
            const offset = (page - 1) * limit;

            // Pedimos datos paginados
            const { rows, total } = await AdminReportesModel.obtenerResultados({
                cargo, estado, busqueda, limit, offset
            });

            const cargos = await AdminReportesModel.obtenerCargos();
            const totalPages = Math.ceil(total / limit);

            res.render('admin/reportes', {
                resultados: rows,
                cargos,
                filtros: { cargo, estado, busqueda },
                pagination: {
                    page,
                    totalPages,
                    totalItems: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            });

        } catch (error) {
            console.error("Error verReportes:", error);
            res.status(500).send("Error al cargar reportes");
        }
    }

    static async exportarExcel(req, res) {
        try {
            const { cargo, estado, busqueda } = req.query;

            // Para Excel NO pasamos limit ni offset, queremos TODO
            const { rows } = await AdminReportesModel.obtenerResultados({ cargo, estado, busqueda });

            const excelData = rows.map(row => ({
                "Cédula": row.cedula,
                "Nombre Completo": row.nombre_completo,
                "Cargo": row.cargo,
                "Estado": row.estado || 'PENDIENTE',
                "Nota Final": row.puntaje_final || 0,
                "Sobre": row.puntaje_maximo || 100,
                "Fecha Envío": row.enviado_en ? new Date(row.enviado_en).toLocaleString('es-EC') : '-'
            }));

            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.json_to_sheet(excelData);

            ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 20 }];

            xlsx.utils.book_append_sheet(wb, ws, "Resultados");
            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Resultados.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);

        } catch (error) {
            console.error(error);
            res.status(500).send("Error generando Excel");
        }
    }
}

module.exports = AdminReportesController;