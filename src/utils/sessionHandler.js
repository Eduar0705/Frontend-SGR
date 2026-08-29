import Swal from 'sweetalert2';
import axios from 'axios';

let isAlertShowing = false;

/**
 * Muestra la alerta de sesión expirada y redirige al login
 */
export function handleSessionExpired(customMessage = null) {
    if (isAlertShowing) return;

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    // Solo actuar si había una sesión activa previa
    if (!token && !user) return;

    isAlertShowing = true;

    // Limpiar almacenamiento local
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    Swal.fire({
        icon: 'warning',
        title: 'Sesión Expirada',
        text: customMessage || 'Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente para continuar.',
        confirmButtonText: 'Ir a Iniciar Sesión',
        confirmButtonColor: '#1e3a8a',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then(() => {
        isAlertShowing = false;
        window.location.href = '/login';
    });
}

/**
 * Obtiene el timestamp de expiración del JWT en milisegundos
 */
export function getJwtExpirationTime(token) {
    try {
        if (!token) return null;
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return null;
        const payload = JSON.parse(atob(payloadBase64));
        return payload.exp ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

/**
 * Inicializa interceptores globales para Axios y Fetch
 */
export function initSessionInterceptors() {
    // 1. Interceptor de Axios
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                const url = error.config?.url || '';
                const isAuthEndpoint = url.includes('/auth/login') || 
                                       url.includes('/auth/request-recovery') || 
                                       url.includes('/auth/reset-password');
                if (!isAuthEndpoint && localStorage.getItem('token')) {
                    handleSessionExpired();
                }
            }
            return Promise.reject(error);
        }
    );

    // 2. Interceptor global para fetch
    if (typeof window !== 'undefined' && window.fetch) {
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            try {
                const response = await originalFetch.apply(this, args);
                if (response.status === 401 || response.status === 403) {
                    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
                    const isAuthEndpoint = url.includes('/auth/login') || 
                                           url.includes('/auth/request-recovery') || 
                                           url.includes('/auth/reset-password');
                    if (!isAuthEndpoint && localStorage.getItem('token')) {
                        handleSessionExpired();
                    }
                }
                return response;
            } catch (error) {
                throw error;
            }
        };
    }
}
