import { jwtDecode } from 'jwt-decode';

// Use a relative base so requests go to the same origin (nginx) and get proxied to backend
const BASE_URL = '/api';

const getAccessToken = () => sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
const getRefreshToken = () => sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');

const setAccessToken = (token) => localStorage.setItem('accessToken', token);

const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const decoded = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    } catch (e) {
        console.error("Error in decoding token:", e);
        return true;
    }
};

const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) throw new Error('Refresh token inválido');
    const data = await res.json();
    setAccessToken(data.access_token);
    return data.access_token;
};

export const fetchWithAuth = async (url, options = {}) => {
    let token = getAccessToken();

    if (isTokenExpired(token)) {
        try {
            console.log('🔄 Access token caducado. Intentando refresh...');
            token = await refreshAccessToken();
            console.log('✅ Nuevo token obtenido:', token);
        } catch (err) {
            console.error('⛔ Error al refrescar token:', err);
            window.location.href = '/sign-in';
            return;
        }
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        console.warn('⚠️ Token inválido o no autorizado. Redirigiendo a login.');
        window.location.href = '/sign-in';
    }

    return response;
};