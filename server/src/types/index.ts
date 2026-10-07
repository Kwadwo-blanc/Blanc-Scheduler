export type TaskStatus = 
  | 'not_started' 
  | 'scheduled' 
  | 'in_progress' 
  | 'paused' 
  | 'completed' 
  | 'overdue' 
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory = 'study' | 'work' | 'development' | 'research' | 'personal';

export type WorkUnitStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export type WorkUnitType = 'exercise' | 'chapter' | 'subtask' | 'code_module' | 'reading' | 'milestone';

export type UserRole = 'student' | 'professional' | 'developer' | 'team_lead' | 'admin';

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'contributor' | 'viewer';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  timezone: string;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  description?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  color: string;
  status: 'planning' | 'active' | 'paused' | 'completed';
  target_end_date?: string;
  progress_pct: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  project_id?: string;
  creator_id: string;
  assignee_id?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  scheduled_start: string;
  scheduled_end: string;
  estimated_minutes: number;
  actual_minutes: number;
  recurrence_rule?: string;
  progress_pct: number;
  created_at: string;
  updated_at: string;
}

export interface TaskWorkUnit {
  id: string;
  task_id: string;
  sequence_order: number;
  title: string;
  unit_type: WorkUnitType;
  status: WorkUnitStatus;
  estimated_minutes: number;
  completed_at?: string;
  created_at: string;
}

export interface ResumePoint {
  id: string;
  task_id: string;
  active_unit_id?: string;
  checkpoint_title: string;
  stopping_context?: string;
  next_recommended_action: string;
  state_snapshot?: Record<string, any>;
  is_ai_inferred: boolean;
  updated_at: string;
}

export interface ContinuitySession {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  paused_at?: string;
  ended_at?: string;
  duration_seconds: number;
  start_checkpoint?: string;
  end_checkpoint?: string;
  notes?: string;
}

export interface LearningMaterial {
  id: string;
  task_id?: string;
  project_id?: string;
  uploader_id: string;
  title: string;
  resource_type: 'pdf' | 'doc' | 'link' | 'text' | 'book';
  file_path?: string;
  url?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ChatChannel {
  id: string;
  workspace_id: string;
  project_id?: string;
  name: string;
  channel_type: 'general' | 'direct' | 'project' | 'task';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  content: string;
  attachments?: any[];
  reply_to_id?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'reminder' | 'deadline' | 'assignment' | 'comment' | 'ai_recommendation';
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}
