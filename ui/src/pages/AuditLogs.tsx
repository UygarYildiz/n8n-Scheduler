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
  Chip,
  Alert,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Pagination,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { auditService, AuditLog, AuditStats, AuditAction } from '../services/auditService';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import { tr } from 'date-fns/locale';

const AuditLogs: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [actions, setActions] = useState<AuditAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Filtreler
  const [filters, setFilters] = useState({
    action: '',
    success: '',
    user_id: '',
    days: 7
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      
      // Audit logları yükle
      const logsParams: any = {
        limit: pageSize,
        offset: offset
      };
      
      if (filters.action) logsParams.action = filters.action;
      if (filters.success !== '') logsParams.success = filters.success === 'true';
      if (filters.user_id) logsParams.user_id = parseInt(filters.user_id);
      
      const [logsData, statsData, actionsData] = await Promise.all([
        auditService.getAuditLogs(logsParams),
        auditService.getAuditStats(filters.days),
        auditService.getAuditActions()
      ]);
      
      setLogs(logsData.logs);
      setTotalCount(logsData.total_count);
      setStats(statsData);
      setActions(actionsData.actions);
      
    } catch (error) {
      console.error('Audit logs loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      loadData();
    }
  }, [currentPage, filters]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const utcDate = parseISO(dateString + (dateString.includes('Z') ? '' : 'Z'));
      const turkeyTime = toZonedTime(utcDate, 'Europe/Istanbul');
      
      return formatTz(turkeyTime, 'dd.MM.yyyy HH:mm:ss', {
        timeZone: 'Europe/Istanbul',
        locale: tr
      });
    } catch {
      return 'Bilinmiyor';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const utcDate = parseISO(dateString + (dateString.includes('Z') ? '' : 'Z'));
      const turkeyTime = toZonedTime(utcDate, 'Europe/Istanbul');
      
      return formatDistanceToNow(turkeyTime, { 
        addSuffix: true, 
        locale: tr 
      });
    } catch {
      return 'Bilinmiyor';
    }
  };

  const StatsCards: React.FC = () => {
    if (!stats) return null;

    return (
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AssessmentIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total_logs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toplam İşlem ({stats.period_days} gün)
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
                <TrendingUpIcon color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    %{stats.success_rate}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Başarı Oranı
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
                <SecurityIcon color="info" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.successful_logs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Başarılı İşlem
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
                <PersonIcon color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.failed_logs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Başarısız İşlem
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (!isAdmin()) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">
          Bu sayfaya erişim yetkiniz bulunmamaktadır.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          İşlem Takibi
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

      {/* Stats Cards */}
      <StatsCards />

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <FilterIcon />
              <Typography>Filtreler</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>İşlem Türü</InputLabel>
                  <Select
                    value={filters.action}
                    label="İşlem Türü"
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {actions.map((action) => (
                      <MenuItem key={action.value} value={action.value}>
                        {auditService.getActionIcon(action.value)} {action.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={filters.success}
                    label="Durum"
                    onChange={(e) => handleFilterChange('success', e.target.value)}
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    <MenuItem value="true">Başarılı</MenuItem>
                    <MenuItem value="false">Başarısız</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Kullanıcı ID"
                  type="number"
                  value={filters.user_id}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Zaman Aralığı</InputLabel>
                  <Select
                    value={filters.days}
                    label="Zaman Aralığı"
                    onChange={(e) => handleFilterChange('days', e.target.value)}
                  >
                    <MenuItem value={1}>Son 1 gün</MenuItem>
                    <MenuItem value={7}>Son 7 gün</MenuItem>
                    <MenuItem value={30}>Son 30 gün</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            İşlem Kayıtları ({totalCount} kayıt)
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Zaman</TableCell>
                  <TableCell>İşlem</TableCell>
                  <TableCell>Kullanıcı</TableCell>
                  <TableCell>Hedef</TableCell>
                  <TableCell>Açıklama</TableCell>
                  <TableCell>Detaylar</TableCell>
                  <TableCell>IP Adresi</TableCell>
                  <TableCell>Durum</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDateTime(log.created_at)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeAgo(log.created_at)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${auditService.getActionIcon(log.action)} ${actions.find(a => a.value === log.action)?.description || log.action}`}
                        size="small"
                        color={auditService.getActionColor(log.action)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {log.user.full_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{log.user.username}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sistem
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.target_user ? (
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {log.target_user.full_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{log.target_user.username}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {auditService.formatLogDetails(log) || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {log.ip_address || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.success ? 'Başarılı' : 'Başarısız'}
                        size="small"
                        color={log.success ? 'success' : 'error'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" py={2}>
                        Kayıt bulunamadı
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Stack spacing={2}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  Sayfa {currentPage} / {totalPages} (Toplam {totalCount} kayıt)
                </Typography>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuditLogs; 