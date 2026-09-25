import { Student, Course, NoticeItem, Assignment, Complaint, CampusEvent } from '../types';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'CS301',
    code: 'CS-301',
    name: 'Advanced Data Structures & Algorithms',
    instructor: 'Prof. Rajesh Sharma',
    department: 'Computer Science & Engineering',
    section: 'CSE-A (3rd Year)',
    room: 'LH-302 (Turing Hall)',
    schedule: 'Mon, Wed, Fri • 10:00 AM - 11:30 AM',
    totalStudents: 20
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
    totalStudents: 20
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
    totalStudents: 20
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's-001',
    rollNo: '2024CS001',
    name: 'Aarav Sharma',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345671',
    email: 'aarav.sharma@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300001',
    stats: { totalClasses: 32, attended: 30, absent: 1, eventDuty: 1 },
    grades: { courseId: 'CS301', assignments: 92, midterm: 88, finalExam: 94, gpa: 3.9, letterGrade: 'A+' }
  },
  {
    id: 's-002',
    rollNo: '2024CS002',
    name: 'Aditi Patel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345672',
    email: 'aditi.patel@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300002',
    stats: { totalClasses: 32, attended: 28, absent: 2, eventDuty: 2 },
    grades: { courseId: 'CS301', assignments: 86, midterm: 82, finalExam: 89, gpa: 3.6, letterGrade: 'A' }
  },
  {
    id: 's-003',
    rollNo: '2024CS003',
    name: 'Akash Verma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345673',
    email: 'akash.verma@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300003',
    stats: { totalClasses: 32, attended: 22, absent: 8, eventDuty: 2 },
    grades: { courseId: 'CS301', assignments: 68, midterm: 60, finalExam: 64, gpa: 2.3, letterGrade: 'C' }
  },
  {
    id: 's-004',
    rollNo: '2024CS004',
    name: 'Ananya Gupta',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345674',
    email: 'ananya.gupta@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300004',
    stats: { totalClasses: 32, attended: 31, absent: 1, eventDuty: 0 },
    grades: { courseId: 'CS301', assignments: 95, midterm: 96, finalExam: 98, gpa: 4.0, letterGrade: 'A+' }
  },
  {
    id: 's-005',
    rollNo: '2024CS005',
    name: 'Aryan Singh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345675',
    email: 'aryan.singh@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300005',
    stats: { totalClasses: 32, attended: 29, absent: 1, eventDuty: 2 },
    grades: { courseId: 'CS301', assignments: 78, midterm: 84, finalExam: 80, gpa: 3.2, letterGrade: 'B+' }
  },
  {
    id: 's-006',
    rollNo: '2024CS006',
    name: 'Bhavya Reddy',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345676',
    email: 'bhavya.reddy@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300006',
    stats: { totalClasses: 32, attended: 26, absent: 3, eventDuty: 3 },
    grades: { courseId: 'CS301', assignments: 88, midterm: 80, finalExam: 86, gpa: 3.4, letterGrade: 'B+' }
  },
  {
    id: 's-007',
    rollNo: '2024CS007',
    name: 'Devendra Joshi',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345677',
    email: 'devendra.joshi@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300007',
    stats: { totalClasses: 32, attended: 20, absent: 10, eventDuty: 2 },
    grades: { courseId: 'CS301', assignments: 55, midterm: 58, finalExam: 52, gpa: 1.8, letterGrade: 'D' }
  },
  {
    id: 's-008',
    rollNo: '2024CS008',
    name: 'Divya Nair',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345678',
    email: 'divya.nair@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300008',
    stats: { totalClasses: 32, attended: 30, absent: 1, eventDuty: 1 },
    grades: { courseId: 'CS301', assignments: 91, midterm: 92, finalExam: 95, gpa: 3.9, letterGrade: 'A+' }
  },
  {
    id: 's-009',
    rollNo: '2024CS009',
    name: 'Harsh Vardhan',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345679',
    email: 'harsh.vardhan@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300009',
    stats: { totalClasses: 32, attended: 27, absent: 2, eventDuty: 3 },
    grades: { courseId: 'CS301', assignments: 80, midterm: 76, finalExam: 82, gpa: 3.1, letterGrade: 'B' }
  },
  {
    id: 's-010',
    rollNo: '2024CS010',
    name: 'Ishaan Chopra',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345680',
    email: 'ishaan.chopra@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300010',
    stats: { totalClasses: 32, attended: 29, absent: 2, eventDuty: 1 },
    grades: { courseId: 'CS301', assignments: 84, midterm: 89, finalExam: 85, gpa: 3.5, letterGrade: 'A' }
  },
  {
    id: 's-011',
    rollNo: '2024CS011',
    name: 'Kavya Mehra',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345681',
    email: 'kavya.mehra@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300011',
    stats: { totalClasses: 32, attended: 31, absent: 0, eventDuty: 1 },
    grades: { courseId: 'CS301', assignments: 96, midterm: 94, finalExam: 97, gpa: 4.0, letterGrade: 'A+' }
  },
  {
    id: 's-012',
    rollNo: '2024CS012',
    name: 'Manish Kumar',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345682',
    email: 'manish.kumar@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300012',
    stats: { totalClasses: 32, attended: 25, absent: 5, eventDuty: 2 },
    grades: { courseId: 'CS301', assignments: 72, midterm: 70, finalExam: 75, gpa: 2.8, letterGrade: 'B' }
  },
  {
    id: 's-013',
    rollNo: '2024CS013',
    name: 'Neha Saxena',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345683',
    email: 'neha.saxena@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300013',
    stats: { totalClasses: 32, attended: 28, absent: 3, eventDuty: 1 },
    grades: { courseId: 'CS301', assignments: 85, midterm: 88, finalExam: 90, gpa: 3.7, letterGrade: 'A' }
  },
  {
    id: 's-014',
    rollNo: '2024CS014',
    name: 'Pranav Kulkarni',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345684',
    email: 'pranav.kulkarni@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300014',
    stats: { totalClasses: 32, attended: 29, absent: 2, eventDuty: 1 },
    grades: { courseId: 'CS301', assignments: 89, midterm: 83, finalExam: 87, gpa: 3.5, letterGrade: 'A' }
  },
  {
    id: 's-015',
    rollNo: '2024CS015',
    name: 'Rhea Sen',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345685',
    email: 'rhea.sen@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300015',
    stats: { totalClasses: 32, attended: 30, absent: 0, eventDuty: 2 },
    grades: { courseId: 'CS301', assignments: 93, midterm: 91, finalExam: 94, gpa: 3.9, letterGrade: 'A+' }
  },
  {
    id: 's-016',
    rollNo: '2024CS016',
    name: 'Rohan Deshmukh',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345686',
    email: 'rohan.deshmukh@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300016',
    stats: { totalClasses: 32, attended: 21, absent: 9, eventDuty: 2 },
    grades: { courseId: 'CS301', assignments: 60, midterm: 65, finalExam: 59, gpa: 2.1, letterGrade: 'C' }
  },
  {
    id: 's-017',
    rollNo: '2024CS017',
    name: 'Sanya Mirza',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345687',
    email: 'sanya.mirza@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300017',
    stats: { totalClasses: 32, attended: 27, absent: 3, eventDuty: 2 },
    grades: { courseId: 'CS301', assignments: 82, midterm: 79, finalExam: 85, gpa: 3.3, letterGrade: 'B+' }
  },
  {
    id: 's-018',
    rollNo: '2024CS018',
    name: 'Tanmay Bhattacharya',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345688',
    email: 'tanmay.b@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300018',
    stats: { totalClasses: 32, attended: 28, absent: 2, eventDuty: 2 },
    grades: { courseId: 'CS301', assignments: 87, midterm: 86, finalExam: 88, gpa: 3.6, letterGrade: 'A' }
  },
  {
    id: 's-019',
    rollNo: '2024CS019',
    name: 'Varun Khanna',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345689',
    email: 'varun.khanna@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300019',
    stats: { totalClasses: 32, attended: 24, absent: 6, eventDuty: 2 },
    grades: { courseId: 'CS301', assignments: 70, midterm: 74, finalExam: 72, gpa: 2.7, letterGrade: 'B' }
  },
  {
    id: 's-020',
    rollNo: '2024CS020',
    name: 'Zoya Khan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    phone: '+919812345690',
    email: 'zoya.khan@campus.edu',
    section: 'CSE-A',
    semester: 'Semester 5',
    department: 'Computer Science',
    batch: '2024-2028',
    parentPhone: '+919812300020',
    stats: { totalClasses: 32, attended: 32, absent: 0, eventDuty: 0 },
    grades: { courseId: 'CS301', assignments: 98, midterm: 97, finalExam: 99, gpa: 4.0, letterGrade: 'A+' }
  }
];

export const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'notice-1',
    title: 'Mid-Term Lab Practical Schedule Announced',
    content: 'All 3rd Year CSE students must submit their complete lab journals before Friday 4:00 PM. Practical exams commence Monday.',
    category: 'Exam',
    postedAt: 'Today, 09:15 AM',
    author: 'Prof. Rajesh Sharma',
    priority: 'high'
  },
  {
    id: 'notice-2',
    title: 'Inter-College Hackathon On-Duty (OD) Forms',
    content: 'Students participating in HackAsia 2026 can submit their OD approvals through the ERP before Friday to prevent attendance deduction.',
    category: 'Event',
    postedAt: 'Yesterday, 02:40 PM',
    author: 'Student Affairs Council',
    priority: 'medium'
  },
  {
    id: 'notice-3',
    title: 'Mandatory 75% Attendance Warning for Semester Exams',
    content: 'University regulations require minimum 75% aggregate attendance to be eligible for hall tickets. Absentees have received direct WhatsApp alerts.',
    category: 'Urgent',
    postedAt: 'Sep 10, 11:00 AM',
    author: 'Dean of Academics',
    priority: 'high'
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-1',
    courseId: 'CS301',
    courseCode: 'CS-301',
    title: 'Assignment 3: Red-Black Trees & Dijkstra Algorithm',
    description: 'Implement AVL balancing and Dijkstra shortest-path with asymptotic runtime proofs. Submit PDF report and GitHub link.',
    dueDate: 'Sep 18, 2026 • 11:59 PM',
    maxMarks: 100
  },
  {
    id: 'asg-2',
    courseId: 'CS301',
    courseCode: 'CS-301',
    title: 'Assignment 2: Cache-Oblivious B-Trees',
    description: 'Empirical benchmark comparing cache misses between standard binary search trees and cache-oblivious B-Trees.',
    dueDate: 'Sep 10, 2026 • 05:00 PM',
    maxMarks: 100
  },
  {
    id: 'asg-3',
    courseId: 'CS302',
    courseCode: 'CS-302',
    title: 'Assignment 1: Relational Algebra & BCNF Normalization',
    description: 'Design schemas satisfying Boyce-Codd Normal Form with functional dependency closures.',
    dueDate: 'Sep 22, 2026 • 11:59 PM',
    maxMarks: 50
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'comp-101',
    facultyName: 'Prof. Rajesh Sharma',
    classroomNumber: 'Room LH-302',
    category: 'Projector & HDMI Display',
    description: 'Projector ceiling lamp flickers intensely and HDMI cable drops audio signal every 3 minutes during lectures.',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
    priority: 'urgent',
    status: 'in_progress',
    lodgedAt: 'Today, 08:30 AM',
    updates: [
      {
        timestamp: 'Today, 08:35 AM',
        text: 'Complaint logged into Campus Infrastructure Registry.',
        updatedBy: 'System Auto-Dispatch'
      },
      {
        timestamp: 'Today, 09:15 AM',
        text: 'Assigned to Senior Estate Technician: R. K. Verma (Mob: 9876501234).',
        updatedBy: 'Estate Maintenance Desk'
      },
      {
        timestamp: 'Today, 10:45 AM',
        text: 'New HDMI 2.1 cable installed. Replacement projector bulb requisitioned from central store.',
        updatedBy: 'Technician R. K. Verma'
      }
    ]
  },
  {
    id: 'comp-102',
    facultyName: 'Prof. Rajesh Sharma',
    classroomNumber: 'CS Lab-4',
    category: 'Air Conditioning & Ventilation',
    description: 'Split AC unit on north wall is leaking condensation water onto workstation row 3. High humidity.',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    priority: 'high',
    status: 'dispatched',
    lodgedAt: 'Yesterday, 03:15 PM',
    updates: [
      {
        timestamp: 'Yesterday, 03:20 PM',
        text: 'Ticket generated and flagged high-priority due to electrical equipment proximity.',
        updatedBy: 'System Auto-Dispatch'
      },
      {
        timestamp: 'Yesterday, 04:30 PM',
        text: 'HVAC team dispatched to inspect drainage piping in Lab 4.',
        updatedBy: 'Chief Engineer Office'
      }
    ]
  },
  {
    id: 'comp-103',
    facultyName: 'Dr. Ananya Roy',
    classroomNumber: 'LH-201',
    category: 'Wi-Fi & Network Access Point',
    description: 'Access Point AP-201-B showing red LED status. Students unable to access intranet LMS.',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80',
    priority: 'medium',
    status: 'resolved',
    lodgedAt: 'Sep 11, 2026',
    updates: [
      {
        timestamp: 'Sep 11, 09:00 AM',
        text: 'Complaint logged for network drops.',
        updatedBy: 'Dr. Ananya Roy'
      },
      {
        timestamp: 'Sep 11, 11:10 AM',
        text: 'PoE switch port rebooted and firmware patched by Campus IT.',
        updatedBy: 'Network Admin - Mr. Vikas'
      },
      {
        timestamp: 'Sep 11, 11:30 AM',
        text: 'Signal strength verified at 54 Mbps. Issue resolved.',
        updatedBy: 'Network Admin - Mr. Vikas'
      }
    ]
  }
];

export const INITIAL_CAMPUS_EVENTS: CampusEvent[] = [
  {
    id: 'evt-201',
    title: 'Dean’s Academic Review & Faculty Senate 2026',
    description: 'Mandatory semester review with all Department HODs, Deans, and Senior Faculty regarding curriculum modernization and NAAC accreditation benchmarks.',
    venue: 'Senate Hall • Administrative Block (3rd Floor)',
    date: 'Tomorrow, Sep 14',
    time: '02:30 PM - 04:30 PM',
    yearsAllowed: ['All Years'],
    branches: ['CSE', 'Mechanical Engg', 'AIML', 'EE', 'EC', 'CE'],
    targetAudience: 'Deans, HODs & Faculty Members',
    postedByFaculty: 'Prof. Rajesh Sharma',
    facultyDesignation: 'Associate Dean (Academics)',
    department: 'Computer Science & Engineering',
    isLive: true,
    createdAt: 'Today, 08:00 AM'
  },
  {
    id: 'evt-202',
    title: 'Inter-Department Robotics & Edge AI Hackathon',
    description: '48-Hour prototype building sprint with hardware rigs, IoT sensors, and Jetson Nano kits provided by the college incubation centre. Cash awards worth ₹1,50,000.',
    venue: 'Mechanical Workshop Hall & IoT Lab (Block D)',
    date: 'Sep 18 - Sep 19',
    time: '09:00 AM onwards',
    yearsAllowed: ['2nd Year', '3rd Year', '4th Year'],
    branches: ['CSE', 'AIML', 'Mechanical Engg', 'EC', 'EE'],
    targetAudience: 'Students & Faculty Mentors',
    postedByFaculty: 'Dr. H. K. Singhania',
    facultyDesignation: 'HOD, Mechanical Engg',
    department: 'Mechanical Engg',
    isLive: true,
    createdAt: 'Yesterday, 11:20 AM'
  },
  {
    id: 'evt-203',
    title: 'Civil & Infrastructure Guest Lecture: Smart Metros & TBM Tunnels',
    description: 'Keynote by Chief Project Director, Metro Rail Corp on urban subterranean geotechnical engineering and environmental acoustics.',
    venue: 'Auditorium 2 (CV Raman Hall)',
    date: 'Sep 21, 2026',
    time: '11:00 AM - 01:00 PM',
    yearsAllowed: ['3rd Year', '4th Year'],
    branches: ['CE', 'Mechanical Engg'],
    targetAudience: 'Faculty, Research Scholars & Civil Students',
    postedByFaculty: 'Prof. Sunita Mehta',
    facultyDesignation: 'Dean of Student Welfare',
    department: 'Civil Engineering',
    isLive: false,
    createdAt: 'Sep 10, 2026'
  }
];

