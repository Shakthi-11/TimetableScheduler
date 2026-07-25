export interface FacultyMember {
  Faculty_ID: string;
  Name: string;
  Primary_Dept: string;
  Qualified: string;
  Max_Daily: number;
  Max_Cons: number;
}

export interface SubjectData {
  Subject: string;
  Faculty: string;
  Hours: number;
  Type: 'Theory' | 'Lab';
  Category: 'Core Theory' | 'Elective Theory' | 'Lab';
}

export interface CombinedClass {
  Subject: string;
  Faculty: string;
  ParticipatingDepts: string[];
  Hours: number;
  Type: 'Theory' | 'Lab';
}

export interface OperatingRules {
  working_days: number;
  hours_per_day: number;
  break_option: 'None' | 'Hour IV (Lunch)' | 'Hour III (Lunch)';
  semester: number;
}

export interface DepartmentMetrics {
  dept_name: string;
  allocated_slots: number;
  total_slots: number;
  load_factor: number;
  rest_breaks_enforced: number;
}

export interface SystemMetrics {
  total_departments: number;
  total_faculty: number;
  total_allocated_slots: number;
  total_institution_slots: number;
  dept_metrics: Record<string, DepartmentMetrics>;
}

export interface ScheduleResult {
  dept_timetables: Record<string, Array<Record<string, string>>>;
  faculty_matrices: Record<string, Array<Record<string, string>>>;
  conflicts: string[];
  metrics: SystemMetrics;
  faculty_ids: string[];
}
