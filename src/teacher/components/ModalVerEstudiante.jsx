import React from 'react';

export default function ModalVerEstudiante({ estudiante, onClose }) {
    if (!estudiante) return null;

    const formattedDate = (dateString) => {
        if (!dateString || dateString === 'Sin registros.') return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="modal-overlay active" onClick={(e) => e.target.className === 'modal-overlay active' && onClose()}>
            <div className="modal-estudiante">
                <div className="estudiante-header">
                    <div className="estudiante-avatar">
                        <i className="fas fa-user"></i>
                    </div>
                    <div className="estudiante-info-header">
                        <h2>{estudiante.nombre} {estudiante.apellido}</h2>
                        <p><i className="fas fa-graduation-cap"></i> <span>{estudiante.carrera_nombre || 'Sin carrera asignada'}</span></p>
                    </div>
                </div>

                <div className="estudiante-estado">
                    <span>Estado del Estudiante</span>
                    <span className={`badge-estado ${estudiante.estudiante_activo ? 'activo' : 'inactivo'}`}>
                        {estudiante.estudiante_activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                </div>

                <div className="estudiante-section">
                    <h3><i className="fas fa-info-circle"></i> Información Personal</h3>
                    
                    <div className="info-item">
                        <div className="info-icon cedula-icon">
                            <i className="fas fa-id-card"></i>
                        </div>
                        <div className="info-content">
                            <span className="info-label">CÉDULA DE IDENTIDAD</span>
                            <span className="info-value">{estudiante.cedula}</span>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon email-icon">
                            <i className="fas fa-envelope"></i>
                        </div>
                        <div className="info-content">
                            <span className="info-label">CORREO ELECTRÓNICO</span>
                            <a href={`mailto:${estudiante.email}`} className="info-value info-link">{estudiante.email}</a>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon phone-icon">
                            <i className="fas fa-phone"></i>
                        </div>
                        <div className="info-content">
                            <span className="info-label">TELÉFONO</span>
                            <span className="info-value">{estudiante.telefono || 'No registrado'}</span>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon calendar-icon">
                            <i className="fas fa-calendar"></i>
                        </div>
                        <div className="info-content">
                            <span className="info-label">FECHA DE NACIMIENTO</span>
                            <span className="info-value">{formattedDate(estudiante.fecha_nacimiento)}</span>
                        </div>
                    </div>
                </div>

                <div className="estudiante-section">
                    <h3><i className="fas fa-chart-bar"></i> Estadísticas Académicas</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Total Evaluaciones</span>
                            <span className="stat-value">{estudiante.total_evaluaciones || 0}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Promedio General</span>
                            <span className="stat-value">{estudiante.promedio_puntaje ? parseFloat(estudiante.promedio_puntaje).toFixed(2) : '0.00'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Última Evaluación</span>
                            <span className="stat-value">{formattedDate(estudiante.ultima_evaluacion)}</span>
                        </div>
                    </div>
                </div>

                <button className="btn-cerrar" onClick={onClose}>
                    <i className="fas fa-times"></i> Cerrar
                </button>
            </div>
        </div>
    );
}
