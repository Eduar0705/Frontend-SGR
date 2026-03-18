import React, { useState, useEffect, useCallback } from 'react';
import { evaluacionesService } from '../../services/evaluaciones.service';
import Swal from 'sweetalert2';
import { useFechasDisponibles, agruparFechasPorMes } from '../../utils/useFechasDisponibles';

export default function ModalAddEvaluacion({ onClose, onSaved }) {
    const [submitting, setSubmitting] = useState(false);

    // Catalogos
    const [carreras, setCarreras] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [secciones, setSecciones] = useState([]);
    const [estrategias, setEstrategias] = useState([]);
    const [cortes, setCortes] = useState([]);

    // Hook de fechas dinámicas
    const { fechasSistema, configuracionFechas, loadingFechas, errorFechas, cargarFechas, resetFechas } = useFechasDisponibles();

    const [formData, setFormData] = useState({
        contenido: '',
        corte: '',
        estrategias_eval: [],
        porcentaje: 5,
        cant_personas: 1,
        carrera_codigo: '',
        materia_codigo: '',
        id_seccion: '',
        tipo_horario: 'Sección',
        fecha_horario_json: '',
        fecha_evaluacion: '',
        id_horario: '',
        hora_inicio: '',
        hora_fin: '',
        competencias: '',
        instrumentos: ''
    });

    // Carga de catálogos iniciales (específicos de docente)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [resCarreras, resEstrategias, resCortes] = await Promise.all([
                    evaluacionesService.getTeacherCarreras(),
                    evaluacionesService.getEstrategias(),
                    evaluacionesService.getCortes()
                ]);

                if (resCarreras.success) setCarreras(resCarreras.carreras);
                if (resEstrategias.success) setEstrategias(resEstrategias.estrategias_eval);
                if (resCortes.success) setCortes(resCortes.cortes);
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };
        loadInitialData();
    }, []);
    const formatearFecha = (fecha_formato_sql) => {
        const fecha = new Date(fecha_formato_sql);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
        }).replace(/\//g, '-');
        return fechaFormateada;
    }
    // ── Carga jerárquica ───────────────────────────────────────────────────────
    const handleCarreraChange = async (codigo) => {
        setFormData(prev => ({ ...prev, carrera_codigo: codigo, materia_codigo: '', id_seccion: '', id_horario: '', fecha_horario_json: '', fecha_evaluacion: '' }));
        resetFechas();
        setMaterias([]);
        setSecciones([]);
        if (codigo) {
            const res = await evaluacionesService.getTeacherMateriasByCarrera(codigo);
            if (res.success) setMaterias(res.materias);
        }
    };

    const handleMateriaChange = async (codigo) => {
        setFormData(prev => ({ ...prev, materia_codigo: codigo, id_seccion: '', id_horario: '', fecha_horario_json: '', fecha_evaluacion: '' }));
        resetFechas();
        setSecciones([]);
        if (codigo) {
            const res = await evaluacionesService.getTeacherSecciones(codigo);
            if (res.success) setSecciones(res.secciones);
        }
    };

    const handleSeccionChange = async (id) => {
        setFormData(prev => ({ ...prev, id_seccion: id, id_horario: '', fecha_horario_json: '', fecha_evaluacion: '' }));
        if (id) {
            await cargarFechas(id, []);
        } else {
            resetFechas();
        }
    };

    const handleFechaHorarioChange = (jsonString) => {
        if (!jsonString) {
            setFormData(prev => ({ ...prev, fecha_horario_json: '', id_horario: '', fecha_evaluacion: '', hora_inicio: '', hora_fin: '' }));
            return;
        }
        const selected = JSON.parse(jsonString);
        setFormData(prev => ({
            ...prev,
            fecha_horario_json: jsonString,
            id_horario: selected.horarioId,
            fecha_evaluacion: selected.fecha,
            hora_inicio: selected.horaInicio,
            hora_fin: selected.horaCierre,
        }));
    };

    const handleTipoHorarioChange = (tipo) => {
        setFormData(prev => ({
            ...prev,
            tipo_horario: tipo,
            fecha_horario_json: '',
            id_horario: '',
            fecha_evaluacion: '',
            hora_inicio: '',
            hora_fin: '',
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones preventivas
        if (formData.estrategias_eval.length === 0) {
            Swal.fire('Atención', 'Debe seleccionar al menos una estrategia de evaluación.', 'warning');
            return;
        }

        if (formData.tipo_horario === 'Sección' && !formData.id_horario) {
            Swal.fire('Atención', 'Debe seleccionar una fecha y horario de la lista.', 'warning');
            return;
        }

        if (!formData.corte) {
            Swal.fire('Atención', 'Debe seleccionar un corte al que pertenezca la evaluación.', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            const res = await evaluacionesService.saveEvaluacion(formData);
            if (res.success) {
                Swal.fire('Éxito', res.message || 'Evaluación creada correctamente', 'success').then(() => onSaved());
            } else {
                Swal.fire('Error', res.message || 'No se pudo crear la evaluación', 'error');
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            Swal.fire('Error', 'Error al procesar la solicitud', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-premium-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-premium-content" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-premium-header">
                    <h2><i className="fas fa-plus-circle"></i> Nueva Evaluación</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-premium-form">

                    {/* ── Sección: Materia ──────────────────────── */}
                    <div className="form-section-premium">
                        <h4><i className="fas fa-book"></i> Datos de la Materia</h4>
                        <div className="form-grid-premium">
                            <div className="form-field">
                                <label>Carrera</label>
                                <select
                                    value={formData.carrera_codigo}
                                    onChange={(e) => handleCarreraChange(e.target.value)}
                                    required
                                >
                                    <option value="">Seleccione carrera...</option>
                                    {carreras.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Materia</label>
                                <select
                                    value={formData.materia_codigo}
                                    onChange={(e) => handleMateriaChange(e.target.value)}
                                    disabled={!formData.carrera_codigo}
                                    required
                                >
                                    <option value="">Seleccione materia...</option>
                                    {materias.map(m => (
                                        <option key={m.codigo} value={m.codigo}>
                                            {m.nombre} (Semestre {m.semestre})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Sección</label>
                                <select
                                    value={formData.id_seccion}
                                    onChange={(e) => handleSeccionChange(e.target.value)}
                                    disabled={!formData.materia_codigo}
                                    required
                                >
                                    <option value="">Seleccione sección...</option>
                                    {secciones.map(s => (
                                        <option key={s.id} value={s.id}>Sección {s.codigo}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Corte</label>
                                <select
                                    value = {formData.corte}
                                    disabled={!formData.id_seccion}
                                    onChange={(e) => setFormData({ ...formData, corte: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione el corte...</option>
                                    {cortes.map(c => (
                                        <option key={c.orden} value={c.orden}>Corte {c.orden} ({formatearFecha(c.fecha_inicio)} - {formatearFecha(c.fecha_fin)})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Sección: Detalles ─────────────────────── */}
                    <div className="form-section-premium">
                        <h4><i className="fas fa-tasks"></i> Detalles de la Evaluación</h4>
                        <div className="form-field full-width">
                            <label>Contenido / Título</label>
                            <input
                                type="text"
                                value={formData.contenido}
                                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                                required
                                placeholder="Ej: Primer Parcial de Programación"
                            />
                        </div>
                        <div className="form-grid-premium">
                            <div className="form-field">
                                <label>Ponderación (%)</label>
                                <input
                                    type="number" min="1" max="100"
                                    value={formData.porcentaje}
                                    onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>Modalidad</label>
                                <input
                                    type = "number"
                                    min = "1" max = "50"
                                    value={formData.cant_personas}
                                    onChange={(e) => setFormData({ ...formData, cant_personas: e.target.value })}
                                >
                                </input>
                            </div>
                        </div>
                    </div>

                    {/* ── Sección: Horario ──────────────────────── */}
                    <div className="form-section-premium">
                        <h4><i className="fas fa-clock"></i> Horario</h4>
                        <div className="form-grid-premium">
                            <div className="form-field">
                                <label>Tipo de Horario</label>
                                <select
                                    value={formData.tipo_horario}
                                    onChange={(e) => handleTipoHorarioChange(e.target.value)}
                                    disabled={!formData.id_seccion}
                                >
                                    <option value="Sección">Dentro de Horario de Sección</option>
                                    <option value="Otro">Fuera de Horario</option>
                                </select>
                            </div>

                            {formData.tipo_horario === 'Sección' ? (
                                <div className="form-field">
                                    <label>
                                        Fecha y Horario Disponible
                                        {loadingFechas && <span style={{ marginLeft: 8, fontSize: '0.8em', color: '#888' }}>Cargando...</span>}
                                    </label>
                                    {errorFechas ? (
                                        <p style={{ color: 'red', fontSize: '0.85em' }}>{errorFechas}</p>
                                    ) : (
                                        <select
                                            value={formData.fecha_horario_json}
                                            onChange={(e) => handleFechaHorarioChange(e.target.value)}
                                            disabled={!formData.id_seccion || loadingFechas}
                                            required
                                        >
                                            <option value="">
                                                {loadingFechas ? 'Cargando fechas...' : '-- Seleccione una fecha --'}
                                            </option>
                                            {!loadingFechas && fechasSistema.length === 0 && (
                                                <option disabled>No hay fechas disponibles</option>
                                            )}
                                            {!loadingFechas && Object.entries(agruparFechasPorMes(fechasSistema)).map(([mes, fechas]) => (
                                                <optgroup key={mes} label={mes}>
                                                    {fechas.map(f => {
                                                        const optionData = JSON.stringify({
                                                            fecha: f.fechaStr,
                                                            horarioId: f.horarioId,
                                                            diaNumero: f.diaNumero,
                                                            horaInicio: f.horaInicio,
                                                            horaCierre: f.horaCierre,
                                                        });
                                                        return (
                                                            <option key={`${f.fechaStr}_${f.horarioId}`} value={optionData}>
                                                                {f.fechaLocal} ({f.diaSemana}) — {f.horaInicio?.substring(0, 5)} a {f.horaCierre?.substring(0, 5)} — Aula: {f.aula}
                                                            </option>
                                                        );
                                                    })}
                                                </optgroup>
                                            ))}
                                        </select>
                                    )}
                                    {configuracionFechas && (
                                        <small style={{ color: '#888', marginTop: 4, display: 'block' }}>
                                            <i className="fas fa-info-circle"></i> Período: {configuracionFechas.periodo}
                                        </small>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="form-field">
                                        <label>Fecha</label>
                                        <input
                                            type="date"
                                            value={formData.fecha_evaluacion}
                                            min={configuracionFechas?.fechaInicio?.slice(0, 10)}
                                            max={configuracionFechas?.fechaFin?.slice(0, 10)}
                                            onChange={(e) => setFormData({ ...formData, fecha_evaluacion: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Hora Inicio</label>
                                        <input
                                            type="time"
                                            value={formData.hora_inicio}
                                            onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Hora Fin</label>
                                        <input
                                            type="time"
                                            value={formData.hora_fin}
                                            onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                                            required
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Sección: Estrategias ──────────────────── */}
                    <div className="form-section-premium">
                        <h4><i className="fas fa-list-ul"></i> Estrategias, Competencias e Instrumentos</h4>
                        <div className="form-field full-width">
                            <label>Estrategias (Múltiple)</label>
                            <div className="chips-container-premium">
                                {estrategias.map(est => (
                                    <label key={est.id} className={`chip-premium ${formData.estrategias_eval.includes(est.id) ? 'selected' : ''}`}>
                                        <input
                                            type="checkbox"
                                            value={est.id}
                                            checked={formData.estrategias_eval.includes(est.id)}
                                            onChange={(e) => {
                                                const id = parseInt(e.target.value);
                                                const newEst = e.target.checked
                                                    ? [...formData.estrategias_eval, id]
                                                    : formData.estrategias_eval.filter(x => x !== id);
                                                setFormData({ ...formData, estrategias_eval: newEst });
                                            }}
                                        />
                                        {est.nombre}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="form-grid-premium">
                            <div className="form-field">
                                <label>Competencias</label>
                                <textarea
                                    rows="3"
                                    value={formData.competencias}
                                    onChange={(e) => setFormData({ ...formData, competencias: e.target.value })}
                                    placeholder="Describa las competencias..."
                                />
                            </div>
                            <div className="form-field">
                                <label>Instrumentos</label>
                                <textarea
                                    rows="3"
                                    value={formData.instrumentos}
                                    onChange={(e) => setFormData({ ...formData, instrumentos: e.target.value })}
                                    placeholder="Describa los instrumentos..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-premium-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={submitting}>
                            {submitting ? 'Guardando...' : 'Crear Evaluación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
