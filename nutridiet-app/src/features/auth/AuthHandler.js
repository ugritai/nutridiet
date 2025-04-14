import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthHandler() {
    const navigate = useNavigate();

    useEffect(() => {
        const refreshAccessToken = async () => {
            const token = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');

            if (!token && refreshToken) {
                try {
                    const res = await fetch('http://localhost:8000/api/auth/refresh', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem('accessToken', data.access_token);
                    } else {
                        throw new Error('Refresh token inválido');
                    }
                } catch {
                    localStorage.clear();
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
