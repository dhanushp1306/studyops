export type PriorityLevel = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type EventType = 'class' | 'study_session' | 'assignment_work' | 'deadline' | 'exam';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ActivityStatus = 'processing' | 'completed' | 'pending_approval' | 'failed';

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  color?: string;
  target_hours_per_week: number;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  subject_id?: number;
  subject?: Subject;
  course_code?: string;
  course_name?: string;
  priority: PriorityLevel;
  status: TaskStatus;
  progress: number; // 0.0 to 100.0%
  estimated_effort: number; // hours
  estimated_hours?: number; // compat alias
  completed_hours: number; // hours
  deadline: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  event_type: EventType;
  subject_id?: number;
  subject?: Subject;
  course_code?: string;
  start_time: string;
  end_time: string;
  location?: string;
  status: string;
  linked_task_id?: number;
  created_at: string;
}

export interface StudySession {
  id: number;
  title: string;
  subject_id: number;
  subject?: Subject;
  task_id?: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface StudyPlan {
  id: number;
  subject: string;
  course_code: string;
  target_hours_per_week: number;
  allocated_hours: number;
  completed_hours: number;
  priority_level: PriorityLevel;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PlanStep {
  step: number;
  action: string;
  event_type?: string;
  tool?: string;
  status?: string;
}

export interface AgentActivity {
  id: number;
  run_id: string;
  user_request: string;
  intent: string;
  plan_steps?: PlanStep[];
  tools_used?: string[];
  execution_result?: string;
  status: ActivityStatus;
  duration_ms: number;
  created_at: string;
}

export interface AgentApproval {
  id: number;
  activity_id?: number;
  action_type: string;
  title: string;
  description: string;
  impact_level: PriorityLevel;
  payload?: Record<string, any>;
  status: ApprovalStatus;
  created_at: string;
  resolved_at?: string;
}

export interface DashboardStats {
  total_tasks: number;
  pending_tasks: number;
  high_priority_tasks: number;
  completed_tasks: number;
  upcoming_events_today: number;
  weekly_planned_hours: number;
  weekly_completed_hours: number;
  pending_approvals_count: number;
}

export type PageId = 'dashboard' | 'agent' | 'tasks' | 'calendar' | 'study_plan' | 'agent_activity' | 'approvals';
