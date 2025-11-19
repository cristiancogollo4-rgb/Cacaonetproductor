// src/components/AuthScreen.jsx
import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase';
import { Container, Typography, TextField, Button, Card, CardContent, Box, CircularProgress, Alert } from '@mui/material';
import { Agriculture, Login, PersonAdd } from '@mui/icons-material';

const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            let msg = err.message;
            if (err.code === 'auth/invalid-email') msg = 'Email inválido.';
            if (err.code === 'auth/wrong-password') msg = 'Contraseña incorrecta.';
            if (err.code === 'auth/user-not-found') msg = 'Usuario no encontrado.';
            if (err.code === 'auth/email-already-in-use') msg = 'Este correo ya está registrado.';
            if (err.code === 'auth/weak-password') msg = 'Contraseña débil.';
            setError(msg);
        }
        setCargando(false);
    };

    return (
        // Usamos un Box flexible que ocupe todo el alto disponible para centrar
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh', 
            bgcolor: '#f9f9f9', // Fondo suave dentro del contenedor
            p: 2
        }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                <Agriculture sx={{ fontSize: 80, color: '#5D4037', mb: 1 }} /> 
                <Typography variant="h4" component="h1" sx={{ color: '#5D4037', fontWeight: 'bold', textAlign: 'center' }}>
                    CacaoNet
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" align="center">
                    {isLogin ? 'Bienvenido Productor' : 'Crear Cuenta Nueva'}
                </Typography>
            </Box>

            <Card elevation={4} sx={{ width: '100%', maxWidth: '400px', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <form onSubmit={handleSubmit}>
                        <TextField fullWidth label="Correo Electrónico" type="email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <TextField fullWidth label="Contraseña" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                        
                        <Button type="submit" variant="contained" fullWidth size="large" disabled={cargando} 
                            startIcon={cargando ? <CircularProgress size={20} color="inherit"/> : (isLogin ? <Login /> : <PersonAdd />)} 
                            sx={{ mt: 3, py: 1.5, bgcolor: '#795548', '&:hover': { bgcolor: '#5D4037' }, borderRadius: 2 }}>
                            {cargando ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarme')}
                        </Button>
                        
                        <Button fullWidth variant="text" sx={{ mt: 2, color: '#5D4037', textTransform: 'none' }} onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default AuthScreen;