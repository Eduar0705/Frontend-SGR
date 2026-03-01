export const imprimirRubricaFormal = (rubrica, criterios) => {
    const ventanaImpresion = window.open('', '_blank', 'width=1200,height=900');
    if (!ventanaImpresion) {
        return false;
    }

    const primerCriterioValido = criterios.find(c => c.niveles && c.niveles.length > 0);
    const nombresNiveles = primerCriterioValido 
        ? primerCriterioValido.niveles.sort((a,b) => b.puntaje - a.puntaje).map(n => n.nombre_nivel)
        : ['Sobresaliente', 'Notable', 'Aprobado', 'Insuficiente'];

    // Convert date
    const fechaFormat = rubrica.fecha_evaluacion ? new Date(rubrica.fecha_evaluacion).toLocaleDateString('es-ES') : '';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${rubrica.nombre_rubrica}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 40px; 
                    font-size: 12px; 
                    color: #000;
                }
                .header-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .logo {
                    width: 150px;
                    font-weight: bold;
                    font-size: 24px;
                    color: #cc0000;
                }
                .header-text {
                    flex: 1;
                    text-align: center;
                }
                .title {
                    font-weight: bold;
                    font-size: 14px;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .subtitle {
                    font-weight: bold;
                    font-size: 14px;
                }
                .meta-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .meta-table td {
                    border: 1px solid #000;
                    padding: 5px 8px;
                    vertical-align: top;
                }
                .meta-label {
                    font-weight: bold;
                }
                .rubrica-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .rubrica-table th, .rubrica-table td {
                    border: 1px solid #000;
                    padding: 8px;
                    vertical-align: top;
                    text-align: left;
                }
                .rubrica-table th {
                    text-align: center;
                    font-weight: bold;
                }
                .criterio-col {
                    width: 15%;
                    font-weight: bold;
                }
                .nivel-col {
                    width: 21.25%;
                }
                .puntaje {
                    font-weight: bold;
                    display: block;
                    margin-top: 5px;
                }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <button onclick="window.print()" class="no-print" style="margin-bottom: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir</button>
            
            <div class="header-container">
                <div class="logo">
                     IUJO<br><span style="font-size:10px; color:#000;">Instituto Universitario<br>Jesús Obrero</span>
                </div>
                <div class="header-text">
                    <div class="title">RÚBRICA DE EVALUACIÓN ${rubrica.nombre_rubrica}</div>
                    <div class="subtitle">CALIFICACIÓN ${rubrica.porcentaje_evaluacion}%</div>
                </div>
            </div>

            <table class="meta-table">
                <tr>
                    <td width="50%"><span class="meta-label">Docente:</span> ${rubrica.docente_nombre || ''}</td>
                    <td width="50%"><span class="meta-label">Unidad Curricular:</span> ${rubrica.materia_nombre || ''}</td>
                </tr>
                <tr>
                    <td><span class="meta-label">Carrera:</span> ${rubrica.carrera_nombre || ''}</td>
                    <td><span class="meta-label">Sección:</span> ${rubrica.seccion_codigo || ''}</td>
                </tr>
                <tr>
                    <td><span class="meta-label">Fecha:</span> ${fechaFormat}</td>
                    <td><span class="meta-label">Lapso:</span> ${rubrica.lapse_academico || ''}</td>
                </tr>
                <tr>
                    <td colspan="2"><span class="meta-label">Competencias:</span> ${rubrica.competencias || ''}</td>
                </tr>
            </table>

            <table class="rubrica-table">
                <thead>
                    <tr>
                        <th class="criterio-col"></th>
                        ${nombresNiveles.map(n => `<th class="nivel-col">${n}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${criterios.map(c => `
                        <tr>
                            <td class="criterio-col">
                                ${c.descripcion}<br/>
                                <span class="puntaje">(${c.puntaje_maximo} pts)</span>
                            </td>
                            ${nombresNiveles.map(nivelNombre => {
                                const nivel = c.niveles.find(n => n.nombre_nivel === nivelNombre);
                                return `<td>${nivel ? (nivel.descripcion || '') + `<br/><span class="puntaje">(${nivel.puntaje} pts)</span>` : ''}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
        </body>
        </html>
    `;

    ventanaImpresion.document.write(html);
    ventanaImpresion.document.close();
    return true;
};
