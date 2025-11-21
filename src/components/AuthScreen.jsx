import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Box, Typography, TextField, Button, Card, CardContent, Alert, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Agriculture, Storefront, Login, PersonAdd } from '@mui/icons-material';
import logoCacaonet from '../assets/images/cacaonetlogo.png'; 

const AuthScreen = ({ initialError }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('producer'); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => { if (initialError) setError(initialError); }, [initialError]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            // --- NOMBRE DE COLECCIÓN ESTÁNDAR ---
            const collectionName = role === 'producer' ? 'producers' : 'buyers';
            
            // Guardamos intención para App.jsx
            sessionStorage.setItem('auth_intent_role', role);

            if (isLogin) {
                // LOGIN
                await signInWithEmailAndPassword(auth, email, password);
                // App.jsx manejará el resto
            } else {
                // REGISTRO
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // CREAR DOCUMENTO
                console.log(`Creando usuario en colección: ${collectionName}`); // Debug
                await setDoc(doc(db, collectionName, user.uid), {
                    email: user.email,
                    role: role,
                    createdAt: new Date(),
                    isProfileComplete: false,
                    nombre: '',
                    telefono: ''
                });
                
                setSuccessMessage('Cuenta creada. Ingresando...');
                setLoading(false); // Soltamos el botón para mostrar éxito
            }
        } catch (err) {
            console.error("Error Auth:", err);
            // Si el error es de permisos, lo decimos claramente
            if (err.code === 'permission-denied') {
                setError("Error de permisos en Firebase. Revisa las Reglas de Firestore.");
            } else {
                let msg = err.message;
                if (err.code === 'auth/email-already-in-use') msg = 'El correo ya está registrado.';
                if (err.code === 'auth/wrong-password') msg = 'Contraseña incorrecta.';
                if (err.code === 'auth/user-not-found') msg = 'Usuario no encontrado.';
                setError(msg);
            }
            setLoading(false);
            sessionStorage.removeItem('auth_intent_role');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2, bgcolor: '#f5f5f5' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                     <Box component="img" src={logoCacaonet} alt="Logo" sx={{ height: 100, width: 100, borderRadius: '50%', boxShadow: 3 }} />
                </Box>
                <Typography variant="subtitle1" color="text.secondary" fontWeight="bold">Plataforma de Comercialización</Typography>
            </Box>

            <Card elevation={4} sx={{ width: '100%', maxWidth: 400, borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <ToggleButtonGroup value={role} exclusive onChange={(e, n) => { if(n && !loading) setRole(n); }} fullWidth size="medium" disabled={loading}>
                            <ToggleButton value="producer" sx={{ '&.Mui-selected': { bgcolor: '#795548', color: 'white' } }}><Agriculture sx={{ mr: 1 }} /> Productor</ToggleButton>
                            <ToggleButton value="buyer" sx={{ '&.Mui-selected': { bgcolor: '#1565C0', color: 'white' } }}><Storefront sx={{ mr: 1 }} /> Comprador</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <form onSubmit={handleAuth}>
                        <TextField fullWidth label="Correo" type="email" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                        <TextField fullWidth label="Contraseña" type="password" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                        
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                        {successMessage && <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}
                        
                        <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mt: 3, py: 1.5, bgcolor: role === 'producer' ? '#795548' : '#1565C0' }}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? 'Ingresar' : 'Crear Cuenta')}
                        </Button>
                        <Button fullWidth sx={{ mt: 2 }} onClick={() => setIsLogin(!isLogin)} disabled={loading}>
                            {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};
export default AuthScreen;