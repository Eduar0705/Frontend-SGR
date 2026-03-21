const fs = require('fs');

const path = "c:\\ServerDevelopment\\xampp\\htdocs\\SYSRUBR\\Frontend-SGR\\src\\teacher\\evaluaciones.jsx";
let content = fs.readFileSync(path, 'utf8');

const anchorStart = "    const renderContent = () => {";
const anchorEnd = "    if (!user) return null;\n";

const idx1 = content.indexOf(anchorStart);
const idx2 = content.indexOf(anchorEnd);

if (idx1 === -1 || idx2 === -1) {
    console.log("Anchors not found!");
    process.exit(1);
}

const head = content.substring(0, idx1);
const tail = content.substring(idx2);

const replacement = `    /* ─────────── render ─────────── */
    const renderContent = () => {
        if (loading) return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#3b82f6' }} />
                <p style={{ marginTop: '10px', color: '#64748b' }}>Cargando evaluaciones...</p>
            </div>
        );

        if (Object.keys(evaluacionesAgrupadas).length === 0) return (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>
                <i className="fas fa-clipboard-list" style={{ fontSize: '3em', color: '#94a3b8', marginBottom: '15px' }} />
                <h3>No hay evaluaciones registradas</h3>
                <p style={{ color: '#64748b' }}>Aún no se han asignado evaluaciones a los estudiantes.</p>
            </div>
        );

        return (
            <div className="hierarchy-container">
                {Object.keys(evaluacionesAgrupadas).map(carrera => {
                    const openC = expandedCarreras[carrera];
                    return (
                        <div key={carrera} style={{ marginBottom: '20px', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>

                            {/* ══ NIVEL 1: CARRERA ══ */}
                            <h2 onClick={() => toggleCarrera(carrera)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '15px 20px', margin: 0, color: '#1e293b', fontSize: '1.2em' }}>
                                <span><i className="fas fa-graduation-cap" style={{ marginRight: '10px' }} />{carrera}</span>
                                <Chevron open={openC} />
                            </h2>

                            {openC && (
                                <div style={{ padding: '20px' }}>
                                    {Object.keys(evaluacionesAgrupadas[carrera]).map(semestre => {
                                        const semKey = \`\${carrera}|\${semestre}\`;
                                        const openSem = expandedSemestres[semKey];
                                        return (
                                        <div key={semestre} style={{ marginBottom: '20px' }}>
                                            <h3 onClick={() => toggleSemestre(semKey)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px' }}>
                                                <span><i className="fas fa-layer-group" style={{ marginRight: '8px', color: '#64748b' }} />{semestre}</span>
                                                <Chevron open={openSem} />
                                            </h3>

                                            {openSem && Object.keys(evaluacionesAgrupadas[carrera][semestre]).map(materia => {
                                                const mKey  = \`\${semKey}|\${materia}\`;
                                                const openM = expandedMaterias[mKey];
                                                return (
                                                    <div key={materia} style={{ marginLeft: '15px', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>

                                                        {/* ══ NIVEL 2: MATERIA ══ */}
                                                        <h4 onClick={() => toggleMateria(mKey)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, padding: '12px 16px', color: '#1e3a8a', background: '#eef2ff', borderBottom: openM ? '1px solid #c7d2fe' : 'none' }}>
                                                            <span><i className="fas fa-book" style={{ marginRight: '8px', color: '#3b82f6' }} />{materia}</span>
                                                            <Chevron open={openM} />
                                                        </h4>

                                                        {openM && (
                                                            <div style={{ padding: '12px 15px', background: '#f8fafc' }}>
                                                                {Object.keys(evaluacionesAgrupadas[carrera][semestre][materia]).map(seccion => {
                                                                    const secData = evaluacionesAgrupadas[carrera][semestre][materia][seccion];
                                                                    const sKey    = \`\${mKey}|\${seccion}\`;
                                                                    const openS   = expandedSecciones[sKey];
                                                                    return (
                                                                        <div key={seccion} style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>

                                                                            {/* ══ NIVEL 3: SECCIÓN ══ */}
                                                                            <div onClick={() => toggleSeccion(sKey)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: '#fef9ee', borderBottom: openS ? '1px solid #fde68a' : 'none', gap: '12px' }}>
                                                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.9em', flexWrap: 'wrap' }}>
                                                                                    <strong style={{ color: '#92400e' }}>
                                                                                        <i className="fas fa-layer-group" style={{ marginRight: '7px', color: '#f59e0b' }} />{seccion}
                                                                                    </strong>
                                                                                    <span style={{ color: '#64748b' }}><i className="fas fa-clock" style={{ marginRight: '5px' }} />{secData.info.horario}</span>
                                                                                    <span style={{ color: '#64748b' }}><i className="fas fa-map-marker-alt" style={{ marginRight: '5px' }} />{secData.info.aula}</span>
                                                                                </div>
                                                                                <Chevron open={openS} />
                                                                            </div>

                                                                            {openS && (
                                                                                <div style={{ padding: '12px 15px', background: 'white' }}>
                                                                                    {Object.keys(secData.rubricas).map(rubrica => {
                                                                                        const rKey  = \`\${sKey}|\${rubrica}\`;
                                                                                        const openR = expandedRubricas[rKey];
                                                                                        const filtrados = secData.rubricas[rubrica].filter(ev => {
                                                                                            if (!searchTerm) return true;
                                                                                            const full = \`\${ev.estudiante_nombre} \${ev.estudiante_apellido}\`.toLowerCase();
                                                                                            return full.includes(searchTerm) || ev.estudiante_cedula.includes(searchTerm);
                                                                                        });
                                                                                        return (
                                                                                            <div key={rubrica} style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>

                                                                                                {/* ══ NIVEL 4: RÚBRICA ══ */}
                                                                                                <h5 onClick={() => toggleRubrica(rKey)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, padding: '10px 14px', color: '#065f46', fontSize: '0.95em', background: '#f0fdf4', borderBottom: openR ? '1px solid #a7f3d0' : 'none' }}>
                                                                                                    <span>
                                                                                                        <i className="fas fa-clipboard-check" style={{ marginRight: '8px', color: '#10b981' }} />
                                                                                                        {rubrica}
                                                                                                        <span style={{ marginLeft: '10px', background: '#d1fae5', color: '#065f46', borderRadius: '999px', padding: '2px 8px', fontSize: '0.78em', fontWeight: '600' }}>
                                                                                                            {filtrados.length} estudiante{filtrados.length !== 1 ? 's' : ''}
                                                                                                        </span>
                                                                                                    </span>
                                                                                                    <Chevron open={openR} />
                                                                                                </h5>

                                                                                                {openR && (
                                                                                                    <div style={{ padding: '15px' }}>
                                                                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                                                                                                            {filtrados.map(ev => (
                                                                                                                <div key={ev.estudiante_cedula + ev.id} className="evaluacion-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                                                                                    {/* Ribbon */}
                                                                                                                    <div style={{ position: 'absolute', top: '12px', right: '-35px', background: ev.estado === 'Completada' ? '#10b981' : '#f59e0b', color: 'white', padding: '5px 40px', fontSize: '0.75em', fontWeight: 'bold', transform: 'rotate(45deg)', zIndex: 1 }}>
                                                                                                                        {ev.estado}
                                                                                                                    </div>

                                                                                                                    <div>
                                                                                                                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2em', color: '#1e293b', fontWeight: 'bold', textTransform: 'uppercase' }}>{ev.materia_nombre}</h4>
                                                                                                                        <div style={{ color: '#3b82f6', fontSize: '0.9em', fontWeight: '500' }}>{ev.materia_codigo} {ev.seccion_codigo}</div>
                                                                                                                    </div>

                                                                                                                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                                                        <i className="fas fa-user" style={{ color: '#64748b' }} />
                                                                                                                        <div style={{ color: '#2563eb', fontWeight: '500' }}>{ev.estudiante_nombre} {ev.estudiante_apellido}</div>
                                                                                                                    </div>

                                                                                                                    <div style={{ color: '#64748b', fontSize: '0.95em', minHeight: '1.4em' }}>
                                                                                                                        {ev.observaciones || 'Sin observaciones adicionales'}
                                                                                                                    </div>

                                                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                                                                                                        <div>
                                                                                                                            <span style={{ fontSize: '0.75em', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Ponderación</span>
                                                                                                                            <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.1em' }}>{ev.porcentaje_evaluacion || 10}%</div>
                                                                                                                        </div>
                                                                                                                        <div style={{ textAlign: 'right' }}>
                                                                                                                            <span style={{ fontSize: '0.75em', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Progreso</span>
                                                                                                                            <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.1em' }}>{ev.estado === 'Completada' ? '1/1' : '0/1'}</div>
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85em' }}>
                                                                                                                            <span><i className="fas fa-calendar-alt" /> {ev.fecha_formateada}</span>
                                                                                                                            <span><i className="fas fa-clock" /> Sección</span>
                                                                                                                        </div>
                                                                                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                                                                                            {ev.estado === 'Completada' ? (
                                                                                                                                <>
                                                                                                                                    <button onClick={(e) => { e.stopPropagation(); setIsActionLoading(true); setSelectedEstudianteEvaluar({ idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula }); setTimeout(() => { setIsActionLoading(false); setShowEvaluar(true); }, 800); }} style={{ flex: 1, padding: '10px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }} className="btn-card-action" title="Editar Evaluación"><i className="fas fa-edit" /></button>
                                                                                                                                    <button onClick={(e) => { e.stopPropagation(); setIsActionLoading(true); setSelectedEstudianteDetalles({ idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula }); setTimeout(() => { setIsActionLoading(false); setShowDetalles(true); }, 800); }} style={{ flex: 1, padding: '10px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }} className="btn-card-action" title="Ver Detalles"><i className="fas fa-eye" /></button>
                                                                                                                                    <button style={{ flex: 1, padding: '10px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', opacity: 0.6 }} title="Estadísticas (Próximamente)"><i className="fas fa-chart-line" /></button>
                                                                                                                                </>
                                                                                                                            ) : (
                                                                                                                                <button onClick={(e) => { e.stopPropagation(); setIsActionLoading(true); setSelectedEstudianteEvaluar({ idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula }); setTimeout(() => { setIsActionLoading(false); setShowEvaluar(true); }, 800); }} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                                                                                                    <i className="fas fa-clipboard-check" /> Evaluar Estudiante
                                                                                                                                </button>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };
\n`;

fs.writeFileSync(path, head + replacement + tail);
console.log("SUCCESS!");
