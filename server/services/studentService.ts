import { StudentRecord } from '../models/schema';
import { ClassService } from './classService';

/**
 * Student Directory Service
 * 
 * Provides unified query and search across all student records.
 */

export class StudentService {
  /**
   * Get all students across all institutional sections
   */
  static getAllStudents(): StudentRecord[] {
    const classes = ClassService.getAllClasses();
    const students: StudentRecord[] = [];
    for (const cls of classes) {
      students.push(...cls.students);
    }
    return students;
  }

  /**
   * Search student by Roll Number or Name
   */
  static searchStudents(query: string): StudentRecord[] {
    if (!query) return this.getAllStudents();
    const clean = query.toLowerCase().trim();

    return this.getAllStudents().filter(
      (s) =>
        s.rollNo.toLowerCase().includes(clean) ||
        s.name.toLowerCase().includes(clean) ||
        s.section.toLowerCase().includes(clean)
    );
  }
}
