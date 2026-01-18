import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';

export function LoginPage() {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            let res;
            if (isRegister) {
                res = await authApi.register(name, email, password);
            } else {
                res = await authApi.login(email, password);
            }

            localStorage.setItem('accessToken', res.accessToken);
            // Recargar para reiniciar estado de app
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100vh', gap: '1rem',
            backgroundColor: '#1a1a1a', color: 'white'
        }}>
            <h1>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h1>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
                {isRegister && (
                    <input
                        type="text" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)}
                        required style={{ padding: '0.5rem' }}
                    />
                )}
                <input
                    type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                    required style={{ padding: '0.5rem' }}
                />
                <input
                    type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
                    required style={{ padding: '0.5rem' }}
                />

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <button type="submit" style={{ padding: '0.5rem', cursor: 'pointer' }}>
                    {isRegister ? 'Registrarse' : 'Ingresar'}
                </button>
            </form>

            <button
                onClick={() => setIsRegister(!isRegister)}
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }}
            >
                {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
        </div>
    );
}
