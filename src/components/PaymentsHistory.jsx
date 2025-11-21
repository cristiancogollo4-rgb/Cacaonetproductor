import React, { useState, useEffect } from 'react';
import { db, collection, query, where, orderBy, onSnapshot } from '../firebase';
import { 
    Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, 
    Paper, Divider, Stack
} from '@mui/material';
import { 
    AttachMoney, AccountBalanceWallet, TrendingUp, CalendarToday, 
    LocalShipping, CheckCircle, ReceiptLong
} from '@mui/icons-material';

const PaymentsHistory = ({ userId }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalEarned, setTotalEarned] = useState(0);

    // Formateador de moneda (Pesos Colombianos)
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            maximumFractionDigits: 0 
        }).format(amount || 0);
    };

    useEffect(() => {
        if (!userId) return;

        // CONSULTA: Entregas de este productor que ya fueron VENDIDAS
        // Nota: Si Firebase te pide crear un índice en la consola, sigue el link que te dará en el error.
        const q = query(
            collection(db, "deliveries"),
            where("producerId", "==", userId),
            where("status", "==", "Vendido"),
            orderBy("soldDate", "desc") // Ordenar por fecha de venta (más reciente primero)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setPayments(docs);
            
            // Calcular el total histórico
            const total = docs.reduce((sum, item) => sum + (parseFloat(item.totalPayment) || 0), 0);
            setTotalEarned(total);
            
            setLoading(false);
        }, (error) => {
            console.error("Error cargando pagos:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress sx={{ color: '#2E7D32' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 8 }}>
            
            {/* 1. TARJETA DE RESUMEN TOTAL */}
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 3, mb: 4, borderRadius: 3, 
                    background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                    color: 'white', position: 'relative', overflow: 'hidden'
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center' }}>
                        <AccountBalanceWallet sx={{ mr: 1 }} /> INGRESOS TOTALES
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
                        {formatMoney(totalEarned)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {payments.length} lotes vendidos exitosamente
                    </Typography>
                </Box>
                {/* Icono de fondo decorativo */}
                <TrendingUp sx={{ 
                    position: 'absolute', right: -20, bottom: -20, 
                    fontSize: 180, opacity: 0.1, color: 'white' 
                }} />
            </Paper>

            {/* 2. LISTA DE PAGOS */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#5D4037', display: 'flex', alignItems: 'center' }}>
                <ReceiptLong sx={{ mr: 1 }} /> Historial de Ventas
            </Typography>

            {payments.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 5, opacity: 0.6 }}>
                    <AttachMoney sx={{ fontSize: 60, color: '#ccc' }} />
                    <Typography>Aún no tienes lotes vendidos.</Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {payments.map((item) => {
                        // Formatear fecha de venta
                        let dateStr = "Fecha desconocida";
                        if (item.soldDate && item.soldDate.seconds) {
                            dateStr = new Date(item.soldDate.seconds * 1000).toLocaleDateString('es-ES', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            });
                        }

                        return (
                            <Grid item xs={12} key={item.id}>
                                <Card elevation={2} sx={{ borderRadius: 2, borderLeft: '6px solid #2E7D32' }}>
                                    <CardContent sx={{ pb: '16px !important' }}>
                                        
                                        {/* Encabezado de la Tarjeta */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Box>
                                                <Typography variant="h6" fontWeight="bold" color="#2E7D32">
                                                    {formatMoney(item.totalPayment)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Lote: {item.id.slice(-6).toUpperCase()}
                                                </Typography>
                                            </Box>
                                            <Chip 
                                                label="VENDIDO" 
                                                color="success" 
                                                size="small" 
                                                icon={<CheckCircle />}
                                                variant="outlined"
                                            />
                                        </Box>

                                        <Divider sx={{ my: 1.5 }} />

                                        {/* Detalles */}
                                        <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', color: '#555' }}>
                                                    <CalendarToday sx={{ fontSize: 16, mr: 1, color: '#795548' }} />
                                                    <Typography variant="body2">{dateStr}</Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', color: '#555' }}>
                                                    <LocalShipping sx={{ fontSize: 16, mr: 1, color: '#795548' }} />
                                                    <Typography variant="body2">{item.weightKg_Bruto} Kg</Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        {/* Detalles financieros extra (Opcional) */}
                                        {item.pricePerKg && (
                                            <Box sx={{ mt: 1.5, bgcolor: '#F1F8E9', p: 1, borderRadius: 1 }}>
                                                <Typography variant="caption" sx={{ color: '#33691E', display: 'block', textAlign: 'center' }}>
                                                    Pagado a {formatMoney(item.pricePerKg)} / Kg
                                                </Typography>
                                            </Box>
                                        )}

                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
};

export default PaymentsHistory;