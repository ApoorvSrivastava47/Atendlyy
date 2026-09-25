export type AttendanceStatus = 'present' | 'absent' | 'event';

export interface Student {
  id: string;
  rollNo: string; // e.g. "2024CS001"
  name: string;
  avatar: string;
  phone: string; // e.g. "+919876543210"
  email: string;
  section: string;
  semester: string;
  department: string;
  batch: string;
  courseId?: string;
  parentPhone?: string;
  stats: {
    totalClasses: number;
    attended: number;
    absent: number;
    eventDuty: number;
  };
  grades: {
    courseId: string;
    assignments: number; // 0 - 100
    midterm: number;     // 0 - 100
    finalExam: number;   // 0 - 100
    gpa: number;         // 0.0 - 4.0
    letterGrade: string; // 'A+', 'A', 'B', etc.
  };
}

export interface Course {
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

export interface AttendanceRecord {
  studentId: string;
  rollNo: string;
  studentName: string;
  status: AttendanceStatus;
  timestamp: string;
  remarks?: string;
}

export interface AttendanceSession {
  id: string;
  courseId: string;
  courseName: string;
  section: string;
  date: string;
  time: string;
  records: AttendanceRecord[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  eventCount: number;
  syncedToGoogleSheets: boolean;
  syncTimestamp?: string;
}

export interface GoogleSheetsConfig {
  sheetId: string;
  sheetName: string;
  webhookUrl: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export type CollegeBranch = 'CSE' | 'Mechanical Engg' | 'AIML' | 'EE' | 'EC' | 'CE';

export type AssignmentStatus = 'accepted' | 'pending' | 'late' | 'not_submitted';

export interface Assignment {
  id: string;
  courseId: string;
  courseCode: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
}

export interface AssignmentSubmission {
  studentId: string;
  rollNo: string;
  studentName: string;
  status: AssignmentStatus;
  marksAwarded?: number;
  submittedAt?: string;
  fileName?: string;
  notes?: string;
}

export type ComplaintStatus = 'lodged' | 'dispatched' | 'in_progress' | 'resolved';

export interface ComplaintUpdate {
  timestamp: string;
  text: string;
  updatedBy: string;
}

export interface Complaint {
  id: string;
  facultyName: string;
  classroomNumber: string;
  category: string;
  description: string;
  imageUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: ComplaintStatus;
  lodgedAt: string;
  updates: ComplaintUpdate[];
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  time: string;
  yearsAllowed: string[]; // e.g. ['1st Year', '2nd Year', '3rd Year', '4th Year'] or ['All Years']
  branches: CollegeBranch[];
  targetAudience: string; // e.g. 'Deans, HODs & Faculty' or 'All Students & Faculty'
  postedByFaculty: string;
  facultyDesignation?: string;
  department: string;
  isLive: boolean;
  createdAt: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  category: 'Urgent' | 'Exam' | 'Academic' | 'Event' | 'General';
  postedAt: string;
  author: string;
  priority: 'high' | 'medium' | 'low';
}

export interface GoogleDriveStatus {
  isConnected: boolean;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string | null;
  folderId: string | null;
  folderUrl: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
}

