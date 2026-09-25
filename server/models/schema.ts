/**
 * Backend Data Models & Types Schema
 * 
 * Defines all standard domain entities used across the backend
 * controllers, services, and REST API contracts.
 */

export interface StudentRecord {
  id: string;
  rollNo: string;
  name: string;
  avatar?: string;
  phone: string;
  email?: string;
  section: string;
  semester?: string;
  department: string;
  batch?: string;
  parentPhone?: string;
  stats?: {
    totalClasses: number;
    attended: number;
    absent: number;
    eventDuty: number;
  };
}

export interface ClassSectionRecord {
  section: string;
  className?: string;
  department: string;
  semester?: string;
  defaultSubject?: string;
  uploadedAt: string;
  uploadedBy: string;
  students: StudentRecord[];
}

export interface AttendanceRecordItem {
  studentId: string;
  rollNo: string;
  studentName: string;
  status: 'present' | 'absent' | 'event';
  timestamp: string;
}

export interface AttendanceSessionRecord {
  id: string;
  courseId: string;
  courseName: string;
  section: string;
  date: string;
  time: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  eventCount: number;
  records: AttendanceRecordItem[];
  createdAt?: string;
}

export interface CourseRecord {
  id: string;
  code: string;
  name: string;
  instructor: string;
  department: string;
  section: string;
  room: string;
  schedule: string;
  totalStudents: number;
  currentLecture?: string;
}

export interface CampusEventRecord {
  id: string;
  title: string;
  type: 'tech' | 'cultural' | 'sports' | 'academic' | 'urgent';
  organizer: string;
  date: string;
  time: string;
  venue: string;
  expectedAttendance: number;
  branches: string[];
  isLive: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  broadcastTime?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp: string;
}
