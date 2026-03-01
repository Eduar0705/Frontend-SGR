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

export default function TeacherEvaluaciones() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [evaluacionesAgrupadas, setEvaluacionesAgrupadas] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCarreras, setExpandedCarreras] = useState({});
    
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
                                                                                <div key={ev.id} className="evaluacion-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                                                    <div className="evaluacion-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                                                                        <div className="evaluacion-student" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                                            <div className="student-avatar" style={{ background: '#3b82f6', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                                                                {ev.iniciales}
                                                                                            </div>
                                                                                            <div>
                                                                                                <div className="student-name" style={{ fontWeight: '600', color: '#1e293b' }}>
                                                                                                    {ev.estudiante_nombre} {ev.estudiante_apellido}
                                                                                                </div>
                                                                                                <div className="student-id" style={{ fontSize: '0.85em', color: '#64748b' }}>
                                                                                                    CI: {ev.estudiante_cedula}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <span className={`badge-status ${ev.estado === 'Completada' ? 'completed' : 'pending'}`} style={{ 
                                                                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.8em',
                                                                                            background: ev.estado === 'Completada' ? '#dcfce7' : '#fef3c7',
                                                                                            color: ev.estado === 'Completada' ? '#166534' : '#92400e'
                                                                                        }}>
                                                                                            {ev.estado}
                                                                                        </span>
                                                                                    </div>
                                                                                    
                                                                                    <div className="evaluacion-body" style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                                                                                        <div className="evaluacion-score" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                            <div className="score-label" style={{ color: '#64748b', fontSize: '0.9em' }}>Calificación</div>
                                                                                            <div className="score-value" style={{ fontWeight: 'bold', color: '#1e293b' }}>{ev.calificacion}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="evaluacion-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                                                                                        <span className="evaluacion-date" style={{ fontSize: '0.85em', color: '#64748b' }}>
                                                                                            <i className="fas fa-calendar" style={{ marginRight: '5px' }}></i>
                                                                                            {ev.fecha_formateada}
                                                                                        </span>
                                                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                                                            {ev.estado === 'Completada' ? (
                                                                                                <>
                                                                                                    <button onClick={() => { setSelectedEstudianteDetalles({idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula}); setShowDetalles(true); }} style={{ padding: '6px 10px', fontSize: '0.85em', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                                                                        Ver Detalles
                                                                                                    </button>
                                                                                                    <button onClick={() => { setSelectedEstudianteEvaluar({idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula}); setShowEvaluar(true); }} style={{ padding: '6px 10px', fontSize: '0.85em', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                                                                        <i className="fas fa-edit" style={{ marginRight: '5px' }}></i> Editar
                                                                                                    </button>
                                                                                                </>
                                                                                            ) : (
                                                                                                <button onClick={() => { setSelectedEstudianteEvaluar({idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula}); setShowEvaluar(true); }} style={{ padding: '6px 12px', fontSize: '0.85em', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                                                                    Evaluar
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
        </div>
    );
}
