import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, query, where, orderBy, onSnapshot } from '../firebase.js';
import {
    Box, Typography, Button, Paper, Chip, Dialog, DialogContent, 
    Skeleton, Fab, Grid, Divider, LinearProgress, Stack, IconButton, Stepper, Step, StepLabel
} from '@mui/material';
import {
    CalendarToday, CheckCircle, Warning, Cancel, AttachMoney, HourglassEmpty, 
    Add as AddIcon, Close, SearchOff, Science, WorkspacePremium, LocalShipping
} from '@mui/icons-material';
import AddDeliveryForm from './AddDeliveryForm';

// --- 1. CONFIGURACIÓN VISUAL ---
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

const getGradeColor = (grade) => {
    const g = grade ? grade.toString().toUpperCase() : '';
    if (g === 'A' || g === 'PREMIUM') return '#2E7D32';
    if (g === 'B' || g === 'ESTÁNDAR' || g === 'ESTANDAR') return '#F9A825';
    if (g === 'C') return '#EF6C00';
    return '#C62828'; 
};

const DeliveriesList = ({ userId }) => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('Todos');
    const [openDetails, setOpenDetails] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [openAddForm, setOpenAddForm] = useState(false);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        const q = query(collection(db, "deliveries"), where("producerId", "==", userId), orderBy("deliveryDate", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setDeliveries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => { console.error(err); setLoading(false); });
        return () => unsubscribe();
    }, [userId]);

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

    const formatMoney = (amount) => {
        if (amount === undefined || amount === null) return '$0';
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    // --- CAMBIO AQUÍ: Nuevos nombres para la línea de tiempo ---
    const steps = ['Recibido', 'Análisis', 'Inventario', 'Vendido'];
    
    const getActiveStep = (status) => {
        if (status === 'Pendiente de Análisis') return 1; // Está en Análisis
        if (status === 'Pendiente de Pago') return 2;     // Ya pasó análisis, está en Inventario
        if (status === 'Pagado') return 4;                // Ya se vendió (paso final completado)
        return 0;
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Header */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ color: '#5D4037', fontWeight: 'bold' }}>
                    Mis Entregas <span style={{ fontSize: '0.8em', color: '#999' }}>({filteredDeliveries.length})</span>
                </Typography>
            </Box>

            {/* Tabs */}
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', mb: 3, pb: 1 }}>
                {tabs.map((tab) => (
                    <Button key={tab.value} variant={selectedTab === tab.value ? 'contained' : 'outlined'} onClick={() => setSelectedTab(tab.value)} size="small" sx={{ borderRadius: 5, bgcolor: selectedTab === tab.value ? '#795548' : 'transparent', color: selectedTab === tab.value ? 'white' : '#795548', borderColor: '#795548', whiteSpace: 'nowrap' }}>
                        {tab.label}
                    </Button>
                ))}
            </Box>

            {/* Lista */}
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

            <Fab color="primary" sx={{ position: 'fixed', bottom: 80, right: 30, bgcolor: '#795548', zIndex: 2000 }} onClick={() => setOpenAddForm(true)}>
                <AddIcon />
            </Fab>

            <AddDeliveryForm open={openAddForm} onClose={() => setOpenAddForm(false)} userId={userId} onDeliveryAdded={() => {}} />

            {/* --- DIÁLOGO DE DETALLES --- */}
            <Dialog open={openDetails} onClose={handleCloseDetails} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
                {selectedDelivery && (() => {
                    const statusConfig = getStatusConfig(selectedDelivery.status);
                    const isAnalyzed = !!selectedDelivery.qualityGrade;

                    return (
                        <>
                            {/* HEADER */}
                            <Box sx={{ bgcolor: statusConfig.color, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {statusConfig.icon}
                                    <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>{statusConfig.label}</Typography>
                                </Box>
                                <IconButton onClick={handleCloseDetails} sx={{ color: 'white' }}><Close /></IconButton>
                            </Box>

                            <DialogContent sx={{ p: 0 }}>
                                {/* INFO LOTE */}
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

                                {/* STEPPER (LÍNEA DE TRAZABILIDAD) */}
                                <Box sx={{ px: 2, py: 3 }}>
                                    <Stepper activeStep={getActiveStep(selectedDelivery.status)} alternativeLabel>
                                        {steps.map((label) => (
                                            <Step key={label}>
                                                <StepLabel>{label}</StepLabel>
                                            </Step>
                                        ))}
                                    </Stepper>
                                </Box>

                                <Divider />

                                {/* CONTENIDO PRINCIPAL */}
                                <Box sx={{ p: 3 }}>
                                    {!isAnalyzed ? (
                                        // VISTA: ANÁLISIS PENDIENTE
                                        <Box sx={{ textAlign: 'center', py: 2 }}>
                                            <Paper elevation={0} sx={{ bgcolor: '#FFF3E0', p: 3, borderRadius: 2, mb: 2 }}>
                                                <Science sx={{ fontSize: 50, color: '#F57C00', mb: 1 }} />
                                                <Typography variant="h6" gutterBottom sx={{ color: '#E65100' }}>
                                                    Muestra en Laboratorio
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Estamos analizando la humedad, fermentación y calidad física de tu entrega. 
                                                    Una vez completado, el lote pasará a inventario.
                                                </Typography>
                                            </Paper>
                                            {/* Se eliminó el mensaje de "Tiempo estimado" como pediste */}
                                        </Box>
                                    ) : (
                                        // VISTA: ANÁLISIS COMPLETADO
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#5D4037' }}>
                                                RESULTADOS DE CALIDAD
                                            </Typography>
                                            
                                            <Paper elevation={0} sx={{ 
                                                bgcolor: getGradeColor(selectedDelivery.qualityGrade), 
                                                color: 'white', p: 2, borderRadius: 3, mb: 3,
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>CALIFICACIÓN GLOBAL</Typography>
                                                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>GRADO {selectedDelivery.qualityGrade}</Typography>
                                                </Box>
                                                <WorkspacePremium sx={{ fontSize: 50, opacity: 0.9 }} />
                                            </Paper>

                                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                                <Grid item xs={6}>
                                                    <Box sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2 }}>
                                                        <Typography variant="caption" color="text.secondary">HUMEDAD</Typography>
                                                        <Typography variant="h6" color="#0277BD">{selectedDelivery.moisturePercentage || 0}%</Typography>
                                                        <LinearProgress variant="determinate" value={Number(selectedDelivery.moisturePercentage || 0) * 5} sx={{ mt: 0.5, height: 4 }} />
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Box sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2 }}>
                                                        <Typography variant="caption" color="text.secondary">FERMENTACIÓN</Typography>
                                                        <Typography variant="h6" color="#7B1FA2">{selectedDelivery.fermentationScore || 0}%</Typography>
                                                        <LinearProgress variant="determinate" color="secondary" value={Number(selectedDelivery.fermentationScore || 0)} sx={{ mt: 0.5, height: 4 }} />
                                                    </Box>
                                                </Grid>
                                            </Grid>

                                            <Paper elevation={0} sx={{ bgcolor: '#F1F8E9', p: 2, borderRadius: 3, border: '1px solid #C5E1A5' }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#33691E', fontWeight: 'bold' }}>VALOR DE VENTA</Typography>
                                                        <Typography variant="h4" sx={{ color: '#33691E', fontWeight: 'bold' }}>
                                                            {formatMoney(selectedDelivery.totalPayment)}
                                                        </Typography>
                                                    </Box>
                                                    <Chip 
                                                        label={selectedDelivery.paymentStatus === 'Pagado' ? 'VENDIDO' : 'EN INVENTARIO'} 
                                                        color={selectedDelivery.paymentStatus === 'Pagado' ? 'success' : 'info'} 
                                                        sx={{ fontWeight: 'bold' }}
                                                    />
                                                </Stack>
                                                {selectedDelivery.pricePerKg && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                        Valorado a {formatMoney(selectedDelivery.pricePerKg)} por Kg
                                                    </Typography>
                                                )}
                                            </Paper>
                                        </Box>
                                    )}
                                </Box>
                            </DialogContent>
                        </>
                    );
                })()}
            </Dialog>
        </Box>
    );
};
export default DeliveriesList;