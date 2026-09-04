import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { evaluacionesService } from '../../services/evaluaciones.service';
import { aplicarRedondeoPuntaje } from '../../utils/evaluacionUtils';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ModalEvaluar({ data, onClose, onSaved }) {
    const { idEvaluacion, cedula } = data;
    const [evalData, setEvalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selecciones, setSelecciones] = useState({});
    const [observaciones, setObservaciones] = useState('');

    useEffect(() => {
        cargarEvaluacion();
    }, [idEvaluacion, cedula]);

    const cargarEvaluacion = async () => {
        try {
            const resp = await evaluacionesService.getEvaluacionDetalles(idEvaluacion, cedula);
            if (resp.success) {
                setEvalData(resp);
                setObservaciones(resp.evaluacion.observaciones || '');
                
                const initialSels = {};
                resp.criterios.forEach(crit => {
                    const selectedNivel = crit.niveles.find(n => n.seleccionado);
                    if (selectedNivel) {
                        initialSels[crit.id] = {
                            nivel_id: selectedNivel.id,
                            puntaje: parseFloat(selectedNivel.puntaje),
                            nivel_puntaje_base: parseFloat(selectedNivel.puntaje_maximo || selectedNivel.puntaje),
                            puntaje_maximo: parseFloat(selectedNivel.puntaje_maximo || selectedNivel.puntaje)
                        };
                    }
                });
                setSelecciones(initialSels);
            } else {
                Swal.fire('Error', resp.message || 'Error al cargar detalles', 'error');
                onClose();
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            Swal.fire('Error', 'No se pudieron cargar los detalles para evaluar', 'error');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSelectNivel = (criterioId, nivelId, puntaje, puntajeMaximo) => {
        setSelecciones(prev => ({
            ...prev,
            [criterioId]: {
                nivel_id: nivelId,
                puntaje: parseFloat(puntaje),
                nivel_puntaje_base: parseFloat(puntaje),
                puntaje_maximo: parseFloat(puntajeMaximo || puntaje)
            }
        }));
    };

    const handlePuntajeChange = (criterioId, value) => {
        setSelecciones(prev => ({
            ...prev,
            [criterioId]: {
                ...prev[criterioId],
                puntaje: value
            }
        }));
    };

    const puntajeSumaDirecta = () => {
        let suma = 0;
        const seleccionados = Object.values(selecciones);
        for (let i = 0; i < seleccionados.length; i++) {
            const p = parseFloat(seleccionados[i]?.puntaje);
            if (!isNaN(p)) {
                suma += p;
            }
        }
        return suma;
    };

    const puntajeRealObtenido = () => {
        const suma = puntajeSumaDirecta();
        if (!evalData?.evaluacion?.porcentaje_evaluacion) return suma;
        return aplicarRedondeoPuntaje(suma, evalData.evaluacion.porcentaje_evaluacion);
    };

    const handleGuardar = async () => {
        if (!evalData) return;

        const totalCriterios = evalData.criterios.length;
        if (Object.keys(selecciones).length < totalCriterios) {
            Swal.fire('Atención', 'Debe evaluar todos los criterios', 'warning');
            return;
        }

        // Validar que ningún criterio exceda el nivel por más de 10 centésimas ni sea negativo
        for (const crit of evalData.criterios) {
            const sel = selecciones[crit.id];
            if (!sel) continue;
            const nivel = crit.niveles.find(n => n.id === sel.nivel_id);
            const basePuntaje = parseFloat(nivel?.puntaje_maximo || nivel?.puntaje || 0);
            const puntajeAsignado = parseFloat(sel.puntaje);
            const maxPermitido = Number((basePuntaje + 0.10001).toFixed(3));

            if (isNaN(puntajeAsignado) || puntajeAsignado < 0) {
                Swal.fire('Atención', `El puntaje del criterio "${crit.nombre}" debe ser mayor o igual a 0.`, 'warning');
                return;
            }

            if (puntajeAsignado > maxPermitido) {
                Swal.fire(
                    'Atención',
                    `El puntaje asignado al criterio "${crit.nombre}" (${puntajeAsignado}) no puede exceder el nivel (Máximo permitido: ${(basePuntaje).toFixed(3)} pts).`,
                    'warning'
                );
                return;
            }
        }

        const calificacionFinal = puntajeRealObtenido();
        const esEvalCero = parseFloat(evalData?.evaluacion?.porcentaje_evaluacion) === 0;

        if (!esEvalCero && calificacionFinal < 0.02499) {
            Swal.fire(
                'Atención',
                'La calificación total obtenida no puede ser inferior a 0.025 puntos. Por favor, revise y ajuste los puntajes de los criterios.',
                'warning'
            );
            return;
        }

        const detalles = evalData.criterios.map(crit => {
            const sel = selecciones[crit.id];
            const nivel = crit.niveles.find(n => n.id === sel.nivel_id);
            return {
                criterio_id: crit.id,
                nivel_id: sel.nivel_id,
                puntaje_obtenido: parseFloat(sel.puntaje || 0),
                puntaje_maximo: parseFloat(nivel?.puntaje_maximo || sel.puntaje || 1)
            };
        });

        try {
            Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });
            
            const payload = {
                observaciones,
                puntaje_total: calificacionFinal,
                detalles
            };

            const resp = await evaluacionesService.saveEvaluacionResultado(evalData.evaluacion.evaluacion_id, evalData.estudiante.cedula, payload);

            if (resp.success) {
                Swal.fire('Éxito', 'Evaluación guardada correctamente', 'success').then(() => onSaved());
            } else {
                Swal.fire('Error', resp.message || 'Error al guardar', 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error al guardar la evaluación', 'error');
        }
    };

    if (loading || !evalData) {
        return (
            <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', minWidth: '320px' }}>
                    <LoadingSpinner text="Cargando evaluación..." color="#3b82f6" padding="20px" />
                </div>
            </div>
        );
    }

    const iniciales = `${evalData.estudiante.nombre.charAt(0)}${evalData.estudiante.apellido.charAt(0)}`.toUpperCase();
    const sumaDirecta = puntajeSumaDirecta();
    const puntajeFinal = puntajeRealObtenido();
    const maxPorcentaje = parseFloat(evalData.evaluacion.porcentaje_evaluacion);
    const fueRedondeado = puntajeFinal === maxPorcentaje && sumaDirecta < maxPorcentaje && (maxPorcentaje - sumaDirecta) <= 0.50001;

    return (
        <div className="modal active">
            <div className="modal-content modal-evaluar-content" style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h2 className="modal-title"><i className="fas fa-clipboard-check"></i> Evaluar Estudiante</h2>
                    <button className="modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
                </div>

                <div className="modal-body" style={{ padding: '25px' }}>
                    {/* Estudiante Info */}
                    <div className="estudiante-info-card" style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                        <div className="estudiante-avatar-large" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5em', fontWeight: 'bold' }}>
                            {iniciales}
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{evalData.estudiante.nombre} {evalData.estudiante.apellido}</h3>
                            <p style={{ margin: '0 0 5px 0', color: '#64748b' }}>CI: {evalData.estudiante.cedula}</p>
                            <span style={{ background: '#e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85em' }}>{evalData.estudiante.carrera}</span>
                        </div>
                    </div>

                    {/* Rubrica Info */}
                    <div className="rubrica-info-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-file-alt"></i> Información de la Rúbrica
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            <div><strong>Rúbrica:</strong> <span style={{ color: '#475569' }}>{evalData.rubrica.nombre_rubrica}</span></div>
                            <div><strong>Materia:</strong> <span style={{ color: '#475569' }}>{evalData.rubrica.materia}</span></div>
                            <div><strong>Tipo:</strong> <span style={{ color: '#475569' }}>{evalData.rubrica.tipo_evaluacion}</span></div>
                            <div><strong>Porcentaje:</strong> <span style={{ color: '#475569', fontWeight: 'bold' }}>{evalData.rubrica.porcentaje_evaluacion}%</span></div>
                        </div>
                    </div>

                    {/* Criterios list */}
                    <div className="criterios-evaluacion">
                        <h4 style={{ marginBottom: '15px', color: '#334155' }}><i className="fas fa-list-check"></i> Criterios de Evaluación</h4>
                        {evalData.criterios.map(crit => (
                            <div key={crit.id} className="criterio-card" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '15px', padding: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                    <h5 style={{ margin: 0, color: '#1e293b', fontSize: '1.05em' }}>{crit.nombre}</h5>
                                    <strong style={{ color: '#3b82f6' }}><i className="fas fa-star"></i> {parseFloat(crit.puntaje_maximo).toFixed(3)} pts</strong>
                                </div>
                                <div className="niveles-desempeno" style={{ display: 'grid', gap: '10px' }}>
                                    {crit.niveles.map((nivel, idx) => { 
                                    const isSelected = selecciones[crit.id]?.nivel_id === nivel.id;
                                    const maxPuntaje = parseFloat(nivel.puntaje_maximo !== undefined ? nivel.puntaje_maximo : nivel.puntaje);
                                    const nextLevel = crit.niveles[idx + 1];
                                    const minPuntaje = nextLevel ? parseFloat(nextLevel.puntaje) : 0;
                                    const maxPermitido = maxPuntaje.toFixed(3);
                                    const minPermitido = minPuntaje.toFixed(3); + 0.001

                                    return (
                                        <div 
                                            key={nivel.id} 
                                            onClick={() => handleSelectNivel(crit.id, nivel.id, nivel.puntaje, nivel.puntaje_maximo)}
                                            style={{ 
                                                padding: '14px', 
                                                border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                                                borderRadius: '8px', 
                                                cursor: 'pointer', 
                                                background: isSelected ? '#eff6ff' : 'white',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <i className={isSelected ? 'fas fa-check-circle' : 'far fa-circle'} style={{ color: isSelected ? '#3b82f6' : '#cbd5e1' }}></i>
                                                    <strong style={{ color: isSelected ? '#1e3a8a' : '#334155' }}>{nivel.nombre}</strong>
                                                </div>
                                                <span style={{ color: isSelected ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>
                                                    {parseFloat(nivel.puntaje).toFixed(3)}/{parseFloat(nivel.puntaje_maximo).toFixed(3)} pts
                                                </span>
                                            </div>
                                            <p style={{ margin: '0 0 0 24px', fontSize: '0.9em', color: '#64748b' }}>{nivel.descripcion}</p>

                                            {isSelected && (
                                                <div 
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ 
                                                        marginTop: '12px', 
                                                        paddingTop: '10px', 
                                                        borderTop: '1px dashed #bfdbfe',
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '10px'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: '600' }}>
                                                        <i className="fas fa-pencil-alt"></i> Calificación para este criterio:
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <input 
                                                            type="number"
                                                            step="0.001"
                                                            min={minPermitido}    
                                                            max={maxPermitido}    
                                                            value={selecciones[crit.id]?.puntaje !== undefined ? parseFloat(selecciones[crit.id].puntaje).toFixed(3) : parseFloat(nivel.puntaje).toFixed(3)}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '') {
                                                                    handlePuntajeChange(crit.id, '');
                                                                    return;
                                                                }
                                                                const num = parseFloat(val);
                                                                if (!isNaN(num)) {
                                                                    let newVal = num;
                                                                    if (num > maxPuntaje) {
                                                                        newVal = maxPuntaje;
                                                                    } else if (num < minPuntaje) {
                                                                        newVal = minPuntaje;
                                                                    }
                                                                    handlePuntajeChange(crit.id, newVal.toFixed(3));
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                const num = parseFloat(e.target.value);
                                                                if (isNaN(num) || num < minPuntaje) {
                                                                    handlePuntajeChange(crit.id, minPuntaje.toFixed(3));
                                                                } else if (num > maxPuntaje) {
                                                                    handlePuntajeChange(crit.id, maxPuntaje.toFixed(3));
                                                                }
                                                            }}
                                                            style={{
                                                                width: '95px',
                                                                padding: '5px 8px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #3b82f6',
                                                                fontSize: '0.95rem',
                                                                fontWeight: 'bold',
                                                                color: '#1e40af',
                                                                textAlign: 'right',
                                                                background: '#fff'
                                                            }}
                                                        />
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af' }}>pts</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Resumen */}
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginTop: '25px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
                                Puntaje Obtenido: <strong style={{ color: '#1e293b', fontSize: '1.1rem' }}>{puntajeFinal.toFixed(3)}</strong>
                                {fueRedondeado && (
                                    <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                        <i className="fas fa-arrow-up"></i> 
                                    </span>
                                )}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '4px' }}>
                                Puntaje Máximo: <strong style={{ color: '#1e293b' }}>{evalData.evaluacion.porcentaje_evaluacion} pts</strong>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#64748b', fontSize: '0.9em', textTransform: 'uppercase', fontWeight: 'bold' }}>Calificación Final</div>
                            <div style={{ fontSize: '2em', color: '#3b82f6', fontWeight: 'bold' }}>
                                {parseFloat(evalData.evaluacion.porcentaje_evaluacion) > 0
                                    ? (puntajeFinal * 100 / parseFloat(evalData.evaluacion.porcentaje_evaluacion)).toFixed(2)
                                    : '0.00'}
                                <span style={{ fontSize: '0.5em', color: '#94a3b8' }}>/100</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#334155' }}>
                            <i className="fas fa-comment"></i> Observaciones
                        </label>
                        <textarea 
                            className="form-textarea" 
                            rows="4" 
                            style={{ width: '100%', padding: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical' }}
                            placeholder="Escriba observaciones adicionales..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                        />
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                    <button onClick={handleGuardar} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-save"></i> Guardar Evaluación
                    </button>
                </div>
            </div>
        </div>
    );
}

