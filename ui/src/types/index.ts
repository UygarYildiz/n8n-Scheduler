// Çalışan tipi
export interface Employee {
  employee_id: string;
  name?: string;
  role?: string;
  department?: string;
  specialty?: string;
}

// Vardiya tipi
export interface Shift {
  shift_id: string;
  name?: string;
  date: string;
  start_time: string;
  end_time: string;
  required_staff?: number;
  department?: string;
}

// Yetenek tipi
export interface Skill {
  employee_id: string;
  skill: string;
}

// Uygunluk tipi
export interface Availability {
  employee_id: string;
  date: string;
  is_available: boolean;
}

// Tercih tipi
export interface Preference {
  employee_id: string;
  shift_id: string;
  preference_score: number;
}

// Girdi verisi tipi
export interface InputData {
  employees: Employee[];
  shifts: Shift[];
  skills: Skill[];
  availability: Availability[];
  preferences: Preference[];
}

// Optimizasyon isteği tipi
export interface OptimizationRequest {
  configuration_ref?: string;
  configuration?: Record<string, any>;
  input_data: InputData;
}

// Atama tipi
export interface Assignment {
  employee_id: string;
  shift_id: string;
}

// Optimizasyon çözümü tipi
export interface OptimizationSolution {
  assignments: Assignment[];
}

// Metrikler tipi
export interface MetricsOutput {
  total_understaffing?: number;
  total_overstaffing?: number;
  min_staffing_coverage_ratio?: number;
  skill_coverage_ratio?: number;
  positive_preferences_met_count?: number;
  negative_preferences_assigned_count?: number;
  total_preference_score_achieved?: number;
  workload_distribution_std_dev?: number;
  bad_shift_distribution_std_dev?: number;
  system_adaptability_score?: number;
  config_complexity_score?: number;
  rule_count?: number;
}

// Optimizasyon yanıtı tipi
export interface OptimizationResponse {
  status: string;
  solver_status_message?: string;
  processing_time_seconds?: number;
  objective_value?: number;
  solution?: OptimizationSolution;
  metrics?: MetricsOutput;
  error_details?: string;
}

// Veri seti tipi
export interface Dataset {
  id: string;
  name: string;
  path: string;
}

// Konfigürasyon dosyası tipi
export interface ConfigurationFile {
  id: string;
  name: string;
  path: string;
}

// Kullanıcı tipi
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Planlamacı' | 'Görüntüleyici';
}

// API ayarları tipi
export interface ApiSettings {
  apiUrl: string;
  n8nUrl: string;
  webhookId: string;
}

// Kullanıcı ayarları tipi
export interface UserSettings {
  darkMode: boolean;
  language: string;
  notificationsEnabled: boolean;
}
