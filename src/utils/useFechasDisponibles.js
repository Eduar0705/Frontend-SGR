import axios from 'axios';
import { useState, useCallback } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';
// ── Utilidades ─────────────────────────────────────────────────────────────────
export function formatearFechaParaInput(fecha) {
    const year  = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day   = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function formatearFechaLocal(fecha) {
    if (!fecha) return '';
    if (typeof fecha === 'string') fecha = new Date(fecha);
    const day   = String(fecha.getDate()).padStart(2, '0');
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const year  = fecha.getFullYear();
    return `${day}/${month}/${year}`;
}

export function agruparFechasPorMes(fechas) {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const agrupadas = {};
    fechas.forEach(fecha => {
        const clave = `${meses[fecha.fecha.getMonth()]} ${fecha.fecha.getFullYear()}`;
        if (!agrupadas[clave]) agrupadas[clave] = [];
        agrupadas[clave].push(fecha);
    });
    return agrupadas;
}

// ── Hook principal ─────────────────────────────────────────────────────────────
export function useFechasDisponibles() {
    const [fechasSistema,       setFechasSistema]       = useState([]);
    const [configuracionFechas, setConfiguracionFechas] = useState(null);
    const [loadingFechas,       setLoadingFechas]       = useState(false);
    const [errorFechas,         setErrorFechas]         = useState(null);

    const cargarFechas = useCallback(async (seccionId, evaluacionesExistentes = []) => {
        setLoadingFechas(true);
        setErrorFechas(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/evaluaciones/seccion/${seccionId}/horario`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
            const data     = await response.data;
            if (!data.success || !data.horarios.length) {
                setFechasSistema([]);
                setLoadingFechas(false);
                return;
            }

            // 1. Armar configuración
            const horariosSeccion = data.horarios.map(h => ({
                id:          h.id,
                dia:         h.dia,
                dia_num:     h.dia_num,
                aula:        h.aula,
                modalidad:   h.modalidad,
                hora_inicio: h.hora_inicio,
                hora_cierre: h.hora_cierre,
                id_seccion:  h.id_seccion,
            }));

            const diasUnicos = [...new Set(horariosSeccion.map(h => h.dia_num))];

            const config = {
                seccion:        seccionId,
                periodo:        data.horarios[0].periodo,
                diasPermitidos: diasUnicos,
                fechaInicio:    data.horarios[0].fecha_inicio,
                fechaFin:       data.horarios[0].fecha_fin,
                horarios:       horariosSeccion,
            };

            setConfiguracionFechas(config);

            // 2. Fechas ocupadas solo de ESTA sección
            const fechasOcupadas = new Set(
                evaluacionesExistentes
                    .filter(ev => String(ev.id_seccion) === String(seccionId))
                    .map(ev => `${formatearFechaParaInput(new Date(ev.fecha_evaluacion))}_${ev.id_horario}`)
            );

            // 3. Generar todas las fechas disponibles dentro del período
            const fechaInicio  = new Date(config.fechaInicio);
            const fechaFin     = new Date(config.fechaFin);
            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin   .setHours(0, 0, 0, 0);

            const resultado   = [];
            const fechaActual = new Date(fechaInicio);

            while (fechaActual <= fechaFin) {
                const diaSemana      = fechaActual.getDay();
                // JS: 0=Dom,1=Lun... → tu formato: 0=Lun,...,6=Dom
                const diaEnTuFormato = diaSemana === 0 ? 6 : diaSemana - 1;

                if (config.diasPermitidos.includes(diaEnTuFormato)) {
                    const horariosDelDia = config.horarios.filter(h => h.dia_num === diaEnTuFormato);

                    horariosDelDia.forEach(horario => {
                        const fechaStr          = formatearFechaParaInput(fechaActual);
                        const claveFechaHorario = `${fechaStr}_${horario.id}`;

                        if (!fechasOcupadas.has(claveFechaHorario)) {
                            resultado.push({
                                fecha:      new Date(fechaActual),
                                fechaStr,
                                fechaLocal: formatearFechaLocal(fechaActual),
                                diaSemana:  horario.dia,
                                diaNumero:  horario.dia_num,
                                horarioId:  horario.id,
                                aula:       horario.aula,
                                modalidad:  horario.modalidad,
                                horaInicio: horario.hora_inicio,
                                horaCierre: horario.hora_cierre,
                            });
                        }
                    });
                }

                fechaActual.setDate(fechaActual.getDate() + 1);
            }

            resultado.sort((a, b) => a.fecha - b.fecha);
            setFechasSistema(resultado);

        } catch (err) {
            console.error('Error al cargar fechas:', err);
            setErrorFechas('No se pudieron cargar las fechas disponibles');
        } finally {
            setLoadingFechas(false);
        }
    }, []);

    const resetFechas = useCallback(() => {
        setFechasSistema([]);
        setConfiguracionFechas(null);
        setErrorFechas(null);
    }, []);

    return { fechasSistema, configuracionFechas, loadingFechas, errorFechas, cargarFechas, resetFechas };
}