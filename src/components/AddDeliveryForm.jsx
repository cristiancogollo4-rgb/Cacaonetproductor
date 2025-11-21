import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert
} from '@mui/material';

// --- CORRECCIÓN DE IMPORTACIONES ---
// 1. Importamos la conexión a la base de datos desde tu archivo local
import { db } from '../firebase';
// 2. Importamos las funciones lógicas desde la librería oficial de Firebase
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AddDeliveryForm = ({ open, onClose, userId, onDeliveryAdded }) => {
    const [weightKg_Bruto, setWeightKg_Bruto] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log("AddDeliveryForm - Iniciando guardado.");

        if (!userId) {
            setError("Error de usuario. Por favor, vuelve a iniciar sesión.");
            setLoading(false);
            return;
        }

        if (!weightKg_Bruto || parseFloat(weightKg_Bruto) <= 0) {
            setError('Por favor, ingresa un peso válido.');
            setLoading(false);
            return;
        }

        try {
            const lotId = `LOT-${userId.slice(-4)}-${Date.now()}`;

            const newDelivery = {
                lotId,
                producerId: userId,
                weightKg_Bruto: parseFloat(weightKg_Bruto),
                deliveryDate: serverTimestamp(), // Usamos la función oficial aquí
                status: 'Pendiente de Análisis',
                paymentStatus: 'Pendiente de Pago',
                operatorId: null,
                analysisDate: null,
                moisturePercentage: null,
                fermentationScore: null,
                qualityGrade: null,
                qualityNotes: null,
                weightKg_Neto: null,
                pricePerKg: null,
                totalPayment: null,
            };

            console.log("Guardando en Firestore:", newDelivery);
            
            // Usamos la colección y la función addDoc importadas correctamente
            const docRef = await addDoc(collection(db, "deliveries"), newDelivery);
            console.log("Documento creado con ID:", docRef.id);

            if (onDeliveryAdded) onDeliveryAdded();
            onClose();
            setWeightKg_Bruto('');

        } catch (err) {
            console.error("ERROR al guardar:", err);
            setError(`No se pudo guardar. Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ bgcolor: '#795548', color: 'white' }}>
                Registrar Nueva Entrega
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ mt: 2 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Peso Bruto (Kg)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={weightKg_Bruto}
                        onChange={(e) => setWeightKg_Bruto(e.target.value)}
                        required
                        inputProps={{ min: "0.1", step: "0.1" }}
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} disabled={loading} color="inherit">Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#795548', '&:hover': { bgcolor: '#5D4037' } }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Guardar Entrega'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AddDeliveryForm;