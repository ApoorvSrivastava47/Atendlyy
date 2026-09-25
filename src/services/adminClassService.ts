import { ParsedStudentRow } from './sheetParserService';
import { loadCloudState, saveCloudState } from './cloudStateService';

export interface AdminClassRecord {
  section: string; // e.g. "1B10", "2B11", "3CS4"
  className: string; // e.g. "1st Year Engineering - 1B10"
  department: string;
  semester: string;
  defaultSubject?: string;
  students: ParsedStudentRow[];
  uploadedAt: string;
  uploadedBy: string;
}

const ADMIN_STORAGE_KEY = 'atendly_admin_rosters';
const ADMIN_AUTH_KEY = 'atendly_admin_authenticated';

// Initial pre-loaded institutional rosters for immediate lookup (1B10, 2B11, etc.)
const SEED_1B10_STUDENTS: ParsedStudentRow[] = [
  { rollNo: '24B10-01', name: 'Aarav Sharma', phone: '+91 98123 45601', email: 'aarav.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-02', name: 'Ananya Verma', phone: '+91 98123 45602', email: 'ananya.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-03', name: 'Rohan Mehta', phone: '+91 98123 45603', email: 'rohan.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-04', name: 'Diya Patel', phone: '+91 98123 45604', email: 'diya.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-05', name: 'Kabir Sen', phone: '+91 98123 45605', email: 'kabir.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-06', name: 'Ishita Gupta', phone: '+91 98123 45606', email: 'ishita.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-07', name: 'Devansh Kulkarni', phone: '+91 98123 45607', email: 'devansh.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-08', name: 'Meera Iyer', phone: '+91 98123 45608', email: 'meera.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-09', name: 'Siddharth Rao', phone: '+91 98123 45609', email: 'siddharth.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-10', name: 'Pooja Bhatia', phone: '+91 98123 45610', email: 'pooja.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-11', name: 'Tanmay Joshi', phone: '+91 98123 45611', email: 'tanmay.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-12', name: 'Kavya Nair', phone: '+91 98123 45612', email: 'kavya.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-13', name: 'Pranav Saxena', phone: '+91 98123 45613', email: 'pranav.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-14', name: 'Riya Mukherjee', phone: '+91 98123 45614', email: 'riya.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-15', name: 'Yashwardhan Singhania', phone: '+91 98123 45615', email: 'yash.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-16', name: 'Tara Deshmukh', phone: '+91 98123 45616', email: 'tara.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-17', name: 'Arjun Bansal', phone: '+91 98123 45617', email: 'arjun.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-18', name: 'Zoya Khan', phone: '+91 98123 45618', email: 'zoya.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-19', name: 'Aryan Choudhary', phone: '+91 98123 45619', email: 'aryan.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' },
  { rollNo: '24B10-20', name: 'Shreya Mittal', phone: '+91 98123 45620', email: 'shreya.24b10@campus.edu', section: '1B10', department: 'Applied Sciences & Engineering' }
];

const SEED_2B11_STUDENTS: ParsedStudentRow[] = [
  { rollNo: '23B11-01', name: 'Aditya Nair', phone: '+91 98234 56701', email: 'aditya.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-02', name: 'Pooja Reddy', phone: '+91 98234 56702', email: 'pooja.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-03', name: 'Vikram Malhotra', phone: '+91 98234 56703', email: 'vikram.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-04', name: 'Sneha Rao', phone: '+91 98234 56704', email: 'sneha.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-05', name: 'Arjun Das', phone: '+91 98234 56705', email: 'arjun.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-06', name: 'Neha Pillai', phone: '+91 98234 56706', email: 'neha.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-07', name: 'Harshvardhan Jain', phone: '+91 98234 56707', email: 'harsh.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-08', name: 'Bhavna Menon', phone: '+91 98234 56708', email: 'bhavna.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-09', name: 'Kunal Kapoor', phone: '+91 98234 56709', email: 'kunal.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-10', name: 'Megha Srinivas', phone: '+91 98234 56710', email: 'megha.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-11', name: 'Naveen Kumar', phone: '+91 98234 56711', email: 'naveen.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-12', name: 'Tanvi Agarwal', phone: '+91 98234 56712', email: 'tanvi.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-13', name: 'Chaitanya Hegde', phone: '+91 98234 56713', email: 'chaitanya.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-14', name: 'Simran Walia', phone: '+91 98234 56714', email: 'simran.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' },
  { rollNo: '23B11-15', name: 'Gaurav Tewari', phone: '+91 98234 56715', email: 'gaurav.23b11@campus.edu', section: '2B11', department: 'Computer Science & Engineering' }
];

const SEED_DEFAULT_CLASSES: AdminClassRecord[] = [
  {
    section: '1B10',
    className: '1st Year B.Tech - Section 1B10',
    department: 'Applied Sciences & Engineering',
    semester: 'Semester 2',
    defaultSubject: 'Engineering Physics & Computing (PHY-102)',
    students: SEED_1B10_STUDENTS,
    uploadedAt: '2026-09-01 09:00 AM',
    uploadedBy: 'Office of Academic Registrar'
  },
  {
    section: '2B11',
    className: '2nd Year B.Tech - Section 2B11',
    department: 'Computer Science & Engineering',
    semester: 'Semester 4',
    defaultSubject: 'Data Structures & Algorithms (CS-201)',
    students: SEED_2B11_STUDENTS,
    uploadedAt: '2026-09-01 09:15 AM',
    uploadedBy: 'Dean of Computer Sciences'
  }
];

// Normalize section string for matching (e.g. "1B10", "1b10", "1-b-10", "Section 1B10")
export function normalizeSectionKey(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .toUpperCase()
    .replace(/^SECTION\s+/i, '')
    .replace(/[^A-Z0-9]/g, '');
}

// Retrieve all admin classes from localStorage
export function getAdminClasses(): AdminClassRecord[] {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) {
      // Seed initial classes
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(SEED_DEFAULT_CLASSES));
      return SEED_DEFAULT_CLASSES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_DEFAULT_CLASSES;
  } catch (e) {
    console.error('Failed to load admin classes from storage:', e);
    return SEED_DEFAULT_CLASSES;
  }
}

// Save all admin classes
export function saveAdminClasses(classes: AdminClassRecord[]): void {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(classes));
    void saveCloudState('admin_rosters', classes);
  } catch (e) {
    console.error('Failed to save admin classes:', e);
  }
}

export async function hydrateAdminClasses(): Promise<AdminClassRecord[]> {
  const local = getAdminClasses();
  const cloud = await loadCloudState('admin_rosters', local);
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(cloud));
  } catch {}
  return cloud;
}

// Instant section lookup for faculty
export function findClassBySection(sectionQuery: string): AdminClassRecord | null {
  if (!sectionQuery || !sectionQuery.trim()) return null;
  const classes = getAdminClasses();
  const normalizedQuery = normalizeSectionKey(sectionQuery);

  // Exact or normalized key match
  const match = classes.find((c) => {
    const normKey = normalizeSectionKey(c.section);
    return normKey === normalizedQuery || c.section.toUpperCase() === sectionQuery.trim().toUpperCase();
  });

  return match || null;
}

// Add or update an uploaded class in admin database
export function addOrUpdateAdminClass(newClass: AdminClassRecord): void {
  const current = getAdminClasses();
  const normalizedNew = normalizeSectionKey(newClass.section);

  const filtered = current.filter((c) => normalizeSectionKey(c.section) !== normalizedNew);
  const updated = [newClass, ...filtered];
  saveAdminClasses(updated);
}

// Bulk store parsed classes from multi-class CSV
export function bulkSaveAdminClasses(
  classesData: { section: string; department?: string; students: ParsedStudentRow[] }[],
  adminName = 'College Administrator'
): number {
  const current = getAdminClasses();
  let addedCount = 0;
  const updatedMap = new Map<string, AdminClassRecord>();

  // Existing classes
  for (const c of current) {
    updatedMap.set(normalizeSectionKey(c.section), c);
  }

  // New classes
  const timestamp = new Date().toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  for (const item of classesData) {
    if (!item.section || item.students.length === 0) continue;
    const normKey = normalizeSectionKey(item.section);
    updatedMap.set(normKey, {
      section: item.section.trim().toUpperCase(),
      className: `Section ${item.section.trim().toUpperCase()}`,
      department: item.department || item.students[0]?.department || 'Academic Department',
      semester: item.students[0]?.semester || 'Current Term',
      students: item.students,
      uploadedAt: timestamp,
      uploadedBy: adminName
    });
    addedCount++;
  }

  saveAdminClasses(Array.from(updatedMap.values()));
  return addedCount;
}

// Admin session authentication check
export function isAdminAuthenticated(): boolean {
  return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
}

export function setAdminAuthenticated(val: boolean): void {
  if (val) {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  }
}
