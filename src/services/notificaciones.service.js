import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

const getNotifications = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/notificaciones`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const markAsRead = async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/notificaciones/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/notificaciones/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export default {
    getNotifications,
    markAsRead,
    markAllAsRead
};
