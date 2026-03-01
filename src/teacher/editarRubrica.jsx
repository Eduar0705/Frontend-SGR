import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Menu from '../components/menu';
import Header from '../components/header';
import { teacherRubricasService } from '../services/teacherRubricas.service';
import '../assets/css/home.css';
import '../assets/css/crearRubrica.css';

import { useUI } from '../context/UIContext';

export default function TeacherEditarRubrica() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Form data arrays
    const [carreras, setCarreras] = useState([]);
    const [tiposRubrica, setTiposRubrica] = useState([]);
    const [semestres, setSemestres] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [secciones, setSecciones] = useState([]);
    const [evaluaciones, setEvaluaciones] = useState([]);

    // Form states
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
        instrucciones: ''
    });

    // Criterios & Niveles
    const [criterios, setCriterios] = useState([
        {
            id: 1,
            descripcion: '',
            puntaje_maximo: 10,
            orden: 1,
            niveles: [
                { id: 1, nombre_nivel: 'Sobresaliente', descripcion: '', puntaje: 10, orden: 1 },
                { id: 2, nombre_nivel: 'Notable', descripcion: '', puntaje: 8, orden: 2 },
                { id: 3, nombre_nivel: 'Aprobado', descripcion: '', puntaje: 6, orden: 3 },
                { id: 4, nombre_nivel: 'Insuficiente', descripcion: '', puntaje: 4, orden: 4 }
            ]
        }
    ]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        loadInitialData();
    }, [user, navigate]);

    useEffect(() => {
        redistribuirPuntajes();
    }, [formData.porcentaje_evaluacion, criterios.length]);

    const loadInitialData = async () => {
        try {
            const data = await teacherRubricasService.getFormData();
            setCarreras(data.carreras || []);
            setTiposRubrica(data.tipos || []);
            
            // Load the rubric data to be edited
            const editData = await teacherRubricasService.getRubricaForEdit(id);
            if (!editData.success) throw new Error(editData.message || 'Error al cargar rúbrica');
            
            const r = editData.rubrica;
            
            // Pre-load the cascade selects
            const sems = await teacherRubricasService.getSemestres(r.carrera_id || r.seccion_codigo.split('-')[0]); // Fallback info if carrera_id not there directly
            
            // Note: The backend getRubricaForEdit provides `r.materia_codigo`, `r.seccion_id`, etc.
            // We need to fetch the dropdown items just like when changing them
            // Usually, getRubricaForEdit gives us enough context, but extracting carrera from seccion_codigo format:
            const parts = r.seccion_codigo.split('-');
            const carrera_id = parts[0];
            const secParts = parts[1].split(' ');
            const semestreCalculado = '1'; // Actually we don't have semestre in the rubric directly, let's just fetch everything based on what we have or accept it's prefilled and disabled.
            // Actually, in edit mode, changing seccion/materia is risky. For simplicity, we can just load the exact options OR lock the top-level cascade.
            // Let's load the cascade correctly if possible, or leave it locked.
            // Since editing the assignment metadata might be rare, we'll allow editing the rubric details mostly, but we do need to populate formData.

            setFormData({
                nombre_rubrica: r.nombre_rubrica,
                tipo_rubrica: r.id_tipo,
                carrera: carrera_id,
                semestre: '', // It doesn't matter much if we don't know it, we just display the current seccion
                materia_codigo: r.materia_codigo,
                seccion_id: r.seccion_id,
                evaluacion_id: r.evaluacion_id,
                fecha_evaluacion: r.fecha_evaluacion ? r.fecha_evaluacion.split('T')[0] : '',
                porcentaje_evaluacion: r.porcentaje_evaluacion,
                competencias: r.competencias || '',
                instrucciones: r.instrucciones || ''
            });

            // We mock the dropdowns just with the selected item so it looks correct without full cascade loading
            setCarreras(prev => prev.some(c => c.codigo == carrera_id) ? prev : [...prev, {codigo: carrera_id, nombre: carrera_id}]);
            setSemestres([r.lapse_academico]);
            setFormData(prev => ({...prev, semestre: r.lapse_academico}));
            setMaterias([{codigo: r.materia_codigo, nombre: r.materia_nombre}]);
            setSecciones([{id: r.seccion_id, letra: r.seccion_codigo.split(' ')[1], codigo_periodo: r.lapse_academico}]);
            setEvaluaciones([{id: r.evaluacion_id, fecha_evaluacion: r.fecha_evaluacion, ponderacion: r.porcentaje_evaluacion}]);

            if (editData.criterios && editData.criterios.length > 0) {
                setCriterios(editData.criterios.map(c => ({
                    ...c,
                    niveles: c.niveles.map(n => ({...n, id: n.id || Math.random(), puntaje: n.puntaje}))
                })));
            }
        } catch (error) {
            Swal.fire('Error', error.message || 'No se pudieron cargar los datos iniciales', 'error');
            navigate('/teacher/rubricas');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    };

    // --- Cascade Handlers ---
    const handleChange = async (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'carrera') {
            setFormData(prev => ({ ...prev, semestre: '', materia_codigo: '', seccion_id: '', evaluacion_id: '', competencias: '', fecha_evaluacion: '' }));
            setSemestres([]); setMaterias([]); setSecciones([]); setEvaluaciones([]);
            if (value) {
                const sems = await teacherRubricasService.getSemestres(value);
                setSemestres(sems);
            }
        } 
        else if (name === 'semestre') {
            setFormData(prev => ({ ...prev, materia_codigo: '', seccion_id: '', evaluacion_id: '', competencias: '', fecha_evaluacion: '' }));
            setMaterias([]); setSecciones([]); setEvaluaciones([]);
            if (value) {
                const mats = await teacherRubricasService.getMaterias(formData.carrera, value);
                setMaterias(mats);
            }
        }
        else if (name === 'materia_codigo') {
            setFormData(prev => ({ ...prev, seccion_id: '', evaluacion_id: '', competencias: '', fecha_evaluacion: '' }));
            setSecciones([]); setEvaluaciones([]);
            if (value) {
                const secs = await teacherRubricasService.getSecciones(value);
                setSecciones(secs);
            }
        }
        else if (name === 'seccion_id') {
            setFormData(prev => ({ ...prev, evaluacion_id: '', competencias: '', fecha_evaluacion: '' }));
            setEvaluaciones([]);
            if (value) {
                const evals = await teacherRubricasService.getEvaluaciones(value);
                setEvaluaciones(evals);
            }
        }
        else if (name === 'evaluacion_id') {
            const ev = evaluaciones.find(x => String(x.id) === String(value));
            if (ev) {
                setFormData(prev => ({
                    ...prev,
                    fecha_evaluacion: ev.fecha_evaluacion ? ev.fecha_evaluacion.split('T')[0] : '',
                    porcentaje_evaluacion: ev.ponderacion || 10,
                    competencias: ev.competencias || ''
                }));
            }
        }
    };

    // --- Dynamic Form Logic ---
    const redistribuirPuntajes = () => {
        if (!criterios.length) return;
        const totalPorcentaje = parseFloat(formData.porcentaje_evaluacion) || 10;
        
        const numCriterios = criterios.length;
        const puntajeBase = Math.floor((totalPorcentaje / numCriterios) * 1000) / 1000;
        const resto = parseFloat((totalPorcentaje - (puntajeBase * numCriterios)).toFixed(3));

        setCriterios(prevCriterios => prevCriterios.map((c, idx) => {
            const nuevoMax = idx === numCriterios - 1 ? parseFloat((puntajeBase + resto).toFixed(3)) : puntajeBase;
            
            return {
                ...c,
                puntaje_maximo: nuevoMax.toFixed(3),
                niveles: c.niveles.map((n) => {
                    let nuevoPuntaje = n.puntaje;
                    const nombre = n.nombre_nivel;
                    
                    if (nombre === 'Excelente' || nombre === 'Sobresaliente') nuevoPuntaje = nuevoMax;
                    else if (nombre === 'Notable') nuevoPuntaje = parseFloat((nuevoMax * 0.8).toFixed(3));
                    else if (nombre === 'Regular' || nombre === 'Aprobado') nuevoPuntaje = parseFloat((nuevoMax * 0.6).toFixed(3));
                    else if (nombre === 'Deficiente' || nombre === 'Insuficiente') nuevoPuntaje = 0;
                    
                    if (nombre !== 'Deficiente' && nombre !== 'Insuficiente' && nuevoPuntaje < 0.025) nuevoPuntaje = 0.025;
                    
                    return { ...n, puntaje: parseFloat(nuevoPuntaje).toFixed(3) };
                })
            };
        }));
    };

    const addCriterio = () => {
        const id = Date.now();
        const nuevoCriterio = {
            id,
            descripcion: '',
            puntaje_maximo: 0,
            orden: criterios.length + 1,
            niveles: [
                { id: id + 1, nombre_nivel: 'Sobresaliente', descripcion: '', puntaje: 0, orden: 1 },
                { id: id + 2, nombre_nivel: 'Notable', descripcion: '', puntaje: 0, orden: 2 },
                { id: id + 3, nombre_nivel: 'Aprobado', descripcion: '', puntaje: 0, orden: 3 },
                { id: id + 4, nombre_nivel: 'Insuficiente', descripcion: '', puntaje: 0, orden: 4 }
            ]
        };
        setCriterios(prev => [...prev, nuevoCriterio]);
    };

    const removeCriterio = (id) => {
        if (criterios.length <= 1) {
            Swal.fire('Advertencia', 'Debe mantener al menos un criterio', 'warning');
            return;
        }
        setCriterios(prev => prev.filter(c => c.id !== id));
    };

    const updateCriterio = (criterioId, field, value) => {
        setCriterios(prev => prev.map(c => c.id === criterioId ? { ...c, [field]: value } : c));
    };

    const addNivel = (criterioId) => {
        setCriterios(prev => prev.map(c => {
            if (c.id === criterioId) {
                return {
                    ...c,
                    niveles: [
                        ...c.niveles,
                        { id: Date.now(), nombre_nivel: 'Nuevo Nivel', descripcion: '', puntaje: 1, orden: c.niveles.length + 1 }
                    ]
                };
            }
            return c;
        }));
        redistribuirPuntajes();
    };

    const removeNivel = (criterioId, nivelId) => {
        setCriterios(prev => prev.map(c => {
            if (c.id === criterioId) {
                if (c.niveles.length <= 1) {
                    Swal.fire('Advertencia', 'Cada criterio debe tener al menos un nivel', 'warning');
                    return c;
                }
                return { ...c, niveles: c.niveles.filter(n => n.id !== nivelId) };
            }
            return c;
        }));
        redistribuirPuntajes();
    };

    const updateNivel = (criterioId, nivelId, field, value) => {
        setCriterios(prev => prev.map(c => {
            if (c.id === criterioId) {
                return {
                    ...c,
                    niveles: c.niveles.map(n => n.id === nivelId ? { ...n, [field]: value } : n)
                };
            }
            return c;
        }));
    };

    // Calcular suma total automáticamente
    const totalPuntosCriterios = criterios.reduce((acc, c) => acc + (parseFloat(c.puntaje_maximo) || 0), 0);

    // --- Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (parseFloat(formData.porcentaje_evaluacion) < 5) {
            Swal.fire('Error', 'El porcentaje debe ser al menos 5%', 'error');
            return;
        }

        // Validate criterios
        let sumaCriterios = 0;
        let invalid = false;
        criterios.forEach(c => {
            if (!c.descripcion) invalid = true;
            sumaCriterios += parseFloat(c.puntaje_maximo || 0);
            c.niveles.forEach(n => {
                if (!n.nombre_nivel || !n.descripcion) invalid = true;
            });
        });

        if (invalid) {
            Swal.fire('Error', 'Debe llenar todas las descripciones y nombres de criterios/niveles', 'error');
            return;
        }

        if (Math.abs(sumaCriterios - formData.porcentaje_evaluacion) > 0.5) {
            Swal.fire('Error', `La suma de puntajes (${sumaCriterios.toFixed(2)}) no coincide con el porcentaje (${formData.porcentaje_evaluacion}%)`, 'error');
            return;
        }

        const payload = { ...formData, criterios: criterios, id_evaluacion: formData.evaluacion_id };

        Swal.fire({ title: 'Actualizando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            const result = await teacherRubricasService.updateRubrica(id, payload);
            if (result.status === 'error' || result.success === false) throw new Error(result.mensaje || result.message);
            Swal.fire('Éxito', result.mensaje || 'Rúbrica actualizada', 'success').then(() => {
                navigate('/teacher/rubricas');
            });
        } catch (error) {
            Swal.fire('Error', error.message || 'Error al actualizar rúbrica', 'error');
        }
    };

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Crear Rúbrica" user={user} onLogout={() => navigate('/login')} />

                <div className="view active" style={{ padding: '20px' }}>
                    <div className="card form-container" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div className="card-header" style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <h2 style={{ color: '#1e3a8a' }}><i className="fas fa-edit"></i> Editar Rúbrica</h2>
                        </div>
                        
                        <div className="alert alert-info" style={{ background: '#eff6ff', color: '#1e40af', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <i className="fas fa-info-circle"></i> Complete todos los campos requeridos. Los puntajes se distribuirán automáticamente según el porcentaje de la evaluación seleccionada.
                        </div>

                        {loading ? <p>Cargando datos...</p> : (
                            <form onSubmit={handleSubmit} id="rubricaForm">
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Nombre de la Rúbrica *</label>
                                    <input type="text" name="nombre_rubrica" value={formData.nombre_rubrica} onChange={handleChange} className="form-input" style={inputStyle} required />
                                </div>
                                
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Tipo de Rúbrica *</label>
                                    <select name="tipo_rubrica" value={formData.tipo_rubrica} onChange={handleChange} className="form-select" style={inputStyle} required>
                                        <option value="">Seleccionar tipo</option>
                                        {tiposRubrica.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div className="form-group">
                                        <label>Carrera *</label>
                                        <select name="carrera" value={formData.carrera} onChange={handleChange} className="form-select" style={inputStyle} required>
                                            <option value="">Seleccione carrera</option>
                                            {carreras.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Semestre *</label>
                                        <select name="semestre" value={formData.semestre} onChange={handleChange} className="form-select" style={inputStyle} required disabled={!formData.carrera}>
                                            <option value="">{formData.carrera ? 'Seleccione semestre' : 'Primero seleccione carrera'}</option>
                                            {semestres.map(s => <option key={s} value={s}>Semestre {s}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Materia *</label>
                                        <select name="materia_codigo" value={formData.materia_codigo} onChange={handleChange} className="form-select" style={inputStyle} required disabled={!formData.semestre}>
                                            <option value="">{formData.semestre ? 'Seleccione materia' : 'Primero seleccione semestre'}</option>
                                            {materias.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Sección *</label>
                                        <select name="seccion_id" value={formData.seccion_id} onChange={handleChange} className="form-select" style={inputStyle} required disabled={!formData.materia_codigo}>
                                            <option value="">{formData.materia_codigo ? 'Seleccione sección' : 'Primero seleccione materia'}</option>
                                            {secciones.map(s => <option key={s.id} value={s.id}>{s.letra} ({s.codigo_periodo})</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1, marginRight: '20px' }}>
                                            <label>Evaluación que la utilizará *</label>
                                            <select name="evaluacion_id" value={formData.evaluacion_id} onChange={handleChange} className="form-select" style={inputStyle} required disabled={!formData.seccion_id}>
                                                <option value="">{formData.seccion_id ? 'Seleccione evaluación' : 'Primero seleccione sección'}</option>
                                                {evaluaciones.map(e => <option key={e.id} value={e.id}>Evaluación {e.fecha_evaluacion ? e.fecha_evaluacion.split('T')[0] : 'Sin fecha'} - {e.ponderacion}%</option>)}
                                            </select>
                                        </div>
                                        <div style={{ background: '#e0f2fe', padding: '10px 20px', borderRadius: '10px', border: '1px solid #7dd3fc', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase' }}>Suma de Criterios</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: Math.abs(totalPuntosCriterios - formData.porcentaje_evaluacion) < 0.01 ? '#059669' : '#ef4444' }}>
                                                {totalPuntosCriterios.toFixed(2)} / {formData.porcentaje_evaluacion}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div className="form-group">
                                        <label>Fecha de Evaluación *</label>
                                        <input type="date" value={formData.fecha_evaluacion} className="form-input" style={inputStyle} disabled />
                                    </div>
                                    <div className="form-group">
                                        <label>Porcentaje de Evaluación (%) *</label>
                                        <input type="number" value={formData.porcentaje_evaluacion} className="form-input" style={inputStyle} disabled />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Competencias Evaluadas</label>
                                    <textarea value={formData.competencias} className="form-textarea" style={inputStyle} rows="2" disabled />
                                </div>

                                <div className="form-group" style={{ marginBottom: '25px' }}>
                                    <label>Instrucciones / Descripción Extra</label>
                                    <textarea name="instrucciones" value={formData.instrucciones} onChange={handleChange} className="form-textarea" style={inputStyle} rows="3" placeholder="Instrucciones adicionales para la rúbrica..." />
                                </div>

                                {/* CRITERIOS SECTION */}
                                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '20px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3 style={{ color: '#0f172a' }}><i className="fas fa-list-check"></i> Criterios de Evaluación</h3>
                                        <button type="button" onClick={addCriterio} style={btnStyle('#3b82f6', '#fff')}><i className="fas fa-plus"></i> Agregar Criterio</button>
                                    </div>

                                    {criterios.map((crit, cIdx) => (
                                        <div key={crit.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                                <input type="text" value={crit.descripcion} onChange={e => updateCriterio(crit.id, 'descripcion', e.target.value)} placeholder="Descripción del Criterio (Ej: Originalidad)" style={{ ...inputStyle, flex: 1 }} required />
                                                <div style={{ width: '120px' }}>
                                                    <small>Puntaje Max.</small>
                                                    <input type="number" value={crit.puntaje_maximo} onChange={e => updateCriterio(crit.id, 'puntaje_maximo', e.target.value)} style={inputStyle} step="0.01" min="0" required />
                                                </div>
                                                <button type="button" onClick={() => removeCriterio(crit.id)} style={{ ...btnStyle('#ef4444', '#fff'), padding: '10px' }} title="Eliminar Criterio"><i className="fas fa-trash"></i></button>
                                            </div>

                                            <div style={{ marginLeft: '20px', paddingLeft: '20px', borderLeft: '3px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                    <h4 style={{ color: '#475569', fontSize: '14px', margin: 0 }}><i className="fas fa-star"></i> Niveles de Desempeño</h4>
                                                    <button type="button" onClick={() => addNivel(crit.id)} style={btnStyle('#10b981', '#fff', '12px', '5px 10px')}><i className="fas fa-plus"></i> Nivel</button>
                                                </div>

                                                {crit.niveles.map((nivel, nIdx) => (
                                                    <div key={nivel.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <input type="text" value={nivel.nombre_nivel} onChange={e => updateNivel(crit.id, nivel.id, 'nombre_nivel', e.target.value)} placeholder="Nombre Nivel" style={{ ...inputStyle, flex: 1 }} required />
                                                                <input type="number" value={nivel.puntaje} onChange={e => updateNivel(crit.id, nivel.id, 'puntaje', e.target.value)} placeholder="Puntos" style={{ ...inputStyle, width: '100px' }} step="0.01" min="0" required />
                                                            </div>
                                                            <textarea value={nivel.descripcion} onChange={e => updateNivel(crit.id, nivel.id, 'descripcion', e.target.value)} placeholder="Descripción del nivel..." style={inputStyle} rows="1" required />
                                                        </div>
                                                        <button type="button" onClick={() => removeNivel(crit.id, nivel.id)} style={{ ...btnStyle('#ef4444', '#fff'), padding: '8px', opacity: 0.8 }}><i className="fas fa-times"></i></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                    <button type="button" onClick={() => navigate('/teacher/rubricas')} style={btnStyle('#94a3b8', '#fff')}><i className="fas fa-times"></i> Cancelar</button>
                                    <button type="submit" style={btnStyle('#2563eb', '#fff')}><i className="fas fa-save"></i> Actualizar Rúbrica</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

const inputStyle = {
    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', 
    fontSize: '14px', boxSizing: 'border-box', outline: 'none'
};

const btnStyle = (bg, color, fontSize = '14px', padding = '10px 15px') => ({
    background: bg, color: color, padding: padding, fontSize: fontSize, 
    border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', 
    alignItems: 'center', gap: '6px', fontWeight: 'bold'
});
