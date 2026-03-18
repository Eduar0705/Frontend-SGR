import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import Swal from 'sweetalert2';
import { teacherRubricasService } from '../services/teacherRubricas.service';
import '../assets/css/home.css';

import { useUI } from '../context/UIContext';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function TeacherCrearRubricas() {
    const navigate = useNavigate();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Estados de datos
    const [loading, setLoading] = useState(false);
    const [tiposRubrica, setTiposRubrica] = useState([]);
    const [carreras, setCarreras] = useState([]);
    const [semestres, setSemestres] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [secciones, setSecciones] = useState([]);
    const [evaluaciones, setEvaluaciones] = useState([]);

    // Estado del Formulario
    const [formData, setFormData] = useState({
        nombre_rubrica: '',
        tipo_rubrica: '', // ID del tipo
        carrera_codigo: '',
        semestre: '',
        materia_codigo: '',
        seccion_id: '',
        evaluacion_id: '',
        porcentaje_evaluacion: 0,
        instrucciones: '',
        criterios: [
            {
                id_local: 1,
                descripcion: '',
                puntaje_maximo: '',
                niveles: [
                    { id_local: 1, nombre_nivel: 'Sobresaliente', descripcion: '', puntaje: '' },
                    { id_local: 2, nombre_nivel: 'Notable', descripcion: '', puntaje: '' },
                    { id_local: 3, nombre_nivel: 'Aprobado', descripcion: '', puntaje: '' },
                    { id_local: 4, nombre_nivel: 'Insuficiente', descripcion: '', puntaje: '' }
                ]
            }
        ]
    });

    // Cargar datos iniciales
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadInitialData();
    }, [user, navigate]);

    const loadInitialData = async () => {
        try {
            setGlobalLoading(false); // Apagar el overlay del menú
            
            // Cargar tipos de rúbrica y otros datos del formulario usando el servicio
            const dataForm = await teacherRubricasService.getFormData();
            setTiposRubrica(dataForm.tipos || []);
            setCarreras(dataForm.carreras || []);

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error al cargar datos iniciales', 'error');
            const data = await teacherRubricasService.getFormData();
            setCarreras(data.carreras || []);
            setTiposRubrica(data.tipos || []);
        } finally {
            setGlobalLoading(false);
        }
    };

    // Manejadores de Cascada (Usando Service)
    const handleCarreraChange = async (codigo) => {
        setFormData(prev => ({ ...prev, carrera_codigo: codigo, semestre: '', materia_codigo: '', seccion_id: '', evaluacion_id: '' }));
        setSemestres([]); setMaterias([]); setSecciones([]); setEvaluaciones([]);

        if (!codigo) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/teacher/rubricas/semestres/${codigo}`, {
                params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json()
            if (data.success) {
                setSemestres(data.data);
            }
        } catch (error) { console.error(error); }
    };

    const handleSemestreChange = async (semestre) => {
        setFormData(prev => ({ ...prev, semestre: semestre, materia_codigo: '', seccion_id: '', evaluacion_id: '' }));
        setMaterias([]); setSecciones([]); setEvaluaciones([]);

        if (!semestre) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/teacher/rubricas/materias/${formData.carrera_codigo}/${semestre}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMaterias(data.data);
            }
        } catch (error) { console.error(error); }
    };

    const handleMateriaChange = async (materiaCodigo) => {
        setFormData(prev => ({ ...prev, materia_codigo: materiaCodigo, seccion_id: '', evaluacion_id: '' }));
        setSecciones([]); setEvaluaciones([]);

        if (!materiaCodigo) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/teacher/rubricas/secciones/${materiaCodigo}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSecciones(data.data);
            }
        } catch (error) { console.error(error); }
    };

    const handleSeccionChange = async (seccionId) => {
        setFormData(prev => ({ ...prev, seccion_id: seccionId, evaluacion_id: '' }));
        setEvaluaciones([]);

        if (!seccionId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/teacher/rubricas/evaluaciones/${seccionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setEvaluaciones(data.evaluaciones);
            }
        } catch (error) { console.error(error); }
    };

    const redistribuirPuntajes = (porcentaje, criterios) => {
        if (!criterios.length) return criterios;

        const numCriterios = criterios.length;
        const puntajeBase = Math.floor((porcentaje / numCriterios) * 1000) / 1000;
        const resto = parseFloat((porcentaje - (puntajeBase * numCriterios)).toFixed(3));

        return criterios.map((c, idx) => {
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
        });
    };

    const handleEvaluacionChange = (evalId) => {
        const evaluacion = evaluaciones.find(e => e.id == evalId);
        if (!evaluacion) return;

        const nuevoPorcentaje = evaluacion.ponderacion;
        const nuevosCriterios = redistribuirPuntajes(nuevoPorcentaje, formData.criterios);

        setFormData(prev => ({
            ...prev,
            evaluacion_id: evalId,
            porcentaje_evaluacion: nuevoPorcentaje,
            criterios: nuevosCriterios
        }));
    };

    // Manejo de Criterios y Niveles
    const addCriterio = () => {
        const nuevoCriterio = {
            id_local: Date.now(),
            descripcion: '',
            puntaje_maximo: '',
            niveles: [
                { id_local: Date.now() + 1, nombre_nivel: 'Sobresaliente', descripcion: '', puntaje: '' },
                { id_local: Date.now() + 2, nombre_nivel: 'Notable', descripcion: '', puntaje: '' },
                { id_local: Date.now() + 3, nombre_nivel: 'Aprobado', descripcion: '', puntaje: '' },
                { id_local: Date.now() + 4, nombre_nivel: 'Insuficiente', descripcion: '', puntaje: 0 }
            ]
        };

        const nuevosCriterios = redistribuirPuntajes(formData.porcentaje_evaluacion, [...formData.criterios, nuevoCriterio]);
        setFormData(prev => ({ ...prev, criterios: nuevosCriterios }));
    };

    const removeCriterio = (idx) => {
        if (formData.criterios.length <= 1) {
            return Swal.fire('Aviso', 'Debe haber al menos un criterio', 'info');
        }
        const tempCriterios = [...formData.criterios];
        tempCriterios.splice(idx, 1);
        const nuevosCriterios = redistribuirPuntajes(formData.porcentaje_evaluacion, tempCriterios);
        setFormData({ ...formData, criterios: nuevosCriterios });
    };

    const handleCriterioChange = (idx, field, value) => {
        const newCriterios = [...formData.criterios];

        if (field === 'puntaje_maximo') {
            const val = parseFloat(value) || 0;
            newCriterios[idx][field] = val;

            // Si el puntaje máximo cambia, el nivel "Excelente" toma ese valor automáticamente
            const excelenteIdx = newCriterios[idx].niveles.findIndex(n => n.nombre_nivel === 'Excelente');
            if (excelenteIdx !== -1) {
                newCriterios[idx].niveles[excelenteIdx].puntaje = val;
            }
        } else {
            newCriterios[idx][field] = value;
        }

        setFormData({ ...formData, criterios: newCriterios });
    };

    const handleNivelChange = (cIdx, nIdx, field, value) => {
        const newCriterios = [...formData.criterios];

        if (field === 'puntaje') {
            const val = parseFloat(value) || 0;
            const max = parseFloat(newCriterios[cIdx].puntaje_maximo) || 0;

            if (val > max) {
                Swal.fire('Aviso', 'El puntaje del nivel no puede ser mayor al máximo del criterio', 'warning');
                newCriterios[cIdx].niveles[nIdx][field] = max;
            } else {
                newCriterios[cIdx].niveles[nIdx][field] = val;
            }
        } else {
            newCriterios[cIdx].niveles[nIdx][field] = value;
        }

        setFormData({ ...formData, criterios: newCriterios });
    };

    // Calcular suma total automáticamente
    const totalPuntosCriterios = formData.criterios.reduce((acc, c) => acc + (parseFloat(c.puntaje_maximo) || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre_rubrica || !formData.tipo_rubrica || !formData.evaluacion_id) {
            return Swal.fire('Atención', 'Complete los campos obligatorios del encabezado', 'warning');
        }

        const totalPuntos = formData.criterios.reduce((acc, c) => acc + parseFloat(c.puntaje_maximo || 0), 0);
        if (Math.abs(totalPuntos - formData.porcentaje_evaluacion) > 0.01) {
            return Swal.fire('Error de Puntos', `La suma de criterios (${totalPuntos}) debe ser igual al porcentaje de la evaluación (${formData.porcentaje_evaluacion}%)`, 'error');
        }

        // Validar mínimo de 0.025
        for (const crit of formData.criterios) {
            if (parseFloat(crit.puntaje_maximo) < 0.025) {
                return Swal.fire('Error', `El puntaje del criterio "${crit.descripcion}" debe ser al menos 0.025`, 'error');
            }
            for (const nivel of crit.niveles) {
                if (nivel.nombre_nivel !== 'Deficiente' && parseFloat(nivel.puntaje) < 0.025) {
                    return Swal.fire('Error', `El nivel "${nivel.nombre_nivel}" del criterio "${crit.descripcion}" debe tener al menos 0.025 puntos`, 'error');
                }
            }
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/teacher/rubricas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.status === 'ok' || data.success) {
                Swal.fire('Éxito', 'Rúbrica creada correctamente', 'success');
                navigate('/teacher/rubricas');
            } else {
                Swal.fire('Error', data.mensaje || 'Error al crear la rúbrica', 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error de conexión', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Crear Nueva Rúbrica" user={user} onLogout={() => navigate('/login')} />

                <div style={{ padding: '30px' }}>
                    <div className="card" style={{ borderRadius: '15px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '30px' }}>
                        <form onSubmit={handleSubmit}>
                            {/* Encabezado */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Nombre de la Rúbrica *</label>
                                    <input type="text" value={formData.nombre_rubrica} onChange={(e) => setFormData({ ...formData, nombre_rubrica: e.target.value })} className="form-input" required placeholder="Ej: Rúbrica de Proyecto Final" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Tipo de Rúbrica *</label>
                                    <select value={formData.tipo_rubrica} onChange={(e) => setFormData({ ...formData, tipo_rubrica: e.target.value })} className="form-select" required>
                                        <option value="">Seleccione tipo</option>
                                        {tiposRubrica.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Selectores en Cascada */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Carrera</label>
                                    <select value={formData.carrera_codigo} onChange={(e) => handleCarreraChange(e.target.value)} className="form-select">
                                        <option value="">Seleccione carrera</option>
                                        {carreras.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Semestre</label>
                                    <select value={formData.semestre} onChange={(e) => handleSemestreChange(e.target.value)} className="form-select" disabled={!semestres.length}>
                                        <option value="">Seleccione semestre</option>
                                        {semestres.map(s => <option key={s} value={s}>Semestre {s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Materia</label>
                                    <select value={formData.materia_codigo} onChange={(e) => handleMateriaChange(e.target.value)} className="form-select" disabled={!materias.length}>
                                        <option value="">Seleccione materia</option>
                                        {materias.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sección</label>
                                    <select value={formData.seccion_id} onChange={(e) => handleSeccionChange(e.target.value)} className="form-select" disabled={!secciones.length}>
                                        <option value="">Seleccione sección</option>
                                        {secciones.map(s => <option key={s.id} value={s.id}>{s.letra} ({s.lapso_academico || s.codigo_periodo})</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1, marginRight: '20px' }}>
                                        <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Evaluación</label>
                                        <select value={formData.evaluacion_id} onChange={(e) => handleEvaluacionChange(e.target.value)} className="form-select" required disabled={!evaluaciones.length}>
                                            <option value="">Seleccione evaluación</option>
                                            {evaluaciones.map(ev => <option key={ev.id} value={ev.id}>{ev.competencias} ({ev.ponderacion}%)</option>)}
                                        </select>
                                    </div>
                                </div>
                                    <div style={{ background: '#e0f2fe', padding: '10px 20px', borderRadius: '10px', border: '1px solid #7dd3fc', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase' }}>Suma de Criterios</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: totalPuntosCriterios === formData.porcentaje_evaluacion ? '#059669' : '#ef4444' }}>
                                            {totalPuntosCriterios} / {formData.porcentaje_evaluacion}
                                        </div>
                                    </div>
                                </div>

                            {/* Instrucciones */}
                            <div style={{ marginBottom: '30px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Instrucciones Generales</label>
                                <textarea className="form-textarea" rows="3" value={formData.instrucciones} onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value })} placeholder="Instrucciones para el estudiante..."></textarea>
                            </div>

                            {/* Criterios */}
                            <div className="criterios-container">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '10px', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, color: '#1e3a8a' }}>Criterios de Evaluación</h3>
                                    <button type="button" onClick={addCriterio} className="btns" style={{ background: '#10b981', color: 'white', padding: '8px 15px', borderRadius: '8px', fontSize: '0.9rem' }}>
                                        <i className="fas fa-plus"></i> Agregar Criterio
                                    </button>
                                </div>

                                {formData.criterios.map((c, cIdx) => (
                                    <div key={c.id_local} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px', position: 'relative' }}>
                                        <button type="button" onClick={() => removeCriterio(cIdx)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar criterio">
                                            <i className="fas fa-trash"></i>
                                        </button>

                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingRight: '40px' }}>
                                            <input type="text" placeholder="Descripción del criterio (Ej: Dominio del tema)" value={c.descripcion} onChange={(e) => handleCriterioChange(cIdx, 'descripcion', e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <input type="number" step="0.001" min="0" value={c.puntaje_maximo} onChange={(e) => handleCriterioChange(cIdx, 'puntaje_maximo', e.target.value)} style={{ width: '100px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', fontWeight: 'bold' }} placeholder="Max" required />
                                                <span style={{ fontWeight: 'bold' }}>Pts</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                            {c.niveles.map((n, nIdx) => (
                                                <div key={n.id_local} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                    <input type="text" value={n.nombre_nivel} onChange={(e) => handleNivelChange(cIdx, nIdx, 'nombre_nivel', e.target.value)} style={{ fontWeight: 'bold', border: 'none', background: 'transparent', width: '100%', marginBottom: '5px', color: '#475569' }} placeholder="Nivel" />
                                                    <textarea value={n.descripcion} onChange={(e) => handleNivelChange(cIdx, nIdx, 'descripcion', e.target.value)} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.85rem', padding: '8px', marginBottom: '5px', resize: 'vertical' }} rows="3" placeholder="Descripción del nivel..." />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <input type="number" step="0.001" min="0" value={n.puntaje} onChange={(e) => handleNivelChange(cIdx, nIdx, 'puntaje', e.target.value)} style={{ width: '80px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px', fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 'bold' }} placeholder="0" />
                                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>pts</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '25px', marginTop: '30px' }}>
                                <button type="button" onClick={() => navigate('/teacher/rubricas')} className="btns" style={{ background: '#94a3b8', color: 'white', padding: '12px 30px', borderRadius: '10px' }}>Cancelar</button>
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
