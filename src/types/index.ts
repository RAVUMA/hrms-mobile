export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  jobPositionName?: string;
  profileUrl?: string;
}

export function employeeFromJson(json: Record<string, unknown>): Employee {
  return {
    id: Number(json.id) || 0,
    firstName: String(json.employee_first_name ?? ''),
    lastName: String(json.employee_last_name ?? ''),
    email: json.email as string | undefined,
    jobPositionName: json.job_position_name as string | undefined,
    profileUrl: json.employee_profile as string | undefined,
  };
}

export function fullName(e: { firstName: string; lastName: string }): string {
  return `${e.firstName} ${e.lastName}`.trim();
}

export interface EmployeeDetail {
  id: number;
  badgeId?: string;
  firstName: string;
  lastName: string;
  profileUrl?: string;
  email: string;
  phone: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  zip?: string;
  dob?: string;
  gender?: string;
  qualification?: string;
  experience?: number;
  maritalStatus?: string;
  children?: number;
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  departmentName?: string;
  jobPositionName?: string;
}

export function employeeDetailFromJson(json: Record<string, unknown>): EmployeeDetail {
  return {
    id: Number(json.id) || 0,
    badgeId: json.badge_id as string | undefined,
    firstName: String(json.employee_first_name ?? ''),
    lastName: String(json.employee_last_name ?? ''),
    profileUrl: json.employee_profile as string | undefined,
    email: String(json.email ?? ''),
    phone: String(json.phone ?? ''),
    address: json.address as string | undefined,
    country: json.country as string | undefined,
    state: json.state as string | undefined,
    city: json.city as string | undefined,
    zip: json.zip as string | undefined,
    dob: json.dob as string | undefined,
    gender: json.gender as string | undefined,
    qualification: json.qualification as string | undefined,
    experience: json.experience != null ? Number(json.experience) : undefined,
    maritalStatus: json.marital_status as string | undefined,
    children: json.children != null ? Number(json.children) : undefined,
    emergencyContact: json.emergency_contact as string | undefined,
    emergencyContactName: json.emergency_contact_name as string | undefined,
    emergencyContactRelation: json.emergency_contact_relation as string | undefined,
    departmentName: json.department_name as string | undefined,
    jobPositionName: json.job_position_name as string | undefined,
  };
}

export interface AttendanceRecord {
  id: number;
  attendanceDate: string;
  clockIn?: string;
  clockInDate?: string;
  clockOut?: string;
  clockOutDate?: string;
  workedHour?: string;
  minimumHour?: string;
  overtime?: string;
  overtimeApproved: boolean;
  validated: boolean;
  isValidateRequest: boolean;
  isHoliday: boolean;
  requestDescription?: string;
}

export function attendanceRecordFromJson(json: Record<string, unknown>): AttendanceRecord {
  return {
    id: Number(json.id) || 0,
    attendanceDate: String(json.attendance_date ?? ''),
    clockIn: json.attendance_clock_in as string | undefined,
    clockInDate: json.attendance_clock_in_date as string | undefined,
    clockOut: json.attendance_clock_out as string | undefined,
    clockOutDate: json.attendance_clock_out_date as string | undefined,
    workedHour: json.attendance_worked_hour as string | undefined,
    minimumHour: json.minimum_hour as string | undefined,
    overtime: json.attendance_overtime as string | undefined,
    overtimeApproved: json.attendance_overtime_approve === true,
    validated: json.attendance_validated === true,
    isValidateRequest: json.is_validate_request === true,
    isHoliday: json.is_holiday === true,
    requestDescription: json.request_description as string | undefined,
  };
}

export interface LeaveType {
  id: number;
  name: string;
  iconUrl?: string;
}

export function leaveTypeFromJson(json: Record<string, unknown>): LeaveType {
  return {
    id: Number(json.id) || 0,
    name: String(json.name ?? 'Leave'),
    iconUrl: json.icon as string | undefined,
  };
}

export interface AvailableLeave {
  id: number;
  leaveType?: LeaveType;
  availableDays: number;
  carryforwardDays: number;
  totalLeaveDays: number;
}

export function availableLeaveFromJson(json: Record<string, unknown>): AvailableLeave {
  return {
    id: Number(json.id) || 0,
    leaveType:
      json.leave_type_id && typeof json.leave_type_id === 'object'
        ? leaveTypeFromJson(json.leave_type_id as Record<string, unknown>)
        : undefined,
    availableDays: Number(json.available_days) || 0,
    carryforwardDays: Number(json.carryforward_days) || 0,
    totalLeaveDays: Number(json.total_leave_days) || 0,
  };
}

export type LeaveStatus = 'requested' | 'approved' | 'cancelled' | 'rejected';

export interface LeaveRequest {
  id: number;
  leaveType?: LeaveType;
  startDate: string;
  startDateBreakdown: string;
  endDate?: string;
  endDateBreakdown: string;
  requestedDays?: number;
  description?: string;
  status: LeaveStatus;
  rejectReason?: string;
}

export function leaveRequestFromJson(json: Record<string, unknown>): LeaveRequest {
  return {
    id: Number(json.id) || 0,
    leaveType:
      json.leave_type_id && typeof json.leave_type_id === 'object'
        ? leaveTypeFromJson(json.leave_type_id as Record<string, unknown>)
        : undefined,
    startDate: String(json.start_date ?? ''),
    startDateBreakdown: String(json.start_date_breakdown ?? 'full_day'),
    endDate: json.end_date as string | undefined,
    endDateBreakdown: String(json.end_date_breakdown ?? 'full_day'),
    requestedDays: json.requested_days != null ? Number(json.requested_days) : undefined,
    description: json.description as string | undefined,
    status: (json.status as LeaveStatus) ?? 'requested',
    rejectReason: json.reject_reason as string | undefined,
  };
}

export interface AnnouncementContentBlock {
  type: 'heading' | 'paragraph';
  text: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: AnnouncementContentBlock[];
  createdAt?: string;
  expireDate?: string;
  hasViewed: boolean;
}

export function announcementFromJson(json: Record<string, unknown>): Announcement {
  return {
    id: Number(json.id) || 0,
    title: String(json.title ?? 'Announcement'),
    content: Array.isArray(json.content) ? (json.content as AnnouncementContentBlock[]) : [],
    createdAt: json.created_at as string | undefined,
    expireDate: json.expire_date as string | undefined,
    hasViewed: json.has_viewed === true,
  };
}
