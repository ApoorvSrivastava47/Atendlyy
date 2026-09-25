import { CourseRecord } from '../models/schema';

/**
 * Course Service
 * 
 * Manages academic course schedules and syllabus assignments.
 */

const defaultCourses: CourseRecord[] = [
  {
    id: 'CS301',
    code: 'CS-301',
    name: 'Advanced Data Structures & Algorithms',
    instructor: 'Prof. Rajesh Sharma',
    department: 'Computer Science & Engineering',
    section: 'CSE-A (3rd Year)',
    room: 'LH-302 (Turing Hall)',
    schedule: 'Mon, Wed, Fri • 10:00 AM - 11:30 AM',
    totalStudents: 20,
    currentLecture: 'Lecture 18: Dynamic Programming & Bellman-Ford'
  },
  {
    id: 'CS302',
    code: 'CS-302',
    name: 'Database Management Systems & SQL',
    instructor: 'Dr. Ananya Roy',
    department: 'Computer Science & Engineering',
    section: 'CSE-A (3rd Year)',
    room: 'Lab-4 (Ada Lovelace Wing)',
    schedule: 'Tue, Thu • 02:00 PM - 04:00 PM',
    totalStudents: 20,
    currentLecture: 'Lab 6: Multi-table JOINs & Subqueries'
  },
  {
    id: 'CS303',
    code: 'CS-303',
    name: 'Operating Systems & System Architecture',
    instructor: 'Prof. Vikram Malhotra',
    department: 'Computer Science & Engineering',
    section: 'CSE-A (3rd Year)',
    room: 'LH-201',
    schedule: 'Mon, Thu • 11:45 AM - 01:15 PM',
    totalStudents: 20,
    currentLecture: 'Lecture 14: Virtual Memory & Page Replacement'
  }
];

export class CourseService {
  static getAllCourses(): CourseRecord[] {
    return defaultCourses;
  }

  static getCourseById(id: string): CourseRecord | null {
    return defaultCourses.find((c) => c.id === id || c.code === id) || null;
  }
}
