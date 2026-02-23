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

// src/api.js corregido

export const fetchWithAuth = async (url, options = {}) => {
    let token = getAccessToken();

    if (isTokenExpired(token)) {
        try {
            token = await refreshAccessToken();
        } catch (err) {
            window.location.href = '/sign-in';
            return;
        }
    }

    const headers = {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
    };

    // 🚀 LÓGICA CLAVE: Solo añadimos JSON si el body NO es FormData
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        window.location.href = '/sign-in';
    }

    return response;
};