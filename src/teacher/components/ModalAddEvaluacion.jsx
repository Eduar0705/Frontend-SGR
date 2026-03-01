import React, { useState, useEffect } from 'react';
import { evaluacionesService } from '../../services/evaluaciones.service';
import Swal from 'sweetalert2';

export default function ModalAddEvaluacion({ onClose, onSaved }) {
    const [carreras, setCarreras] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [secciones, setSecciones] = useState([]);
    const [rubricas, setRubricas] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    
    const [selectedCarrera, setSelectedCarrera] = useState('');
    const [selectedMateria, setSelectedMateria] = useState('');
    const [selectedSeccion, setSelectedSeccion] = useState('');
    const [selectedRubrica, setSelectedRubrica] = useState('');
    
    const [observaciones, setObservaciones] = useState('');
    const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);

    useEffect(() => {
        cargarDatosBasicos();
    }, []);

    const cargarDatosBasicos = async () => {
        try {
            const [resCarreras, resRubricas] = await Promise.all([
                evaluacionesService.getTeacherCarreras(),
                evaluacionesService.getTeacherRubricasActivas()
            ]);
            
            if (resCarreras?.success) {
                setCarreras(resCarreras.carreras || []);
                if (resCarreras.carreras.length === 0) {
                    console.log('No Careers for this teacher');
                }
            } else {
                Swal.fire('Error', resCarreras?.message || 'No se pudieron cargar las carreras', 'error');
            }

            if (resRubricas?.success) {
                setRubricas(resRubricas.rubricas || []);
            } else {
                Swal.fire('Error', resRubricas?.message || 'No se pudieron cargar las rúbricas', 'error');
            }
        } catch (error) {
            console.error('Error fetching basic data:', error);
            Swal.fire('Error', 'Error de conexión al cargar datos básicos', 'error');
        }
    };

    const handleCarreraChange = async (e) => {
        const cod = e.target.value;
        setSelectedCarrera(cod);
        setSelectedMateria('');
        setSelectedSeccion('');
        setEstudiantes([]);
        setMaterias([]);
        setSecciones([]);

        if (cod) {
            try {
                const res = await evaluacionesService.getTeacherMateriasByCarrera(cod);
                setMaterias(res?.success ? res.materias : []);
            } catch (error) {
                console.error('Error fetching materias:', error);
            }
        }
    };

    const handleMateriaChange = async (e) => {
        const cod = e.target.value;
        setSelectedMateria(cod);
        setSelectedSeccion('');
        setEstudiantes([]);
        setSecciones([]);

        if (cod) {
            try {
                const res = await evaluacionesService.getTeacherSecciones(cod);
                setSecciones(res?.success ? res.secciones : []);
            } catch (error) {
                console.error('Error fetching secciones:', error);
            }
        }
    };

    const handleSeccionChange = async (e) => {
        const seccionId = e.target.value;
        setSelectedSeccion(seccionId);
        setEstudiantes([]);

        if (seccionId) {
            setLoadingEstudiantes(true);
            try {
                const res = await evaluacionesService.getTeacherEstudiantes(seccionId);
                setEstudiantes(res?.success ? res.estudiantes : []);
            } catch (error) {
                console.error('Error fetching estudiantes:', error);
                Swal.fire('Error', 'No se pudieron cargar los estudiantes', 'error');
            } finally {
                setLoadingEstudiantes(false);
            }
        }
    };

    const handleGuardar = async () => {
        if (!selectedRubrica) {
            Swal.fire('Atención', 'Debe seleccionar una rúbrica', 'warning');
            return;
        }

        if (estudiantes.length === 0) {
            Swal.fire('Atención', 'No hay estudiantes seleccionados', 'warning');
            return;
        }

        try {
            Swal.fire({ title: 'Creando...', didOpen: () => Swal.showLoading() });
            
            const estudiantesIds = estudiantes.map(e => e.cedula);
            const resp = await evaluacionesService.createEvaluaciones(selectedRubrica, estudiantesIds, observaciones);

            if (resp.success) {
                Swal.fire('Éxito', resp.message || 'Evaluaciones creadas con éxito', 'success').then(() => onSaved());
            } else {
                Swal.fire('Error', resp.message || 'Error al crear', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Error al crear evaluaciones', 'error');
        }
    };

    const rubricaInfo = selectedRubrica ? rubricas.find(r => r.id.toString() === selectedRubrica) : null;

    return (
        <div className="modal active">
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%', background: 'white', borderRadius: '12px', padding: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                    <h2 style={{ margin: 0, color: '#1e293b' }}><i className="fas fa-plus-circle" style={{ color: '#10b981' }}></i> Nueva Evaluación</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2em', cursor: 'pointer', color: '#64748b' }}><i className="fas fa-times"></i></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Carrera</label>
                        <select 
                            value={selectedCarrera} 
                            onChange={handleCarreraChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="">Seleccione una carrera</option>
                            {carreras.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Rúbrica</label>
                        <select 
                            value={selectedRubrica} 
                            onChange={e => setSelectedRubrica(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="">Seleccione una rúbrica</option>
                            {rubricas.map(r => <option key={r.id} value={r.id}>{r.nombre_rubrica}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Materia</label>
                        <select 
                            value={selectedMateria} 
                            onChange={handleMateriaChange}
                            disabled={!selectedCarrera || materias.length === 0}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: (!selectedCarrera || materias.length === 0) ? '#f1f5f9' : 'white' }}
                        >
                            <option value="">Seleccione una materia</option>
                            {materias.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Sección</label>
                        <select 
                            value={selectedSeccion} 
                            onChange={handleSeccionChange}
                            disabled={!selectedMateria || secciones.length === 0}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: (!selectedMateria || secciones.length === 0) ? '#f1f5f9' : 'white' }}
                        >
                            <option value="">Seleccione una sección</option>
                            {secciones.map(s => <option key={s.id} value={s.id}>Sección {s.codigo}</option>)}
                        </select>
                    </div>
                </div>

                {rubricaInfo && (
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', color: '#475569', fontSize: '0.9em' }}>
                        <div><strong>Materia: </strong> {rubricaInfo.materia_nombre || 'N/A'}</div>
                        <div><strong>Tipo: </strong> {rubricaInfo.tipo_evaluacion || 'N/A'}</div>
                        <div><strong>Porcentaje: </strong> {rubricaInfo.porcentaje_evaluacion || 0}%</div>
                    </div>
                )}

                <div style={{ marginBottom: '25px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', minHeight: '150px', maxHeight: '250px', overflowY: 'auto' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Estudiantes a evaluar</h4>
                    {loadingEstudiantes ? (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}><i className="fas fa-spinner fa-spin"></i> Cargando estudiantes...</div>
                    ) : estudiantes.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {estudiantes.map(est => (
                                <div key={est.cedula} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ background: '#3b82f6', color: 'white', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8em', fontWeight: 'bold' }}>
                                            {est.nombre.charAt(0)}{est.apellido.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '500', color: '#1e293b', fontSize: '0.9em' }}>{est.nombre} {est.apellido}</div>
                                            <div style={{ fontSize: '0.8em', color: '#64748b' }}>CI: {est.cedula}</div>
                                        </div>
                                    </div>
                                    <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '20px', fontStyle: 'italic' }}>
                            {selectedSeccion ? 'No hay estudiantes en esta sección' : 'Seleccione carrera, materia y sección para cargar estudiantes'}
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Observaciones Iniciales (opcional)</label>
                    <textarea 
                        value={observaciones}
                        onChange={e => setObservaciones(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                        rows="2"
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                    <button 
                        onClick={handleGuardar} 
                        disabled={!selectedRubrica || estudiantes.length === 0}
                        style={{ padding: '10px 20px', background: (!selectedRubrica || estudiantes.length === 0) ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: (!selectedRubrica || estudiantes.length === 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                    >
                        <i className="fas fa-save" style={{ marginRight: '8px' }}></i> Crear Evaluaciones
                    </button>
                </div>
            </div>
        </div>
    );
}
