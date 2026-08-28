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
    const { id, id_eval } = useParams();
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
        carrera_codigo: '',
        semestre: '',
        materia_codigo: '',
        seccion_id: '',
        evaluacion_id: '',
        fecha_evaluacion: '',
        porcentaje_evaluacion: 0,
        competencias: '',
        instrucciones: ''
    });

    // Criterios & Niveles
    const [criterios, setCriterios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadInitialData();
    }, [user, navigate]);

    const loadInitialData = async () => {
        try {
            setGlobalLoading(true);
            const data = await teacherRubricasService.getFormData();
            setCarreras(data.carreras || []);
            setTiposRubrica(data.tipos || []);

            // Cargar datos de la rúbrica para editar
            const editData = await teacherRubricasService.getRubricaForEdit(id, id_eval);
            if (!editData || !editData.rubrica) {
                throw new Error(editData?.message || 'Error al cargar rúbrica');
            }

            const r = editData.rubrica;
            const parts = r.seccion_codigo ? r.seccion_codigo.split('-') : [''];
            const carrera_id = parts[0] || '';

            setFormData({
                nombre_rubrica: r.nombre_rubrica || '',
                tipo_rubrica: r.id_tipo || '',
                carrera_codigo: carrera_id,
                semestre: r.lapse_academico || '',
                materia_codigo: r.materia_codigo || '',
                seccion_id: r.seccion_id || '',
                evaluacion_id: r.evaluacion_id || '',
                fecha_evaluacion: r.fecha_evaluacion ? r.fecha_evaluacion.split('T')[0] : '',
                porcentaje_evaluacion: parseFloat(r.porcentaje_evaluacion) || 0,
                competencias: r.competencias || '',
                instrucciones: r.instrucciones || ''
            });

            setCarreras(prev => prev.some(c => String(c.codigo) === String(carrera_id)) ? prev : [...prev, { codigo: carrera_id, nombre: carrera_id }]);
            setSemestres([r.lapse_academico]);
            setMaterias([{ codigo: r.materia_codigo, nombre: r.materia_nombre || r.materia_codigo }]);
            setSecciones([{ id: r.seccion_id, letra: r.seccion_codigo ? r.seccion_codigo.split(' ')[1] : '', lapso_academico: r.lapse_academico, codigo_periodo: r.lapse_academico }]);
            setEvaluaciones([{ id: r.evaluacion_id, competencias: r.contenido_evaluacion || r.competencias, ponderacion: r.porcentaje_evaluacion }]);

            if (editData.criterios && editData.criterios.length > 0) {
                setCriterios(editData.criterios.map((c, idx) => ({
                    id_local: c.id || Date.now() + idx,
                    id: c.id,
                    descripcion: c.descripcion || '',
                    puntaje_maximo: c.puntaje_maximo,
                    orden: c.orden || idx + 1,
                    niveles: (c.niveles || []).map((n, nIdx) => ({
                        id_local: n.id || Date.now() + idx * 10 + nIdx,
                        id: n.id,
                        nombre_nivel: n.nombre_nivel || n.nombre || '',
                        descripcion: n.descripcion || '',
                        puntaje: n.puntaje,
                        orden: n.orden || nIdx + 1
                    }))
                })));
            } else {
                setCriterios([
                    {
                        id_local: 1,
                        descripcion: '',
                        puntaje_maximo: r.porcentaje_evaluacion || 10,
                        niveles: [
                            { id_local: 4, nombre_nivel: 'Insuficiente', descripcion: '', puntaje: 0 },
                            { id_local: 3, nombre_nivel: 'Aprobado', descripcion: '', puntaje: '' },
                            { id_local: 2, nombre_nivel: 'Notable', descripcion: '', puntaje: '' },
                            { id_local: 1, nombre_nivel: 'Sobresaliente', descripcion: '', puntaje: '' }
                        ]
                    }
                ]);
            }
        } catch (error) {
            console.error('Error loadInitialData:', error);
            Swal.fire('Error', error.message || 'No se pudieron cargar los datos iniciales', 'error');
            navigate('/teacher/rubricas');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    };

    const redistribuirPuntajes = (porcentaje, listaCriterios) => {
        if (!listaCriterios || !listaCriterios.length) return listaCriterios || [];

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

    // Manejo de Criterios y Niveles
    const addCriterio = () => {
        const nuevoCriterio = {
            id: null,
            id_local: Date.now(),
            descripcion: '',
            puntaje_maximo: '',
            niveles: [
                { id_local: 4, nombre_nivel: 'Insuficiente', descripcion: '', puntaje: 0 },
                { id_local: 3, nombre_nivel: 'Aprobado', descripcion: '', puntaje: '' },
                { id_local: 2, nombre_nivel: 'Notable', descripcion: '', puntaje: '' },
                { id_local: 1, nombre_nivel: 'Sobresaliente', descripcion: '', puntaje: '' }
            ]
        };

        const nuevosCriterios = redistribuirPuntajes(formData.porcentaje_evaluacion, [...criterios, nuevoCriterio]);
        setCriterios(nuevosCriterios);
    };

    const removeCriterio = (idx) => {
        if (criterios.length <= 1) {
            return Swal.fire('Aviso', 'Debe haber al menos un criterio', 'info');
        }
        const tempCriterios = [...criterios];
        tempCriterios.splice(idx, 1);
        const nuevosCriterios = redistribuirPuntajes(formData.porcentaje_evaluacion, tempCriterios);
        setCriterios(nuevosCriterios);
    };

    const handleCriterioChange = (idx, field, value) => {
        const newCriterios = [...criterios];

        if (field === 'puntaje_maximo') {
            const val = parseFloat(value) || 0;
            newCriterios[idx][field] = val;

            const sobresalienteIdx = newCriterios[idx].niveles.findIndex(n => n.nombre_nivel === 'Sobresaliente' || n.nombre_nivel === 'Excelente');
            if (sobresalienteIdx !== -1) {
                newCriterios[idx].niveles[sobresalienteIdx].puntaje = val;
            }
        } else {
            newCriterios[idx][field] = value;
        }

        setCriterios(newCriterios);
    };

    const handleNivelChange = (cIdx, nIdx, field, value) => {
        const newCriterios = [...criterios];

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

        setCriterios(newCriterios);
    };

    // Calcular suma total automáticamente
    const totalPuntosCriterios = criterios.reduce((acc, c) => acc + (parseFloat(c.puntaje_maximo) || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre_rubrica || !formData.tipo_rubrica) {
            return Swal.fire('Atención', 'Complete los campos obligatorios del encabezado', 'warning');
        }

        const totalPuntos = criterios.reduce((acc, c) => acc + parseFloat(c.puntaje_maximo || 0), 0);
        if (Math.abs(totalPuntos - formData.porcentaje_evaluacion) > 0.01) {
            return Swal.fire('Error de Puntos', `La suma de criterios (${totalPuntos.toFixed(3)}) debe ser igual al porcentaje de la evaluación (${formData.porcentaje_evaluacion}%)`, 'error');
        }

        // Validaciones de criterios y niveles
        for (let i = 0; i < criterios.length; i++) {
            const crit = criterios[i];
            if (!crit.descripcion || !crit.descripcion.trim()) {
                return Swal.fire('Error', `El criterio ${i + 1} necesita una descripción`, 'error');
            }
            if (parseFloat(crit.puntaje_maximo) < 0.025) {
                return Swal.fire('Error', `El puntaje del criterio "${crit.descripcion}" debe ser al menos 0.025`, 'error');
            }
            for (const nivel of crit.niveles) {
                if (!nivel.nombre_nivel || !nivel.nombre_nivel.trim()) {
                    return Swal.fire('Error', `Todos los niveles del criterio "${crit.descripcion}" deben tener nombre`, 'error');
                }
                if (!nivel.descripcion || !nivel.descripcion.trim()) {
                    return Swal.fire('Error', `El nivel "${nivel.nombre_nivel}" del criterio "${crit.descripcion}" necesita una descripción`, 'error');
                }
                if (nivel.nombre_nivel !== 'Deficiente' && nivel.nombre_nivel !== 'Insuficiente' && parseFloat(nivel.puntaje) < 0.025) {
                    return Swal.fire('Error', `El nivel "${nivel.nombre_nivel}" del criterio "${crit.descripcion}" debe tener al menos 0.025 puntos`, 'error');
                }
            }
        }

        const payload = {
            nombre_rubrica: formData.nombre_rubrica,
            tipo_rubrica: formData.tipo_rubrica,
            id_evaluacion: formData.evaluacion_id,
            instrucciones: formData.instrucciones,
            porcentaje: parseFloat(formData.porcentaje_evaluacion),
            criterios: criterios.map((c, idx) => ({
                descripcion: c.descripcion.trim(),
                puntaje_maximo: parseFloat(c.puntaje_maximo),
                orden: idx + 1,
                niveles: c.niveles.map((n, nIdx) => ({
                    nombre_nivel: n.nombre_nivel.trim(),
                    descripcion: n.descripcion.trim(),
                    puntaje: parseFloat(n.puntaje),
                    orden: nIdx + 1
                }))
            }))
        };

        try {
            setLoading(true);
            Swal.fire({ title: 'Actualizando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const result = await teacherRubricasService.updateRubrica(id, payload);
            Swal.close();

            if (result.status === 'error' || result.success === false) {
                throw new Error(result.mensaje || result.message || 'Error al actualizar la rúbrica');
            }

            Swal.fire('Éxito', result.mensaje || 'Rúbrica actualizada correctamente', 'success').then(() => {
                navigate('/teacher/rubricas');
            });
        } catch (error) {
            Swal.close();
            console.error('Error al actualizar rúbrica:', error);
            Swal.fire('Error', error.message || 'Error al actualizar rúbrica', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Editar Rúbrica" user={user} onLogout={() => navigate('/login')} />

                <div style={{ padding: '30px' }}>
                    <div className="card" style={{ borderRadius: '15px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '30px' }}>
                        <form onSubmit={handleSubmit}>
                            {/* Encabezado */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Nombre de la Rúbrica *</label>
                                    <input 
                                        type="text" 
                                        value={formData.nombre_rubrica} 
                                        onChange={(e) => setFormData({ ...formData, nombre_rubrica: e.target.value })} 
                                        className="form-input" 
                                        required 
                                        placeholder="Ej: Rúbrica de Proyecto Final" 
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Tipo de Rúbrica *</label>
                                    <select 
                                        value={formData.tipo_rubrica} 
                                        onChange={(e) => setFormData({ ...formData, tipo_rubrica: e.target.value })} 
                                        className="form-select" 
                                        required
                                    >
                                        <option value="">Seleccione tipo</option>
                                        {tiposRubrica.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Selectores en Cascada */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Carrera</label>
                                    <select 
                                        value={formData.carrera_codigo} 
                                        className="form-select"
                                        disabled
                                    >
                                        <option value="">Seleccione carrera</option>
                                        {carreras.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre || c.codigo}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Semestre</label>
                                    <select 
                                        value={formData.semestre} 
                                        className="form-select" 
                                        disabled
                                    >
                                        <option value="">Seleccione semestre</option>
                                        {semestres.map(s => <option key={s} value={s}>Semestre {s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Materia</label>
                                    <select 
                                        value={formData.materia_codigo} 
                                        className="form-select" 
                                        disabled
                                    >
                                        <option value="">Seleccione materia</option>
                                        {materias.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre || m.codigo}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sección</label>
                                    <select 
                                        value={formData.seccion_id} 
                                        className="form-select" 
                                        disabled
                                    >
                                        <option value="">Seleccione sección</option>
                                        {secciones.map(s => <option key={s.id} value={s.id}>{s.letra || s.codigo} ({s.lapso_academico || s.codigo_periodo})</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1, marginRight: '20px' }}>
                                        <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Evaluación</label>
                                        <select 
                                            value={formData.evaluacion_id} 
                                            className="form-select" 
                                            required 
                                            disabled
                                        >
                                            <option value="">Seleccione evaluación</option>
                                            {evaluaciones.map(ev => <option key={ev.id} value={ev.id}>{ev.competencias || ev.contenido} ({ev.ponderacion || formData.porcentaje_evaluacion}%)</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ background: '#e0f2fe', padding: '10px 20px', borderRadius: '10px', border: '1px solid #7dd3fc', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase' }}>Suma de Criterios</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: Math.abs(totalPuntosCriterios - formData.porcentaje_evaluacion) < 0.01 ? '#059669' : '#ef4444' }}>
                                        {totalPuntosCriterios.toFixed(3)} / {formData.porcentaje_evaluacion}
                                    </div>
                                </div>
                            </div>

                            {/* Instrucciones */}
                            <div style={{ marginBottom: '30px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Instrucciones Generales</label>
                                <textarea 
                                    className="form-textarea" 
                                    rows="3" 
                                    value={formData.instrucciones} 
                                    onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value })} 
                                    placeholder="Instrucciones para el estudiante..."
                                ></textarea>
                            </div>

                            {/* Criterios */}
                            <div className="criterios-container">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '10px', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, color: '#1e3a8a' }}>Criterios de Evaluación</h3>
                                    <button type="button" onClick={addCriterio} className="btns" style={{ background: '#10b981', color: 'white', padding: '8px 15px', borderRadius: '8px', fontSize: '0.9rem' }}>
                                        <i className="fas fa-plus"></i> Agregar Criterio
                                    </button>
                                </div>

                                {criterios.map((c, cIdx) => (
                                    <div key={c.id_local || c.id || cIdx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px', position: 'relative' }}>
                                        <button type="button" onClick={() => removeCriterio(cIdx)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar criterio">
                                            <i className="fas fa-trash"></i>
                                        </button>

                                        <label style={{ display: 'block', color: '#1e3a8a', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '6px' }}>Nombre de Criterio</label>

                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingRight: '40px' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Descripción del criterio (Ej: Dominio del tema)" 
                                                value={c.descripcion} 
                                                onChange={(e) => handleCriterioChange(cIdx, 'descripcion', e.target.value)} 
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                                                required 
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <input 
                                                    type="number" 
                                                    step="0.001" 
                                                    min="0" 
                                                    value={c.puntaje_maximo} 
                                                    onChange={(e) => handleCriterioChange(cIdx, 'puntaje_maximo', e.target.value)} 
                                                    style={{ width: '100px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', fontWeight: 'bold' }} 
                                                    placeholder="Max" 
                                                    required 
                                                />
                                                <span style={{ fontWeight: 'bold' }}>Pts</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                            {c.niveles.map((n, nIdx) => (
                                                <div key={n.id_local || n.id || nIdx} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                    <input 
                                                        type="text" 
                                                        value={n.nombre_nivel} 
                                                        onChange={(e) => handleNivelChange(cIdx, nIdx, 'nombre_nivel', e.target.value)} 
                                                        style={{ fontWeight: 'bold', border: 'none', background: 'transparent', width: '100%', marginBottom: '5px', color: '#475569' }} 
                                                        placeholder="Nivel" 
                                                    />
                                                    <textarea 
                                                        value={n.descripcion} 
                                                        onChange={(e) => handleNivelChange(cIdx, nIdx, 'descripcion', e.target.value)} 
                                                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.85rem', padding: '8px', marginBottom: '5px', resize: 'vertical' }} 
                                                        rows="3" 
                                                        placeholder="Descripción del nivel..." 
                                                    />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <input 
                                                            type="number" 
                                                            step="0.001" 
                                                            min="0" 
                                                            value={n.puntaje} 
                                                            onChange={(e) => handleNivelChange(cIdx, nIdx, 'puntaje', e.target.value)} 
                                                            style={{ width: '80px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px', fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 'bold' }} 
                                                            placeholder="0" 
                                                        />
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
                                    <i className="fas fa-save" style={{ marginRight: '8px' }}></i> {loading ? 'Actualizando...' : 'Actualizar Rúbrica'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
