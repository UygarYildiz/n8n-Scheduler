import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  LockOutlined,
  Visibility,
  VisibilityOff,
  Person,
  Business,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login({ username, password });
      
      if (success) {
        // Redirect to intended page or dashboard
        navigate(from, { replace: true });
      } else {
        setError('Kullanıcı adı veya şifre hatalı');
      }
    } catch (err) {
      setError('Giriş sırasında bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Demo credentials helper
  const fillDemoCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 400,
            boxShadow: 3,
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  m: 1,
                  bgcolor: 'primary.main',
                  width: 56,
                  height: 56,
                }}
              >
                <Business fontSize="large" />
              </Avatar>
              <Typography component="h1" variant="h4" fontWeight="bold">
                Optimizasyon Sistemi
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Vardiya Çizelgeleme ve Otomasyon Platformu
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Kullanıcı Adı"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={isSubmitting}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Şifre"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={isSubmitting}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isSubmitting || !username || !password}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Button>

              {/* Demo Credentials Button */}
              <Button
                fullWidth
                variant="outlined"
                onClick={fillDemoCredentials}
                disabled={isSubmitting}
                sx={{ mb: 2 }}
              >
                Demo Bilgilerini Doldur
              </Button>

              {/* Info */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Demo Hesap: admin / admin123
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Kurumsal Optimizasyon ve Otomasyon Çözümü v0.2.0
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default LoginPage; 