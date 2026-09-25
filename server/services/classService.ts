import { ClassSectionRecord, StudentRecord } from '../models/schema';

/**
 * Class Service
 * 
 * Manages institutional class rosters uploaded by campus administrators
 * (e.g., sections 1B10, 2B11) and provides retrieval logic for faculty.
 */

// Initial in-memory institutional classes
let institutionalClasses: ClassSectionRecord[] = [
  {
    section: '1B10',
    className: '1st Year B.Tech CSE (Section 1B10)',
    department: 'Computer Science & Engineering',
    semester: 'Semester 2',
    defaultSubject: 'Engineering Physics & Computing (PHY-102)',
    uploadedAt: 'Today, 09:00 AM',
    uploadedBy: 'Campus Academic Administration',
    students: [
      { id: '1b10-01', rollNo: '24B10-01', name: 'Aarav Sharma', phone: '+91 98123 45601', email: 'aarav.24b10@campus.edu', section: '1B10', department: 'Computer Science' },
      { id: '1b10-02', rollNo: '24B10-02', name: 'Ananya Verma', phone: '+91 98123 45602', email: 'ananya.24b10@campus.edu', section: '1B10', department: 'Computer Science' },
      { id: '1b10-03', rollNo: '24B10-03', name: 'Rohan Gupta', phone: '+91 98123 45603', email: 'rohan.24b10@campus.edu', section: '1B10', department: 'Computer Science' },
      { id: '1b10-04', rollNo: '24B10-04', name: 'Diya Patel', phone: '+91 98123 45604', email: 'diya.24b10@campus.edu', section: '1B10', department: 'Computer Science' },
      { id: '1b10-05', rollNo: '24B10-05', name: 'Kavya Nair', phone: '+91 98123 45605', email: 'kavya.24b10@campus.edu', section: '1B10', department: 'Computer Science' },
      { id: '1b10-06', rollNo: '24B10-06', name: 'Kabir Mehta', phone: '+91 98123 45606', email: 'kabir.24b10@campus.edu', section: '1B10', department: 'Computer Science' },
      { id: '1b10-07', rollNo: '24B10-07', name: 'Ishaan Chopra', phone: '+91 98123 45607', email: 'ishaan.24b10@campus.edu', section: '1B10', department: 'Computer Science' },
      { id: '1b10-08', rollNo: '24B10-08', name: 'Meera Rao', phone: '+91 98123 45608', email: 'meera.24b10@campus.edu', section: '1B10', department: 'Computer Science' },
      { id: '1b10-09', rollNo: '24B10-09', name: 'Arjun Sen', phone: '+91 98123 45609', email: 'arjun.24b10@campus.edu', section: '1B10', department: 'Computer Science' },
      { id: '1b10-10', rollNo: '24B10-10', name: 'Pooja Bhatia', phone: '+91 98123 45610', email: 'pooja.24b10@campus.edu', section: '1B10', department: 'Computer Science' }
    ]
  },
  {
    section: '2B11',
    className: '2nd Year B.Tech IT & AI (Section 2B11)',
    department: 'Information Technology',
    semester: 'Semester 4',
    defaultSubject: 'Data Structures & Algorithms (IT-204)',
    uploadedAt: 'Today, 08:30 AM',
    uploadedBy: 'Campus Academic Administration',
    students: [
      { id: '2b11-01', rollNo: '23B11-01', name: 'Vikram Aditya', phone: '+91 98765 43201', email: 'vikram.23b11@campus.edu', section: '2B11', department: 'Information Technology' },
      { id: '2b11-02', rollNo: '23B11-02', name: 'Siddharth Rao', phone: '+91 98765 43202', email: 'siddharth.23b11@campus.edu', section: '2B11', department: 'Information Technology' },
      { id: '2b11-03', rollNo: '23B11-03', name: 'Neha Singhania', phone: '+91 98765 43203', email: 'neha.23b11@campus.edu', section: '2B11', department: 'Information Technology' },
      { id: '2b11-04', rollNo: '23B11-04', name: 'Tarun Joshi', phone: '+91 98765 43204', email: 'tarun.23b11@campus.edu', section: '2B11', department: 'Information Technology' },
      { id: '2b11-05', rollNo: '23B11-05', name: 'Shreya Kapoor', phone: '+91 98765 43205', email: 'shreya.23b11@campus.edu', section: '2B11', department: 'Information Technology' }
    ]
  }
];

export class ClassService {
  /**
   * Returns all institutional classes registered in the master database
   */
  static getAllClasses(): ClassSectionRecord[] {
    return institutionalClasses;
  }

  /**
   * Find class section by exact or normalized section code (e.g. 1B10, 2B11)
   */
  static findBySection(sectionCode: string): ClassSectionRecord | null {
    if (!sectionCode) return null;
    const cleanQuery = sectionCode.trim().toUpperCase().replace(/[\s-_]/g, '');

    return (
      institutionalClasses.find((cls) => {
        const cleanSection = cls.section.trim().toUpperCase().replace(/[\s-_]/g, '');
        return (
          cleanSection === cleanQuery ||
          cleanSection.includes(cleanQuery) ||
          cleanQuery.includes(cleanSection)
        );
      }) || null
    );
  }

  /**
   * Add or update an institutional class section
   */
  static saveClass(record: ClassSectionRecord): ClassSectionRecord {
    const existingIndex = institutionalClasses.findIndex(
      (c) => c.section.toUpperCase() === record.section.toUpperCase()
    );

    if (existingIndex >= 0) {
      institutionalClasses[existingIndex] = record;
    } else {
      institutionalClasses.push(record);
    }

    return record;
  }

  /**
   * Bulk upload multiple classes/sections
   */
  static bulkSaveClasses(classes: ClassSectionRecord[]): number {
    for (const item of classes) {
      this.saveClass(item);
    }
    return classes.length;
  }

  /**
   * Delete a section from the database
   */
  static deleteSection(sectionCode: string): boolean {
    const initialLen = institutionalClasses.length;
    institutionalClasses = institutionalClasses.filter(
      (c) => c.section.toUpperCase() !== sectionCode.toUpperCase()
    );
    return institutionalClasses.length < initialLen;
  }
}
