import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Menu from '../components/menu';
import Swal from 'sweetalert2';
import { evaluacionesService } from '../services/evaluaciones.service';
import '../assets/css/evaluacion.css';

// Componentes internos (modales) se pueden poner aquí mismo por simplicidad por ahora
import ModalEvaluar from './components/ModalEvaluar';
import ModalVerDetalles from './components/ModalVerDetalles';
import ModalAddEvaluacion from './components/ModalAddEvaluacion';

import { useUI } from '../context/UIContext';

export default function TeacherEvaluaciones() {
    const navigate = useNavigate();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [evaluacionesAgrupadas, setEvaluacionesAgrupadas] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCarreras, setExpandedCarreras] = useState({});
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    // Estados para Modales
    const [showEvaluar, setShowEvaluar] = useState(false);
    const [selectedEstudianteEvaluar, setSelectedEstudianteEvaluar] = useState(null); // { idEvaluacion, cedula }

    const [showDetalles, setShowDetalles] = useState(false);
    const [selectedEstudianteDetalles, setSelectedEstudianteDetalles] = useState(null);

    const [showAddEvaluacion, setShowAddEvaluacion] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchEvaluaciones();
    }, [user, navigate]);

    const fetchEvaluaciones = async () => {
        setLoading(true);
        try {
            const evals = await evaluacionesService.getTeacherEvaluaciones();
            agruparEvaluaciones(evals);
        } catch (error) {
            console.error('Error fetching evaluaciones:', error);
            Swal.fire('Error', 'No se pudieron cargar las evaluaciones', 'error');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    };

    const agruparEvaluaciones = (evaluacionesFormateadas) => {
        const agrupadas = {};
        
        evaluacionesFormateadas.forEach(ev => {
            if (!agrupadas[ev.carrera_nombre]) {
                agrupadas[ev.carrera_nombre] = {};
            }
            const semestreKey = `Semestre ${ev.materia_semestre}`;
            if (!agrupadas[ev.carrera_nombre][semestreKey]) {
                agrupadas[ev.carrera_nombre][semestreKey] = {};
            }
            if (!agrupadas[ev.carrera_nombre][semestreKey][ev.materia_nombre]) {
                agrupadas[ev.carrera_nombre][semestreKey][ev.materia_nombre] = {};
            }
            const seccionKey = `Sección ${ev.seccion_codigo}`;
            if (!agrupadas[ev.carrera_nombre][semestreKey][ev.materia_nombre][seccionKey]) {
                agrupadas[ev.carrera_nombre][semestreKey][ev.materia_nombre][seccionKey] = {
                    info: { horario: ev.seccion_horario, aula: ev.seccion_aula },
                    rubricas: {}
                };
            }
            if (!agrupadas[ev.carrera_nombre][semestreKey][ev.materia_nombre][seccionKey].rubricas[ev.nombre_rubrica]) {
                agrupadas[ev.carrera_nombre][semestreKey][ev.materia_nombre][seccionKey].rubricas[ev.nombre_rubrica] = [];
            }
            agrupadas[ev.carrera_nombre][semestreKey][ev.materia_nombre][seccionKey].rubricas[ev.nombre_rubrica].push(ev);
        });

        setEvaluacionesAgrupadas(agrupadas);
        // Expandir por defecto la primera carrera si existe
        if (Object.keys(agrupadas).length > 0) {
            setExpandedCarreras({ [Object.keys(agrupadas)[0]]: true });
        }
    };

    const toggleCarrera = (carrera) => {
        setExpandedCarreras(prev => ({ ...prev, [carrera]: !prev[carrera] }));
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#3b82f6' }}></i>
                    <p style={{ marginTop: '10px', color: '#64748b' }}>Cargando evaluaciones...</p>
                </div>
            );
        }

        if (Object.keys(evaluacionesAgrupadas).length === 0) {
            return (
                <div className="empty-state" style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>
                    <i className="fas fa-clipboard-list" style={{ fontSize: '3em', color: '#94a3b8', marginBottom: '15px' }}></i>
                    <h3>No hay evaluaciones registradas</h3>
                    <p style={{ color: '#64748b' }}>Aún no se han asignado evaluaciones a los estudiantes.</p>
                </div>
            );
        }

        return (
            <div className="hierarchy-container">
                {Object.keys(evaluacionesAgrupadas).map(carrera => {
                    const isExpanded = expandedCarreras[carrera];
                    return (
                        <div key={carrera} className="carrera-block" style={{ marginBottom: '20px', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <h2 
                                className="carrera-title" 
                                onClick={() => toggleCarrera(carrera)}
                                style={{ 
                                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', 
                                    background: '#f1f5f9', padding: '15px 20px', margin: 0, 
                                    color: '#1e293b', fontSize: '1.2em' 
                                }}
                            >
                                <span><i className="fas fa-graduation-cap" style={{ marginRight: '10px' }}></i> {carrera}</span>
                                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} toggle-icon`}></i>
                            </h2>

                            {isExpanded && (
                                <div className="carrera-content" style={{ padding: '20px' }}>
                                    {Object.keys(evaluacionesAgrupadas[carrera]).map(semestre => (
                                        <div key={semestre} className="semestre-block" style={{ marginBottom: '20px' }}>
                                            <h3 className="semestre-title" style={{ color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px' }}>{semestre}</h3>
                                            
                                            {Object.keys(evaluacionesAgrupadas[carrera][semestre]).map(materia => (
                                                <div key={materia} className="materia-block" style={{ marginLeft: '15px', marginBottom: '20px' }}>
                                                    <h4 className="materia-title" style={{ color: '#0f172a', marginBottom: '12px' }}>
                                                        <i className="fas fa-book" style={{ marginRight: '8px', color: '#3b82f6' }}></i> {materia}
                                                    </h4>

                                                    {Object.keys(evaluacionesAgrupadas[carrera][semestre][materia]).map(seccion => {
                                                        const seccionData = evaluacionesAgrupadas[carrera][semestre][materia][seccion];
                                                        return (
                                                            <div key={seccion} className="seccion-block" style={{ marginLeft: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                                                <div className="seccion-header-info" style={{ display: 'flex', gap: '15px', fontSize: '0.9em', color: '#64748b', marginBottom: '15px' }}>
                                                                    <strong style={{ color: '#334155' }}>{seccion}</strong>
                                                                    <span><i className="fas fa-clock" style={{ marginRight: '5px' }}></i> {seccionData.info.horario}</span>
                                                                    <span><i className="fas fa-map-marker-alt" style={{ marginRight: '5px' }}></i> {seccionData.info.aula}</span>
                                                                </div>

                                                                {Object.keys(seccionData.rubricas).map(rubrica => (
                                                                    <div key={rubrica} className="rubrica-block" style={{ marginTop: '15px' }}>
                                                                        <h5 className="rubrica-title" style={{ color: '#475569', fontSize: '1em', marginBottom: '10px' }}>
                                                                            <i className="fas fa-clipboard-check" style={{ marginRight: '8px', color: '#10b981' }}></i> {rubrica}
                                                                        </h5>

                                                                        <div className="evaluaciones-grid-mini" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                                                                            {seccionData.rubricas[rubrica].filter(ev => {
                                                                                if (!searchTerm) return true;
                                                                                const fullName = `${ev.estudiante_nombre} ${ev.estudiante_apellido}`.toLowerCase();
                                                                                return fullName.includes(searchTerm) || ev.estudiante_cedula.includes(searchTerm);
                                                                            }).map(ev => (
                                                                                <div key={ev.id} className="evaluacion-card" style={{ 
                                                                                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', 
                                                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', 
                                                                                    position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '15px' 
                                                                                }}>
                                                                                    {/* Ribbon Banner */}
                                                                                    <div style={{
                                                                                        position: 'absolute', top: '12px', right: '-35px', background: ev.estado === 'Completada' ? '#10b981' : '#f59e0b',
                                                                                        color: 'white', padding: '5px 40px', fontSize: '0.75em', fontWeight: 'bold',
                                                                                        transform: 'rotate(45deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 1
                                                                                    }}>
                                                                                        {ev.estado}
                                                                                    </div>

                                                                                    <div className="evaluacion-header-info">
                                                                                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2em', color: '#1e293b', fontWeight: 'bold', textTransform: 'uppercase' }}>{ev.materia_nombre}</h4>
                                                                                        <div style={{ color: '#3b82f6', fontSize: '0.9em', fontWeight: '500' }}>{ev.materia_codigo} {ev.seccion_codigo}</div>
                                                                                    </div>

                                                                                    <div className="student-box" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                        <div style={{ color: '#64748b' }}><i className="fas fa-user"></i></div>
                                                                                        <div style={{ color: '#2563eb', fontWeight: '500' }}>{ev.estudiante_nombre} {ev.estudiante_apellido}</div>
                                                                                    </div>

                                                                                    <div className="evaluacion-comment" style={{ color: '#64748b', fontSize: '0.95em', minHeight: '1.4em' }}>
                                                                                        {ev.observaciones || 'Sin observaciones adicionales'}
                                                                                    </div>
                                                                                    
                                                                                    <div className="evaluacion-stats" style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                                                                        <div style={{ textAlign: 'left' }}>
                                                                                            <span style={{ fontSize: '0.75em', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Ponderación</span>
                                                                                            <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.1em' }}>{ev.porcentaje_evaluacion || 10}%</div>
                                                                                        </div>
                                                                                        <div style={{ textAlign: 'right' }}>
                                                                                            <span style={{ fontSize: '0.75em', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Progreso</span>
                                                                                            <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.1em' }}>{ev.estado === 'Completada' ? '1/1' : '0/1'}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="evaluacion-footer" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85em' }}>
                                                                                            <span><i className="fas fa-calendar-alt"></i> {ev.fecha_formateada}</span>
                                                                                            <span><i className="fas fa-clock"></i> Sección</span>
                                                                                        </div>
                                                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                                                            {ev.estado === 'Completada' ? (
                                                                                                <>
                                                                                                    <button 
                                                                                                        onClick={(e) => { 
                                                                                                            e.stopPropagation();
                                                                                                            setIsActionLoading(true);
                                                                                                            setSelectedEstudianteEvaluar({idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula}); 
                                                                                                            setTimeout(() => { setIsActionLoading(false); setShowEvaluar(true); }, 800);
                                                                                                        }} 
                                                                                                        style={{ flex: 1, padding: '10px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                                                                        className="btn-card-action"
                                                                                                        title="Editar Evaluación"
                                                                                                    >
                                                                                                        <i className="fas fa-edit"></i>
                                                                                                    </button>
                                                                                                    <button 
                                                                                                        onClick={(e) => { 
                                                                                                            e.stopPropagation();
                                                                                                            setIsActionLoading(true);
                                                                                                            setSelectedEstudianteDetalles({idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula}); 
                                                                                                            setTimeout(() => { setIsActionLoading(false); setShowDetalles(true); }, 800);
                                                                                                        }} 
                                                                                                        style={{ flex: 1, padding: '10px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                                                                        className="btn-card-action"
                                                                                                        title="Ver Detalles"
                                                                                                    >
                                                                                                        <i className="fas fa-eye"></i>
                                                                                                    </button>
                                                                                                    <button 
                                                                                                        style={{ flex: 1, padding: '10px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', opacity: 0.6 }}
                                                                                                        title="Estadísticas (Próximamente)"
                                                                                                    >
                                                                                                        <i className="fas fa-chart-line"></i>
                                                                                                    </button>
                                                                                                </>
                                                                                            ) : (
                                                                                                <button 
                                                                                                    onClick={(e) => { 
                                                                                                        e.stopPropagation();
                                                                                                        setIsActionLoading(true);
                                                                                                        setSelectedEstudianteEvaluar({idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula}); 
                                                                                                        setTimeout(() => { setIsActionLoading(false); setShowEvaluar(true); }, 800);
                                                                                                    }} 
                                                                                                    style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                                                                >
                                                                                                    <i className="fas fa-clipboard-check"></i> Evaluar Estudiante
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!user) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Menu user={user} />
            <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header title="Mis Evaluaciones" user={user} onLogout={() => navigate('/login')} />
                
                <div style={{ padding: '30px' }}>
                    <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div className="search-box" style={{ position: 'relative', width: '300px' }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}></i>
                            <input 
                                type="text" 
                                placeholder="Buscar Alumno (Nombre o CI)..." 
                                value={searchTerm}
                                onChange={handleSearchChange}
                                style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
                            />
                        </div>
                        
                        <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={fetchEvaluaciones} style={{ padding: '10px 15px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Actualizar">
                                <i className="fas fa-sync-alt"></i>
                            </button>
                            <button onClick={() => setShowAddEvaluacion(true)} style={{ padding: '10px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                                <i className="fas fa-plus"></i> Nueva Evaluación
                            </button>
                        </div>
                    </div>

                    {renderContent()}
                </div>

                {/* Overlay de Carga Global para Acciones */}
                {isActionLoading && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999, transition: 'all 0.3s ease'
                    }}>
                        <div style={{
                            background: 'white', padding: '30px 50px', borderRadius: '16px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center'
                        }}>
                            <i className="fas fa-circle-notch fa-spin fa-3x" style={{ color: '#3b82f6', marginBottom: '15px' }}></i>
                            <h3 style={{ margin: 0, color: '#1e293b' }}>Cargando información...</h3>
                            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9em' }}>Por favor, espere un momento</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Modales */}
            {showEvaluar && selectedEstudianteEvaluar && (
                <ModalEvaluar 
                    data={selectedEstudianteEvaluar} 
                    onClose={() => setShowEvaluar(false)} 
                    onSaved={() => { setShowEvaluar(false); fetchEvaluaciones(); }}
                />
            )}

            {showDetalles && selectedEstudianteDetalles && (
                <ModalVerDetalles 
                    data={selectedEstudianteDetalles} 
                    onClose={() => setShowDetalles(false)} 
                />
            )}

            {showAddEvaluacion && (
                <ModalAddEvaluacion 
                    onClose={() => setShowAddEvaluacion(false)} 
                    onSaved={() => { setShowAddEvaluacion(false); fetchEvaluaciones(); }}
                />
            )}

            {/* Overlay de Carga Global para Acciones (Ubicado al final para asegurar z-index) */}
            {isActionLoading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2147483647, transition: 'all 0.3s ease'
                }}>
                    <div style={{
                        background: 'white', padding: '40px 60px', borderRadius: '24px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)', textAlign: 'center',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px',
                        minWidth: '300px'
                    }}>
                        <div className="loader-container-uiverse">
                            <div className="loader">
                                <div className="justify-content-center jimu-primary-loading"></div>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.4em', fontWeight: 'bold' }}>Procesando...</h3>
                            <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '1em' }}>Espere un momento por favor</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
