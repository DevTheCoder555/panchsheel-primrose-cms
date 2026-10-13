import type { ComplaintStatus, Priority } from '../types';

export const COMPLAINT_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Cleaning',
  'Security',
  'Lift/Elevator',
  'Parking',
  'Garden/Landscaping',
  'Civil Work',
  'Pest Control',
  'Water Supply',
  'Power Backup',
  'Other',
];

export const PROBLEM_TYPES: Record<string, string[]> = {
  Plumbing: ['Leakage', 'Blockage', 'Low Pressure', 'Broken Pipe', 'Drainage Issue', 'Other'],
  Electrical: ['Power Failure', 'Short Circuit', 'Faulty Switch', 'Wiring Issue', 'Fuse Problem', 'Other'],
  Carpentry: ['Broken Door', 'Loose Hinge', 'Damaged Lock', 'Cabinet Repair', 'Window Issue', 'Other'],
  Painting: ['Dampness', 'Peeling Paint', 'Cracks', 'Water Stain', 'Discoloration', 'Other'],
  Cleaning: ['Garbage Accumulation', 'Stain', 'Odor', 'Pest Sighting', 'Dirty Common Area', 'Other'],
  Security: ['CCTV Issue', 'Gate Malfunction', 'Suspicious Activity', 'Guard Concern', 'Lighting Issue', 'Other'],
  'Lift/Elevator': ['Not Working', 'Strange Noise', 'Door Issue', 'Stuck Between Floors', 'Button Malfunction', 'Other'],
  Parking: ['Unauthorized Parking', 'Space Dispute', 'Barrier Issue', 'Lighting', 'Cleanliness', 'Other'],
  'Garden/Landscaping': ['Tree Trimming', 'Plant Damage', 'Irrigation Issue', 'Lawn Care', 'Fallen Branch', 'Other'],
  'Civil Work': ['Wall Crack', 'Floor Damage', 'Tile Broken', 'Ceiling Leak', 'Road Repair', 'Other'],
  'Pest Control': ['Mosquitoes', 'Rodents', 'Cockroaches', 'Ants', 'Termites', 'Other'],
  'Water Supply': ['No Water', 'Low Pressure', 'Contaminated Water', 'Tank Issue', 'Pump Failure', 'Other'],
  'Power Backup': ['Generator Failure', 'Delayed Switchover', 'Fuel Issue', 'Noise', 'Maintenance Due', 'Other'],
  Other: ['General Complaint', 'Suggestion', 'Feedback', 'Other'],
};

export const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  under_review: { label: 'Under Review', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  accepted: { label: 'Accepted', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  assigned: { label: 'Assigned', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  in_progress: { label: 'In Progress', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  resolution_submitted: { label: 'Resolution Submitted', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  rework_requested: { label: 'Rework Requested', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'text-slate-600', bg: 'bg-slate-100' },
  medium: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' },
};

export const TOWERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const COMMON_AREAS = [
  'Lobby',
  'Corridor',
  'Staircase',
  'Parking Area',
  'Garden',
  'Swimming Pool',
  'Clubhouse',
  'Gym',
  'Rooftop',
  'Main Gate',
  'Peripheral Road',
  'Other',
];
