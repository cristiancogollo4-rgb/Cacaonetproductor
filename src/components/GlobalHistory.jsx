import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot } from '../firebase';
import { 
    Box, Typography, Card, CardContent, Grid, Skeleton, Stack, LinearProgress, Paper 
} from '@mui/material';
import { 
    BarChart, 
    Scale, 
    MonetizationOn, 
    WorkspacePremium, 
    Science,
    Public,     
    ThumbUp,    
    Opacity,        
    ReportProblem,
    CheckCircle,
    Cancel
} from '@mui/icons-material';

// Componente auxiliar para los círculos de progreso visual
const CircularProgressVariant = ({ value, color, icon }) => (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <Box sx={{ 
            width: 50, height: 50, borderRadius: '50%', 
            border: `3px solid ${color}40`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
            {icon}
        </Box>
        <Box sx={{ 
            position: 'absolute', top: 0, left: 0, width: 50, height: 50, borderRadius: '50%',
            border: `3px solid ${color}`, borderRightColor: 'transparent', borderBottomColor: 'transparent',
            transform: 'rotate(-45deg)'
        }} />
    </Box>
);

const GlobalHistory = ({ userId }) => {
    const [stats, setStats] = useState({
        totalKilos: 0,
        totalEarnings: 0,
        totalDeliveries: 0,
        avgPricePerKg: 0,
        
        // Datos Técnicos
        avgFermentation: 0,
        avgMoisture: 0,
        avgDefects: 0,
        
        // Perfil
        dominantProfile: 'N/A', 
        dominantColor: '#bdbdbd',

        // Desglose de Kilos
        kilosExport: 0,
        kilosNational: 0,
        kilosRejected: 0,
        totalAnalyzedKilos: 0,
        
        // Textos y Ratios
        exportRatio: 0,
        exportPercentage: 0,
        fermentationMsg: 'Calculando...',
        moistureMsg: 'Calculando...',
        exportMsg: 'Calculando...',
        defectsMsg: 'Calculando...'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const q = query(collection(db, "deliveries"), where("producerId", "==", userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let sumKilos = 0;
            let sumEarnings = 0;
            let count = 0;
            let sumSoldKilos = 0; 
            
            let sumFermentation = 0;
            let sumMoisture = 0;
            let sumDefects = 0;
            let countAnalyzed = 0;

            // Variables para clasificar Kilos
            let kExport = 0;
            let kNational = 0;
            let kRejected = 0;
            let kAnalyzedTotal = 0;

            snapshot.forEach((doc) => {
                try {
                    const data = doc.data();
                    const peso = parseFloat(data.weightKg_Bruto);
                    const safePeso = isNaN(peso) ? 0 : peso;

                    // 1. Suma Total Física (Independiente del estado)
                    if (safePeso > 0) sumKilos += safePeso;

                    // 2. Suma Financiera (Solo Pagados)
                    if (data.status === 'Vendido' && data.totalPayment) {
                        const pago = parseFloat(data.totalPayment);
                        if (!isNaN(pago)) {
                            sumEarnings += pago;
                            sumSoldKilos += safePeso;
                        }
                    }

                    // 3. CLASIFICACIÓN Y CALIDAD (Si tiene 'qualityGrade')
                    if (data.qualityGrade) {
                        countAnalyzed++;
                        kAnalyzedTotal += safePeso;

                        // Convertimos a mayúsculas para comparar fácil
                        const grade = String(data.qualityGrade).toUpperCase();
                        
                        // --- LÓGICA DE CLASIFICACIÓN ---
                        
                        // A. RECHAZO: Si contiene "RECHAZO", "PASILLA" o "C"
                        if (grade.includes('RECHAZO') || grade.includes('PASILLA') || grade.includes('DEFECTO')) {
                            kRejected += safePeso;
                        }
                        // B. EXPORTACIÓN: Si contiene "EXPORT" o "PREMIUM" o "A" (pero NO estándar)
                        else if (grade.includes('EXPORT') || grade.includes('PREMIUM') || grade.includes('FINO') || grade === 'A') {
                            kExport += safePeso;
                        }
                        // C. NACIONAL: Todo lo demás ("Nacional Estandar", "B", etc.)
                        else {
                            kNational += safePeso;
                        }

                        // --- ACUMULAR MÉTRICAS TÉCNICAS ---
                        if (!isNaN(parseFloat(data.fermentationScore))) sumFermentation += parseFloat(data.fermentationScore);
                        if (!isNaN(parseFloat(data.moisturePercentage))) sumMoisture += parseFloat(data.moisturePercentage);
                        if (!isNaN(parseFloat(data.defectsPercentage))) sumDefects += parseFloat(data.defectsPercentage);
                    }
                    count++;
                } catch (err) {
                    console.warn("Error en documento:", doc.id);
                }
            });

            // --- CÁLCULOS FINALES ---

            // Promedios
            const avgFermentation = countAnalyzed > 0 ? (sumFermentation / countAnalyzed) : 0;
            const avgMoisture = countAnalyzed > 0 ? (sumMoisture / countAnalyzed) : 0;
            const avgDefects = countAnalyzed > 0 ? (sumDefects / countAnalyzed) : 0;
            const avgPrice = sumSoldKilos > 0 ? (sumEarnings / sumSoldKilos) : 0;

            // Ratio de Exportación (Base: Total Analizado)
            // Evitamos división por cero
            const exportPct = kAnalyzedTotal > 0 ? (kExport / kAnalyzedTotal) * 100 : 0;
            const ratio10 = Math.round((kExport / kAnalyzedTotal) * 10) || 0;

            // Diagnósticos de Texto (Restaurados)
            let fMsg = "Datos insuficientes.";
            if (avgFermentation >= 75) fMsg = "Excelente. Perfil Fino de Aroma.";
            else if (avgFermentation >= 60) fMsg = "Bueno. Estándar internacional.";
            else if (countAnalyzed > 0) fMsg = "Bajo. Revisa el proceso de fermentación.";

            let mMsg = "Normal.";
            if (avgMoisture > 8) mMsg = "ALERTA: Riesgo de hongos (>8%).";
            else if (avgMoisture < 6.5 && countAnalyzed > 0) mMsg = "Cuidado: Grano muy seco.";
            else if (countAnalyzed > 0) mMsg = "Óptima (7.0% - 7.5%).";

            let eMsg = "Faltan datos.";
            if (exportPct > 70) eMsg = "¡Finca Exportadora! Calidad Alta.";
            else if (exportPct > 30) eMsg = "Potencial Mixto.";
            else if (countAnalyzed > 0) eMsg = "Enfoque Nacional.";

            let dMsg = "Sin analizar";
            if (countAnalyzed > 0) {
                if (avgDefects <= 3) dMsg = "Excelente limpieza.";
                else if (avgDefects <= 6) dMsg = "Aceptable.";
                else dMsg = "Alto rechazo físico.";
            }

            // Perfil Predominante
            let dominantProfile = "Sin datos";
            let dominantColor = "#bdbdbd";
            const maxKilos = Math.max(kExport, kNational, kRejected);
            
            if (kAnalyzedTotal > 0) {
                if (maxKilos > 0) {
                    if (maxKilos === kExport) { dominantProfile = "EXPORTACIÓN"; dominantColor = "#1A237E"; }
                    else if (maxKilos === kNational) { dominantProfile = "NACIONAL"; dominantColor = "#F57C00"; }
                    else { dominantProfile = "RECHAZO"; dominantColor = "#D32F2F"; }
                } else {
                    dominantProfile = "Pendiente";
                }
            }

            setStats({
                totalKilos: sumKilos,
                totalEarnings: sumEarnings,
                totalDeliveries: count,
                avgPricePerKg: avgPrice,
                avgFermentation: avgFermentation.toFixed(1),
                avgMoisture: avgMoisture.toFixed(1),
                avgDefects: avgDefects.toFixed(1),
                
                dominantProfile,
                dominantColor,

                kilosExport: kExport,
                kilosNational: kNational,
                kilosRejected: kRejected,
                totalAnalyzedKilos: kAnalyzedTotal,

                exportRatio: ratio10,
                exportPercentage: exportPct.toFixed(1),
                
                fermentationMsg: fMsg,
                moistureMsg: mMsg,
                exportMsg: eMsg,
                defectsMsg: dMsg
            });
            setLoading(false);

        }, (error) => { console.error(error); setLoading(false); });

        return () => unsubscribe();
    }, [userId]);

    const formatMoney = (amount) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount || 0);
    const formatKilos = (amount) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(amount || 0);
    const getPercent = (val) => stats.totalAnalyzedKilos > 0 ? (val / stats.totalAnalyzedKilos) * 100 : 0;

    if (loading) {
        return (
            <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                    {[...Array(3)].map((_, i) => (
                        <Grid size={{ xs: 12 }} key={i}><Skeleton height={150} sx={{ borderRadius: 3 }} /></Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BarChart sx={{ color: '#5D4037', mr: 1, fontSize: 32 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#5D4037' }}>Estadísticas</Typography>
            </Box>

            {/* --- POTENCIAL EXPORTADOR (RATIO DE 10) --- */}
            <Card elevation={3} sx={{ borderRadius: 3, mb: 3, border: '1px solid #1A237E' }}>
                <Box sx={{ bgcolor: '#1A237E', p: 1.5, display: 'flex', alignItems: 'center', color: 'white' }}>
                    <Public sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight="bold">POTENCIAL EXPORTADOR</Typography>
                </Box>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 5 }} sx={{ textAlign: 'center', borderRight: '1px solid #eee' }}>
                            <Typography variant="h1" sx={{ fontWeight: 'bold', color: '#1A237E', fontSize: '3.5rem' }}>
                                {stats.exportRatio}<span style={{ fontSize: '0.3em', color: '#9FA8DA' }}>/10</span>
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#3949AB', display: 'block', lineHeight: 1 }}>
                                KILOS EXPORTABLES
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 7 }}>
                            <Box sx={{ display: 'flex', alignItems: 'start', bgcolor: '#E8EAF6', p: 1, borderRadius: 1 }}>
                                <ThumbUp sx={{ fontSize: 16, color: '#1A237E', mr: 0.5, mt: 0.3 }} />
                                <Typography variant="caption" color="#1A237E" sx={{ lineHeight: 1.2 }}>
                                    {stats.exportMsg}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* --- COMPARATIVO DE CALIDAD (EXPORT VS NACIONAL VS RECHAZO) --- */}
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#5D4037', fontWeight: 'bold' }}>
                DISTRIBUCIÓN DE CALIDAD (KILOS)
            </Typography>
            <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent>
                    <Stack spacing={2}>
                        {/* Exportación */}
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" fontWeight="bold" sx={{ color: '#1A237E', display: 'flex', alignItems: 'center' }}>
                                    <WorkspacePremium fontSize="small" sx={{ mr: 0.5 }} /> Exportación
                                </Typography>
                                <Typography variant="caption" fontWeight="bold">{formatKilos(stats.kilosExport)} Kg</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={getPercent(stats.kilosExport)} sx={{ height: 8, borderRadius: 5, bgcolor: '#E8EAF6', '& .MuiLinearProgress-bar': { bgcolor: '#1A237E' } }} />
                        </Box>

                        {/* Nacional */}
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" fontWeight="bold" sx={{ color: '#F57C00', display: 'flex', alignItems: 'center' }}>
                                    <CheckCircle fontSize="small" sx={{ mr: 0.5 }} /> Nacional Estándar
                                </Typography>
                                <Typography variant="caption" fontWeight="bold">{formatKilos(stats.kilosNational)} Kg</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={getPercent(stats.kilosNational)} sx={{ height: 8, borderRadius: 5, bgcolor: '#FFF3E0', '& .MuiLinearProgress-bar': { bgcolor: '#F57C00' } }} />
                        </Box>

                        {/* Rechazo */}
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" fontWeight="bold" sx={{ color: '#D32F2F', display: 'flex', alignItems: 'center' }}>
                                    <Cancel fontSize="small" sx={{ mr: 0.5 }} /> Rechazo
                                </Typography>
                                <Typography variant="caption" fontWeight="bold">{formatKilos(stats.kilosRejected)} Kg</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={getPercent(stats.kilosRejected)} sx={{ height: 8, borderRadius: 5, bgcolor: '#FFEBEE', '& .MuiLinearProgress-bar': { bgcolor: '#D32F2F' } }} />
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {/* --- FINANCIERO Y VOLUMEN --- */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card elevation={2} sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', color: 'white', height: '100%' }}>
                        <CardContent>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>INGRESOS NETOS</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{formatMoney(stats.totalEarnings)}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, opacity: 0.9 }}>
                                <MonetizationOn sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography variant="caption">Promedio: {formatMoney(stats.avgPricePerKg)} / Kg</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card elevation={2} sx={{ borderRadius: 3, height: '100%', borderLeft: '6px solid #795548' }}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">VOLUMEN TOTAL</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3e2723', mt: 0.5 }}>{formatKilos(stats.totalKilos)}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, color: 'text.secondary' }}>
                                <Scale sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography variant="caption">{stats.totalDeliveries} lotes entregados</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* --- TÉCNICO --- */}
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#5D4037', fontWeight: 'bold' }}>DIAGNÓSTICO TÉCNICO</Typography>
            <Card elevation={2} sx={{ borderRadius: 3, mb: 2 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2, borderBottom: '1px solid #eee', pb: 2 }}>
                        <Grid size={{ xs: 3 }} sx={{ textAlign: 'center' }}>
                            <CircularProgressVariant value={stats.avgFermentation} color="#7B1FA2" icon={<Science sx={{ color: '#7B1FA2', fontSize: 20 }} />} />
                        </Grid>
                        <Grid size={{ xs: 9 }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="#7B1FA2">Fermentación: {stats.avgFermentation}%</Typography>
                            <Typography variant="caption" color="text.secondary">{stats.fermentationMsg}</Typography>
                        </Grid>
                    </Grid>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 3 }} sx={{ textAlign: 'center' }}>
                            <CircularProgressVariant value={(stats.avgMoisture / 10) * 100} color="#0288D1" icon={<Opacity sx={{ color: '#0288D1', fontSize: 20 }} />} />
                        </Grid>
                        <Grid size={{ xs: 9 }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="#0288D1">Humedad Promedio: {stats.avgMoisture}%</Typography>
                            <Typography variant="caption" color="text.secondary">{stats.moistureMsg}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* --- PERFIL Y DEFECTOS --- */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center', height: '100%' }}>
                        <WorkspacePremium sx={{ color: stats.dominantColor, mb: 0.5 }} />
                        <Typography variant="caption" display="block" color="text.secondary">PERFIL PREDOMINANTE</Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: stats.dominantColor, fontSize: '0.9rem' }}>
                            {stats.dominantProfile}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center', height: '100%' }}>
                        <ReportProblem sx={{ color: '#D32F2F', mb: 0.5 }} />
                        <Typography variant="caption" display="block" color="text.secondary">DEFECTOS FÍSICOS</Typography>
                        <Typography variant="h6" fontWeight="bold" color="#D32F2F">{stats.avgDefects}%</Typography>
                        <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', color: '#D32F2F' }}>
                            {stats.defectsMsg}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default GlobalHistory;