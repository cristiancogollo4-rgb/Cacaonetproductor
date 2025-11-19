// src/components/ProducerProfileForm.jsx
import React, { useState } from 'react';
import { db, doc, setDoc, serverTimestamp } from '../firebase';
import { Container, Typography, TextField, Button, Card, CardContent, Box, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Person, Phone, HomeWork, Agriculture, PersonAdd } from '@mui/icons-material';

const ProducerProfileForm = ({ userId }) => {
    const [fincaName, setFincaName] = useState('');
    const [hectares, setHectares] = useState('');
    const [producerName, setProducerName] = useState(''); 
    const [phone, setPhone] = useState('');
    const [type, setType] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        if (!fincaName || !hectares || !producerName || !phone || !type) {
            setError("Todos los campos son obligatorios.");
            setSaving(false);
            return;
        }
        
        if (isNaN(parseFloat(hectares)) || parseFloat(hectares) <= 0) {
            setError("Las Hectáreas deben ser un número positivo.");
            setSaving(false);
            return;
        }

        try {
            await setDoc(doc(db, "producers", userId), {
                producerId: userId,
                fincaName: fincaName,
                hectares: parseFloat(hectares), 
                producerName: producerName,
                phone: phone,
                type: type, 
                createdAt: serverTimestamp() 
            });
        } catch (err) {
            console.error("Error al guardar perfil:", err);
            setError("Error al guardar el perfil. Intenta de nuevo.");
        }
        setSaving(false);
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Person sx={{ fontSize: 60, color: '#4CAF50' }} />
                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>Completa tu Perfil</Typography>
                <Typography variant="subtitle2" color="text.secondary">Información esencial de tu unidad productiva</Typography>
            </Box>
            <Card elevation={4}>
                <CardContent>
                    <form onSubmit={handleSaveProfile}>
                        <TextField fullWidth label="Nombre del Productor" type="text" variant="outlined" margin="normal" value={producerName} onChange={(e) => setProducerName(e.target.value)} required InputProps={{ startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} /> }} />
                        <TextField fullWidth label="Nombre de la Finca" type="text" variant="outlined" margin="normal" value={fincaName} onChange={(e) => setFincaName(e.target.value)} required InputProps={{ startAdornment: <HomeWork sx={{ mr: 1, color: 'action.active' }} /> }} />
                        <TextField fullWidth label="Hectáreas de la Finca" type="number" variant="outlined" margin="normal" value={hectares} onChange={(e) => setHectares(e.target.value)} required inputProps={{ min: "0.1", step: "0.1" }} />
                        <TextField fullWidth label="Teléfono de Contacto" type="tel" variant="outlined" margin="normal" value={phone} onChange={(e) => setPhone(e.target.value)} required InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} /> }} />

                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Tipo de Productor</InputLabel>
                            <Select value={type} label="Tipo de Productor" onChange={(e) => setType(e.target.value)} startAdornment={<Agriculture sx={{ mr: 1, color: 'action.active' }} />}>
                                <MenuItem value="Familiar">Familiar</MenuItem>
                                <MenuItem value="Gran Escala">Gran Escala</MenuItem>
                                <MenuItem value="Cooperativa">Cooperativa</MenuItem>
                            </Select>
                        </FormControl>

                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                        <Button 
                            type="submit" variant="contained" fullWidth size="large" disabled={saving}
                            startIcon={saving ? <CircularProgress size={20} color="inherit"/> : <PersonAdd />}
                            sx={{ mt: 3, py: 1.5, bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' } }}
                        >
                            {saving ? 'Guardando...' : 'Guardar y Continuar'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Container>
    );
};

export default ProducerProfileForm;