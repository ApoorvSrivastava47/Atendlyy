import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ParsedStudentRow {
  rollNo: string;
  name: string;
  phone: string;
  email?: string;
  section?: string;
  semester?: string;
  department?: string;
  parentPhone?: string;
}

export interface SheetParseResult {
  success: boolean;
  totalRows: number;
  students: ParsedStudentRow[];
  detectedClasses: { className: string; count: number }[];
  errorMessage?: string;
  fileName?: string;
}

// Helper to normalize phone numbers
export function formatPhoneNumber(phoneInput?: string | number): string {
  if (!phoneInput) return '+91 98765 43210';
  const clean = String(phoneInput).replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  } else if (clean.length === 12 && clean.startsWith('91')) {
    return `+${clean.slice(0, 2)} ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  return String(phoneInput).trim();
}

// Fallback high-quality student portrait avatars
const AVATAR_SEEDS = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&auto=format&fit=crop&q=80'
];

export function getStudentAvatar(index: number, name: string): string {
  if (name) {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_SEEDS[hash % AVATAR_SEEDS.length];
  }
  return AVATAR_SEEDS[index % AVATAR_SEEDS.length];
}

// Convert raw row keys to normalized fields
function findField(row: Record<string, any>, possibleKeys: string[]): any {
  for (const key of Object.keys(row)) {
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const target of possibleKeys) {
      const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanTarget || cleanKey.includes(cleanTarget)) {
        return row[key];
      }
    }
  }
  return undefined;
}

// Main parser for ArrayBuffer / File data
export function parseSpreadsheetBuffer(data: ArrayBuffer | Uint8Array, fileName: string = 'students.xlsx'): SheetParseResult {
  try {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parse as JSON array of objects
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return {
        success: false,
        totalRows: 0,
        students: [],
        detectedClasses: [],
        errorMessage: 'The uploaded spreadsheet is empty or has no recognizable data rows.',
        fileName
      };
    }

    const students: ParsedStudentRow[] = [];
    const classCountMap: Record<string, number> = {};

    rawRows.forEach((row, index) => {
      // Look for roll number
      let rollNo = findField(row, ['rollno', 'roll', 'rollnumber', 'registration', 'regno', 'urn', 'prn', 'id']);
      // Look for name
      let name = findField(row, ['name', 'studentname', 'fullname', 'student', 'candidate']);
      // Look for phone
      let phone = findField(row, ['phone', 'mobile', 'whatsapp', 'contact', 'cell', 'ph', 'phoneno', 'mobileno']);
      // Look for email
      let email = findField(row, ['email', 'mail', 'emailaddress']);
      // Look for section / class
      let section = findField(row, ['class', 'section', 'sec', 'batch', 'classsection', 'branch', 'classroom']);
      // Semester
      let semester = findField(row, ['semester', 'sem', 'year']);
      // Department
      let department = findField(row, ['department', 'dept', 'branch', 'stream']);
      // Parent phone
      let parentPhone = findField(row, ['parentphone', 'parentsphone', 'fatherphone', 'guardianphone']);

      // Auto-generate roll number if missing
      if (!rollNo && name) {
        rollNo = `2024CS${String(index + 1).padStart(3, '0')}`;
      } else if (rollNo) {
        rollNo = String(rollNo).trim().toUpperCase();
      }

      // If roll exists or name exists
      if (rollNo || name) {
        const studentName = String(name || `Student ${rollNo || index + 1}`).trim();
        const sectionStr = section ? String(section).trim() : 'Class-A';
        const formattedPhone = formatPhoneNumber(phone);
        const emailStr = email
          ? String(email).trim()
          : `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@campus.edu`;

        students.push({
          rollNo: String(rollNo),
          name: studentName,
          phone: formattedPhone,
          email: emailStr,
          section: sectionStr,
          semester: semester ? String(semester).trim() : 'Semester 5',
          department: department ? String(department).trim() : 'Computer Science & Engineering',
          parentPhone: parentPhone ? formatPhoneNumber(parentPhone) : undefined
        });

        classCountMap[sectionStr] = (classCountMap[sectionStr] || 0) + 1;
      }
    });

    // Detect distinct classes
    const detectedClasses = Object.entries(classCountMap).map(([className, count]) => ({
      className,
      count
    }));

    // Sort students by roll number sequence
    students.sort((a, b) => a.rollNo.localeCompare(b.rollNo));

    return {
      success: students.length > 0,
      totalRows: students.length,
      students,
      detectedClasses,
      fileName
    };
  } catch (error: any) {
    console.error('Spreadsheet parse error:', error);
    return {
      success: false,
      totalRows: 0,
      students: [],
      detectedClasses: [],
      errorMessage: error?.message || 'Failed to parse file format. Please check your file.',
      fileName
    };
  }
}

// Convert parsed student rows to full app Student objects linked to a course
export function convertToAppStudents(
  parsedRows: ParsedStudentRow[],
  targetCourseId: string,
  targetSection: string,
  targetDepartment: string = 'Computer Science & Engineering'
): Student[] {
  return parsedRows.map((row, idx) => {
    return {
      id: `stud-${targetCourseId}-${row.rollNo}-${Date.now()}-${idx}`,
      rollNo: row.rollNo,
      name: row.name,
      avatar: getStudentAvatar(idx, row.name),
      phone: row.phone,
      email: row.email || `${row.rollNo.toLowerCase()}@campus.edu`,
      section: targetSection || row.section || 'Class-A',
      semester: row.semester || 'Semester 5',
      department: targetDepartment || row.department || 'Computer Science & Engineering',
      batch: '2024-2028',
      courseId: targetCourseId,
      parentPhone: row.parentPhone,
      stats: {
        totalClasses: 30,
        attended: 28,
        absent: 2,
        eventDuty: 0
      },
      grades: {
        courseId: targetCourseId,
        assignments: 85,
        midterm: 80,
        finalExam: 85,
        gpa: 3.5,
        letterGrade: 'A'
      }
    };
  });
}

// Sample CSV Template Generator
export function generateSampleCsvTemplate(): string {
  return `Roll No,Student Name,Class / Section,WhatsApp Phone,Email,Department
2024CS101,Aarav Sharma,3rd Year CSE-B,+919812345671,aarav.sharma@campus.edu,Computer Science
2024CS102,Aditi Patel,3rd Year CSE-B,+919812345672,aditi.patel@campus.edu,Computer Science
2024CS103,Akash Verma,3rd Year CSE-B,+919812345673,akash.verma@campus.edu,Computer Science
2024CS104,Ananya Gupta,3rd Year CSE-B,+919812345674,ananya.gupta@campus.edu,Computer Science
2024CS105,Ayush Kumar,3rd Year CSE-B,+919812345675,ayush.kumar@campus.edu,Computer Science
2024CS106,Bhavya Reddy,3rd Year CSE-B,+919812345676,bhavya.reddy@campus.edu,Computer Science
2024CS107,Chetan Joshi,3rd Year CSE-B,+919812345677,chetan.joshi@campus.edu,Computer Science
2024CS108,Devika Nair,3rd Year CSE-B,+919812345678,devika.nair@campus.edu,Computer Science
2024CS109,Gaurav Mehta,3rd Year CSE-B,+919812345679,gaurav.mehta@campus.edu,Computer Science
2024CS110,Ishita Sen,3rd Year CSE-B,+919812345680,ishita.sen@campus.edu,Computer Science
2024CS111,Karan Malhotra,3rd Year CSE-B,+919812345681,karan.m@campus.edu,Computer Science
2024CS112,Meera Iyer,3rd Year CSE-B,+919812345682,meera.iyer@campus.edu,Computer Science
2024CS113,Nikhil Kapoor,3rd Year CSE-B,+919812345683,nikhil.k@campus.edu,Computer Science
2024CS114,Pooja Das,3rd Year CSE-B,+919812345684,pooja.das@campus.edu,Computer Science
2024CS115,Rahul Singhania,3rd Year CSE-B,+919812345685,rahul.s@campus.edu,Computer Science
2024CS116,Riya Saxena,3rd Year CSE-B,+919812345686,riya.saxena@campus.edu,Computer Science
2024CS117,Siddharth Rao,3rd Year CSE-B,+919812345687,siddharth.r@campus.edu,Computer Science
2024CS118,Sneha Deshmukh,3rd Year CSE-B,+919812345688,sneha.d@campus.edu,Computer Science
2024CS119,Tanmay Bhatt,3rd Year CSE-B,+919812345689,tanmay.b@campus.edu,Computer Science
2024CS120,Varun Chopra,3rd Year CSE-B,+919812345690,varun.c@campus.edu,Computer Science`;
}

// Sample Multi-Class CSV Data for instant testing
export function generateDemoMultiClassCsv(): string {
  return `Roll No,Student Name,Class / Section,WhatsApp Phone,Email,Department
2024CS201,Aman Gill,3rd Year CSE-B,+919812300101,aman.gill@campus.edu,Computer Science
2024CS202,Bina Roy,3rd Year CSE-B,+919812300102,bina.roy@campus.edu,Computer Science
2024CS203,Chirag Shah,3rd Year CSE-B,+919812300103,chirag.shah@campus.edu,Computer Science
2024CS204,Deepa Menon,3rd Year CSE-B,+919812300104,deepa.menon@campus.edu,Computer Science
2024CS205,Eshan Malik,3rd Year CSE-B,+919812300105,eshan.malik@campus.edu,Computer Science
2024CS206,Farhan Khan,3rd Year CSE-B,+919812300106,farhan.khan@campus.edu,Computer Science
2024CS207,Gayatri Nair,3rd Year CSE-B,+919812300107,gayatri.n@campus.edu,Computer Science
2024CS208,Harshil Vora,3rd Year CSE-B,+919812300108,harshil.v@campus.edu,Computer Science
2024AI101,Aarohi Mathur,2nd Year AI & DS,+919812300201,aarohi.m@campus.edu,Artificial Intelligence
2024AI102,Bikramjit Singh,2nd Year AI & DS,+919812300202,bikram.s@campus.edu,Artificial Intelligence
2024AI103,Charu Agarwal,2nd Year AI & DS,+919812300203,charu.a@campus.edu,Artificial Intelligence
2024AI104,Dhairya Patel,2nd Year AI & DS,+919812300204,dhairya.p@campus.edu,Artificial Intelligence
2024AI105,Ekta Kapoor,2nd Year AI & DS,+919812300205,ekta.k@campus.edu,Artificial Intelligence
2024AI106,Fahim Ansari,2nd Year AI & DS,+919812300206,fahim.a@campus.edu,Artificial Intelligence
2024ECE01,Adhiraj Sen,4th Year ECE-A,+919812300301,adhiraj.s@campus.edu,Electronics
2024ECE02,Bhavani Devi,4th Year ECE-A,+919812300302,bhavani.d@campus.edu,Electronics
2024ECE03,Chetan Bagchi,4th Year ECE-A,+919812300303,chetan.b@campus.edu,Electronics
2024ECE04,Dolly Chawla,4th Year ECE-A,+919812300304,dolly.c@campus.edu,Electronics`;
}

// Helper to trigger browser download of template
export function downloadSampleCsv() {
  const csvContent = generateSampleCsvTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Class_Roster_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
