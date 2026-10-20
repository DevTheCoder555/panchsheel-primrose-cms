export type UserRole = 'admin' | 'maintenance' | 'resident';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'assigned'
  | 'in_progress'
  | 'resolution_submitted'
  | 'completed'
  | 'rejected'
  | 'rework_requested';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  tower?: string;
  flat?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  title: string;
  category: string;
  problem_type: string;
  description: string;
  location_type: 'high_rise' | 'low_rise' | 'common_area';
  tower?: string;
  flat?: string;
  common_area?: string;
  suggested_priority: Priority;
  official_priority?: Priority;
  status: ComplaintStatus;
  resident_id: string;
  assigned_to?: string;
  required_technician?: string;
  rejection_reason?: string;
  rework_reason?: string;
  resolution_notes?: string;
  due_date?: string;
  escalation_level: number;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface ComplaintComment {
  id: string;
  complaint_id: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  comment: string;
  created_at: string;
}

export interface ComplaintImage {
  id: string;
  complaint_id: string;
  image_path: string;
  image_url?: string;
  signed_url?: string;
  image_type: 'problem' | 'resolution';
  uploaded_by: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  complaint_id: string;
  action: string;
  performed_by: string;
  details?: string;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  rejected: number;
}