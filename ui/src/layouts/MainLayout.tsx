import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Avatar,
  Tooltip,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Dataset as DatasetIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Assessment as AssessmentIcon,
  CalendarMonth as CalendarIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Brightness4 as DarkModeIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Veri Seti ve Konfigürasyon', icon: <DatasetIcon />, path: '/dataset-config' },
    { text: 'Optimizasyon Parametreleri', icon: <TuneIcon />, path: '/optimization-params' },
    { text: 'Sonuçlar ve Raporlar', icon: <AssessmentIcon />, path: '/results' },
    { text: 'Vardiya Çizelgesi', icon: <CalendarIcon />, path: '/schedule-view' },
    { text: 'Ayarlar', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <div>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        color: 'white'
      }}>
        <Avatar
          sx={{
            width: 60,
            height: 60,
            mb: 1,
            bgcolor: 'white',
            color: theme.palette.primary.main,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <AssessmentIcon fontSize="large" />
        </Avatar>
        <Typography variant="h6" fontWeight="bold" noWrap component="div">
          Optimizasyon Çözümü
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          v0.1.0
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                      '& .MuiListItemText-primary': {
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 500
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          © 2025 Kurumsal Optimizasyon
        </Typography>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
      <AppBar
        position="fixed"
        elevation={2}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#ffffff',
          color: 'text.primary',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                borderRadius: '4px',
                py: 0.5,
                px: 1.5,
                mr: 1
              }}
            >
              <AssessmentIcon sx={{ color: 'white', mr: 1, fontSize: '1.2rem' }} />
            </Box>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                display: { xs: 'none', sm: 'block' },
                color: theme.palette.text.primary,
                fontWeight: 600,
                letterSpacing: '0.3px',
                fontSize: '1rem'
              }}
            >
              Kurumsal Optimizasyon ve Otomasyon Çözümü
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Arama">
              <IconButton sx={{ mx: 1 }}>
                <SearchIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Bildirimler">
              <IconButton sx={{ mx: 1 }}>
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Karanlık Mod">
              <IconButton sx={{ mx: 1 }}>
                <DarkModeIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Profil">
              <IconButton sx={{ ml: 1 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main
                  }}
                >
                  <PersonIcon fontSize="small" />
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="menu items"
      >
        {/* Mobil görünüm için çekmece */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Mobil performansı iyileştirir
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Masaüstü görünümü için kalıcı çekmece */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // AppBar yüksekliği kadar margin eklendi
          overflow: 'auto' // İçerik taşarsa scroll eklendi
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
