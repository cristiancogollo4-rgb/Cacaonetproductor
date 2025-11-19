// src/components/AddDeliveryForm.jsx
import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert
} from '@mui/material';
import { db, collection, addDoc, serverTimestamp } from '../firebase';

const AddDeliveryForm = ({ open, onClose, userId, onDeliveryAdded }) => {
    const [weightKg_Bruto, setWeightKg_Bruto] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // --- DEPURACIÓN: Revisamos los datos antes de enviar ---
        console.log("AddDeliveryForm - Iniciando guardado.");
        console.log("userId:", userId);
        console.log("weightKg_Bruto:", weightKg_Bruto);

        if (!userId) {
            console.error("Error Crítico: userId es nulo o indefinido.");
            setError("Error de usuario. Por favor, vuelve a iniciar sesión.");
            setLoading(false);
            return;
        }

        if (!weightKg_Bruto || parseFloat(weightKg_Bruto) <= 0) {
            console.error("Error de Validación: Peso inválido.");
            setError('Por favor, ingresa un peso válido.');
            setLoading(false);
            return;
        }

        try {
            const lotId = `LOT-${userId.slice(-4)}-${Date.now()}`;
            console.log("ID de Lote generado:", lotId);

            const newDelivery = {
                lotId,
                producerId: userId,
                weightKg_Bruto: parseFloat(weightKg_Bruto),
                deliveryDate: serverTimestamp(),
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

            console.log("Objeto a guardar en Firestore:", newDelivery);
            
            // --- DEPURACIÓN: El paso más crítico ---
            console.log("Intentando escribir en la colección 'deliveries'...");
            const docRef = await addDoc(collection(db, "deliveries"), newDelivery);
            console.log("Entrega guardada exitosamente con ID:", docRef.id);

            onDeliveryAdded();
            onClose();
            setWeightKg_Bruto('');

        } catch (err) {
            // --- DEPURACIÓN: Atrapamos cualquier error ---
            console.error("ERROR COMPLETO al agregar entrega:", err);
            console.error("Código de error:", err.code);
            console.error("Mensaje de error:", err.message);
            
            // Mensaje más amigable para el usuario
            setError(`No se pudo guardar la entrega. Error: ${err.message}`);
        } finally {
            setLoading(false);
            console.log("Proceso de guardado finalizado.");
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
                    <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#795548' }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Guardar Entrega'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AddDeliveryForm;