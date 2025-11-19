import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, db, doc, onSnapshot } from './firebase';
import { 
  Box, CircularProgress, BottomNavigation, BottomNavigationAction, 
  Paper, IconButton, Typography, CssBaseline, ThemeProvider, createTheme, Container, AppBar, Toolbar
} from '@mui/material';
// 1. CAMBIO AQUÍ: Importamos BarChart en lugar de History
import { Logout, Agriculture, LocalShipping, MonetizationOn, BarChart, AccountCircle } from '@mui/icons-material';

import AuthScreen from './components/AuthScreen';
import ProducerProfileForm from './components/ProducerProfileForm';
import DeliveriesList from './components/DeliveriesList';
import PaymentsHistory from './components/PaymentsHistory';
import GlobalHistory from './components/GlobalHistory';
import ProfileScreen from './components/ProfileScreen';

const theme = createTheme({
  palette: {
    primary: { main: '#795548' },
    secondary: { main: '#5D4037' },
    background: { default: '#F0F2F5' }, 
  },
});

function App() {
  const [tabIndex, setTabIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [producerData, setProducerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProducerData(null);
        setLoading(false);
        return;
      }
      const docRef = doc(db, "producers", currentUser.uid);
      const unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
              setProducerData({ id: docSnap.id, ...docSnap.data() });
          } else {
              setProducerData(null);
          }
          setLoading(false);
      }, (error) => { console.error(error); setLoading(false); });
      return () => unsubscribeProfile();
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogout = () => { signOut(auth); setProducerData(null); setTabIndex(0); };

  const renderScreen = () => {
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress sx={{ color: '#5D4037' }} /></Box>;
    if (!user) return <AuthScreen />;
    if (user && !producerData) return <ProducerProfileForm userId={user.uid} />;

    const getContent = () => {
      switch (tabIndex) {
          case 0: return <DeliveriesList userId={user.uid} />;
          case 1: return <PaymentsHistory userId={user.uid} />; // Opcional: Puedes quitar esta pestaña si ya no la usas
          case 2: return <GlobalHistory userId={user.uid} />;
          case 3: return <ProfileScreen userId={user.uid} initialData={producerData} />;
          default: return <DeliveriesList userId={user.uid} />;
      }
    };

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* Barra Superior */}
        <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'white', color: '#5D4037' }}>
            <Container maxWidth={false}>
                <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Agriculture sx={{ mr: 1, fontSize: 30 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>CacaoNet</Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                                {producerData?.producerName?.split(' ')[0]}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleLogout} color="inherit"><Logout /></IconButton>
                </Toolbar>
            </Container>
        </AppBar>

        {/* Contenido Principal */}
        <Container 
            component="main" 
            maxWidth={false} 
            sx={{ 
                flexGrow: 1, 
                py: 3, 
                pb: 10, 
                width: '100%',
                display: 'block'
            }}
        >
           {getContent()}
        </Container>

        {/* Menú Inferior */}
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={6}>
            <BottomNavigation 
                showLabels 
                value={tabIndex} 
                onChange={(e, n) => setTabIndex(n)} 
                sx={{ "& .Mui-selected": { color: '#795548' } }}
            >
                <BottomNavigationAction label="Entregas" icon={<LocalShipping />} />
                <BottomNavigationAction label="Pagos" icon={<MonetizationOn />} />
                
                {/* 2. CAMBIO AQUÍ: Cambiamos label e icono */}
                <BottomNavigationAction label="Estadísticas" icon={<BarChart />} />
                
                <BottomNavigationAction label="Perfil" icon={<AccountCircle />} />
            </BottomNavigation>
        </Paper>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {renderScreen()}
    </ThemeProvider>
  );
}

export default App;