import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import DatasetConfig from './pages/DatasetConfig'
import OptimizationParams from './pages/OptimizationParams'
import Results from './pages/Results'
import ScheduleView from './pages/ScheduleView'
import Settings from './pages/Settings'
import theme from './theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dataset-config" element={<DatasetConfig />} />
          <Route path="optimization-params" element={<OptimizationParams />} />
          <Route path="results" element={<Results />} />
          <Route path="schedule-view" element={<ScheduleView />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}

export default App
