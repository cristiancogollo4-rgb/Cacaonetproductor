import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
    Box, Typography, Card, CardContent, Grid, Chip, Button, 
    AppBar, Toolbar, Container, IconButton, Divider, BottomNavigation, 
    BottomNavigationAction, Paper, Badge, List, ListItem, ListItemText, 
    ListItemAvatar, Avatar, Alert, Snackbar, TextField, InputAdornment, MenuItem,
    CircularProgress // <--- ¡AQUÍ ESTÁ LA CORRECCIÓN!
} from '@mui/material';
import { 
    Storefront, Logout, WorkspacePremium, LocationOn, Science, 
    ShoppingCart, ReceiptLong, Person, AddShoppingCart, Delete, CheckCircle,
    Phone, Business, Edit, Save, Cancel, Map, LocationCity, ShoppingBag,
    WaterDrop, Agriculture
} from '@mui/icons-material';
import logoCacaonet from '../assets/images/cacaonetlogo.png'; 

// --- VISTA 1: MARKETPLACE ---
const MarketplaceView = ({ onAddToCart }) => {
    const [lots, setLots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "deliveries"), 
            where("status", "==", "Análisis Completo")
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const deliveriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const lotsWithFinca = await Promise.all(deliveriesData.map(async (lot) => {
                let fincaName = "Finca Desconocida";
                let location = "Ubicación N/A";

                if (lot.producerId) {
                    try {
                        const producerSnap = await getDoc(doc(db, "producers", lot.producerId));
                        if (producerSnap.exists()) {
                            const producerData = producerSnap.data();
                            fincaName = producerData.fincaName || "Sin Nombre";
                            if (producerData.municipality) {
                                location = producerData.municipality;
                            }
                        }
                    } catch (err) {
                        console.error("Error buscando finca:", err);
                    }
                }
                return { ...lot, fincaName, location };
            }));

            setLots(lotsWithFinca);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (lots.length === 0 && !loading) {
        return (
            <Box sx={{ textAlign: 'center', mt: 10, opacity: 0.6 }}>
                <Storefront sx={{ fontSize: 80, color: '#ccc' }} />
                <Typography variant="h6" color="text.secondary">No hay lotes disponibles en este momento.</Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={3}>
            {lots.map((lot) => (
                <Grid item xs={12} md={6} lg={4} key={lot.id}>
                    <Card elevation={4} sx={{ borderRadius: 3, transition: '0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        
                        <CardContent>
                            {/* 1. ENCABEZADO: Finca */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Agriculture sx={{ mr: 1, color: '#795548', fontSize: 28 }} />
                                <Typography variant="h6" fontWeight="bold" color="#3E2723" sx={{ lineHeight: 1.2 }}>
                                    {lot.fincaName}
                                </Typography>
                            </Box>

                            {/* 2. SUBTITULO: Grado y Lote */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Chip 
                                    label={`GRADO ${lot.qualityGrade || 'N/A'}`} 
                                    color={
                                        String(lot.qualityGrade).toUpperCase().includes('A') || 
                                        String(lot.qualityGrade).toUpperCase().includes('PREMIUM') 
                                        ? 'success' : 'warning'
                                    } 
                                    size="small"
                                    icon={<WorkspacePremium />}
                                    sx={{ fontWeight: 'bold', borderRadius: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ bgcolor:'#f5f5f5', px:1, py:0.5, borderRadius:1 }}>
                                    ID: {lot.id.slice(-6).toUpperCase()}
                                </Typography>
                            </Box>
                            
                            {/* 3. CUERPO: Peso y Precio */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1565C0', fontSize: '2.5rem' }}>
                                    {lot.weightKg_Bruto} <span style={{fontSize:'1rem', color:'#757575'}}>Kg</span>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    @ ${parseInt(lot.pricePerKg).toLocaleString()} / Kg
                                </Typography>
                            </Box>
                            
                            <Divider sx={{ mb: 2 }} />

                            {/* 4. DATOS TÉCNICOS */}
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#F3E5F5', p: 1, borderRadius: 2 }}>
                                        <Science fontSize="small" sx={{ mr: 1, color: '#7B1FA2' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Fermentación</Typography>
                                            <Typography variant="subtitle2" fontWeight="bold" color="#4A148C">{lot.fermentationScore}%</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#E1F5FE', p: 1, borderRadius: 2 }}>
                                        <WaterDrop fontSize="small" sx={{ mr: 1, color: '#0288D1' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Humedad</Typography>
                                            <Typography variant="subtitle2" fontWeight="bold" color="#01579B">{lot.moisturePercentage}%</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <LocationOn fontSize="small" sx={{ mr: 0.5, color: '#757575' }} />
                                <Typography variant="caption" color="text.secondary">
                                    Ubicación: {lot.location}
                                </Typography>
                            </Box>

                            {/* 5. FOOTER */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, bgcolor: '#FAFAFA', p: 1.5, borderRadius: 2, border: '1px solid #eee' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Total Lote</Typography>
                                    <Typography variant="h6" fontWeight="bold" color="#2E7D32">
                                        ${parseInt(lot.totalPayment || 0).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Button 
                                    variant="contained" 
                                    size="medium" 
                                    startIcon={<AddShoppingCart />} 
                                    onClick={() => onAddToCart(lot)} 
                                    sx={{ bgcolor: '#1565C0', borderRadius: 2, textTransform: 'none', px: 3 }}
                                >
                                    Agregar
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

// --- VISTA 2: CARRITO ---
const CartView = ({ cart, onRemove, onCheckout, loadingCheckout }) => {
    const total = cart.reduce((acc, item) => acc + (parseFloat(item.totalPayment) || 0), 0);
    const totalKilos = cart.reduce((acc, item) => acc + (parseFloat(item.weightKg_Bruto) || 0), 0);

    if (cart.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', mt: 10, opacity: 0.6 }}>
                <ShoppingCart sx={{ fontSize: 80, color: '#ccc' }} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>Tu carrito de compras está vacío.</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1565C0' }}>Resumen de Orden</Typography>
            <Card elevation={0} variant="outlined" sx={{ mb: 3, bgcolor: '#fff', border: '1px solid #e0e0e0' }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={6}>
                            <Typography color="text.secondary">Peso Neto Total</Typography>
                            <Typography variant="h4" fontWeight="bold" color="#424242">{totalKilos} Kg</Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography color="text.secondary">Valor Total a Pagar</Typography>
                            <Typography variant="h4" fontWeight="bold" color="#2E7D32">${total.toLocaleString()}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <List>
                {cart.map((item) => (
                    <Card key={item.id} sx={{ mb: 2, borderRadius: 2 }} elevation={1}>
                        <ListItem secondaryAction={
                            <IconButton edge="end" onClick={() => onRemove(item.id)} color="error">
                                <Delete />
                            </IconButton>
                        }>
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: '#E3F2FD', color: '#1565C0' }}><WorkspacePremium /></Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                                primary={`Lote ${item.qualityGrade} - ${item.fincaName}`}
                                secondary={`${item.weightKg_Bruto} Kg | Ferm: ${item.fermentationScore}%`}
                            />
                            <Typography fontWeight="bold" sx={{ mr: 2, color: '#2E7D32' }}>${parseInt(item.totalPayment).toLocaleString()}</Typography>
                        </ListItem>
                    </Card>
                ))}
            </List>

            <Button 
                variant="contained" fullWidth size="large" 
                onClick={onCheckout} disabled={loadingCheckout}
                sx={{ mt: 2, py: 2, bgcolor: '#2E7D32', fontSize: '1.1rem', borderRadius: 2, '&:hover': { bgcolor: '#1B5E20' } }}
            >
                {loadingCheckout ? 'Procesando Compra...' : `Confirmar Compra ($${total.toLocaleString()})`}
            </Button>
        </Box>
    );
};

// --- VISTA 3: MIS COMPRAS ---
const MyPurchasesView = ({ userId }) => {
    const [purchases, setPurchases] = useState([]);

    useEffect(() => {
        const q = query(
            collection(db, "deliveries"), 
            where("buyerId", "==", userId),
            where("status", "==", "Vendido")
        );
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const purchasesData = await Promise.all(snapshot.docs.map(async (d) => {
                const data = d.data();
                let fincaName = "Finca";
                if (data.producerId) {
                    const pSnap = await getDoc(doc(db, "producers", data.producerId));
                    if (pSnap.exists()) fincaName = pSnap.data().fincaName;
                }
                return { id: d.id, ...data, fincaName };
            }));
            setPurchases(purchasesData);
        });
        return () => unsubscribe();
    }, [userId]);

    if (purchases.length === 0) return (
        <Box sx={{ textAlign: 'center', mt: 10, opacity: 0.6 }}>
            <ReceiptLong sx={{ fontSize: 80, color: '#ccc' }} />
            <Typography variant="h6" sx={{ mt: 2 }}>No tienes compras registradas aún.</Typography>
        </Box>
    );

    return (
        <Grid container spacing={2}>
            {purchases.map((p) => (
                <Grid item xs={12} key={p.id}>
                    <Card elevation={2} sx={{ borderLeft: '6px solid #2E7D32', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">Lote {p.qualityGrade}</Typography>
                                    <Typography variant="caption" color="text.secondary">{p.fincaName}</Typography>
                                </Box>
                                <Chip label="Comprado" size="small" color="success" icon={<CheckCircle />} variant="outlined" />
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Grid container>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Peso</Typography>
                                    <Typography variant="body2" fontWeight="bold">{p.weightKg_Bruto} Kg</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Total</Typography>
                                    <Typography variant="body2" fontWeight="bold" color="#2E7D32">${parseInt(p.totalPayment).toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Fecha</Typography>
                                    <Typography variant="body2">{p.soldDate ? new Date(p.soldDate.seconds * 1000).toLocaleDateString() : 'Reciente'}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

// --- VISTA 4: PERFIL EDITABLE ---
const BuyerProfileView = ({ userId }) => {
    const [originalData, setOriginalData] = useState(null);
    const [formData, setFormData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ open: false, text: '', type: 'success' });

    useEffect(() => {
        const fetch = async () => {
            try {
                const docSnap = await getDoc(doc(db, "buyers", userId));
                if (docSnap.exists()) {
                    setOriginalData(docSnap.data());
                    setFormData(docSnap.data());
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetch();
    }, [userId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, "buyers", userId), formData);
            setOriginalData(formData);
            setIsEditing(false);
            setMsg({ open: true, text: 'Perfil actualizado', type: 'success' });
        } catch (error) {
            setMsg({ open: true, text: 'Error al guardar', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(originalData);
        setIsEditing(false);
    };

    // IMPORTANTE: Aquí usamos CircularProgress, ahora sí importado
    if (!originalData) return <Box sx={{display:'flex', justifyContent:'center', mt:5}}><CircularProgress /></Box>;

    return (
        <Box>
            <Card elevation={3} sx={{ borderRadius: 3, position: 'relative', overflow: 'visible', mt: 4 }}>
                <Box sx={{ bgcolor: '#1565C0', height: 100, borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
                
                <Box sx={{ position: 'absolute', top: 70, right: 20 }}>
                    {!isEditing ? (
                        <Button variant="contained" onClick={() => setIsEditing(true)} sx={{ bgcolor: '#fff', color: '#1565C0', '&:hover': { bgcolor: '#f5f5f5' }, borderRadius: 20 }} startIcon={<Edit />}>Editar</Button>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="contained" color="error" onClick={handleCancel} startIcon={<Cancel />} sx={{ borderRadius: 20 }}>Cancelar</Button>
                            <Button variant="contained" color="success" onClick={handleSave} disabled={saving} startIcon={<Save />} sx={{ borderRadius: 20 }}>{saving ? '...' : 'Guardar'}</Button>
                        </Box>
                    )}
                </Box>

                <CardContent sx={{ mt: -6 }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Avatar sx={{ width: 90, height: 90, bgcolor: 'white', color: '#1565C0', fontSize: 45, border: '4px solid white', mx: 'auto', boxShadow: 3 }}>
                            <Person fontSize="inherit" />
                        </Avatar>
                        {!isEditing && (
                            <>
                                <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>{formData.buyerName}</Typography>
                                <Typography variant="body1" color="text.secondary">{formData.companyName || 'Particular'}</Typography>
                                <Chip label={formData.buyerType} sx={{ mt: 1, bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 'bold' }} />
                            </>
                        )}
                    </Box>

                    <Grid container spacing={3}>
                        {/* CAMPOS DEL PERFIL */}
                        <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary" sx={{borderBottom:'1px solid #eee', pb:1}}>INFORMACIÓN DE CONTACTO</Typography></Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Nombre" name="buyerName" fullWidth size="small" value={formData.buyerName} onChange={handleChange} disabled={!isEditing} variant={isEditing ? "outlined" : "standard"} InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" color="action"/></InputAdornment>, disableUnderline: !isEditing }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Teléfono" name="phone" fullWidth size="small" value={formData.phone} onChange={handleChange} disabled={!isEditing} variant={isEditing ? "outlined" : "standard"} InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" color="action"/></InputAdornment>, disableUnderline: !isEditing }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Empresa" name="companyName" fullWidth size="small" value={formData.companyName} onChange={handleChange} disabled={!isEditing} variant={isEditing ? "outlined" : "standard"} InputProps={{ startAdornment: <InputAdornment position="start"><Business fontSize="small" color="action"/></InputAdornment>, disableUnderline: !isEditing }} />
                        </Grid>

                        <Grid item xs={12} sx={{mt: 2}}><Typography variant="subtitle2" color="text.secondary" sx={{borderBottom:'1px solid #eee', pb:1}}>UBICACIÓN</Typography></Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Departamento" name="department" fullWidth size="small" value={formData.department} onChange={handleChange} disabled={!isEditing} variant={isEditing ? "outlined" : "standard"} InputProps={{ startAdornment: <InputAdornment position="start"><Map fontSize="small" color="action"/></InputAdornment>, disableUnderline: !isEditing }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Ciudad" name="city" fullWidth size="small" value={formData.city} onChange={handleChange} disabled={!isEditing} variant={isEditing ? "outlined" : "standard"} InputProps={{ startAdornment: <InputAdornment position="start"><LocationCity fontSize="small" color="action"/></InputAdornment>, disableUnderline: !isEditing }} />
                        </Grid>

                        <Grid item xs={12} sx={{mt: 2}}><Typography variant="subtitle2" color="text.secondary" sx={{borderBottom:'1px solid #eee', pb:1}}>PREFERENCIAS DE COMPRA</Typography></Grid>
                        <Grid item xs={12} sm={6}>
                            {isEditing ? (
                                <TextField select label="Calidad de Interés" name="preferredQuality" fullWidth size="small" value={formData.preferredQuality} onChange={handleChange}>
                                    <MenuItem value="Premium">Premium</MenuItem><MenuItem value="Estandar">Estándar</MenuItem><MenuItem value="Pasilla">Pasilla</MenuItem><MenuItem value="Todo">Todo</MenuItem>
                                </TextField>
                            ) : (
                                <TextField label="Calidad de Interés" fullWidth size="small" value={formData.preferredQuality} disabled variant="standard" InputProps={{ startAdornment: <InputAdornment position="start"><ShoppingBag fontSize="small" color="action"/></InputAdornment>, disableUnderline: true }} />
                            )}
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            <Snackbar open={msg.open} autoHideDuration={3000} onClose={() => setMsg({...msg, open: false})} anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
                <Alert severity={msg.type} variant="filled">{msg.text}</Alert>
            </Snackbar>
        </Box>
    );
};

// --- COMPONENTE PRINCIPAL (DASHBOARD) ---
const BuyerDashboard = ({ user }) => {
    const [tabIndex, setTabIndex] = useState(0);
    const [cart, setCart] = useState([]);
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [msg, setMsg] = useState({ open: false, text: '', type: 'success' });

    const addToCart = (item) => {
        if (cart.find(i => i.id === item.id)) {
            setMsg({ open: true, text: 'Este lote ya está en tu carrito', type: 'warning' });
            return;
        }
        setCart([...cart, item]);
        setMsg({ open: true, text: 'Lote agregado al carrito', type: 'success' });
    };

    const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

    const handleCheckout = async () => {
        setLoadingCheckout(true);
        try {
            const promises = cart.map(item => 
                updateDoc(doc(db, "deliveries", item.id), {
                    status: "Vendido", 
                    buyerId: user.uid,
                    soldDate: new Date()
                })
            );
            await Promise.all(promises);
            setCart([]); 
            setMsg({ open: true, text: '¡Compra realizada con éxito!', type: 'success' });
            setTabIndex(2); 
        } catch (error) {
            console.error(error);
            setMsg({ open: true, text: 'Error al procesar la compra', type: 'error' });
        } finally {
            setLoadingCheckout(false);
        }
    };

    const getTitle = () => {
        if(tabIndex === 0) return "Mercado Digital";
        if(tabIndex === 1) return "Mi Carrito";
        if(tabIndex === 2) return "Mis Compras";
        return "Mi Perfil";
    };

    return (
        <Box sx={{ bgcolor: '#F5F7FA', minHeight: '100vh', pb: 10, display: 'flex', flexDirection: 'column' }}>
            <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#1565C0' }}>
                <Toolbar>
                    <Box component="img" src={logoCacaonet} sx={{ height: 35, width: 35, borderRadius: '50%', mr: 2, border: '2px solid white' }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>{getTitle()}</Typography>
                    <IconButton color="inherit" onClick={() => signOut(auth)}><Logout /></IconButton>
                </Toolbar>
            </AppBar>

            <Container sx={{ mt: 3, flexGrow: 1 }}>
                {tabIndex === 0 && <MarketplaceView onAddToCart={addToCart} />}
                {tabIndex === 1 && <CartView cart={cart} onRemove={removeFromCart} onCheckout={handleCheckout} loadingCheckout={loadingCheckout} />}
                {tabIndex === 2 && <MyPurchasesView userId={user.uid} />}
                {tabIndex === 3 && <BuyerProfileView userId={user.uid} />}
            </Container>

            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={10}>
                <BottomNavigation showLabels value={tabIndex} onChange={(e, n) => setTabIndex(n)}>
                    <BottomNavigationAction label="Mercado" icon={<Storefront />} />
                    <BottomNavigationAction label="Carrito" icon={<Badge badgeContent={cart.length} color="error"><ShoppingCart /></Badge>} />
                    <BottomNavigationAction label="Mis Compras" icon={<ReceiptLong />} />
                    <BottomNavigationAction label="Perfil" icon={<Person />} />
                </BottomNavigation>
            </Paper>

            <Snackbar open={msg.open} autoHideDuration={3000} onClose={() => setMsg({...msg, open: false})} anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
                <Alert severity={msg.type} variant="filled">{msg.text}</Alert>
            </Snackbar>
        </Box>
    );
};

export default BuyerDashboard;