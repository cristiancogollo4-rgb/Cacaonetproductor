import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, TextField, Button, Alert, CircularProgress, Card, CardContent, 
    Avatar, Grid, Divider, InputAdornment, MenuItem, Snackbar 
} from '@mui/material';
import { 
    Save, 
    AccountCircle, 
    Phone, 
    LocationOn, 
    Agriculture, 
    AccountBalance, 
    CreditCard, 
    SupportAgent, 
    Logout,
    Map,           
    LocationCity,  
    Home           
} from '@mui/icons-material';
import { db, doc, updateDoc, auth, signOut } from '../firebase.js';

const ProfileScreen = ({ userId, initialData }) => {
    // Datos Personales
    const [producerName, setProducerName] = useState('');
    const [fincaName, setFincaName] = useState('');
    const [phone, setPhone] = useState('');
    const [hectares, setHectares] = useState('');
    
    // UBICACIÓN DETALLADA
    const [department, setDepartment] = useState('');
    const [municipality, setMunicipality] = useState('');
    const [vereda, setVereda] = useState('');

    // Datos Bancarios
    const [bankName, setBankName] = useState('');
    const [accountType, setAccountType] = useState('');
    const [accountNumber, setAccountNumber] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ open: false, text: '', severity: 'success' });

    // Cargar datos iniciales
    useEffect(() => {
        if (initialData) {
            setProducerName(initialData.producerName || '');
            setFincaName(initialData.fincaName || '');
            setPhone(initialData.phone || '');
            setHectares(initialData.hectares || '');
            
            setDepartment(initialData.department || '');
            setMunicipality(initialData.municipality || '');
            setVereda(initialData.vereda || initialData.location || ''); 

            setBankName(initialData.bankName || '');
            setAccountType(initialData.accountType || '');
            setAccountNumber(initialData.accountNumber || '');
        }
    }, [initialData]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const docRef = doc(db, "producers", userId);
            
            // String completo para compatibilidad
            const fullLocation = `${municipality}, ${department} - Vda. ${vereda}`;

            await updateDoc(docRef, {
                producerName,
                fincaName,
                phone,
                hectares,
                
                department,
                municipality,
                vereda,
                location: fullLocation, 
                
                bankName,
                accountType,
                accountNumber,
                lastUpdated: new Date()
            });
            setMessage({ open: true, text: 'Perfil actualizado correctamente', severity: 'success' });
        } catch (error) {
            console.error("Error actualizando perfil:", error);
            setMessage({ open: true, text: 'Error al guardar cambios.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        signOut(auth);
    };

    return (
        <Box sx={{ width: '100%', p: 2, pb: 10 }}>
            
            {/* CABECERA */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: '#795548', fontSize: 40, mb: 1 }}>
                    {producerName ? producerName.charAt(0).toUpperCase() : <AccountCircle />}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3e2723' }}>
                    {producerName || 'Productor'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                    {municipality ? `${municipality}, ${department}` : 'Ubicación sin definir'}
                </Typography>
            </Box>

            <form onSubmit={handleUpdateProfile}>
                
                {/* SECCIÓN 1: DATOS DE LA FINCA Y UBICACIÓN */}
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <Agriculture sx={{ mr: 1, fontSize: 20 }} /> INFORMACIÓN DE LA FINCA
                </Typography>
                <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Nombre del Productor"
                                    fullWidth variant="outlined" size="small"
                                    value={producerName} onChange={(e) => setProducerName(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Nombre de la Finca"
                                    fullWidth variant="outlined" size="small"
                                    value={fincaName} onChange={(e) => setFincaName(e.target.value)}
                                />
                            </Grid>

                            {/* --- UBICACIÓN DETALLADA --- */}
                            <Grid item xs={12}>
                                <Divider sx={{ my: 0.5 }}><Typography variant="caption">UBICACIÓN</Typography></Divider>
                            </Grid>
                            
                            <Grid item xs={6}>
                                <TextField
                                    label="Departamento"
                                    placeholder="Ej. Santander"
                                    fullWidth variant="outlined" size="small"
                                    value={department} onChange={(e) => setDepartment(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Map fontSize="small" /></InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Ciudad / Municipio"
                                    placeholder="Ej. Rionegro"
                                    fullWidth variant="outlined" size="small"
                                    value={municipality} onChange={(e) => setMunicipality(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><LocationCity fontSize="small" /></InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Vereda / Corregimiento"
                                    placeholder="Ej. Vda. La Esperanza"
                                    fullWidth variant="outlined" size="small"
                                    value={vereda} onChange={(e) => setVereda(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Home fontSize="small" /></InputAdornment>,
                                    }}
                                />
                            </Grid>

                            {/* Contacto y Producción */}
                            <Grid item xs={12}>
                                <Divider sx={{ my: 0.5 }}><Typography variant="caption">CONTACTO Y PRODUCCIÓN</Typography></Divider>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Celular"
                                    fullWidth variant="outlined" size="small"
                                    value={phone} onChange={(e) => setPhone(e.target.value)}
                                    type="number"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Hectáreas Cacao"
                                    fullWidth variant="outlined" size="small"
                                    value={hectares} onChange={(e) => setHectares(e.target.value)}
                                    type="number"
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* SECCIÓN 2: DATOS DE PAGO */}
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#2E7D32', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <AccountBalance sx={{ mr: 1, fontSize: 20 }} /> DATOS PARA PAGOS
                </Typography>
                <Card elevation={2} sx={{ borderRadius: 3, mb: 3, borderLeft: '4px solid #2E7D32' }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="Banco / Billetera"
                                    fullWidth variant="outlined" size="small"
                                    value={bankName} onChange={(e) => setBankName(e.target.value)}
                                >
                                    <MenuItem value="Bancolombia">Bancolombia</MenuItem>
                                    <MenuItem value="Nequi">Nequi</MenuItem>
                                    <MenuItem value="Daviplata">Daviplata</MenuItem>
                                    <MenuItem value="Davivienda">Davivienda</MenuItem>
                                    <MenuItem value="Banco Agrario">Banco Agrario</MenuItem>
                                    <MenuItem value="Efectivo">Efectivo</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="Tipo de Cuenta"
                                    fullWidth variant="outlined" size="small"
                                    value={accountType} onChange={(e) => setAccountType(e.target.value)}
                                >
                                    <MenuItem value="Ahorros">Ahorros</MenuItem>
                                    <MenuItem value="Corriente">Corriente</MenuItem>
                                    <MenuItem value="Celular">Número Celular</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Número de Cuenta / Celular"
                                    fullWidth variant="outlined" size="small"
                                    value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                                    type="number"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><CreditCard fontSize="small" /></InputAdornment>,
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    sx={{ mb: 2, py: 1.5, bgcolor: '#795548', '&:hover': { bgcolor: '#5D4037' }, borderRadius: 2 }}
                    disabled={loading}
                >
                    {loading ? 'Guardando...' : 'Actualizar Perfil'}
                </Button>
            </form>

            <Divider sx={{ my: 3 }} />

            <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<SupportAgent />} 
                sx={{ mb: 2, color: '#5D4037', borderColor: '#5D4037' }}
                // AQUÍ ESTÁ LA ACTUALIZACIÓN DEL NÚMERO:
                onClick={() => window.open('https://wa.me/573160567337', '_blank')}
            >
                Soporte Técnico
            </Button>

            <Button variant="text" fullWidth startIcon={<Logout />} color="error" onClick={handleLogout}>
                Cerrar Sesión
            </Button>

            <Snackbar 
                open={message.open} 
                autoHideDuration={4000} 
                onClose={() => setMessage({ ...message, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setMessage({ ...message, open: false })} severity={message.severity} sx={{ width: '100%' }}>
                    {message.text}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProfileScreen;