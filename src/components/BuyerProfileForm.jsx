import React, { useState, useEffect } from 'react';
// Importaciones
import { db } from '../firebase'; 
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { 
    Box, Typography, TextField, Button, Card, CardContent, Grid, MenuItem, 
    CircularProgress, InputAdornment, Avatar, Divider, Paper, Container
} from '@mui/material';
import { 
    Business, Person, Phone, LocationOn, Storefront, LocalShipping, Save, 
    ShoppingBag, Badge, Map, LocationCity, VerifiedUser
} from '@mui/icons-material';

const BuyerProfileForm = ({ userId, onSaved }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Estados
    const [buyerName, setBuyerName] = useState(''); 
    const [companyName, setCompanyName] = useState(''); 
    const [nit, setNit] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [city, setCity] = useState('');
    const [buyerType, setBuyerType] = useState(''); 
    const [preferredQuality, setPreferredQuality] = useState(''); 
    const [monthlyVolume, setMonthlyVolume] = useState(''); 

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const docRef = doc(db, "buyers", userId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setBuyerName(data.buyerName || '');
                    setCompanyName(data.companyName || '');
                    setNit(data.nit || '');
                    setPhone(data.phone || '');
                    setDepartment(data.department || '');
                    setCity(data.city || '');
                    setBuyerType(data.buyerType || '');
                    setPreferredQuality(data.preferredQuality || '');
                    setMonthlyVolume(data.monthlyVolume || '');
                }
            } catch (err) {
                console.error("Error cargando perfil:", err);
            }
        };
        if (userId) fetchProfile();
    }, [userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!buyerName || !phone || !city || !buyerType) {
                throw new Error("Por favor completa los campos obligatorios (*)");
            }

            await updateDoc(doc(db, "buyers", userId), {
                buyerName, companyName, nit, phone, department, city,
                buyerType, preferredQuality, monthlyVolume,
                isProfileComplete: true, 
                updatedAt: new Date()
            });

            if (onSaved) await onSaved();

        } catch (err) {
            console.error(err);
            setError(err.message);
            setLoading(false);
        }
    };

    // Componente para Títulos de Sección
    const SectionHeader = ({ icon, title }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
            <Box sx={{ bgcolor: '#E3F2FD', p: 1, borderRadius: '50%', mr: 2, color: '#1565C0' }}>
                {icon}
            </Box>
            <Typography variant="h6" sx={{ color: '#1565C0', fontWeight: 'bold', fontSize: '1rem' }}>
                {title}
            </Typography>
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F5F7FA', py: 4, px: 2, display: 'flex', justifyContent: 'center' }}>
            <Container maxWidth="md">
                
                {/* Tarjeta Principal */}
                <Card elevation={6} sx={{ borderRadius: 4, overflow: 'visible' }}>
                    
                    {/* Encabezado con Degradado */}
                    <Box sx={{ 
                        background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)', 
                        p: 4, 
                        textAlign: 'center', 
                        color: 'white',
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        mb: 2
                    }}>
                        <Avatar sx={{ 
                            bgcolor: 'white', color: '#1565C0', width: 70, height: 70, mx: 'auto', mb: 2,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}>
                            <Storefront fontSize="large" />
                        </Avatar>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Perfil de Comprador
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            Completa tu ficha comercial para acceder al mercado de cacao.
                        </Typography>
                    </Box>

                    <CardContent sx={{ p: { xs: 2, md: 5 } }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={4}>
                                
                                {/* SECCIÓN 1: QUIÉN ERES */}
                                <Grid item xs={12}>
                                    <SectionHeader icon={<Business />} title="INFORMACIÓN COMERCIAL" />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <TextField fullWidth label="Nombre del Representante" variant="outlined" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} disabled={loading}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action"/></InputAdornment> }} 
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField fullWidth label="Celular / WhatsApp" type="number" variant="outlined" required value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Phone color="action"/></InputAdornment> }} 
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField fullWidth label="Empresa / Razón Social (Opcional)" variant="outlined" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={loading}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><VerifiedUser color="action"/></InputAdornment> }} 
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField fullWidth label="NIT / Cédula" variant="outlined" value={nit} onChange={(e) => setNit(e.target.value)} disabled={loading}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Badge color="action"/></InputAdornment> }} 
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>

                                <Grid item xs={12}><Divider /></Grid>

                                {/* SECCIÓN 2: DÓNDE ESTÁS */}
                                <Grid item xs={12}>
                                    <SectionHeader icon={<LocationOn />} title="UBICACIÓN DE ACOPIO" />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <TextField fullWidth label="Departamento" placeholder="Ej. Santander" variant="outlined" required value={department} onChange={(e) => setDepartment(e.target.value)} disabled={loading}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Map color="action"/></InputAdornment> }} 
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField fullWidth label="Ciudad / Municipio" placeholder="Ej. Bucaramanga" variant="outlined" required value={city} onChange={(e) => setCity(e.target.value)} disabled={loading}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><LocationCity color="action"/></InputAdornment> }} 
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>

                                <Grid item xs={12}><Divider /></Grid>

                                {/* SECCIÓN 3: QUÉ BUSCAS */}
                                <Grid item xs={12}>
                                    <SectionHeader icon={<ShoppingBag />} title="INTERESES DE COMPRA" />
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 2 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <TextField select fullWidth label="Tipo de Comprador" required value={buyerType} onChange={(e) => setBuyerType(e.target.value)} disabled={loading}>
                                                    <MenuItem value="Exportador">Exportador</MenuItem>
                                                    <MenuItem value="Transformador Industrial">Transformador Industrial</MenuItem>
                                                    <MenuItem value="Chocolatero Artesanal">Chocolatero Artesanal</MenuItem>
                                                    <MenuItem value="Intermediario">Intermediario</MenuItem>
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <TextField select fullWidth label="Calidad de Interés" required value={preferredQuality} onChange={(e) => setPreferredQuality(e.target.value)} disabled={loading}>
                                                    <MenuItem value="Premium">Premium (Fino de Aroma)</MenuItem>
                                                    <MenuItem value="Estandar">Estándar / Corriente</MenuItem>
                                                    <MenuItem value="Pasilla">Pasilla / Industrial</MenuItem>
                                                    <MenuItem value="Todo">Compro de todo</MenuItem>
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <TextField select fullWidth label="Volumen Mensual" value={monthlyVolume} onChange={(e) => setMonthlyVolume(e.target.value)} disabled={loading}>
                                                    <MenuItem value="Pequeño">Menos de 500 Kg</MenuItem>
                                                    <MenuItem value="Mediano">500 Kg - 2 Toneladas</MenuItem>
                                                    <MenuItem value="Grande">Más de 2 Toneladas</MenuItem>
                                                </TextField>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>

                                {/* MENSAJES Y BOTÓN */}
                                {error && (
                                    <Grid item xs={12}>
                                        <Paper sx={{ p: 2, bgcolor: '#FFEBEE', color: '#C62828', borderRadius: 2 }}>
                                            <Typography variant="body2">⚠️ {error}</Typography>
                                        </Paper>
                                    </Grid>
                                )}

                                <Grid item xs={12} sx={{ mt: 2 }}>
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        fullWidth 
                                        size="large"
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={24} color="inherit"/> : <Save />}
                                        sx={{ 
                                            bgcolor: '#1565C0', 
                                            py: 2, 
                                            fontSize: '1.1rem',
                                            borderRadius: 3,
                                            textTransform: 'none',
                                            boxShadow: '0 8px 16px rgba(21, 101, 192, 0.3)',
                                            '&:hover': { bgcolor: '#0D47A1', transform: 'translateY(-2px)', boxShadow: '0 10px 20px rgba(21, 101, 192, 0.4)' },
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {loading ? 'Guardando Perfil...' : 'Guardar y Acceder al Mercado'}
                                    </Button>
                                </Grid>

                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default BuyerProfileForm;