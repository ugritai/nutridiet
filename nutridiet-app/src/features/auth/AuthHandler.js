import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthHandler() {
    const navigate = useNavigate();

    useEffect(() => {
        const refreshAccessToken = async () => {
            // Buscar en ambos almacenamientos
            const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

            if (!token && refreshToken) {
                try {
                    const res = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        // Guardar el nuevo token donde estuviera el refresh token
                        if (localStorage.getItem('refreshToken')) {
                            localStorage.setItem('accessToken', data.access_token);
                        } else {
                            sessionStorage.setItem('accessToken', data.access_token);
                        }
                    } else {
                        throw new Error('Refresh token inválido');
                    }
                } catch {
                    localStorage.clear();
                    sessionStorage.clear();
                    navigate('/sign-in');
                }
            } else if (!token && !refreshToken) {
                navigate('/sign-in');
            }
        };

        refreshAccessToken();
    }, [navigate]);

    return null;
}