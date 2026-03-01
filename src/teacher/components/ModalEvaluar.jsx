import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { evaluacionesService } from '../../services/evaluaciones.service';

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
            const resp = await evaluacionesService.getDetalles(idEvaluacion, cedula);
            if (resp.success) {
                setEvalData(resp);
                setObservaciones(resp.evaluacion.observaciones || '');
                
                // Initialize selections from already saved detail if any
                const initialSels = {};
                resp.criterios.forEach(crit => {
                    const selectedNivel = crit.niveles.find(n => n.seleccionado);
                    if (selectedNivel) {
                        initialSels[crit.id] = {
                            nivel_id: selectedNivel.id,
                            puntaje: parseFloat(selectedNivel.puntaje)
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

    const handleSelectNivel = (criterioId, nivelId, puntaje) => {
        setSelecciones(prev => ({
            ...prev,
            [criterioId]: { nivel_id: nivelId, puntaje: parseFloat(puntaje) }
        }));
    };

    const calcularCalificacion = () => {
        if (!evalData) return 0;
        const puntajeObtenido = Object.values(selecciones).reduce((sum, sel) => sum + sel.puntaje, 0);
        const puntajeMaximo = evalData.criterios.reduce((sum, crit) => sum + parseFloat(crit.puntaje_maximo), 0);
        return puntajeMaximo > 0 ? (puntajeObtenido / puntajeMaximo) * 100 : 0;
    };

    const puntajeRealObtenido = () => {
        return Object.values(selecciones).reduce((sum, sel) => sum + sel.puntaje, 0);
    };

    const handleGuardar = async () => {
        if (!evalData) return;

        const totalCriterios = evalData.criterios.length;
        if (Object.keys(selecciones).length < totalCriterios) {
            Swal.fire('Atención', 'Debe evaluar todos los criterios', 'warning');
            return;
        }

        const calificacionFinal = calcularCalificacion();

        const detalles = evalData.criterios.map(crit => ({
            criterio_id: crit.id,
            nivel_id: selecciones[crit.id].nivel_id,
            puntaje_obtenido: selecciones[crit.id].puntaje
        }));

        try {
            Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });
            
            const payload = {
                observaciones,
                puntaje_total: calificacionFinal,
                detalles
            };

            const resp = await evaluacionesService.saveEvaluacion(evalData.evaluacion.id_evaluacion, evalData.estudiante.cedula, payload);

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
                <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
                    <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#3b82f6', marginBottom: '20px' }}></i>
                    <h3>Cargando evaluación...</h3>
                </div>
            </div>
        );
    }

    const maxPts = evalData.criterios.reduce((sum, crit) => sum + parseFloat(crit.puntaje_maximo), 0);
    const iniciales = `${evalData.estudiante.nombre.charAt(0)}${evalData.estudiante.apellido.charAt(0)}`.toUpperCase();

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
                            <div><strong>Porcentaje:</strong> <span style={{ color: '#475569' }}>{evalData.rubrica.porcentaje_evaluacion}%</span></div>
                        </div>
                    </div>

                    {/* Criterios list */}
                    <div className="criterios-evaluacion">
                        <h4 style={{ marginBottom: '15px', color: '#334155' }}><i className="fas fa-list-check"></i> Criterios de Evaluación</h4>
                        {evalData.criterios.map(crit => (
                            <div key={crit.id} className="criterio-card" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '15px', padding: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                    <h5 style={{ margin: 0, color: '#1e293b', fontSize: '1.05em' }}>{crit.nombre}</h5>
                                    <strong style={{ color: '#3b82f6' }}><i className="fas fa-star"></i> {crit.puntaje_maximo} pts</strong>
                                </div>
                                <div className="niveles-desempeno" style={{ display: 'grid', gap: '10px' }}>
                                    {crit.niveles.map(nivel => {
                                        const isSelected = selecciones[crit.id]?.nivel_id === nivel.id;
                                        return (
                                            <label 
                                                key={nivel.id} 
                                                style={{ 
                                                    display: 'flex', padding: '15px', border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                                                    borderRadius: '8px', cursor: 'pointer', background: isSelected ? '#eff6ff' : 'white',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <input 
                                                    type="radio" 
                                                    name={`crit-${crit.id}`} 
                                                    value={nivel.id} 
                                                    checked={isSelected}
                                                    onChange={() => handleSelectNivel(crit.id, nivel.id, nivel.puntaje)}
                                                    style={{ display: 'none' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                        <strong style={{ color: isSelected ? '#1e3a8a' : '#334155' }}>{nivel.nombre}</strong>
                                                        <span style={{ color: isSelected ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>{nivel.puntaje} pts</span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '0.9em', color: '#64748b' }}>{nivel.descripcion}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Resumen */}
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginTop: '25px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: '#64748b' }}>Puntaje Obtenido: <strong style={{ color: '#1e293b' }}>{puntajeRealObtenido().toFixed(2)}</strong></div>
                            <div style={{ color: '#64748b' }}>Puntaje Máximo: <strong style={{ color: '#1e293b' }}>{maxPts.toFixed(2)}</strong></div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#64748b', fontSize: '0.9em', textTransform: 'uppercase', fontWeight: 'bold' }}>Calificación Final</div>
                            <div style={{ fontSize: '2em', color: '#3b82f6', fontWeight: 'bold' }}>{calcularCalificacion().toFixed(2)}<span style={{ fontSize: '0.5em', color: '#94a3b8' }}>/100</span></div>
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
