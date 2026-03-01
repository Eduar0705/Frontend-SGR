import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { rubricasService } from '../services/rubricas.service';
import Swal from 'sweetalert2';
import '../assets/css/home.css';
import '../assets/css/crearRubrica.css';

export default function CrearRubricas() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Estados para datos dinámicos
    const [tiposRubrica, setTiposRubrica] = useState([]);
    const [carreras, setCarreras] = useState([]);
    const [semestres, setSemestres] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [secciones, setSecciones] = useState([]);
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [loading, setLoading] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre_rubrica: '',
        tipo_rubrica: '',
        carrera: '',
        semestre: '',
        materia_codigo: '',
        seccion_id: '',
        evaluacion_id: '',
        fecha_evaluacion: '',
        porcentaje_evaluacion: 10,
        competencias: '',
        instrumentos: '',
        instrucciones: ''
    });

    const [criterios, setCriterios] = useState([]);

    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await rubricasService.getHierarchicalData();
            if (data.success) {
                setCarreras(data.carreras || []);
                setTiposRubrica(data.tiposRubrica || []);
            }
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            Swal.fire('Error', 'No se pudieron cargar los datos iniciales', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.id_rol !== 1 && user.id_rol !== 2) {
            navigate('/login');
        } else {
            loadInitialData();
        }
    }, [user, navigate, loadInitialData]);

    const distribuirPuntajes = () => {
        if (criterios.length === 0) return;

        const porcentajeTotal = parseFloat(formData.porcentaje_evaluacion) || 0;
        const puntajePorCriterio = Math.max(1, Math.floor((porcentajeTotal / criterios.length) * 100) / 100);

        setCriterios(prevCriterios => prevCriterios.map(criterio => {
            const nuevosNiveles = criterio.niveles.map((nivel, idx) => {
                const factor = (criterio.niveles.length - idx) / criterio.niveles.length;
                let puntaje = puntajePorCriterio * factor;
                puntaje = Math.max(0.25, Math.round(puntaje * 100) / 100);
                return { ...nivel, puntaje: puntaje.toFixed(2) };
            });
            return {
                ...criterio,
                puntaje_maximo: puntajePorCriterio.toFixed(2),
                niveles: nuevosNiveles
            };
        }));
    };

    const handleCarreraChange = async (e) => {
        const codigo = e.target.value;
        setFormData(prev => ({ ...prev, carrera: codigo, semestre: '', materia_codigo: '', seccion_id: '', evaluacion_id: '', fecha_evaluacion: '', porcentaje_evaluacion: 10 }));
        setSemestres([]); setMaterias([]); setSecciones([]); setEvaluaciones([]);
        if (codigo) {
            try {
                const data = await rubricasService.getSemestres(codigo);
                setSemestres(data);
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const handleSemestreChange = async (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, semestre: value, materia_codigo: '', seccion_id: '', evaluacion_id: '', fecha_evaluacion: '', porcentaje_evaluacion: 10 }));
        setMaterias([]); setSecciones([]); setEvaluaciones([]);
        if (value) {
            try {
                const data = await rubricasService.getMaterias(formData.carrera, value);
                setMaterias(data);
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const handleMateriaChange = async (e) => {
        const codigo = e.target.value;
        setFormData(prev => ({ ...prev, materia_codigo: codigo, seccion_id: '', evaluacion_id: '', fecha_evaluacion: '', porcentaje_evaluacion: 10 }));
        setSecciones([]); setEvaluaciones([]);
        if (codigo) {
            try {
                const data = await rubricasService.getSecciones(codigo, formData.carrera);
                setSecciones(data);
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const handleSeccionChange = async (e) => {
        const id = e.target.value;
        setFormData(prev => ({ ...prev, seccion_id: id, evaluacion_id: '', fecha_evaluacion: '', porcentaje_evaluacion: 10 }));
        setEvaluaciones([]);
        if (id) {
            try {
                const data = await rubricasService.getEvaluacionesPendientes(id);
                setEvaluaciones(data);
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const handleEvaluacionChange = (e) => {
        const id = e.target.value;
        const evaluacion = evaluaciones.find(ev => ev.evaluacion_id === parseInt(id));
        
        if (evaluacion) {
            setFormData(prev => ({
                ...prev,
                evaluacion_id: id,
                fecha_evaluacion: evaluacion.fecha_evaluacion ? new Date(evaluacion.fecha_evaluacion).toISOString().split('T')[0] : '',
                porcentaje_evaluacion: evaluacion.valor || 10
            }));
        } else {
            setFormData(prev => ({ ...prev, evaluacion_id: '', fecha_evaluacion: '', porcentaje_evaluacion: 10 }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const agregarCriterio = () => {
        const id = Date.now();
        const porcentaje = parseFloat(formData.porcentaje_evaluacion) || 10;
        const numActual = criterios.length + 1;
        const puntajeSugerido = Math.max(1, (porcentaje / numActual)).toFixed(2);

        const nuevoCriterio = {
            id,
            descripcion: '',
            puntaje_maximo: puntajeSugerido,
            orden: numActual,
            niveles: [
                { id: id + 1, nombre: 'Sobresaliente', puntaje: puntajeSugerido, descripcion: '', orden: 1 },
                { id: id + 2, nombre: 'Notable', puntaje: (puntajeSugerido * 0.8).toFixed(2), descripcion: '', orden: 2 },
                { id: id + 3, nombre: 'Aprobado', puntaje: (puntajeSugerido * 0.6).toFixed(2), descripcion: '', orden: 3 },
                { id: id + 4, nombre: 'Insuficiente', puntaje: Math.max(0.25, puntajeSugerido * 0.4).toFixed(2), descripcion: '', orden: 4 }
            ]
        };
        setCriterios([...criterios, nuevoCriterio]);
    };

    const eliminarCriterio = (id) => {
        if (criterios.length <= 1) {
            return Swal.fire('Atención', 'Debe mantener al menos un criterio', 'warning');
        }
        setCriterios(criterios.filter(c => c.id !== id));
    };

    const handleCriterioChange = (cId, field, value) => {
        setCriterios(criterios.map(c => c.id === cId ? { ...c, [field]: value } : c));
    };

    const agregarNivel = (cId) => {
        setCriterios(criterios.map(c => {
            if (c.id === cId) {
                const orden = c.niveles.length + 1;
                return {
                    ...c,
                    niveles: [...c.niveles, { id: Date.now(), nombre: '', puntaje: '0.25', descripcion: '', orden }]
                };
            }
            return c;
        }));
    };

    const eliminarNivel = (cId, nId) => {
        setCriterios(criterios.map(c => {
            if (c.id === cId) {
                if (c.niveles.length <= 1) {
                    Swal.fire('Atención', 'Cada criterio debe tener al menos un nivel', 'warning');
                    return c;
                }
                return { ...c, niveles: c.niveles.filter(n => n.id !== nId) };
            }
            return c;
        }));
    };

    const handleNivelChange = (cId, nId, field, value) => {
        setCriterios(criterios.map(c => {
            if (c.id === cId) {
                return {
                    ...c,
                    niveles: c.niveles.map(n => n.id === nId ? { ...n, [field]: value } : n)
                };
            }
            return c;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.evaluacion_id) return Swal.fire('Error', 'Debe seleccionar una evaluación', 'error');
        if (criterios.length === 0) return Swal.fire('Error', 'Agregue al menos un criterio', 'error');
        
        let sumaPuntajes = 0;
        for (const crit of criterios) {
            sumaPuntajes += parseFloat(crit.puntaje_maximo);
            if (!crit.descripcion.trim()){
                return Swal.fire('Error', 'Todos los criterios deben tener una descripción', 'error');
            }
        }

        const porcentajeTotal = parseFloat(formData.porcentaje_evaluacion);
        if (Math.abs(sumaPuntajes - porcentajeTotal) > 0.01) {
            return Swal.fire('Error', `La suma de puntajes (${sumaPuntajes.toFixed(2)}) debe ser igual al porcentaje total (${porcentajeTotal}%)`, 'error');
        }

        const rubricaData = {
            nombre_rubrica: formData.nombre_rubrica,
            id_evaluacion: formData.evaluacion_id,
            tipo_rubrica: formData.tipo_rubrica,
            instrucciones: formData.instrucciones,
            porcentaje: porcentajeTotal,
            criterios: criterios.map(c => ({
                descripcion: c.descripcion.trim(),
                puntaje_maximo: parseFloat(c.puntaje_maximo),
                orden: parseInt(c.orden),
                niveles: c.niveles.map(n => ({
                    nombre_nivel: n.nombre.trim(),
                    descripcion: n.descripcion.trim(),
                    puntaje: parseFloat(n.puntaje),
                    orden: parseInt(n.orden)
                }))
            }))
        };

        try {
            Swal.fire({ title: 'Guardando rúbrica', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const result = await rubricasService.saveRubrica(rubricaData);
            if (result.success) {
                Swal.fire('¡Éxito!', result.mensaje, 'success').then(() => navigate('/admin/rubricas'));
            } else {
                Swal.fire('Error', result.message || 'Error al guardar', 'error');
            }
        } catch {
            Swal.fire('Error', 'Error de conexión', 'error');
        }
    };

    if (!user) return null;

    return (
        <main className="crear-rubrica-container">
            <Menu user={user} />
            <div className="content-wrapper">
                <Header title="Diseñador de Rúbricas Premium" user={user} onLogout={() => navigate('/login')} />
                
                <div className="form-content-area">
                    <div className="rubrica-card-wrapper">
                        {/* HERO HEADER */}
                        <div className="rubrica-hero-header">
                            <div className="title-group">
                                <div className="hero-icon">
                                    <i className="fas fa-magic"></i>
                                </div>
                                <div>
                                    <h2>Creador de Rúbricas</h2>
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-content-area">
                            <form onSubmit={handleSubmit}>
                                {/* SECCIÓN 1: CONFIGURACIÓN */}
                                <div className="rubrica-section">
                                    <div className="section-label">
                                        <div className="number">1</div>
                                        <h3>Configuración General</h3>
                                    </div>
                                    <div className="premium-grid">
                                        <div className="premium-group">
                                            <label>Identificador de Rúbrica</label>
                                            <input type="text" name="nombre_rubrica" value={formData.nombre_rubrica} onChange={handleInputChange} className="premium-input" required placeholder="Ej: Rúbrica de Análisis Crítico Semestre I" />
                                        </div>
                                        <div className="premium-group">
                                            <label>Modelo de Aplicación</label>
                                            <select name="tipo_rubrica" value={formData.tipo_rubrica} onChange={handleInputChange} className="premium-select" required>
                                                <option value="">Seleccione el modelo...</option>
                                                {tiposRubrica.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="premium-group">
                                            <label>Estructura Académica (Carrera)</label>
                                            <select name="carrera" value={formData.carrera} onChange={handleCarreraChange} className="premium-select" required>
                                                <option value="">Seleccione carrera...</option>
                                                {carreras.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN 2: CONTEXTO */}
                                <div className="rubrica-section">
                                    <div className="section-label">
                                        <div className="number">2</div>
                                        <h3>Contexto de Aplicación</h3>
                                    </div>
                                    <div className="premium-grid">
                                        <div className="premium-group">
                                            <label>Periodo (Semestre)</label>
                                            <select name="semestre" value={formData.semestre} onChange={handleSemestreChange} className="premium-select" required disabled={!formData.carrera}>
                                                <option value="">Seleccione...</option>
                                                {semestres.map(s => <option key={s} value={s}>Semestre {s}</option>)}
                                            </select>
                                        </div>
                                        <div className="premium-group">
                                            <label>Unidad Curricular (Materia)</label>
                                            <select name="materia_codigo" value={formData.materia_codigo} onChange={handleMateriaChange} className="premium-select" required disabled={!formData.semestre}>
                                                <option value="">Seleccione...</option>
                                                {materias.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="premium-group">
                                            <label>Sección Académica</label>
                                            <select name="seccion_id" value={formData.seccion_id} onChange={handleSeccionChange} className="premium-select" required disabled={!formData.materia_codigo}>
                                                <option value="">Seleccione...</option>
                                                {secciones.map(s => <option key={s.id} value={s.id}>{s.codigo} ({s.lapso_academico})</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="highlight-context-zone">
                                        <div className="premium-group">
                                            <label>Evaluación Destino (Planificación Vigente)</label>
                                            <select name="evaluacion_id" value={formData.evaluacion_id} onChange={handleEvaluacionChange} className="premium-select" required disabled={!formData.seccion_id}>
                                                <option value="">Vincular con una evaluación planificada...</option>
                                                {evaluaciones.map(e => <option key={e.evaluacion_id} value={e.evaluacion_id}>{e.contenido_evaluacion} [{e.tipo_evaluacion}] — {e.valor}%</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="premium-group" style={{ marginTop: '25px' }}>
                                        <label>Guía de Aplicación (Instrucciones)</label>
                                        <textarea name="instrucciones" value={formData.instrucciones} onChange={handleInputChange} className="premium-input premium-textarea" placeholder="Escriba aquí las directrices para el evaluador o el estudiante..."></textarea>
                                    </div>
                                </div>

                                {/* SECCIÓN 3: CONSTRUCTOR DE CRITERIOS */}
                                <div className="rubrica-section">
                                    <div className="builder-header">
                                        <div className="section-label" style={{ marginBottom: 0 }}>
                                            <div className="number">3</div>
                                            <h3>Definición de Criterios y Desempeño</h3>
                                        </div>
                                        <div className="action-buttons">
                                            <div className="stats-pill">
                                                Balance: <strong>{criterios.reduce((acc, curr) => acc + parseFloat(curr.puntaje_maximo || 0), 0).toFixed(2)}</strong> / {formData.porcentaje_evaluacion}%
                                            </div>
                                            <button type="button" onClick={distribuirPuntajes} className="btn-premium-outline" title="Equilibrar pesos">
                                                <i className="fas fa-balance-scale"></i>
                                            </button>
                                            <button type="button" onClick={agregarCriterio} className="btn-premium-primary">
                                                <i className="fas fa-plus"></i>
                                                <span className="btn-text">Nuevo Criterio</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="criterios-timeline">
                                        {criterios.map((c, cIdx) => (
                                            <div key={c.id} className="criterio-card-premium">
                                                <div className="criterio-top-bar">
                                                    <div className="criterio-num">{cIdx + 1}</div>
                                                    <div className="criterio-input-wrapper">
                                                        <input type="text" value={c.descripcion} onChange={(e) => handleCriterioChange(c.id, 'descripcion', e.target.value)} className="title-input-ghost" placeholder="Defina el objetivo o criterio de evaluación..." required />
                                                    </div>
                                                    <div className="value-box-compact">
                                                        <span>VALOR</span>
                                                        <input type="number" value={c.puntaje_maximo} onChange={(e) => handleCriterioChange(c.id, 'puntaje_maximo', e.target.value)} step="0.01" required />
                                                    </div>
                                                    <div className="criterio-management">
                                                        <button type="button" onClick={() => agregarNivel(c.id)} className="btn-circles btn-circles-add" title="Añadir Nivel de Logro">
                                                            <i className="fas fa-plus"></i>
                                                        </button>
                                                        <button type="button" onClick={() => eliminarCriterio(c.id)} className="btn-circles btn-circles-delete" title="Remover Criterio">
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="niveles-scroller">
                                                    <div className="niveles-grid">
                                                        {c.niveles.map((n) => (
                                                            <div key={n.id} className="nivel-card-modern">
                                                                <div className="nivel-header-row">
                                                                    <input type="text" value={n.nombre} onChange={(e) => handleNivelChange(c.id, n.id, 'nombre', e.target.value)} placeholder="Ej: Excelente" className="nivel-name-input" required />
                                                                    <div className="pts-badge-input">
                                                                        <input type="number" value={n.puntaje} onChange={(e) => handleNivelChange(c.id, n.id, 'puntaje', e.target.value)} step="0.01" required />
                                                                        <span>pts</span>
                                                                    </div>
                                                                    <button type="button" onClick={() => eliminarNivel(c.id, n.id)} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', marginLeft: 'auto' }}>✕</button>
                                                                </div>
                                                                <textarea value={n.descripcion} onChange={(e) => handleNivelChange(c.id, n.id, 'descripcion', e.target.value)} placeholder="Describa las evidencias o indicadores de este nivel de logro..." className="nivel-desc-area" required></textarea>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {criterios.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.4 }}>
                                                <i className="fas fa-scroll" style={{ fontSize: '4rem', marginBottom: '20px' }}></i>
                                                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Inicie el diseño agregando su primer criterio</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* FOOTER ACTIONS */}
                                <div className="footer-actions">
                                    <button type="button" onClick={() => navigate('/admin/rubricas')} className="btn-premium-outline">
                                        Descartar cambios
                                    </button>
                                    <button type="submit" className="btn-premium-primary" disabled={loading}>
                                        <i className="fas fa-check-double"></i>
                                        Finalizar y Publicar Rúbrica
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
