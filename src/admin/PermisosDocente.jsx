import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { permisosService } from '../services/permisos.service';
import { docentesService } from '../services/docentes.service';
import Swal from 'sweetalert2';
import '../assets/css/permisos_docente.css';

import { useUI } from '../context/UIContext';

export default function PermisosDocente() {
    const { cedula } = useParams();
    const {periodoActual} = useUI();
    const navigate = useNavigate();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [docente, setDocente] = useState(null);
    const [permisos, setPermisos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para la cascada de selección
    const [carreras, setCarreras] = useState([]);
    const [semestres, setSemestres] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [secciones, setSecciones] = useState([]);

    const [selectedCarrera, setSelectedCarrera] = useState(null);
    const [selectedSemestre, setSelectedSemestre] = useState(null);
    const [selectedMateria, setSelectedMateria] = useState(null);
    const [selectedSeccion, setSelectedSeccion] = useState(null);

    const [loadingSteps, setLoadingSteps] = useState({
        carreras: false,
        semestres: false,
        materias: false,
        secciones: false
    });

    const cargarDatosDocente = useCallback(async () => {
        try {
            // Obtener info del docente (usamos getDocentes y filtramos por ahora, o podrías agregar getDocenteByCedula)
            const todos = await docentesService.getDocentes();
            const found = todos.find(d => d.cedula.toString() === cedula);
            if (!found) {
                Swal.fire('Error', 'Docente no encontrado', 'error');
                return navigate('/admin/profesores');
            }
            setDocente(found);

            // Obtener permisos
            const resPermisos = await permisosService.getPermisosByDocente(cedula);
            if (resPermisos.success) {
                setPermisos(resPermisos.data);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error al cargar datos', 'error');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    }, [cedula, navigate, setGlobalLoading]);

    const cargarCarreras = useCallback(async () => {
        setLoadingSteps(prev => ({ ...prev, carreras: true }));
        try {
            const res = await permisosService.getCarreras();
            console.log('Response from getCarreras:', res);
            
            // Manejar diferentes estructuras de respuesta
            let carrerasData = [];
            if (res.success && Array.isArray(res.data)) {
                carrerasData = res.data;
            } else if (Array.isArray(res)) {
                carrerasData = res;
            } else if (res.carreras && Array.isArray(res.carreras)) {
                carrerasData = res.carreras;
            }
            
            console.log('Carreras cargadas:', carrerasData);
            setCarreras(carrerasData);
        } catch (error) {
            console.error('Error al cargar carreras:', error);
        } finally {
            setLoadingSteps(prev => ({ ...prev, carreras: false }));
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!user || !token) {
            navigate('/login');
        } else {
            cargarDatosDocente();
            cargarCarreras();
        }
    }, [periodoActual, user, navigate, cargarDatosDocente, cargarCarreras]);

    // Handlers de Cascada
    const handleCarreraSelect = async (carrera) => {
        setSelectedCarrera(carrera);
        setSelectedSemestre(null);
        setSelectedMateria(null);
        setSelectedSeccion(null);
        setSemestres([]);
        setMaterias([]);
        setSecciones([]);

        setLoadingSteps(prev => ({ ...prev, semestres: true }));
        try {
            const res = await permisosService.getSemestres(carrera.codigo);
            console.log('Response from getSemestres:', res);
            // El backend devuelve un array simple [1, 2, 3...]
            const data = Array.isArray(res) ? res : (res?.data || []);
            setSemestres(data);
        } catch (error) {
            console.error('Error al cargar semestres:', error);
        } finally {
            setLoadingSteps(prev => ({ ...prev, semestres: false }));
        }
    };

    const handleSemestreSelect = async (semestre) => {
        setSelectedSemestre(semestre);
        setSelectedMateria(null);
        setSelectedSeccion(null);
        setMaterias([]);
        setSecciones([]);

        setLoadingSteps(prev => ({ ...prev, materias: true }));
        try {
            const res = await permisosService.getMaterias(selectedCarrera.codigo, semestre);
            console.log('Response from getMaterias:', res);
            const data = Array.isArray(res) ? res : (res?.data || []);
            setMaterias(data);
        } catch (error) {
            console.error('Error al cargar materias:', error);
        } finally {
            setLoadingSteps(prev => ({ ...prev, materias: false }));
        }
    };

    const handleMateriaSelect = async (materia) => {
        setSelectedMateria(materia);
        setSelectedSeccion(null);
        setSecciones([]);

        setLoadingSteps(prev => ({ ...prev, secciones: true }));
        try {
            const res = await permisosService.getSecciones(materia.codigo, selectedCarrera.codigo);
            console.log('Response from getSecciones:', res);
            const data = Array.isArray(res) ? res : (res?.data || []);
            setSecciones(data);
        } catch (error) {
            console.error('Error al cargar secciones:', error);
        } finally {
            setLoadingSteps(prev => ({ ...prev, secciones: false }));
        }
    };

    const handleSeccionSelect = (seccion) => {
        setSelectedSeccion(seccion);
    };

    const handleGuardarPermiso = async () => {
        if (!selectedSeccion) return;

        try {
            const res = await permisosService.createPermiso(cedula, selectedSeccion.id);
            if (res.success) {
                Swal.fire('Éxito', res.message, 'success');
                resetForm();
                cargarDatosDocente();
            } else {
                Swal.fire('Aviso', res.message, 'info');
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar el permiso', 'error');
            console.error(error)
        }
    };

    const handleDeletePermiso = (id) => {
        Swal.fire({
            title: '¿Eliminar permiso?',
            text: "El docente ya no tendrá acceso a esta sección.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await permisosService.deletePermiso(id);
                    if (res.success) {
                        Swal.fire('Eliminado', res.message, 'success');
                        cargarDatosDocente();
                    }
                } catch (error) {
                    Swal.fire('Error', 'No se pudo eliminar el permiso', 'error');
                    console.error(error)
                }
            }
        });
    };

    const resetForm = () => {
        setSelectedCarrera(null);
        setSelectedSemestre(null);
        setSelectedMateria(null);
        setSelectedSeccion(null);
        setSemestres([]);
        setMaterias([]);
        setSecciones([]);
    };

    if (loading || !docente) {
        return <div className="loading-overlay">Cargando...</div>;
    }

    return (
        <div className="home-container">
            <Menu user={user} />
            <div className="main-content">
                <Header title="Gestión de Permisos" user={user} onLogout={() => navigate('/')} />
                
                <div className="permisos-container">
                    <button className="back-btn" onClick={() => navigate('/admin/profesores')}>
                        <i className="fas fa-arrow-left"></i> Volver a Docentes
                    </button>

                    <div className="docente-badge">
                        <div className="avatar-placeholder">
                            {docente.nombre[0]}{docente.apellido[0]}
                        </div>
                        <div className="docente-details">
                            <h2>{docente.nombre} {docente.apellido}</h2>
                            <p><i className="fas fa-id-card"></i> {docente.cedula} | <i className="fas fa-graduation-cap"></i> {docente.especializacion}</p>
                        </div>
                    </div>

                    <div className="permissions-grid">
                        {/* LISTA DE PERMISOS ACTUALES */}
                        <div className="card-premium">
                            <h3 className="card-title">
                                <i className="fas fa-key"></i> Permisos Activos
                            </h3>
                            <div className="permisos-list">
                                {permisos.length > 0 ? (
                                    permisos.map(p => (
                                        <div key={p.id} className="permiso-item">
                                            <div className="permiso-info">
                                                <h4>{p.materia_nombre}</h4>
                                                <p>{p.carrera_nombre} | Semestre {p.semestre} | Sección {p.seccion_codigo}</p>
                                                <p style={{fontSize: '0.7rem', color: '#94a3b8'}}>Lapso: {p.lapso_academico}</p>
                                            </div>
                                            <button 
                                                className="btn-delete-permiso" 
                                                title="Eliminar Permiso"
                                                onClick={() => handleDeletePermiso(p.id)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <p>No hay permisos asignados.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AGREGAR NUEVO PERMISO */}
                        <div className="card-premium">
                            <h3 className="card-title">
                                <i className="fas fa-plus-circle"></i> Asignar Nueva Sección
                            </h3>
                            
                            <div className="assignment-form">
                                {/* PASO 1: CARRERA */}
                                <div className="step-container">
                                    <div className="step-header">
                                        <span className="step-number">1</span>
                                        <h4>Carrera</h4>
                                    </div>
                                    <div className="selection-grid">
                                        {loadingSteps.carreras ? (
                                            <div className="empty-state"><p><i className="fas fa-spinner fa-spin"></i> Cargando carreras...</p></div>
                                        ) : carreras.length > 0 ? (
                                            carreras.map(c => (
                                                <div 
                                                    key={c.codigo} 
                                                    className={`selection-card ${selectedCarrera?.codigo === c.codigo ? 'active' : ''}`}
                                                    onClick={() => handleCarreraSelect(c)}
                                                >
                                                    <strong>{c.codigo}</strong>
                                                    <span>{c.nombre}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state"><p>No se encontraron carreras disponibles.</p></div>
                                        )}
                                    </div>
                                </div>

                                {/* PASO 2: SEMESTRE */}
                                {selectedCarrera && (
                                    <div className="step-container animate-fade-in">
                                        <div className="step-header">
                                            <span className="step-number">2</span>
                                            <h4>Semestre</h4>
                                        </div>
                                        <div className="selection-grid">
                                            {semestres.map(s => (
                                                <div 
                                                    key={s} 
                                                    className={`selection-card ${selectedSemestre === s ? 'active' : ''}`}
                                                    onClick={() => handleSemestreSelect(s)}
                                                >
                                                    <strong>{s}°</strong>
                                                    <span>Semestre</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* PASO 3: MATERIA */}
                                {selectedSemestre && (
                                    <div className="step-container animate-fade-in">
                                        <div className="step-header">
                                            <span className="step-number">3</span>
                                            <h4>Materia</h4>
                                        </div>
                                        <div className="selection-grid">
                                            {materias.map(m => (
                                                <div 
                                                    key={m.codigo} 
                                                    className={`selection-card ${selectedMateria?.codigo === m.codigo ? 'active' : ''}`}
                                                    onClick={() => handleMateriaSelect(m)}
                                                >
                                                    <strong>{m.codigo}</strong>
                                                    <span>{m.nombre}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* PASO 4: SECCIÓN */}
                                {selectedMateria && (
                                    <div className="step-container animate-fade-in">
                                        <div className="step-header">
                                            <span className="step-number">4</span>
                                            <h4>Sección</h4>
                                        </div>
                                        <div className="selection-grid">
                                            {secciones.map(s => (
                                                <div 
                                                    key={s.id} 
                                                    className={`selection-card ${selectedSeccion?.id === s.id ? 'active' : ''}`}
                                                    onClick={() => handleSeccionSelect(s)}
                                                >
                                                    <strong>{s.codigo}</strong>
                                                    <span>{s.horario}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button 
                                        className="btn-add-permiso" 
                                        disabled={!selectedSeccion}
                                        onClick={handleGuardarPermiso}
                                    >
                                        <i className="fas fa-save"></i> Conceder Permiso
                                    </button>
                                    <button className="btn-reset" onClick={resetForm}>
                                        <i className="fas fa-undo"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
