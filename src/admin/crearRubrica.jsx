import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { rubricasService } from '../services/rubricas.service';
import Swal from 'sweetalert2';
import '../assets/css/home.css';
import '../assets/css/crearRubrica.css';

import { useUI } from '../context/UIContext';

export default function CrearRubricas() {
    const { periodoActual } = useUI();
    const navigate = useNavigate();
    const location = useLocation();
    const { setLoading: setGlobalLoading } = useUI();
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

    const [criterios, setCriterios] = useState([
        {
            id: 1,
            descripcion: '',
            puntaje_maximo: 10,
            orden: 1,
            niveles: [
                { id: 2, nombre: 'Sobresaliente', puntaje: 10, descripcion: '', orden: 1 },
                { id: 3, nombre: 'Notable', puntaje: 8, descripcion: '', orden: 2 },
                { id: 4, nombre: 'Aprobado', puntaje: 6, descripcion: '', orden: 3 },
                { id: 5, nombre: 'Insuficiente', puntaje: 0, descripcion: '', orden: 4 }
            ]
        }
    ]);

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
            setGlobalLoading(false);
        }
    }, [setGlobalLoading]);

    // --- MANEJO DE DATOS PRECARGADOS (DESDE EVALUACIONES) ---
    useEffect(() => {
        const preData = location.state?.preloaded;
        if (preData && user) {
            const handlePreloading = async () => {
                setLoading(true);
                try {
                    // 1. Cargar Semestres para la carrera pre-seleccionada
                    const resSem = await rubricasService.getSemestres(preData.carrera);
                    setSemestres(resSem);

                    // 2. Cargar Materias para carrera y semestre
                    const resMat = await rubricasService.getMaterias(preData.carrera, preData.semestre);
                    setMaterias(resMat);

                    // 3. Cargar Secciones para materia y carrera
                    const resSec = await rubricasService.getSecciones(preData.materia_codigo, preData.carrera);
                    setSecciones(resSec);

                    // 4. Cargar Evaluaciones para la sección
                    const resEval = await rubricasService.getEvaluacionesPendientes(preData.seccion_id);
                    setEvaluaciones(resEval);

                    // 5. Encontrar la evaluación específica para obtener su detalle
                    const targetEval = resEval.find(ev => String(ev.evaluacion_id) === String(preData.evaluacion_id));

                    // 6. Actualizar formData con todos los valores como strings para que los selects los reconozcan
                    const finalPorcentaje = targetEval?.valor || 10;
                    setFormData(prev => ({
                        ...prev,
                        carrera: String(preData.carrera),
                        semestre: String(preData.semestre),
                        materia_codigo: String(preData.materia_codigo),
                        seccion_id: String(preData.seccion_id),
                        evaluacion_id: String(preData.evaluacion_id),
                        fecha_evaluacion: targetEval?.fecha_evaluacion?.split('T')[0] || '',
                        porcentaje_evaluacion: finalPorcentaje
                    }));

                    // 7. Redistribuir el puntaje del criterio por defecto (u otros)
                    setCriterios(prev => redistribuirPuntajes(parseFloat(finalPorcentaje), prev));
                } catch (error) {
                    console.error("Error en preloading:", error);
                    Swal.fire('Error', 'No se pudieron precargar los datos de la evaluación', 'error');
                } finally {
                    setLoading(false);
                }
            };
            handlePreloading();
        }
    }, [location.state, user]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.id_rol !== 1 && user.id_rol !== 2) {
            navigate('/login');
        } else {
            loadInitialData();
        }
    }, [periodoActual, user, navigate, loadInitialData]);

    const redistribuirPuntajes = (porcentaje, listaCriterios) => {
        if (!listaCriterios.length) return [];
        
        const numCriterios = listaCriterios.length;
        const puntajeBase = Math.floor((porcentaje / numCriterios) * 1000) / 1000;
        const resto = parseFloat((porcentaje - (puntajeBase * numCriterios)).toFixed(3));

        return listaCriterios.map((c, idx) => {
            const nuevoMax = idx === numCriterios - 1 ? parseFloat((puntajeBase + resto).toFixed(3)) : puntajeBase;
            
            return {
                ...c,
                puntaje_maximo: nuevoMax.toFixed(3),
                niveles: c.niveles.map((n) => {
                    let nuevoPuntaje = n.puntaje;
                    if (n.nombre === 'Sobresaliente' || n.nombre === 'Excelente') nuevoPuntaje = nuevoMax;
                    else if (n.nombre === 'Notable') nuevoPuntaje = parseFloat((nuevoMax * 0.8).toFixed(3));
                    else if (n.nombre === 'Aprobado' || n.nombre === 'Regular') nuevoPuntaje = parseFloat((nuevoMax * 0.6).toFixed(3));
                    else if (n.nombre === 'Insuficiente' || n.nombre === 'Deficiente') nuevoPuntaje = 0;
                    
                    if (n.nombre !== 'Insuficiente' && n.nombre !== 'Deficiente' && nuevoPuntaje < 0.025) nuevoPuntaje = 0.025;
                    
                    return { ...n, puntaje: parseFloat(nuevoPuntaje).toFixed(3) };
                })
            };
        });
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
            const nuevoPorcentaje = evaluacion.valor || 10;
            const nuevosCriterios = redistribuirPuntajes(nuevoPorcentaje, criterios);
            setFormData(prev => ({
                ...prev,
                evaluacion_id: id,
                fecha_evaluacion: (evaluacion.fecha_evaluacion && !isNaN(new Date(evaluacion.fecha_evaluacion).getTime())) 
                    ? new Date(evaluacion.fecha_evaluacion).toISOString().split('T')[0] 
                    : '',
                porcentaje_evaluacion: nuevoPorcentaje
            }));
            setCriterios(nuevosCriterios);
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
        const nuevoCriterio = {
            id,
            descripcion: '',
            puntaje_maximo: 0,
            orden: criterios.length + 1,
            niveles: [
                { id: id + 1, nombre: 'Sobresaliente', puntaje: 0, descripcion: '', orden: 1 },
                { id: id + 2, nombre: 'Notable', puntaje: 0, descripcion: '', orden: 2 },
                { id: id + 3, nombre: 'Aprobado', puntaje: 0, descripcion: '', orden: 3 },
                { id: id + 4, nombre: 'Insuficiente', puntaje: 0, descripcion: '', orden: 4 }
            ]
        };
        const nuevosCriterios = redistribuirPuntajes(parseFloat(formData.porcentaje_evaluacion) || 10, [...criterios, nuevoCriterio]);
        setCriterios(nuevosCriterios);
    };

    const eliminarCriterio = (id) => {
        if (criterios.length <= 1) {
            return Swal.fire('Atención', 'Debe mantener al menos un criterio', 'warning');
        }
        const tempCriterios = criterios.filter(c => c.id !== id);
        const nuevosCriterios = redistribuirPuntajes(parseFloat(formData.porcentaje_evaluacion) || 10, tempCriterios);
        setCriterios(nuevosCriterios);
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
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Crear Nueva Rúbrica" user={user} onLogout={() => navigate('/login')} />
                
                <div style={{ padding: '30px' }}>
                    <div className="card" style={{ borderRadius: '5px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '30px' }}>
                        <form onSubmit={handleSubmit}>
                            {/* Encabezado */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Nombre de la Rúbrica *</label>
                                    <input type="text" name="nombre_rubrica" value={formData.nombre_rubrica} onChange={handleInputChange} className="form-input" required placeholder="Ej: Rúbrica de Proyecto Final" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Tipo de Rúbrica *</label>
                                    <select name="tipo_rubrica" value={formData.tipo_rubrica} onChange={handleInputChange} className="form-select" required>
                                        <option value="">Seleccione tipo</option>
                                        {tiposRubrica.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Selectores en Cascada */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Carrera</label>
                                    <select name="carrera" value={formData.carrera} onChange={handleCarreraChange} className="form-select" disabled={!!location.state?.preloaded}>
                                        <option value="">Seleccione carrera</option>
                                        {carreras.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Semestre</label>
                                    <select name="semestre" value={formData.semestre} onChange={handleSemestreChange} className="form-select" disabled={!semestres.length || !!location.state?.preloaded}>
                                        <option value="">Seleccione semestre</option>
                                        {semestres.map(s => <option key={s} value={s}>Semestre {s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Materia</label>
                                    <select name="materia_codigo" value={formData.materia_codigo} onChange={handleMateriaChange} className="form-select" disabled={!materias.length || !!location.state?.preloaded}>
                                        <option value="">Seleccione materia</option>
                                        {materias.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sección</label>
                                    <select name="seccion_id" value={formData.seccion_id} onChange={handleSeccionChange} className="form-select" disabled={!secciones.length || !!location.state?.preloaded}>
                                        <option value="">Seleccione sección</option>
                                        {secciones.map(s => <option key={s.id} value={s.id}>{s.codigo} ({s.lapso_academico})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Evaluación</label>
                                    <select name="evaluacion_id" value={formData.evaluacion_id} onChange={handleEvaluacionChange} className="form-select" required disabled={!evaluaciones.length || !!location.state?.preloaded}>
                                        <option value="">Seleccione evaluación</option>
                                        {evaluaciones.map(e => <option key={e.evaluacion_id} value={e.evaluacion_id}>{e.contenido_evaluacion} ({e.valor}%)</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Instrucciones */}
                            <div style={{ marginBottom: '30px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Instrucciones Generales</label>
                                <textarea name="instrucciones" className="form-textarea" rows="3" value={formData.instrucciones} onChange={handleInputChange} placeholder="Instrucciones para el estudiante..."></textarea>
                            </div>

                            {/* Criterios */}
                            <div className="criterios-container">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '10px', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, color: '#1e3a8a' }}>Criterios de Evaluación</h3>
                                    <button type="button" onClick={agregarCriterio} className="btns" style={{ background: '#10b981', color: 'white', padding: '8px 15px', borderRadius: '8px', fontSize: '0.9rem' }}>
                                        <i className="fas fa-plus"></i> Agregar Criterio
                                    </button>
                                </div>

                                {criterios.map((c, cIdx) => (
                                    <div key={c.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px', position: 'relative' }}>
                                        <button type="button" onClick={() => eliminarCriterio(c.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar criterio">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                        
                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingRight: '40px' }}>
                                            <input type="text" placeholder="Descripción del criterio (Ej: Dominio del tema)" value={c.descripcion} onChange={(e) => handleCriterioChange(c.id, 'descripcion', e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                                            <input type="number" step="0.001" placeholder="Pts" value={c.puntaje_maximo} onChange={(e) => handleCriterioChange(c.id, 'puntaje_maximo', e.target.value)} style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required disabled />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                            {c.niveles.map((n, nIdx) => (
                                                <div key={n.id} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                    <input type="text" value={n.nombre} onChange={(e) => handleNivelChange(c.id, n.id, 'nombre', e.target.value)} style={{ fontWeight: 'bold', border: 'none', background: 'transparent', width: '100%', marginBottom: '5px', color: '#475569' }} placeholder="Nivel" />
                                                    <textarea value={n.descripcion} onChange={(e) => handleNivelChange(c.id, n.id, 'descripcion', e.target.value)} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.85rem', padding: '8px', marginBottom: '5px', resize: 'vertical' }} rows="3" placeholder="Descripción del nivel..." />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <input type="number" value={n.puntaje} onChange={(e) => handleNivelChange(c.id, n.id, 'puntaje', e.target.value)} style={{ width: '60px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px', fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 'bold' }} placeholder="0" />
                                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>pts</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '25px', marginTop: '30px' }}>
                                <button type="button" onClick={() => navigate('/admin/rubricas')} className="btns" style={{ background: '#94a3b8', color: 'white', padding: '12px 30px', borderRadius: '10px' }}>Cancelar</button>
                                <button type="submit" className="btns" style={{ background: '#1e3a8a', color: 'white', padding: '12px 45px', borderRadius: '10px', fontWeight: 'bold' }} disabled={loading}>
                                    <i className="fas fa-save" style={{ marginRight: '8px' }}></i> {loading ? 'Guardando...' : 'Guardar Rúbrica'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
