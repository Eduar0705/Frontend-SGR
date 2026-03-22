import React, { useState, useEffect } from 'react';
import { evaluacionesService } from '../../services/evaluaciones.service';
import Swal from 'sweetalert2';

export default function ModalVerDetalles({ data, onClose }) {
    const { idEvaluacion, cedula } = data;
    const [evalData, setEvalData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarDetalles();
    }, [idEvaluacion, cedula]);

    const cargarDetalles = async () => {
        try {
            const resp = await evaluacionesService.getEvaluacionDetalles(idEvaluacion, cedula);
            if (resp.success) {
                setEvalData(resp);
            } else {
                Swal.fire('Error', resp.message || 'Error al cargar detalles', 'error');
                onClose();
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            Swal.fire('Error', 'No se pudieron cargar los detalles', 'error');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (loading || !evalData) {
        return (
            <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
                    <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#3b82f6', marginBottom: '20px' }}></i>
                    <h3>Cargando detalles de evaluación...</h3>
                </div>
            </div>
        );
    }

    const { evaluacion, estudiante, rubrica, criterios } = evalData;
    const iniciales = `${estudiante.nombre.charAt(0)}${estudiante.apellido.charAt(0)}`.toUpperCase();
    const maxPts = criterios.reduce((sum, crit) => sum + parseFloat(crit.puntaje_maximo), 0);

    return (
        <div className="modal active">
            <div className="modal-content-detalles" style={{ maxWidth: '800px', width: '90%', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header-detalles" style={{ background: '#f8fafc', padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-eye" style={{ color: '#3b82f6' }}></i> Detalles de Evaluación
                    </h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.2em', cursor: 'pointer', color: '#64748b' }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body-detalles" style={{ padding: '25px', overflowY: 'auto' }}>
                    {/* Info Estudiante */}
                    <div className="estudiante-info-detalles" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                        <div className="estudiante-avatar-detalles" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5em', fontWeight: 'bold' }}>
                            {iniciales}
                        </div>
                        <div className="estudiante-datos-detalles">
                            <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{estudiante.nombre} {estudiante.apellido}</h3>
                            <p style={{ margin: '0 0 5px 0', color: '#64748b' }}><i className="fas fa-id-card"></i> {estudiante.cedula}</p>
                            <div className="badge-carrera-detalles" style={{ display: 'inline-block', background: '#e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85em', marginTop: '5px' }}>
                                {estudiante.carrera}
                            </div>
                        </div>
                    </div>

                    {/* Info Rúbrica */}
                    <div className="rubrica-info-detalles" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
                        <div className="rubrica-info-header-detalles" style={{ marginBottom: '15px' }}>
                            <h4 style={{ margin: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-clipboard-list" style={{ color: '#3b82f6' }}></i> {rubrica.nombre_rubrica}
                            </h4>
                        </div>
                        <div className="rubrica-info-details-detalles" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                            <div>
                                <div style={{ fontSize: '0.85em', color: '#64748b', marginBottom: '3px' }}>Materia</div>
                                <div style={{ color: '#1e293b', fontWeight: '500' }}>{rubrica.materia}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85em', color: '#64748b', marginBottom: '3px' }}>Tipo</div>
                                <div style={{ color: '#1e293b', fontWeight: '500' }}>{rubrica.tipo_evaluacion}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85em', color: '#64748b', marginBottom: '3px' }}>Porcentaje</div>
                                <div style={{ color: '#1e293b', fontWeight: '500' }}>{rubrica.porcentaje_evaluacion}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Criterios */}
                    <div className="criterios-evaluados" style={{ marginBottom: '30px' }}>
                        <div className="criterios-title-detalles" style={{ marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-tasks" style={{ color: '#3b82f6' }}></i> Desglose de Evaluación
                            </h4>
                        </div>
                        <div className="criterios-list-detalles" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {criterios.map(crit => {
                                const nivelSeleccionado = crit.niveles.find(n => n.seleccionado);
                                const puntajeDesc = nivelSeleccionado ? nivelSeleccionado.puntaje : 0;
                                return (
                                    <div key={crit.id} className="criterio-card-detalles" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <h5 style={{ margin: 0, color: '#1e293b', fontSize: '1em' }}>{crit.nombre}</h5>
                                            <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>{puntajeDesc} / {crit.puntaje_maximo} pts</div>
                                        </div>
                                        {nivelSeleccionado ? (
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                    <strong style={{ color: '#334155' }}>{nivelSeleccionado.nombre}</strong>
                                                </div>
                                                <div style={{ fontSize: '0.9em', color: '#64748b' }}>{nivelSeleccionado.descripcion}</div>
                                            </div>
                                        ) : (
                                            <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9em' }}>No evaluado</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Observaciones */}
                    {evaluacion.observaciones && (
                        <div className="observaciones-detalles" style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a', marginBottom: '30px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-comment"></i> Observaciones
                            </h4>
                            <p style={{ margin: 0, color: '#b45309', whiteSpace: 'pre-line' }}>{evaluacion.observaciones}</p>
                        </div>
                    )}

                    {/* Resumen */}
                    <div className="calificacion-final-detalles" style={{ background: '#1e293b', color: 'white', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.1em', fontWeight: '500' }}>Calificación Final</div>
                        <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
                            {((parseFloat(evaluacion.puntaje_total) / parseFloat(evaluacion.porcentaje_evaluacion)) * 100).toFixed(2)}<span style={{ fontSize: '0.5em', color: '#94a3b8' }}>/100  </span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer-detalles" style={{ background: '#f8fafc', padding: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <i className="fas fa-times" style={{ marginRight: '8px' }}></i> Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
