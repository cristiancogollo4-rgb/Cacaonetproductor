// src/components/PaymentsHistory.jsx
import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import { MonetizationOn } from '@mui/icons-material';

const PaymentsHistory = ({ userId }) => {
    // Datos simulados (reemplazar con una consulta a Firestore si hay una colección 'payments')
    const pagos = [
        { id: 1, fecha: "15/11/2025", monto: 450000, estado: "Pagado" },
        { id: 2, fecha: "01/11/2025", monto: 320000, estado: "Pagado" },
    ];
    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#2E7D32' }}>
                Pagos Recibidos (Usuario: {userId.substring(0, 5)}...)
            </Typography>
            <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                {pagos.map((pago) => (
                    <div key={pago.id}>
                        <ListItem>
                            <Box sx={{ mr: 2, bgcolor: '#E8F5E9', p: 1, borderRadius: '50%' }}>
                                <MonetizationOn color="success" />
                            </Box>
                            <ListItemText primary={`$${pago.monto.toLocaleString()}`} secondary={`Fecha: ${pago.fecha}`} />
                            <Chip label={pago.estado} color="success" size="small" />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                    </div>
                ))}
            </List>
        </Box>
    );
};

export default PaymentsHistory;