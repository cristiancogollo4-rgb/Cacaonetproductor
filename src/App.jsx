import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Box, CircularProgress, CssBaseline, ThemeProvider, createTheme, AppBar, Container, Toolbar, IconButton, Typography, Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Logout, Agriculture, LocalShipping, MonetizationOn, BarChart, AccountCircle } from '@mui/icons-material';

// Componentes
import AuthScreen from './components/AuthScreen';
import ProducerProfileForm from './components/ProducerProfileForm';
import DeliveriesList from './components/DeliveriesList';
import PaymentsHistory from './components/PaymentsHistory';
import GlobalHistory from './components/GlobalHistory';
import ProfileScreen from './components/ProfileScreen';
import BuyerDashboard from './components/BuyerDashboard';
import BuyerProfileForm from './components/BuyerProfileForm';
import logoCacaonet from './assets/images/cacaonetlogo.png'; 

const theme = createTheme({
  palette: { primary: { main: '#795548' }, secondary: { main: '#5D4037' }, background: { default: '#F0F2F5' } },
});

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0); 
  const [authError, setAuthError] = useState('');

  // Función de espera
  const delay = ms => new Promise(res => setTimeout(res, ms));

  const fetchUserRole = async (uid) => {
    let attempts = 0;
    const maxAttempts = 8; // 8 intentos

    while (attempts < maxAttempts) {
        // 1. Buscar Productor
        const producerSnap = await getDoc(doc(db, "producers", uid));
        if (producerSnap.exists()) return { role: 'producer', data: producerSnap.data() };

        // 2. Buscar Comprador (EN LA COLECCIÓN 'buyers')
        const buyerSnap = await getDoc(doc(db, "buyers", uid));
        if (buyerSnap.exists()) return { role: 'buyer', data: buyerSnap.data() };

        attempts++;
        if (attempts < maxAttempts) await delay(1000); 
    }
    return null;
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null); setRole(null); setProfileData(null); setLoading(false); return;
      }
      
      // Evitar recarga si ya está logueado el mismo user
      if (user && user.uid === currentUser.uid) return;

      setLoading(true);

      try {
        const foundUser = await fetchUserRole(currentUser.uid);
        const intendedRole = sessionStorage.getItem('auth_intent_role');

        if (foundUser) {
            if (intendedRole && intendedRole !== foundUser.role) {
                const roleName = intendedRole === 'producer' ? 'Productor' : 'Comprador';
                throw new Error(`Cuenta no registrada como ${roleName}.`);
            }
            setUser(currentUser);
            setRole(foundUser.role);
            setProfileData(foundUser.data);
            setAuthError('');
        } else {
            throw new Error('No se encontraron datos. El registro falló o tardó demasiado.');
        }
      } catch (error) {
        console.warn("Login fallido:", error.message);
        await signOut(auth);
        setUser(null); setRole(null);
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // RENDERIZADO
  if (loading) return <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><CircularProgress sx={{color:'#5D4037'}}/></Box>;
  if (!user) return <AuthScreen initialError={authError} />;

  // RUTAS
  if (role === 'buyer') {
      if (!profileData || !profileData.isProfileComplete) {
          return <ThemeProvider theme={theme}><CssBaseline /><BuyerProfileForm userId={user.uid} onSaved={async () => { const s = await getDoc(doc(db, "buyers", user.uid)); setProfileData(s.data()); }} /></ThemeProvider>;
      }
      return <ThemeProvider theme={theme}><CssBaseline /><BuyerDashboard user={user} /></ThemeProvider>;
  }

  if (role === 'producer' && (!profileData || !profileData.producerName)) return <ProducerProfileForm userId={user.uid} />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'white', color: '#5D4037' }}>
            <Container maxWidth={false}>
                <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box component="img" src={logoCacaonet} sx={{ height: 45, width: 'auto', mr: 1.5, borderRadius: '50%' }} />
                        <Box><Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>CacaoNet</Typography><Typography variant="caption">Productor</Typography></Box>
                    </Box>
                    <IconButton onClick={() => signOut(auth)} color="inherit"><Logout /></IconButton>
                </Toolbar>
            </Container>
        </AppBar>
        <Container component="main" maxWidth={false} sx={{ flexGrow: 1, py: 3, pb: 10 }}>
            {tabIndex === 0 && <DeliveriesList userId={user.uid} />}
            {tabIndex === 1 && <PaymentsHistory userId={user.uid} />}
            {tabIndex === 2 && <GlobalHistory userId={user.uid} />}
            {tabIndex === 3 && <ProfileScreen userId={user.uid} initialData={profileData} />}
        </Container>
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={6}>
            <BottomNavigation showLabels value={tabIndex} onChange={(e, n) => setTabIndex(n)} sx={{ "& .Mui-selected": { color: '#795548' } }}>
                <BottomNavigationAction label="Entregas" icon={<LocalShipping />} />
                <BottomNavigationAction label="Pagos" icon={<MonetizationOn />} />
                <BottomNavigationAction label="Estadísticas" icon={<BarChart />} />
                <BottomNavigationAction label="Perfil" icon={<AccountCircle />} />
            </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
export default App;