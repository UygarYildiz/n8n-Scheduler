import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as ResetIcon,
  FilterList as FilterIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ScheduleView = () => {
  const [tabValue, setTabValue] = useState(0);
  const [currentWeek, setCurrentWeek] = useState('2023-05-01');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Örnek veri - Günler
  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const dates = ['2023-05-01', '2023-05-02', '2023-05-03', '2023-05-04', '2023-05-05', '2023-05-06', '2023-05-07'];

  // Örnek veri - Vardiyalar
  const shifts = [
    { id: 'S001', name: 'Sabah (08:00-16:00)', color: '#4caf50' },
    { id: 'S002', name: 'Akşam (16:00-00:00)', color: '#2196f3' },
    { id: 'S003', name: 'Gece (00:00-08:00)', color: '#9c27b0' }
  ];

  // Örnek veri - Çalışanlar
  const employees = [
    { id: 'E001', name: 'Ahmet Yılmaz', role: 'Doktor', department: 'Acil' },
    { id: 'E002', name: 'Ayşe Demir', role: 'Hemşire', department: 'Kardiyoloji' },
    { id: 'E003', name: 'Mehmet Kaya', role: 'Doktor', department: 'Cerrahi' },
    { id: 'E004', name: 'Zeynep Çelik', role: 'Hemşire', department: 'Acil' },
    { id: 'E005', name: 'Ali Öztürk', role: 'Teknisyen', department: 'Radyoloji' }
  ];

  // Örnek veri - Atamalar
  const assignments = [
    { employee_id: 'E001', shift_id: 'S001', date: '2023-05-01' },
    { employee_id: 'E001', shift_id: 'S002', date: '2023-05-03' },
    { employee_id: 'E001', shift_id: 'S003', date: '2023-05-05' },
    { employee_id: 'E002', shift_id: 'S001', date: '2023-05-02' },
    { employee_id: 'E002', shift_id: 'S002', date: '2023-05-04' },
    { employee_id: 'E003', shift_id: 'S001', date: '2023-05-01' },
    { employee_id: 'E003', shift_id: 'S003', date: '2023-05-06' },
    { employee_id: 'E004', shift_id: 'S002', date: '2023-05-01' },
    { employee_id: 'E004', shift_id: 'S001', date: '2023-05-03' },
    { employee_id: 'E005', shift_id: 'S003', date: '2023-05-02' },
    { employee_id: 'E005', shift_id: 'S001', date: '2023-05-04' }
  ];

  // Departman ve rol filtreleme
  const filteredEmployees = employees.filter(employee => {
    if (selectedDepartment !== 'all' && employee.department !== selectedDepartment) {
      return false;
    }
    if (selectedRole !== 'all' && employee.role !== selectedRole) {
      return false;
    }
    return true;
  });

  // Çalışan için vardiya bulma yardımcı fonksiyonu
  const getShiftForEmployeeOnDate = (employeeId: string, date: string) => {
    const assignment = assignments.find(a => a.employee_id === employeeId && a.date === date);
    if (!assignment) return null;

    const shift = shifts.find(s => s.id === assignment.shift_id);
    return shift;
  };

  // Departman listesi
  const departments = [...new Set(employees.map(e => e.department))];

  // Rol listesi
  const roles = [...new Set(employees.map(e => e.role))];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Vardiya Çizelgesi
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton>
            <PrevIcon />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>
            {currentWeek} Haftası
          </Typography>
          <IconButton>
            <NextIcon />
          </IconButton>
        </Box>

        <Box>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ mr: 1 }}
          >
            Değişiklikleri Kaydet
          </Button>
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
          >
            Sıfırla
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="çizelge görünüm sekmeleri">
          <Tab label="Haftalık Görünüm" />
          <Tab label="Günlük Görünüm" />
          <Tab label="Çalışan Bazlı Görünüm" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="department-select-label">Departman</InputLabel>
                <Select
                  labelId="department-select-label"
                  value={selectedDepartment}
                  label="Departman"
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <MenuItem value="all">Tüm Departmanlar</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="role-select-label">Rol</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={selectedRole}
                  label="Rol"
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <MenuItem value="all">Tüm Roller</MenuItem>
                  {roles.map(role => (
                    <MenuItem key={role} value={role}>{role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                fullWidth
                sx={{ height: '56px' }}
              >
                Filtreleri Uygula
              </Button>
            </Grid>
          </Grid>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Çalışan</TableCell>
                {days.map((day, index) => (
                  <TableCell key={day} align="center">
                    {day}<br />
                    <Typography variant="caption">{dates[index]}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Typography variant="body1">{employee.name}</Typography>
                    <Typography variant="caption">{employee.role} - {employee.department}</Typography>
                  </TableCell>
                  {dates.map((date) => {
                    const shift = getShiftForEmployeeOnDate(employee.id, date);
                    return (
                      <TableCell key={date} align="center">
                        {shift ? (
                          <Chip
                            label={shift.name}
                            style={{ backgroundColor: shift.color, color: 'white' }}
                          />
                        ) : (
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              position: 'relative',
                              '&:hover .edit-button': {
                                opacity: 1,
                              }
                            }}
                          >
                            <RemoveIcon sx={{ color: 'text.disabled', fontSize: '1.5rem' }} />
                            <IconButton
                              size="small"
                              className="edit-button"
                              sx={{
                                position: 'absolute',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                bgcolor: 'background.paper',
                                boxShadow: 1,
                                '&:hover': {
                                  bgcolor: 'background.paper',
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Günlük Görünüm
        </Typography>
        <Typography variant="body1">
          Bu bölüm, seçilen günün detaylı vardiya görünümünü gösterecektir.
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Çalışan Bazlı Görünüm
        </Typography>
        <Typography variant="body1">
          Bu bölüm, seçilen çalışanın vardiya çizelgesini gösterecektir.
        </Typography>
      </TabPanel>
    </Box>
  );
};

export default ScheduleView;
