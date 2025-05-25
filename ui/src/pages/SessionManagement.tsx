import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Computer as ComputerIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { sessionService, SessionInfo, SessionStats } from '../services/sessionService';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`session-tabpanel-${index}`}
      aria-labelledby={`session-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SessionManagement: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  
  const [tabValue, setTabValue] = useState(0);
  const [mySessions, setMySessions] = useState<SessionInfo[]>([]);
  const [allSessions, setAllSessions] = useState<SessionInfo[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const loadData = async () => {
    setLoading(true);
    try {
      // Kendi oturumlarını yükle
      const mySessionsData = await sessionService.getUserSessions();
      setMySessions(mySessionsData.sessions);

      // Admin ise tüm oturumları ve istatistikleri yükle
      if (isAdmin()) {
        const [allSessionsData, statsData] = await Promise.all([
          sessionService.getAllSessions(),
          sessionService.getSessionStats()
        ]);
        setAllSessions(allSessionsData.sessions);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Session data loading error:', error);
      setSnackbar({
        open: true,
        message: 'Oturum bilgileri yüklenirken hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRevokeSession = async (session: SessionInfo) => {
    setSelectedSession(session);
    setRevokeDialogOpen(true);
  };

  const confirmRevokeSession = async () => {
    if (!selectedSession) return;

    try {
      await sessionService.revokeSession(selectedSession.id);
      setSnackbar({
        open: true,
        message: 'Oturum başarıyla sonlandırıldı',
        severity: 'success'
      });
      loadData(); // Verileri yenile
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Oturum sonlandırılırken hata oluştu',
        severity: 'error'
      });
    } finally {
      setRevokeDialogOpen(false);
      setSelectedSession(null);
    }
  };

  const formatDuration = (createdAt: string) => {
    try {
      return formatDistanceToNow(parseISO(createdAt), { 
        addSuffix: true, 
        locale: tr 
      });
    } catch {
      return 'Bilinmiyor';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('tr-TR');
    } catch {
      return 'Bilinmiyor';
    }
  };

  const SessionTable: React.FC<{ sessions: SessionInfo[]; showUserInfo?: boolean }> = ({ 
    sessions, 
    showUserInfo = false 
  }) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {showUserInfo && (
              <>
                <TableCell>Kullanıcı</TableCell>
                <TableCell>Kurum</TableCell>
                <TableCell>Rol</TableCell>
              </>
            )}
            <TableCell>Oturum Başlangıcı</TableCell>
            <TableCell>Son Geçerlilik</TableCell>
            <TableCell>Süre</TableCell>
            <TableCell>Durum</TableCell>
            <TableCell align="center">İşlemler</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              {showUserInfo && (
                <>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {session.full_name || session.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{session.username}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {session.organization || 'Belirtilmemiş'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={session.role || 'Bilinmiyor'} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                </>
              )}
              <TableCell>
                <Typography variant="body2">
                  {formatDateTime(session.created_at)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatDateTime(session.expires_at)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDuration(session.created_at)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label="Aktif" 
                  size="small" 
                  color="success" 
                  icon={<ComputerIcon />}
                />
              </TableCell>
              <TableCell align="center">
                <Tooltip title={session.user_id === user?.id && sessions.length === 1 ? "Son oturumunuzu sonlandıramazsınız" : "Oturumu Sonlandır"}>
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRevokeSession(session)}
                      disabled={session.user_id === user?.id && sessions.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={showUserInfo ? 8 : 5} align="center">
                <Typography variant="body2" color="text.secondary" py={2}>
                  Aktif oturum bulunamadı
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const StatsCards: React.FC = () => {
    if (!stats) return null;

    return (
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <SecurityIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.active_sessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aktif Oturum
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PersonIcon color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.active_users}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aktif Kullanıcı
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ScheduleIcon color="info" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.today_sessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bugünkü Giriş
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <WarningIcon color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.expired_sessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Süresi Dolmuş
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Oturum Yönetimi
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
          disabled={loading}
        >
          Yenile
        </Button>
      </Box>

      {/* Stats Cards (Admin Only) */}
      {isAdmin() && <StatsCards />}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Oturumlarım" />
            {isAdmin() && <Tab label="Tüm Oturumlar" />}
          </Tabs>
        </Box>

        {/* My Sessions Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box mb={2}>
            <Alert severity="info" icon={<SecurityIcon />}>
              Mevcut aktif oturumlarınız. Güvenlik için kullanmadığınız oturumları sonlandırabilirsiniz.
            </Alert>
          </Box>
          <SessionTable sessions={mySessions} />
        </TabPanel>

        {/* All Sessions Tab (Admin Only) */}
        {isAdmin() && (
          <TabPanel value={tabValue} index={1}>
            <Box mb={2}>
              <Alert severity="warning" icon={<WarningIcon />}>
                Tüm kullanıcıların aktif oturumları. Şüpheli oturumları sonlandırabilirsiniz.
              </Alert>
            </Box>
            <SessionTable sessions={allSessions} showUserInfo={true} />
          </TabPanel>
        )}
      </Card>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)}>
        <DialogTitle>Oturumu Sonlandır</DialogTitle>
        <DialogContent>
          <Typography>
            Bu oturumu sonlandırmak istediğinizden emin misiniz?
          </Typography>
          {selectedSession && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2">
                <strong>Kullanıcı:</strong> {selectedSession.username}
              </Typography>
              <Typography variant="body2">
                <strong>Başlangıç:</strong> {formatDateTime(selectedSession.created_at)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>İptal</Button>
          <Button onClick={confirmRevokeSession} color="error" variant="contained">
            Sonlandır
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SessionManagement; 