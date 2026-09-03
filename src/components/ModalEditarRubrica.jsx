import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { rubricasService } from '../services/rubricas.service';
import { academicoService } from '../services/academico.service';
import { validarEstructuraRubrica } from '../utils/evaluacionUtils';

export default function ModalEditarRubrica({
    isOpen,
    onClose,
    rubricaId,   // id de la rúbrica: propia (modo editar) o plantilla (modo duplicar)
    idEval,      // id_eval propio (modo editar) o evaluación destino (modo duplicar)
    modo = 'editar', // 'editar' | 'duplicar'
    onSaved
}) {
    const esDuplicado = modo === 'duplicar';

    const [saving, setSaving] = useState(false);
    const [currentRubricaId, setCurrentRubricaId] = useState(null);

    const [tiposRubrica, setTiposRubrica] = useState([]);
    const [carreras, setCarreras] = useState([]);
    const [semestres, setSemestres] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [secciones, setSecciones] = useState([]);
    const [evaluaciones, setEvaluaciones] = useState([]);

    const [formData, setFormData] = useState({
        nombre_rubrica: '',
        id_tipo: '',
        carrera_codigo: '',
        semestre: '',
        materia_codigo: '',
        seccion_id: '',
        evaluacion_id: '',
        fecha_evaluacion: '',
        porcentaje_evaluacion: 10,
        competencias: '',
        instrumentos: '',
        instrucciones: '',
        estrategias: [],
        criterios: []
    });

    useEffect(() => {
        if (isOpen && rubricaId) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, rubricaId, idEval, modo]);

    const handleCarreraChange = async (codigo) => {
        if (!codigo) { setSemestres([]); return; }
        const data = await academicoService.getSemestres(codigo);
        setSemestres(data);
    };

    const handleSemestreChange = async (carCod, sem) => {
        if (!sem) { setMaterias([]); return; }
        const data = await academicoService.getMaterias(carCod, sem);
        setMaterias(data);
    };

    const handleMateriaChange = async (matCod, carCod) => {
        if (!matCod) { setSecciones([]); return; }
        const data = await academicoService.getSecciones(matCod, carCod);
        setSecciones(data);
    };

    const handleSeccionChange = async (secId) => {
        if (!secId) { setEvaluaciones([]); return; }
        const data = await rubricasService.getEvaluacionesConRubrica(secId);
        setEvaluaciones(data);
    };

    const handleEvaluacionChange = (evalId) => {
        const evaluacion = evaluaciones.find(e => e.evaluacion_id == evalId);
        if (!evaluacion) return;

        const nuevoPorcentaje = evaluacion.valor || evaluacion.ponderacion || 10;
        const nuevosCriterios = redistribuirPuntajes(nuevoPorcentaje, formData.criterios);

        setFormData(prev => ({
            ...prev,
            evaluacion_id: evalId,
            porcentaje_evaluacion: nuevoPorcentaje,
            criterios: nuevosCriterios
        }));
    };

    const redistribuirPuntajes = (porcentaje, criterios) => {
        if (!criterios.length) return criterios;

        const numCriterios = criterios.length;
        const puntajeBase = Math.floor((porcentaje / numCriterios) * 1000) / 1000;
        const resto = parseFloat((porcentaje - puntajeBase * numCriterios).toFixed(3));
        const minBase = Math.floor((0.025 / numCriterios) * 1000) / 1000;
        const minResto = parseFloat((0.025 - minBase * numCriterios).toFixed(3));

        return criterios.map((c, idx) => {
            const nuevoMax = idx === numCriterios - 1
                ? parseFloat((puntajeBase + resto).toFixed(3))
                : puntajeBase;
            const minNivelCrit = idx === numCriterios - 1
                ? parseFloat((minBase + minResto).toFixed(3))
                : minBase;

            return {
                ...c,
                puntaje_maximo: nuevoMax,
                niveles: c.niveles.map((n) => {
                    let nuevoPuntaje = n.puntaje;
                    const nombre = (n.nombre_nivel || n.nombre || '').toLowerCase();

                    if (nombre.includes('excelente') || nombre.includes('sobresaliente')) {
                        nuevoPuntaje = nuevoMax;
                    } else if (nombre.includes('notable')) {
                        nuevoPuntaje = parseFloat((nuevoMax * 0.8).toFixed(3));
                    } else if (nombre.includes('aprobado') || nombre.includes('regular') || nombre.includes('bueno')) {
                        const factor = nombre.includes('aprobado') ? 0.6 : 0.5;
                        nuevoPuntaje = parseFloat((nuevoMax * factor).toFixed(3));
                    } else if (nombre.includes('insuficiente') || nombre.includes('deficiente')) {
                        nuevoPuntaje = minNivelCrit;
                    }

                    return { ...n, puntaje: nuevoPuntaje };
                })
            };
        });
    };

    const loadData = async () => {
        try {
            Swal.fire({ title: 'Cargando datos...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            const [tipos, , carrs] = await Promise.all([
                rubricasService.getTiposRubrica(),
                rubricasService.getEstrategiasEval(),
                academicoService.getCarreras()
            ]);

            setTiposRubrica(tipos);
            setCarreras(carrs);

            const res = esDuplicado
                ? await rubricasService.getRubricaForDuplica(rubricaId, idEval)
                : await rubricasService.getRubricaForEdit(rubricaId, idEval);

            if (res.success) {
                console.log(res)
                const r = res.rubrica;
                setCurrentRubricaId(rubricaId);

                const jerarquia = await rubricasService.getCarreraXSeccion(r.id_seccion);

                await handleCarreraChange(jerarquia.carrera_codigo);
                await handleSemestreChange(jerarquia.carrera_codigo, jerarquia.semestre);
                await handleMateriaChange(r.materia_codigo, jerarquia.carrera_codigo);
                await handleSeccionChange(r.seccion_id);

                setFormData({
                    nombre_rubrica: r.nombre_rubrica,
                    id_tipo: r.id_tipo,
                    carrera_codigo: jerarquia.carrera_codigo,
                    semestre: jerarquia.semestre,
                    materia_codigo: r.materia_codigo,
                    seccion_id: r.seccion_id,
                    evaluacion_id: r.evaluacion_id,
                    fecha_evaluacion: r.fecha_evaluacion ? r.fecha_evaluacion.split('T')[0] : '',
                    porcentaje_evaluacion: r.porcentaje_evaluacion,
                    competencias: r.competencias || '',
                    instrumentos: r.instrumentos || '',
                    instrucciones: r.instrucciones || '',
                    estrategias: r.estrategias ? r.estrategias.map(e => e.id) : [],
                    // En modo duplicado no arrastramos los ids de criterios/niveles originales
                    criterios: res.criterios.map((c, idx) => ({
                        id: esDuplicado ? null : c.id,
                        id_local: idx + 1,
                        descripcion: c.descripcion,
                        puntaje_maximo: c.puntaje_maximo,
                        orden: c.orden,
                        niveles: c.niveles.map((n, nidx) => ({
                            id: esDuplicado ? null : n.id,
                            id_local: nidx + 1,
                            nombre_nivel: n.nombre_nivel,
                            descripcion: n.descripcion,
                            puntaje: n.puntaje.toFixed(3),
                            orden: n.orden
                        }))
                    }))
                });

                Swal.close();
            } else {
                Swal.close();
                Swal.fire('Error', res.message || 'No se pudo cargar la rúbrica', 'error');
                onClose();
            }
        } catch (error) {
            Swal.close();
            console.error('Error loadData ModalEditarRubrica:', error);
            Swal.fire('Error', error.message || 'Error al cargar los datos', 'error');
            onClose();
        }
    };

    const handleAddCriterio = async () => {
        const confirm1 = await Swal.fire({
            title: '¿Está seguro de agregar un criterio?',
            text: 'Esta acción causará evaluaciones incompletas que tendrán que volverse a corregir.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        });
        if (!confirm1.isConfirmed) return;

        const confirm2 = await Swal.fire({
            title: 'Confirmación definitiva',
            text: '¿Realmente desea agregar un nuevo criterio a la rúbrica? Recuerde que deberá revisar las evaluaciones asociadas.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, agregar criterio',
            cancelButtonText: 'Cancelar'
        });
        if (!confirm2.isConfirmed) return;

        const nuevoCriterio = {
            id_local: Date.now(),
            descripcion: '',
            puntaje_maximo: '',
            orden: formData.criterios.length + 1,
            niveles: [
                { id_local: Date.now() + 1, nombre_nivel: 'Sobresaliente', descripcion: '', puntaje: '', orden: 1 },
                { id_local: Date.now() + 2, nombre_nivel: 'Notable', descripcion: '', puntaje: '', orden: 2 },
                { id_local: Date.now() + 3, nombre_nivel: 'Bueno', descripcion: '', puntaje: '', orden: 3 },
                { id_local: Date.now() + 4, nombre_nivel: 'Insuficiente', descripcion: '', puntaje: 0, orden: 4 }
            ]
        };

        const nuevosCriterios = redistribuirPuntajes(formData.porcentaje_evaluacion, [...formData.criterios, nuevoCriterio]);
        setFormData(prev => ({ ...prev, criterios: nuevosCriterios }));
    };

    const handleRemoveCriterio = async (idx) => {
        if (formData.criterios.length <= 1) {
            return Swal.fire('Aviso', 'Debe haber al menos un criterio', 'info');
        }

        const confirmDelete = await Swal.fire({
            title: '¿Está seguro de eliminar este criterio?',
            text: 'Las evaluaciones corregidas se adaptarán automáticamente a la nueva cantidad de criterios.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (!confirmDelete.isConfirmed) return;

        const tempCriterios = [...formData.criterios];
        tempCriterios.splice(idx, 1);
        const nuevosCriterios = redistribuirPuntajes(formData.porcentaje_evaluacion, tempCriterios);
        setFormData(prev => ({ ...prev, criterios: nuevosCriterios }));
    };

    const handleCriterioChange = (idx, field, value) => {
        const newCriterios = [...formData.criterios];

        if (field === 'puntaje_maximo') {
            const val = parseFloat(value) || 0;
            newCriterios[idx][field] = val;
            const excelenteIdx = newCriterios[idx].niveles.findIndex(n => n.nombre_nivel === 'Excelente');
            if (excelenteIdx !== -1) {
                newCriterios[idx].niveles[excelenteIdx].puntaje = val;
            }
        } else {
            newCriterios[idx][field] = value;
        }

        setFormData(prev => ({ ...prev, criterios: newCriterios }));
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

        setFormData(prev => ({ ...prev, criterios: newCriterios }));
    };

    const totalPuntosCriterios = formData.criterios.reduce(
        (acc, c) => acc + (parseFloat(c.puntaje_maximo) || 0), 0
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre_rubrica || !formData.id_tipo || !formData.evaluacion_id) {
            return Swal.fire('Atención', 'Complete los campos obligatorios del encabezado', 'warning');
        }

        const validacion = validarEstructuraRubrica({
            criterios: formData.criterios,
            porcentaje: formData.porcentaje_evaluacion,
            esCreacion: esDuplicado
        });

        if (!validacion.valido) {
            return Swal.fire('Error de Validación', validacion.mensaje, 'error');
        }

        try {
            setSaving(true);
            Swal.fire({
                title: esDuplicado ? 'Guardando...' : 'Actualizando...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const payload = {
                nombre_rubrica: formData.nombre_rubrica,
                id_evaluacion: formData.evaluacion_id,
                tipo_rubrica: formData.id_tipo,
                instrucciones: formData.instrucciones,
                porcentaje_evaluacion: formData.porcentaje_evaluacion,
                criterios: formData.criterios
            };
            const res = esDuplicado
                        ? await rubricasService.saveRubrica(payload)
                        : await rubricasService.updateRubrica(currentRubricaId, payload);

            Swal.close();

            if (res.success) {
                Swal.fire('Éxito', esDuplicado ? 'Rúbrica creada correctamente' : 'Rúbrica actualizada correctamente', 'success');
                if (onSaved) onSaved(res);
                onClose();
            } else {
                Swal.fire('Error', res.mensaje || 'Error al guardar', 'error');
            }
        } catch (error) {
            Swal.close();
            Swal.fire('Error', error.message || 'Fallo de conexión', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="modal-content" style={{ background: 'white', borderRadius: '15px', width: '95%', maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header" style={{ padding: '20px 30px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a' }}>
                        <i className={esDuplicado ? 'fas fa-copy' : 'fas fa-edit'}></i> {esDuplicado ? 'Nueva Rúbrica (desde plantilla)' : 'Editar Rúbrica'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Nombre de la Rúbrica *</label>
                            <input
                                type="text"
                                value={formData.nombre_rubrica}
                                onChange={(e) => setFormData(prev => ({ ...prev, nombre_rubrica: e.target.value }))}
                                className="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Tipo de Rúbrica *</label>
                            <select
                                value={formData.id_tipo}
                                onChange={(e) => setFormData(prev => ({ ...prev, id_tipo: e.target.value }))}
                                className="form-select"
                                required
                            >
                                <option value="">Seleccione tipo</option>
                                {tiposRubrica.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, marginRight: '20px' }}>
                                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Evaluación</label>
                                <select
                                    value={formData.evaluacion_id}
                                    onChange={(e) => handleEvaluacionChange(e.target.value)}
                                    className="form-select"
                                    required
                                    disabled={esDuplicado || !evaluaciones.length}
                                >
                                    <option value="">Seleccione evaluación</option>
                                    {evaluaciones.map(ev => (
                                        <option key={ev.evaluacion_id} value={ev.evaluacion_id}>
                                            {ev.contenido_evaluacion || ev.competencias} ({ev.valor || ev.ponderacion}%)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div>
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Carrera</label>
                            <select
                                value={formData.carrera_codigo}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, carrera_codigo: e.target.value }));
                                    handleCarreraChange(e.target.value);
                                }}
                                className="form-select"
                                disabled={esDuplicado}
                            >
                                <option value="" disabled={esDuplicado}>Seleccione carrera</option>
                                {carreras.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Semestre</label>
                            <select
                                value={formData.semestre}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, semestre: e.target.value }));
                                    handleSemestreChange(formData.carrera_codigo, e.target.value);
                                }}
                                className="form-select"
                                disabled={esDuplicado || !semestres.length}
                            >
                                <option value="">Seleccione semestre</option>
                                {semestres.map(s => <option key={s} value={s}>Semestre {s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Materia</label>
                            <select
                                value={formData.materia_codigo}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, materia_codigo: e.target.value }));
                                    handleMateriaChange(e.target.value, formData.carrera_codigo);
                                }}
                                className="form-select"
                                disabled={esDuplicado || !materias.length}
                            >
                                <option value="">Seleccione materia</option>
                                {materias.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sección</label>
                            <select
                                value={formData.seccion_id}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, seccion_id: e.target.value }));
                                    handleSeccionChange(e.target.value);
                                }}
                                className="form-select"
                                disabled={esDuplicado || !secciones.length}
                            >
                                <option value="">Seleccione sección</option>
                                {secciones.map(s => <option key={s.id} value={s.id}>{s.codigo}</option>)}
                            </select>
                        </div>
                        <div style={{ background: '#e0f2fe', padding: '10px 20px', borderRadius: '10px', border: '1px solid #7dd3fc', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase' }}>Suma de Criterios</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: Math.abs(totalPuntosCriterios) > 0.025 ? '#059669' : '#ef4444' }}>
                                {totalPuntosCriterios.toFixed(3)} / {formData.porcentaje_evaluacion}
                            </div>
                        </div>
                    </div>

                    <div className="criterios-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '10px', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#1e3a8a' }}>Criterios de Evaluación</h3>
                            <button type="button" onClick={handleAddCriterio} className="btns" style={{ background: '#10b981', color: 'white', padding: '8px 15px', borderRadius: '8px', fontSize: '0.9rem' }}>
                                <i className="fas fa-plus"></i> Agregar Criterio
                            </button>
                        </div>

                        {formData.criterios.map((c, cIdx) => (
                            <div key={c.id_local || cIdx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px', position: 'relative' }}>
                                <button type="button" onClick={() => handleRemoveCriterio(cIdx)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar criterio">
                                    <i className="fas fa-trash"></i>
                                </button>

                                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingRight: '40px' }}>
                                    <input
                                        type="text"
                                        placeholder="Descripción del criterio..."
                                        value={c.descripcion}
                                        onChange={(e) => handleCriterioChange(cIdx, 'descripcion', e.target.value)}
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                        required
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input
                                            type="number"
                                            step="0.001"
                                            placeholder="Pts"
                                            value={c.puntaje_maximo}
                                            onChange={(e) => handleCriterioChange(cIdx, 'puntaje_maximo', e.target.value)}
                                            style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
                                            required
                                        />
                                        <span style={{ fontWeight: 'bold' }}>Pts</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                    {c.niveles.map((n, nIdx) => (
                                        <div key={n.id_local || nIdx} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                            <input
                                                type="text"
                                                value={n.nombre_nivel}
                                                onChange={(e) => handleNivelChange(cIdx, nIdx, 'nombre_nivel', e.target.value)}
                                                style={{ fontWeight: 'bold', border: 'none', background: 'transparent', width: '100%', marginBottom: '5px', color: '#475569' }}
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
                        <button type="button" onClick={onClose} className="btns" style={{ background: '#94a3b8', color: 'white', padding: '12px 30px', borderRadius: '10px' }}>
                            Cancelar
                        </button>
                        <button type="submit" className="btns" style={{ background: '#1e3a8a', color: 'white', padding: '12px 45px', borderRadius: '10px', fontWeight: 'bold' }} disabled={saving}>
                            <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                            {saving ? (esDuplicado ? 'Guardando...' : 'Actualizando...') : (esDuplicado ? 'Guardar Rúbrica' : 'Guardar Cambios')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}