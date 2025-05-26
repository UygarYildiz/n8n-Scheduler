import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import DatasetConfig from './pages/DatasetConfig'
import OptimizationParams from './pages/OptimizationParams'
import Results from './pages/Results'
import ScheduleView from './pages/ScheduleView'
import Settings from './pages/Settings'
import SessionManagement from './pages/SessionManagement'
import AuditLogs from './pages/AuditLogs'
import theme from './theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={
              <ProtectedRoute requiredPage="DASHBOARD">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute requiredPage="ADMIN_PANEL" showAccessDenied={true}>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="dataset-config" element={
              <ProtectedRoute requiredPage="DATASET_CONFIG" showAccessDenied={true}>
                <DatasetConfig />
              </ProtectedRoute>
            } />
            <Route path="optimization-params" element={
              <ProtectedRoute requiredPage="OPTIMIZATION_PARAMS" showAccessDenied={true}>
                <OptimizationParams />
              </ProtectedRoute>
            } />
            <Route path="results" element={
              <ProtectedRoute requiredPage="RESULTS">
                <Results />
              </ProtectedRoute>
            } />
            <Route path="schedule-view" element={
              <ProtectedRoute requiredPage="SCHEDULE_VIEW">
                <ScheduleView />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute requiredPage="SETTINGS" showAccessDenied={true}>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="session-management" element={
              <ProtectedRoute requiredPage="ADMIN_PANEL" showAccessDenied={true}>
                <SessionManagement />
              </ProtectedRoute>
            } />
            <Route path="audit-logs" element={
              <ProtectedRoute requiredPage="ADMIN_PANEL" showAccessDenied={true}>
                <AuditLogs />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
