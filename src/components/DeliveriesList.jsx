import React, { useState, useEffect, useMemo } from 'react';

// --- 1. CORRECCIÓN DE IMPORTACIONES ---
// A. Importamos SOLO la conexión desde tu archivo local
import { db } from '../firebase'; 
// B. Importamos TODAS las funciones desde la librería oficial
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';

import {
    Box, Typography, Button, Paper, Chip, Dialog, DialogContent, DialogTitle, DialogActions,
    Skeleton, Fab, Grid, Stack, IconButton, Stepper, Step, StepLabel
} from '@mui/material';
import {
    CalendarToday, CheckCircle, Warning, Cancel,
    Add as AddIcon, Close, SearchOff, Science, LocalShipping,
    AccountBalance
} from '@mui/icons-material';

import AddDeliveryForm from './AddDeliveryForm';

// --- CONFIGURACIÓN VISUAL ---
const getStatusConfig = (status) => {
    switch (status) {
        case 'Pendiente de Análisis': 
            return { color: '#F57C00', bg: '#FFF3E0', label: 'En Análisis', icon: <Science /> };
        case 'Pendiente de Pago': 
            return { color: '#0288D1', bg: '#E1F5FE', label: 'En Inventario', icon: <LocalShipping /> };
        case 'Pagado': 
            return { color: '#2E7D32', bg: '#E8F5E9', label: 'Vendido', icon: <CheckCircle /> };
        case 'Rechazado': 
            return { color: '#C62828', bg: '#FFEBEE', label: 'Rechazado', icon: <Cancel /> };
        default: 
            return { color: '#757575', bg: '#F5F5F5', label: status, icon: <Warning /> };
    }
};

const DeliveriesList = ({ userId }) => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('Todos');
    const [openDetails, setOpenDetails] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [openAddForm, setOpenAddForm] = useState(false);

    // Estados de validación
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [showProfileAlert, setShowProfileAlert] = useState(false);
    const [missingFields, setMissingFields] = useState([]);

    // Función para validar texto
    const isValidText = (text) => {
        return text && typeof text === 'string' && text.trim().length > 0;
    };

    useEffect(() => {
        if (!userId) return;
        setLoading(true);

        // 1. Cargar Entregas
        const q = query(collection(db, "deliveries"), where("producerId", "==", userId), orderBy("deliveryDate", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setDeliveries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => { console.error(err); setLoading(false); });

        // 2. VALIDAR PERFIL
        const checkProfile = async () => {
            try {
                const docRef = doc(db, "producers", userId);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    
                    // Reglas de validación
                    const checks = [
                        { label: 'Nombre Completo', valid: isValidText(data.producerName) },
                        { label: 'Nombre de Finca', valid: isValidText(data.fincaName) },
                        { label: 'Celular', valid: isValidText(data.phone) },
                        { label: 'Ubicación', valid: (isValidText(data.location) || isValidText(data.municipality)) },
                        { label: 'Banco', valid: isValidText(data.bankName) },
                        { label: 'Tipo de Cuenta', valid: isValidText(data.accountType) },
                        { label: 'Número de Cuenta', valid: isValidText(data.accountNumber) }
                    ];

                    const missing = checks.filter(c => !c.valid).map(c => c.label);
                    setMissingFields(missing);
                    setIsProfileComplete(missing.length === 0); 

                } else {
                    setIsProfileComplete(false);
                    setMissingFields(['Perfil no creado']);
                }
            } catch (error) {
                console.error("Error validando perfil:", error);
            }
        };
        checkProfile();

        return () => unsubscribe();
    }, [userId]);

    const handleAddClick = () => {
        if (isProfileComplete) {
            setOpenAddForm(true);
        } else {
            setShowProfileAlert(true);
        }
    };

    const filteredDeliveries = useMemo(() => {
        switch (selectedTab) {
            case 'Todos': return deliveries;
            case 'Por Cobrar': return deliveries.filter(d => d.status === 'Pendiente de Pago');
            case 'Cobrado': return deliveries.filter(d => d.status === 'Pagado');
            default: return deliveries.filter(d => d.status === selectedTab);
        }
    }, [deliveries, selectedTab]);

    const handleOpenDetails = (d) => { setSelectedDelivery(d); setOpenDetails(true); };
    const handleCloseDetails = () => { setOpenDetails(false); setSelectedDelivery(null); };
    const tabs = [{ label: 'Todos', value: 'Todos' }, { label: 'En Análisis', value: 'Pendiente de Análisis' }, { label: 'Inventario', value: 'Pendiente de Pago' }, { label: 'Vendidos', value: 'Pagado' }];

    const steps = ['Recibido', 'Análisis', 'Inventario', 'Vendido'];
    
    const getActiveStep = (status) => {
        if (status === 'Pendiente de Análisis') return 1; 
        if (status === 'Pendiente de Pago') return 2;     
        if (status === 'Pagado') return 4;                
        return 0;
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ color: '#5D4037', fontWeight: 'bold' }}>
                    Mis Entregas <span style={{ fontSize: '0.8em', color: '#999' }}>({filteredDeliveries.length})</span>
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', mb: 3, pb: 1 }}>
                {tabs.map((tab) => (
                    <Button key={tab.value} variant={selectedTab === tab.value ? 'contained' : 'outlined'} onClick={() => setSelectedTab(tab.value)} size="small" sx={{ borderRadius: 5, bgcolor: selectedTab === tab.value ? '#795548' : 'transparent', color: selectedTab === tab.value ? 'white' : '#795548', borderColor: '#795548', whiteSpace: 'nowrap' }}>
                        {tab.label}
                    </Button>
                ))}
            </Box>

            {loading ? (
                <Grid container spacing={2} sx={{ width: '100%' }}>
                    {[...Array(3)].map((_, i) => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton height={150} sx={{ borderRadius: 3 }} /></Grid>)}
                </Grid>
            ) : filteredDeliveries.length === 0 ? (
                <Paper elevation={0} sx={{ width: '100%', p: 6, textAlign: 'center', border: '2px dashed #ccc', borderRadius: 4 }}>
                    <SearchOff sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No hay entregas aquí</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2} sx={{ width: '100%' }}>
                    {filteredDeliveries.map((delivery) => {
                        const config = getStatusConfig(delivery.status);
                        let fDate = '';
                        if (delivery.deliveryDate?.toDate) fDate = delivery.deliveryDate.toDate().toLocaleDateString('es-ES');
                        
                        return (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={delivery.id}>
                                <Paper 
                                    elevation={2} 
                                    onClick={() => handleOpenDetails(delivery)} 
                                    sx={{ 
                                        p: 2, borderRadius: 3, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                                        borderLeft: `6px solid ${config.color}`,
                                        transition: '0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3e2723' }}>{delivery.weightKg_Bruto} Kg</Typography>
                                        <Chip label={config.label} size="small" sx={{ bgcolor: config.bg, color: config.color, fontWeight: 'bold' }} />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                                        <CalendarToday sx={{ fontSize: 14, mr: 0.5 }} /> {fDate}
                                    </Typography>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            <Fab 
                color="primary" 
                sx={{ position: 'fixed', bottom: 80, right: 30, bgcolor: '#795548', zIndex: 2000 }} 
                onClick={handleAddClick}
            >
                <AddIcon />
            </Fab>

            <AddDeliveryForm open={openAddForm} onClose={() => setOpenAddForm(false)} userId={userId} onDeliveryAdded={() => {}} />

            <Dialog open={openDetails} onClose={handleCloseDetails} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
                {selectedDelivery && (() => {
                    const statusConfig = getStatusConfig(selectedDelivery.status);
                    return (
                        <>
                            <Box sx={{ bgcolor: statusConfig.color, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {statusConfig.icon}
                                    <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>{statusConfig.label}</Typography>
                                </Box>
                                <IconButton onClick={handleCloseDetails} sx={{ color: 'white' }}><Close /></IconButton>
                            </Box>
                            <DialogContent sx={{ p: 0 }}>
                                <Box sx={{ p: 3, bgcolor: '#FAFAFA', borderBottom: '1px solid #eee' }}>
                                    <Grid container alignItems="center">
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">ID LOTE</Typography>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                    {selectedDelivery.id ? selectedDelivery.id.substring(0, 8).toUpperCase() : '---'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                                <Typography variant="caption" color="text.secondary">PESO BRUTO</Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3e2723' }}>
                                                    {selectedDelivery.weightKg_Bruto} Kg
                                                </Typography>
                                            </Grid>
                                    </Grid>
                                </Box>
                                <Box sx={{ px: 2, py: 3 }}>
                                    <Stepper activeStep={getActiveStep(selectedDelivery.status)} alternativeLabel>
                                        {steps.map((label) => (
                                            <Step key={label}><StepLabel>{label}</StepLabel></Step>
                                        ))}
                                    </Stepper>
                                </Box>
                            </DialogContent>
                        </>
                    );
                })()}
            </Dialog>

            <Dialog open={showProfileAlert} onClose={() => setShowProfileAlert(false)}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: '#D32F2F', fontWeight: 'bold' }}>
                    <Warning sx={{ mr: 1 }} /> Acción Requerida
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Para gestionar entregas y pagos, necesitamos que completes tu perfil.
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#FFEBEE', color: '#C62828' }} variant="outlined">
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Cancel fontSize="small" sx={{ mr: 1 }} /> DATOS FALTANTES:
                        </Typography>
                        {missingFields.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                {missingFields.map((field, index) => (
                                    <li key={index}><Typography variant="body2">{field}</Typography></li>
                                ))}
                            </ul>
                        ) : (
                            <Typography variant="body2">Cargando información...</Typography>
                        )}
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowProfileAlert(false)} color="inherit">Cancelar</Button>
                    <Button variant="contained" color="primary" onClick={() => window.location.reload()}>Ir a Perfil (Recargar)</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DeliveriesList;